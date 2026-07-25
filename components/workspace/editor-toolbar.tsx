"use client";

import { Download, Save, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { GitHubMark } from "@/components/ui/github-mark";
import { LANGUAGE_LIST, type LanguageId } from "@/lib/workspace/languages";

export type SaveState = "idle" | "saving" | "saved";

/**
 * Toolbar above the editor (Requirement 3): language dropdown, file name, and
 * Save / Download / Commit-to-GitHub actions. The Commit button is always
 * present and enabled (Requirement 8).
 */
export function EditorToolbar({
  language,
  onLanguageChange,
  fileName,
  onFileNameChange,
  saveState,
  onSave,
  saveLabel = "Save",
  onDownload,
  onCommit,
}: {
  language: LanguageId;
  onLanguageChange: (lang: LanguageId) => void;
  fileName: string;
  onFileNameChange: (name: string) => void;
  saveState?: SaveState;
  onSave?: () => void;
  saveLabel?: string;
  onDownload: () => void;
  onCommit: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border bg-card px-3 py-2">
      <select
        value={language}
        onChange={(e) => onLanguageChange(e.target.value as LanguageId)}
        aria-label="Language"
        className="h-8 rounded-lg border border-border bg-background px-2 text-xs text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {LANGUAGE_LIST.map((l) => (
          <option key={l.id} value={l.id}>
            {l.label}
          </option>
        ))}
      </select>

      <input
        value={fileName}
        onChange={(e) => onFileNameChange(e.target.value)}
        aria-label="File name"
        spellCheck={false}
        className="h-8 min-w-0 flex-1 rounded-lg border border-border bg-background px-2.5 font-mono text-xs text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />

      {saveState && (
        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
          {saveState === "saving" ? (
            <>
              <Loader2 className="size-3 animate-spin" /> Saving…
            </>
          ) : saveState === "saved" ? (
            <>
              <Check className="size-3 text-success" /> Saved
            </>
          ) : null}
        </span>
      )}

      <div className="ml-auto flex items-center gap-1.5">
        {onSave && (
          <button
            type="button"
            onClick={onSave}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-xs font-medium text-foreground transition-colors hover:border-foreground/40 focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Save className="size-3.5" />
            {saveLabel}
          </button>
        )}
        <button
          type="button"
          onClick={onDownload}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-xs font-medium text-foreground transition-colors hover:border-foreground/40 focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Download className="size-3.5" />
          Download
        </button>
        <button
          type="button"
          onClick={onCommit}
          className={cn(
            "inline-flex h-8 items-center gap-1.5 rounded-lg bg-foreground px-2.5 text-xs font-medium text-background transition-transform hover:scale-[1.02] active:scale-[0.99]",
          )}
        >
          <GitHubMark className="size-3.5" />
          Commit
        </button>
      </div>
    </div>
  );
}
