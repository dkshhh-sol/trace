"use client";

import { useRef } from "react";
import Editor, { type OnMount, type BeforeMount } from "@monaco-editor/react";
import type { LanguageId } from "@/lib/workspace/languages";
import { LANGUAGES } from "@/lib/workspace/languages";

/**
 * Presentational Monaco editor wrapper. Deliberately decoupled from
 * persistence, GitHub, and any future execution service (Requirement 11): it
 * only renders a buffer and reports edits / cursor movement upward.
 */

export type CursorPosition = { line: number; column: number };

const TRACE_THEME = "trace-dark";

const defineTheme: BeforeMount = (monaco) => {
  monaco.editor.defineTheme(TRACE_THEME, {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "comment", foreground: "6b6b76", fontStyle: "italic" },
      { token: "keyword", foreground: "b9b3ff" },
      { token: "number", foreground: "a68fff" },
      { token: "string", foreground: "9fe0b0" },
      { token: "type", foreground: "8b7cff" },
    ],
    colors: {
      "editor.background": "#0d0d12",
      "editor.foreground": "#f4f4f5",
      "editorLineNumber.foreground": "#4a4a55",
      "editorLineNumber.activeForeground": "#9a9aa5",
      "editor.selectionBackground": "#8b7cff40",
      "editor.lineHighlightBackground": "#ffffff08",
      "editorCursor.foreground": "#8b7cff",
      "editorIndentGuide.background1": "#ffffff0d",
      "editorIndentGuide.activeBackground1": "#ffffff1f",
      "editorWidget.background": "#0d0d12",
      "editorWidget.border": "#ffffff14",
      "editorSuggestWidget.background": "#101014",
      "editorSuggestWidget.selectedBackground": "#17171d",
      "scrollbarSlider.background": "#ffffff14",
      "scrollbarSlider.hoverBackground": "#ffffff22",
      "focusBorder": "#00000000",
    },
  });
};

export function CodeEditor({
  value,
  language,
  onChange,
  onCursorChange,
  initialCursor,
  readOnly = false,
  className,
}: {
  value: string;
  language: LanguageId;
  onChange?: (value: string) => void;
  onCursorChange?: (pos: CursorPosition) => void;
  initialCursor?: CursorPosition | null;
  readOnly?: boolean;
  className?: string;
}) {
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);

  const handleMount: OnMount = (editor) => {
    editorRef.current = editor;

    if (initialCursor) {
      editor.setPosition({
        lineNumber: initialCursor.line,
        column: initialCursor.column,
      });
      editor.revealPositionInCenterIfOutsideViewport({
        lineNumber: initialCursor.line,
        column: initialCursor.column,
      });
    }

    if (onCursorChange) {
      editor.onDidChangeCursorPosition((e) => {
        onCursorChange({ line: e.position.lineNumber, column: e.position.column });
      });
    }
  };

  return (
    <div className={className}>
      <Editor
        height="100%"
        theme={TRACE_THEME}
        language={LANGUAGES[language].monaco}
        value={value}
        beforeMount={defineTheme}
        onMount={handleMount}
        onChange={(v) => onChange?.(v ?? "")}
        loading={
          <div className="grid h-full w-full place-items-center bg-card text-sm text-muted-foreground">
            Loading editor…
          </div>
        }
        options={{
          readOnly,
          minimap: { enabled: false },
          wordWrap: "on",
          lineNumbers: "on",
          fontSize: 13,
          fontFamily:
            'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
          fontLigatures: true,
          tabSize: 4,
          autoIndent: "full",
          matchBrackets: "always",
          bracketPairColorization: { enabled: true },
          automaticLayout: true,
          scrollBeyondLastLine: false,
          smoothScrolling: true,
          cursorSmoothCaretAnimation: "on",
          renderLineHighlight: "line",
          padding: { top: 14, bottom: 14 },
          scrollbar: { verticalScrollbarSize: 10, horizontalScrollbarSize: 10 },
          fixedOverflowWidgets: true,
        }}
      />
    </div>
  );
}
