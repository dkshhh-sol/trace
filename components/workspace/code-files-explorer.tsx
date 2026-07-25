"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import {
  FilePlus2,
  FolderPlus,
  Folder,
  FolderOpen,
  FileCode2,
  Search,
  Trash2,
  Pencil,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/toast";
import { EditorToolbar, type SaveState } from "./editor-toolbar";
import { CommitDialog } from "./commit-dialog";
import { downloadTextFile } from "@/lib/workspace/download";
import {
  LANGUAGES,
  ensureExtension,
  languageFromFileName,
  type LanguageId,
} from "@/lib/workspace/languages";
import {
  createFile,
  createFolder,
  deleteFile,
  deleteFolder,
  renameFile,
  renameFolder,
  saveFileContent,
} from "@/lib/workspace/actions";

const CodeEditor = dynamic(
  () => import("./code-editor").then((m) => m.CodeEditor),
  {
    ssr: false,
    loading: () => (
      <div className="grid h-full w-full place-items-center bg-card text-sm text-muted-foreground">
        Loading editor…
      </div>
    ),
  },
);

type FolderNode = { id: string; name: string; parentId: string | null };
type FileNode = {
  id: string;
  name: string;
  language: LanguageId;
  folderId: string | null;
  updatedAt: number;
};
type SortKey = "recent" | "name";

type OpenFile = {
  id: string;
  name: string;
  language: LanguageId;
  content: string;
};

export function CodeFilesExplorer({
  initialFolders,
  initialFiles,
  initialOpenId,
}: {
  initialFolders: FolderNode[];
  initialFiles: FileNode[];
  initialOpenId: string | null;
}) {
  const [folders, setFolders] = useState<FolderNode[]>(initialFolders);
  const [files, setFiles] = useState<FileNode[]>(initialFiles);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("recent");
  const [renaming, setRenaming] = useState<{ kind: "file" | "folder"; id: string } | null>(null);

  const [open, setOpen] = useState<OpenFile | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [showCommit, setShowCommit] = useState(false);
  const cursorRef = useRef<{ line: number; column: number }>({ line: 1, column: 1 });
  const contentTimer = useRef<number | null>(null);
  const renameTimer = useRef<number | null>(null);

  const sortFiles = useCallback(
    (list: FileNode[]) =>
      [...list].sort((a, b) =>
        sort === "name"
          ? a.name.localeCompare(b.name)
          : b.updatedAt - a.updatedAt,
      ),
    [sort],
  );

  const openFileById = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/code-files/${id}`);
      if (!res.ok) throw new Error("failed");
      const data = await res.json();
      setOpen({
        id: data.id,
        name: data.name,
        language: data.language as LanguageId,
        content: data.content,
      });
      setSaveState("saved");
    } catch {
      toast("Couldn't open the file.", "error");
    }
  }, []);

  useEffect(() => {
    // openFileById only updates state after an await (async), not synchronously.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (initialOpenId) void openFileById(initialOpenId);
  }, [initialOpenId, openFileById]);

  /* ---- New items ---- */
  async function onNewFile() {
    const base = `untitled${LANGUAGES.cpp.ext}`;
    try {
      const res = await createFile({
        name: base,
        language: "cpp",
        folderId: selectedFolder,
      });
      const node: FileNode = {
        id: res.fileId,
        name: base,
        language: "cpp",
        folderId: selectedFolder,
        updatedAt: Date.now(),
      };
      setFiles((prev) => [node, ...prev]);
      setOpen({ id: res.fileId, name: base, language: "cpp", content: "" });
      setSaveState("saved");
      setRenaming({ kind: "file", id: res.fileId });
    } catch {
      toast("Couldn't create the file.", "error");
    }
  }

  async function onNewFolder() {
    try {
      const row = await createFolder({ name: "New folder", parentId: selectedFolder });
      setFolders((prev) => [...prev, { id: row.id, name: row.name, parentId: row.parentId }]);
      if (selectedFolder) {
        setExpanded((prev) => new Set(prev).add(selectedFolder));
      }
      setRenaming({ kind: "folder", id: row.id });
    } catch {
      toast("Couldn't create the folder.", "error");
    }
  }

  /* ---- Rename / delete ---- */
  function commitRename(kind: "file" | "folder", id: string, name: string) {
    const trimmed = name.trim();
    setRenaming(null);
    if (!trimmed) return;
    if (kind === "folder") {
      setFolders((prev) => prev.map((f) => (f.id === id ? { ...f, name: trimmed } : f)));
      void renameFolder({ id, name: trimmed });
    } else {
      const lang = languageFromFileName(trimmed);
      setFiles((prev) =>
        prev.map((f) => (f.id === id ? { ...f, name: trimmed, language: lang } : f)),
      );
      setOpen((o) => (o && o.id === id ? { ...o, name: trimmed, language: lang } : o));
      void renameFile({ id, name: trimmed, language: lang });
    }
  }

  async function onDeleteFile(id: string) {
    setFiles((prev) => prev.filter((f) => f.id !== id));
    if (open?.id === id) setOpen(null);
    try {
      await deleteFile(id);
    } catch {
      toast("Couldn't delete the file.", "error");
    }
  }

  async function onDeleteFolder(id: string) {
    // Remove folder and its descendants from local state; server cascades.
    const toRemove = new Set<string>([id]);
    let changed = true;
    while (changed) {
      changed = false;
      for (const f of folders) {
        if (f.parentId && toRemove.has(f.parentId) && !toRemove.has(f.id)) {
          toRemove.add(f.id);
          changed = true;
        }
      }
    }
    setFolders((prev) => prev.filter((f) => !toRemove.has(f.id)));
    setFiles((prev) => prev.filter((f) => !(f.folderId && toRemove.has(f.folderId))));
    if (selectedFolder && toRemove.has(selectedFolder)) setSelectedFolder(null);
    try {
      await deleteFolder(id);
    } catch {
      toast("Couldn't delete the folder.", "error");
    }
  }

  /* ---- Editor autosave ---- */
  function onContentChange(value: string) {
    setOpen((o) => (o ? { ...o, content: value } : o));
    if (!open) return;
    setSaveState("saving");
    const id = open.id;
    if (contentTimer.current) window.clearTimeout(contentTimer.current);
    contentTimer.current = window.setTimeout(async () => {
      try {
        await saveFileContent({ id, content: value });
        setFiles((prev) =>
          prev.map((f) => (f.id === id ? { ...f, updatedAt: Date.now() } : f)),
        );
        setSaveState("saved");
      } catch {
        setSaveState("idle");
      }
    }, 2000);
  }

  function onToolbarRename(name: string) {
    if (!open) return;
    setOpen({ ...open, name });
    setFiles((prev) => prev.map((f) => (f.id === open.id ? { ...f, name } : f)));
    if (renameTimer.current) window.clearTimeout(renameTimer.current);
    const id = open.id;
    const lang = open.language;
    renameTimer.current = window.setTimeout(() => {
      void renameFile({ id, name: name.trim() || `untitled${LANGUAGES[lang].ext}`, language: lang });
    }, 800);
  }

  function onToolbarLanguage(lang: LanguageId) {
    if (!open) return;
    const name = ensureExtension(open.name, lang);
    setOpen({ ...open, language: lang, name });
    setFiles((prev) =>
      prev.map((f) => (f.id === open.id ? { ...f, language: lang, name } : f)),
    );
    void renameFile({ id: open.id, name, language: lang });
  }

  /* ---- Derived tree ---- */
  const searching = query.trim().length > 0;
  const filteredFiles = useMemo(() => {
    if (!searching) return files;
    const q = query.toLowerCase();
    return files.filter((f) => f.name.toLowerCase().includes(q));
  }, [files, query, searching]);

  return (
    <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
      {/* Explorer */}
      <aside className="surface flex max-h-[76vh] flex-col overflow-hidden rounded-2xl">
        <div className="flex items-center gap-1 border-b border-border px-3 py-2">
          <button
            type="button"
            onClick={onNewFile}
            title="New file"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <FilePlus2 className="size-3.5" /> File
          </button>
          <button
            type="button"
            onClick={onNewFolder}
            title="New folder"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <FolderPlus className="size-3.5" /> Folder
          </button>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            aria-label="Sort"
            className="ml-auto h-8 rounded-lg border border-border bg-background px-1.5 text-[11px] text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="recent">Recent</option>
            <option value="name">Name</option>
          </select>
        </div>

        <div className="border-b border-border p-2">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-2.5">
            <Search className="size-3.5 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search files"
              className="h-8 w-full bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground/60"
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-2">
          {folders.length === 0 && files.length === 0 ? (
            <p className="px-2 py-6 text-center text-xs text-muted-foreground">
              No files yet. Create one to start building your code library.
            </p>
          ) : searching ? (
            <ul className="space-y-0.5">
              {filteredFiles.map((f) => (
                <FileRow
                  key={f.id}
                  file={f}
                  active={open?.id === f.id}
                  renaming={renaming?.kind === "file" && renaming.id === f.id}
                  onOpen={() => openFileById(f.id)}
                  onRename={(name) => commitRename("file", f.id, name)}
                  onStartRename={() => setRenaming({ kind: "file", id: f.id })}
                  onDelete={() => onDeleteFile(f.id)}
                  depth={0}
                />
              ))}
              {filteredFiles.length === 0 && (
                <p className="px-2 py-4 text-center text-xs text-muted-foreground">
                  No matches.
                </p>
              )}
            </ul>
          ) : (
            <Tree
              parentId={null}
              depth={0}
              folders={folders}
              files={sortFiles(files)}
              expanded={expanded}
              selectedFolder={selectedFolder}
              openId={open?.id ?? null}
              renaming={renaming}
              onToggle={(id) =>
                setExpanded((prev) => {
                  const next = new Set(prev);
                  if (next.has(id)) next.delete(id);
                  else next.add(id);
                  return next;
                })
              }
              onSelectFolder={setSelectedFolder}
              onOpenFile={(id) => openFileById(id)}
              onRenameCommit={commitRename}
              onStartRename={(kind, id) => setRenaming({ kind, id })}
              onDeleteFile={onDeleteFile}
              onDeleteFolder={onDeleteFolder}
            />
          )}
        </div>
      </aside>

      {/* Editor */}
      <section className="surface flex h-[76vh] flex-col overflow-hidden rounded-2xl">
        {open ? (
          <>
            <EditorToolbar
              language={open.language}
              onLanguageChange={onToolbarLanguage}
              fileName={open.name}
              onFileNameChange={onToolbarRename}
              saveState={saveState}
              onDownload={() =>
                downloadTextFile(ensureExtension(open.name, open.language), open.content)
              }
              onCommit={() => setShowCommit(true)}
            />
            <div className="min-h-0 flex-1">
              <CodeEditor
                className="h-full"
                value={open.content}
                language={open.language}
                onChange={onContentChange}
                onCursorChange={(pos) => (cursorRef.current = pos)}
              />
            </div>
          </>
        ) : (
          <div className="grid flex-1 place-items-center p-8 text-center">
            <div className="max-w-sm space-y-2">
              <FileCode2 className="mx-auto size-8 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">
                Your personal code library
              </p>
              <p className="text-sm text-muted-foreground">
                Create files and folders, edit with full syntax highlighting,
                download, or commit straight to GitHub.
              </p>
            </div>
          </div>
        )}
      </section>

      {showCommit && open && (
        <CommitDialog
          fileName={ensureExtension(open.name, open.language)}
          content={open.content}
          onClose={() => setShowCommit(false)}
        />
      )}
    </div>
  );
}

/* --------------------------------- Tree ---------------------------------- */

function Tree({
  parentId,
  depth,
  folders,
  files,
  expanded,
  selectedFolder,
  openId,
  renaming,
  onToggle,
  onSelectFolder,
  onOpenFile,
  onRenameCommit,
  onStartRename,
  onDeleteFile,
  onDeleteFolder,
}: {
  parentId: string | null;
  depth: number;
  folders: FolderNode[];
  files: FileNode[];
  expanded: Set<string>;
  selectedFolder: string | null;
  openId: string | null;
  renaming: { kind: "file" | "folder"; id: string } | null;
  onToggle: (id: string) => void;
  onSelectFolder: (id: string | null) => void;
  onOpenFile: (id: string) => void;
  onRenameCommit: (kind: "file" | "folder", id: string, name: string) => void;
  onStartRename: (kind: "file" | "folder", id: string) => void;
  onDeleteFile: (id: string) => void;
  onDeleteFolder: (id: string) => void;
}) {
  const childFolders = folders
    .filter((f) => f.parentId === parentId)
    .sort((a, b) => a.name.localeCompare(b.name));
  const childFiles = files.filter((f) => f.folderId === parentId);

  return (
    <ul className="space-y-0.5">
      {childFolders.map((folder) => {
        const isOpen = expanded.has(folder.id);
        return (
          <li key={folder.id}>
            <div
              className={cn(
                "group flex items-center gap-1 rounded-lg pr-1 text-sm transition-colors hover:bg-accent/60",
                selectedFolder === folder.id && "bg-accent/40",
              )}
              style={{ paddingLeft: depth * 12 + 4 }}
            >
              <button
                type="button"
                onClick={() => {
                  onToggle(folder.id);
                  onSelectFolder(selectedFolder === folder.id ? null : folder.id);
                }}
                className="flex min-w-0 flex-1 items-center gap-1.5 py-1.5 text-left text-muted-foreground"
              >
                <ChevronRight
                  className={cn(
                    "size-3.5 shrink-0 transition-transform",
                    isOpen && "rotate-90",
                  )}
                />
                {isOpen ? (
                  <FolderOpen className="size-3.5 shrink-0 text-brand" />
                ) : (
                  <Folder className="size-3.5 shrink-0 text-brand" />
                )}
                {renaming?.kind === "folder" && renaming.id === folder.id ? (
                  <RenameInput
                    initial={folder.name}
                    onCommit={(name) => onRenameCommit("folder", folder.id, name)}
                  />
                ) : (
                  <span className="truncate text-foreground">{folder.name}</span>
                )}
              </button>
              <RowActions
                onRename={() => onStartRename("folder", folder.id)}
                onDelete={() => onDeleteFolder(folder.id)}
              />
            </div>
            {isOpen && (
              <Tree
                parentId={folder.id}
                depth={depth + 1}
                folders={folders}
                files={files}
                expanded={expanded}
                selectedFolder={selectedFolder}
                openId={openId}
                renaming={renaming}
                onToggle={onToggle}
                onSelectFolder={onSelectFolder}
                onOpenFile={onOpenFile}
                onRenameCommit={onRenameCommit}
                onStartRename={onStartRename}
                onDeleteFile={onDeleteFile}
                onDeleteFolder={onDeleteFolder}
              />
            )}
          </li>
        );
      })}

      {childFiles.map((file) => (
        <FileRow
          key={file.id}
          file={file}
          depth={depth}
          active={openId === file.id}
          renaming={renaming?.kind === "file" && renaming.id === file.id}
          onOpen={() => onOpenFile(file.id)}
          onRename={(name) => onRenameCommit("file", file.id, name)}
          onStartRename={() => onStartRename("file", file.id)}
          onDelete={() => onDeleteFile(file.id)}
        />
      ))}
    </ul>
  );
}

function FileRow({
  file,
  depth,
  active,
  renaming,
  onOpen,
  onRename,
  onStartRename,
  onDelete,
}: {
  file: FileNode;
  depth: number;
  active: boolean;
  renaming: boolean;
  onOpen: () => void;
  onRename: (name: string) => void;
  onStartRename: () => void;
  onDelete: () => void;
}) {
  return (
    <li
      className={cn(
        "group flex items-center gap-1 rounded-lg pr-1 text-sm transition-colors hover:bg-accent/60",
        active && "bg-accent text-foreground",
      )}
      style={{ paddingLeft: depth * 12 + 20 }}
    >
      <button
        type="button"
        onClick={onOpen}
        className="flex min-w-0 flex-1 items-center gap-1.5 py-1.5 text-left"
      >
        <FileCode2 className="size-3.5 shrink-0 text-muted-foreground" />
        {renaming ? (
          <RenameInput initial={file.name} onCommit={onRename} />
        ) : (
          <span className="truncate text-foreground">{file.name}</span>
        )}
      </button>
      <RowActions onRename={onStartRename} onDelete={onDelete} />
    </li>
  );
}

function RowActions({
  onRename,
  onDelete,
}: {
  onRename: () => void;
  onDelete: () => void;
}) {
  return (
    <span className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRename();
        }}
        aria-label="Rename"
        className="grid size-6 place-items-center rounded text-muted-foreground hover:bg-accent hover:text-foreground"
      >
        <Pencil className="size-3" />
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        aria-label="Delete"
        className="grid size-6 place-items-center rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
      >
        <Trash2 className="size-3" />
      </button>
    </span>
  );
}

function RenameInput({
  initial,
  onCommit,
}: {
  initial: string;
  onCommit: (name: string) => void;
}) {
  const [value, setValue] = useState(initial);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    ref.current?.focus();
    ref.current?.select();
  }, []);
  return (
    <input
      ref={ref}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onClick={(e) => e.stopPropagation()}
      onBlur={() => onCommit(value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") onCommit(value);
        if (e.key === "Escape") onCommit(initial);
      }}
      className="min-w-0 flex-1 rounded border border-border bg-background px-1 py-0.5 text-xs text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
    />
  );
}
