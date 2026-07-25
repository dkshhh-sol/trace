"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Code2, PanelRightClose, FileCode2 } from "lucide-react";
import { toast } from "@/components/ui/toast";
import { EditorToolbar, type SaveState } from "./editor-toolbar";
import { CommitDialog } from "./commit-dialog";
import { downloadTextFile } from "@/lib/workspace/download";
import {
  LANGUAGES,
  asLanguageId,
  ensureExtension,
  type LanguageId,
} from "@/lib/workspace/languages";
import {
  saveProblemDraft,
  saveProblemAsFile,
  setLectureLayout,
} from "@/lib/workspace/actions";
import type { CursorPosition } from "./code-editor";

// Monaco is client-only; load it without SSR to avoid hydration overhead.
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

const MIN_PCT = 15;
const MAX_PCT = 85;

export type WorkspaceDraft = {
  language: LanguageId;
  fileName: string;
  content: string;
  cursorLine: number;
  cursorColumn: number;
};

export function LectureWorkspace({
  embedUrl,
  problemName,
  problemId,
  roadmapId,
  topicId,
  initialSplitPct,
  initialEditorOpen,
  draft,
  relatedFiles,
}: {
  embedUrl: string | null;
  problemName: string;
  problemId: string;
  roadmapId: string;
  topicId?: string;
  initialSplitPct: number;
  initialEditorOpen: boolean;
  draft: WorkspaceDraft | null;
  relatedFiles: { id: string; name: string }[];
}) {
  const [editorOpen, setEditorOpen] = useState(initialEditorOpen);
  const [splitPct, setSplitPct] = useState(initialSplitPct); // editor width %
  const [isWide, setIsWide] = useState(true);

  const [language, setLanguage] = useState<LanguageId>(
    draft?.language ?? "cpp",
  );
  const [fileName, setFileName] = useState(
    draft?.fileName ?? LANGUAGES[asLanguageId(draft?.language)].defaultFile,
  );
  const [content, setContent] = useState(draft?.content ?? "");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [showCommit, setShowCommit] = useState(false);

  const cursorRef = useRef<CursorPosition>({
    line: draft?.cursorLine ?? 1,
    column: draft?.cursorColumn ?? 1,
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const draftTimer = useRef<number | null>(null);
  const layoutTimer = useRef<number | null>(null);
  const firstRun = useRef(true);

  const initialCursor = useMemo(
    () => ({
      line: draft?.cursorLine ?? 1,
      column: draft?.cursorColumn ?? 1,
    }),
    [draft?.cursorLine, draft?.cursorColumn],
  );

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const update = () => setIsWide(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  /* ---- Auto-save the draft 2s after edits settle (Requirement 4) ---- */
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    setSaveState("saving");
    if (draftTimer.current) window.clearTimeout(draftTimer.current);
    draftTimer.current = window.setTimeout(async () => {
      try {
        await saveProblemDraft({
          problemId,
          roadmapId,
          language,
          fileName,
          content,
          cursorLine: cursorRef.current.line,
          cursorColumn: cursorRef.current.column,
        });
        setSaveState("saved");
      } catch {
        setSaveState("idle");
      }
    }, 2000);
    return () => {
      if (draftTimer.current) window.clearTimeout(draftTimer.current);
    };
  }, [content, language, fileName, problemId, roadmapId]);

  const persistLayout = useCallback(
    (pct: number, open: boolean) => {
      if (layoutTimer.current) window.clearTimeout(layoutTimer.current);
      layoutTimer.current = window.setTimeout(() => {
        void setLectureLayout({ splitPct: Math.round(pct), editorOpen: open });
      }, 500);
    },
    [],
  );

  function toggleEditor() {
    const next = !editorOpen;
    setEditorOpen(next);
    persistLayout(splitPct, next);
  }

  function onLanguageChange(next: LanguageId) {
    setLanguage(next);
    setFileName((prev) => ensureExtension(prev, next));
  }

  function startDrag(e: React.PointerEvent) {
    e.preventDefault();
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();

    function move(ev: PointerEvent) {
      const x = ev.clientX - rect.left;
      const leftPct = (x / rect.width) * 100;
      const editorPct = Math.min(MAX_PCT, Math.max(MIN_PCT, 100 - leftPct));
      setSplitPct(editorPct);
    }
    function up() {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
      setSplitPct((pct) => {
        persistLayout(pct, true);
        return pct;
      });
    }
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";
  }

  function onDownload() {
    downloadTextFile(ensureExtension(fileName, language), content);
  }

  async function onSaveAs() {
    try {
      const res = await saveProblemAsFile({
        problemId,
        roadmapId,
        topicId,
        name: ensureExtension(fileName, language),
        language,
        content,
      });
      toast(
        res.updated ? "Updated in Code Files ✓" : "Saved to Code Files ✓",
        "success",
      );
    } catch {
      toast("Couldn't save the file.", "error");
    }
  }

  const player = embedUrl ? (
    <iframe
      src={embedUrl}
      title={`Lecture: ${problemName}`}
      className="absolute inset-0 h-full w-full"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowFullScreen
    />
  ) : (
    <div className="grid h-full w-full place-items-center text-sm text-muted-foreground">
      No lecture available for this item yet.
    </div>
  );

  const editorPanel = (
    <div className="flex h-full min-h-0 flex-col">
      <EditorToolbar
        language={language}
        onLanguageChange={onLanguageChange}
        fileName={fileName}
        onFileNameChange={setFileName}
        saveState={saveState}
        onSave={onSaveAs}
        saveLabel="Save as file"
        onDownload={onDownload}
        onCommit={() => setShowCommit(true)}
      />
      <div className="min-h-0 flex-1">
        <CodeEditor
          className="h-full"
          value={content}
          language={language}
          onChange={setContent}
          onCursorChange={(pos) => (cursorRef.current = pos)}
          initialCursor={initialCursor}
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-3">
      {/* Workspace controls */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {relatedFiles.length > 0 && (
            <Link
              href={`/code-files?open=${relatedFiles[0].id}`}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <FileCode2 className="size-3.5" />
              Open related file
            </Link>
          )}
        </div>
        <button
          type="button"
          onClick={toggleEditor}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 text-xs font-medium text-foreground transition-colors hover:border-foreground/40 focus-visible:ring-2 focus-visible:ring-ring"
        >
          {editorOpen ? (
            <>
              <PanelRightClose className="size-3.5" />
              Hide editor
            </>
          ) : (
            <>
              <Code2 className="size-3.5" />
              Open Code Editor
            </>
          )}
        </button>
      </div>

      {isWide ? (
        <div
          ref={containerRef}
          className="flex h-[82vh] overflow-hidden rounded-2xl border border-border"
        >
          <div
            className="relative bg-black"
            style={{ width: editorOpen ? `${100 - splitPct}%` : "100%" }}
          >
            {player}
          </div>
          {editorOpen && (
            <>
              <div
                role="separator"
                aria-orientation="vertical"
                onPointerDown={startDrag}
                className="w-1.5 shrink-0 cursor-col-resize bg-border transition-colors hover:bg-brand/60"
              />
              <div
                className="min-w-0 bg-card"
                style={{ width: `${splitPct}%` }}
              >
                {editorPanel}
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="relative aspect-video overflow-hidden rounded-2xl border border-border bg-black">
            {player}
          </div>
          {editorOpen && (
            <div className="h-[70vh] overflow-hidden rounded-2xl border border-border bg-card">
              {editorPanel}
            </div>
          )}
        </div>
      )}

      {showCommit && (
        <CommitDialog
          fileName={ensureExtension(fileName, language)}
          content={content}
          onClose={() => setShowCommit(false)}
        />
      )}
    </div>
  );
}
