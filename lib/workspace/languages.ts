/**
 * Supported workspace languages and their editor/file metadata. Client-safe
 * (no server imports) so it can be shared by the Monaco editor, the toolbar
 * language dropdown, download logic, and Code Files.
 */

export const LANGUAGE_IDS = ["c", "cpp", "java", "python"] as const;
export type LanguageId = (typeof LANGUAGE_IDS)[number];

export type LanguageMeta = {
  id: LanguageId;
  label: string;
  /** Monaco language identifier. */
  monaco: string;
  /** File extension including the dot. */
  ext: string;
  /** Default file name for a fresh buffer. */
  defaultFile: string;
};

export const LANGUAGES: Record<LanguageId, LanguageMeta> = {
  c: { id: "c", label: "C", monaco: "c", ext: ".c", defaultFile: "solution.c" },
  cpp: {
    id: "cpp",
    label: "C++",
    monaco: "cpp",
    ext: ".cpp",
    defaultFile: "solution.cpp",
  },
  java: {
    id: "java",
    label: "Java",
    monaco: "java",
    ext: ".java",
    defaultFile: "Solution.java",
  },
  python: {
    id: "python",
    label: "Python",
    monaco: "python",
    ext: ".py",
    defaultFile: "solution.py",
  },
};

export const LANGUAGE_LIST: LanguageMeta[] = LANGUAGE_IDS.map(
  (id) => LANGUAGES[id],
);

export function isLanguageId(v: string): v is LanguageId {
  return (LANGUAGE_IDS as readonly string[]).includes(v);
}

export function asLanguageId(v: string | null | undefined): LanguageId {
  return v && isLanguageId(v) ? v : "cpp";
}

/** Infer a language from a file name's extension; defaults to C++. */
export function languageFromFileName(name: string): LanguageId {
  const lower = name.toLowerCase();
  if (lower.endsWith(".c")) return "c";
  if (
    lower.endsWith(".cpp") ||
    lower.endsWith(".cc") ||
    lower.endsWith(".cxx") ||
    lower.endsWith(".hpp") ||
    lower.endsWith(".h")
  )
    return "cpp";
  if (lower.endsWith(".java")) return "java";
  if (lower.endsWith(".py")) return "python";
  return "cpp";
}

/** Ensure a download file name carries the correct extension for the language. */
export function ensureExtension(name: string, lang: LanguageId): string {
  const meta = LANGUAGES[lang];
  const trimmed = name.trim() || `solution${meta.ext}`;
  if (trimmed.toLowerCase().endsWith(meta.ext)) return trimmed;
  // Strip any existing known extension before appending the right one.
  const base = trimmed.replace(/\.(c|cpp|cc|cxx|hpp|h|java|py)$/i, "");
  return `${base}${meta.ext}`;
}
