import "server-only";

import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { codeFiles, folders, problemDrafts, userSettings } from "@/lib/db/schema";
import { asLanguageId, type LanguageId } from "@/lib/workspace/languages";

/** Per-user lecture workspace layout (Requirement 2), with safe defaults. */
export async function getLectureLayout(
  userId: string,
): Promise<{ splitPct: number; editorOpen: boolean }> {
  const [row] = await db
    .select({
      splitPct: userSettings.lectureSplitPct,
      editorOpen: userSettings.lectureEditorOpen,
    })
    .from(userSettings)
    .where(eq(userSettings.userId, userId))
    .limit(1);

  return {
    splitPct: row?.splitPct ?? 50,
    editorOpen: row?.editorOpen ?? false,
  };
}

/** Auto-saved editor state for a problem's lecture workspace. */
export type ProblemDraft = {
  language: LanguageId;
  fileName: string;
  content: string;
  cursorLine: number;
  cursorColumn: number;
};

export async function getProblemDraft(
  userId: string,
  problemId: string,
): Promise<ProblemDraft | null> {
  const [row] = await db
    .select({
      language: problemDrafts.language,
      fileName: problemDrafts.fileName,
      content: problemDrafts.content,
      cursorLine: problemDrafts.cursorLine,
      cursorColumn: problemDrafts.cursorColumn,
    })
    .from(problemDrafts)
    .where(
      and(
        eq(problemDrafts.userId, userId),
        eq(problemDrafts.problemId, problemId),
      ),
    )
    .limit(1);

  if (!row) return null;
  return { ...row, language: asLanguageId(row.language) };
}

export type FolderRow = {
  id: string;
  name: string;
  parentId: string | null;
};

export type CodeFileRow = {
  id: string;
  name: string;
  language: LanguageId;
  folderId: string | null;
  linkedProblemId: string | null;
  updatedAt: Date;
};

/** The full explorer contents for a user (folders + file metadata, no bodies). */
export async function getCodeTree(userId: string): Promise<{
  folders: FolderRow[];
  files: CodeFileRow[];
}> {
  const [folderRows, fileRows] = await Promise.all([
    db
      .select({
        id: folders.id,
        name: folders.name,
        parentId: folders.parentId,
      })
      .from(folders)
      .where(eq(folders.userId, userId))
      .orderBy(asc(folders.name)),
    db
      .select({
        id: codeFiles.id,
        name: codeFiles.name,
        language: codeFiles.language,
        folderId: codeFiles.folderId,
        linkedProblemId: codeFiles.linkedProblemId,
        updatedAt: codeFiles.updatedAt,
      })
      .from(codeFiles)
      .where(eq(codeFiles.userId, userId))
      .orderBy(desc(codeFiles.updatedAt)),
  ]);

  return {
    folders: folderRows,
    files: fileRows.map((f) => ({ ...f, language: asLanguageId(f.language) })),
  };
}

export type CodeFileFull = {
  id: string;
  name: string;
  language: LanguageId;
  content: string;
  folderId: string | null;
  linkedProblemId: string | null;
  roadmapId: string | null;
  topicId: string | null;
  updatedAt: Date;
};

export async function getCodeFile(
  userId: string,
  fileId: string,
): Promise<CodeFileFull | null> {
  const [row] = await db
    .select({
      id: codeFiles.id,
      name: codeFiles.name,
      language: codeFiles.language,
      content: codeFiles.content,
      folderId: codeFiles.folderId,
      linkedProblemId: codeFiles.linkedProblemId,
      roadmapId: codeFiles.roadmapId,
      topicId: codeFiles.topicId,
      updatedAt: codeFiles.updatedAt,
    })
    .from(codeFiles)
    .where(and(eq(codeFiles.userId, userId), eq(codeFiles.id, fileId)))
    .limit(1);

  if (!row) return null;
  return { ...row, language: asLanguageId(row.language) };
}

/** Files linked to a specific problem, for "Open Related File" (Requirement 10). */
export async function getRelatedFiles(
  userId: string,
  problemId: string,
): Promise<CodeFileRow[]> {
  const rows = await db
    .select({
      id: codeFiles.id,
      name: codeFiles.name,
      language: codeFiles.language,
      folderId: codeFiles.folderId,
      linkedProblemId: codeFiles.linkedProblemId,
      updatedAt: codeFiles.updatedAt,
    })
    .from(codeFiles)
    .where(
      and(
        eq(codeFiles.userId, userId),
        eq(codeFiles.linkedProblemId, problemId),
      ),
    )
    .orderBy(desc(codeFiles.updatedAt));

  return rows.map((f) => ({ ...f, language: asLanguageId(f.language) }));
}
