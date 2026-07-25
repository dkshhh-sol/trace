"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { requireSession } from "@/lib/auth/guards";
import { db } from "@/lib/db/client";
import { codeFiles, folders, problemDrafts, userSettings } from "@/lib/db/schema";
import { CODE_LANGUAGES } from "@/lib/db/schema/code";

const languageSchema = z.enum(CODE_LANGUAGES);
const idSchema = z.string().uuid();
const nameSchema = z.string().trim().min(1).max(120);

async function uid(): Promise<string> {
  const session = await requireSession();
  return session.user.id;
}

/* --------------------------- Problem draft autosave --------------------------- */

const draftSchema = z.object({
  problemId: z.string().trim().min(1).max(200),
  roadmapId: z.string().trim().max(200).optional(),
  language: languageSchema,
  fileName: z.string().trim().min(1).max(200),
  content: z.string().max(500_000),
  cursorLine: z.coerce.number().int().min(1).max(1_000_000),
  cursorColumn: z.coerce.number().int().min(1).max(100_000),
});

/** Auto-save the lecture editor state for a problem (Requirement 4). */
export async function saveProblemDraft(input: z.infer<typeof draftSchema>) {
  const userId = await uid();
  const data = draftSchema.parse(input);

  await db
    .insert(problemDrafts)
    .values({
      userId,
      problemId: data.problemId,
      roadmapId: data.roadmapId ?? null,
      language: data.language,
      fileName: data.fileName,
      content: data.content,
      cursorLine: data.cursorLine,
      cursorColumn: data.cursorColumn,
    })
    .onConflictDoUpdate({
      target: [problemDrafts.userId, problemDrafts.problemId],
      set: {
        roadmapId: data.roadmapId ?? null,
        language: data.language,
        fileName: data.fileName,
        content: data.content,
        cursorLine: data.cursorLine,
        cursorColumn: data.cursorColumn,
        updatedAt: new Date(),
      },
    });

  return { ok: true as const };
}

/* ------------------------------ Lecture layout ------------------------------ */

const layoutSchema = z.object({
  splitPct: z.coerce.number().int().min(15).max(85),
  editorOpen: z.boolean(),
});

/** Persist the lecture split ratio and open/closed state per user (Requirement 2). */
export async function setLectureLayout(input: z.infer<typeof layoutSchema>) {
  const userId = await uid();
  const data = layoutSchema.parse(input);

  await db
    .insert(userSettings)
    .values({
      userId,
      lectureSplitPct: data.splitPct,
      lectureEditorOpen: data.editorOpen,
    })
    .onConflictDoUpdate({
      target: userSettings.userId,
      set: {
        lectureSplitPct: data.splitPct,
        lectureEditorOpen: data.editorOpen,
        updatedAt: new Date(),
      },
    });

  return { ok: true as const };
}

/* ----------------------------- Save as file --------------------------------- */

const saveAsSchema = z.object({
  problemId: z.string().trim().min(1).max(200),
  roadmapId: z.string().trim().max(200).optional(),
  topicId: z.string().trim().max(200).optional(),
  name: nameSchema,
  language: languageSchema,
  content: z.string().max(500_000),
});

/**
 * Create (or update, if one already exists) a permanent Code File linked to a
 * problem (Requirement 6). One linked file per (user, problem).
 */
export async function saveProblemAsFile(input: z.infer<typeof saveAsSchema>) {
  const userId = await uid();
  const data = saveAsSchema.parse(input);

  const [existing] = await db
    .select({ id: codeFiles.id })
    .from(codeFiles)
    .where(
      and(
        eq(codeFiles.userId, userId),
        eq(codeFiles.linkedProblemId, data.problemId),
      ),
    )
    .limit(1);

  let fileId: string;
  if (existing) {
    await db
      .update(codeFiles)
      .set({
        name: data.name,
        language: data.language,
        content: data.content,
        roadmapId: data.roadmapId ?? null,
        topicId: data.topicId ?? null,
        updatedAt: new Date(),
      })
      .where(and(eq(codeFiles.id, existing.id), eq(codeFiles.userId, userId)));
    fileId = existing.id;
  } else {
    const [row] = await db
      .insert(codeFiles)
      .values({
        userId,
        name: data.name,
        language: data.language,
        content: data.content,
        linkedProblemId: data.problemId,
        roadmapId: data.roadmapId ?? null,
        topicId: data.topicId ?? null,
      })
      .returning({ id: codeFiles.id });
    fileId = row.id;
  }

  revalidatePath("/code-files");
  return { ok: true as const, fileId, updated: Boolean(existing) };
}

/* ------------------------------ Folder CRUD --------------------------------- */

export async function createFolder(input: {
  name: string;
  parentId?: string | null;
}) {
  const userId = await uid();
  const name = nameSchema.parse(input.name);
  const parentId = input.parentId ? idSchema.parse(input.parentId) : null;

  const [row] = await db
    .insert(folders)
    .values({ userId, name, parentId })
    .returning({ id: folders.id, name: folders.name, parentId: folders.parentId });

  revalidatePath("/code-files");
  return row;
}

export async function renameFolder(input: { id: string; name: string }) {
  const userId = await uid();
  const id = idSchema.parse(input.id);
  const name = nameSchema.parse(input.name);

  await db
    .update(folders)
    .set({ name, updatedAt: new Date() })
    .where(and(eq(folders.id, id), eq(folders.userId, userId)));

  revalidatePath("/code-files");
  return { ok: true as const };
}

/** Delete a folder; nested folders cascade, contained files are un-foldered. */
export async function deleteFolder(id: string) {
  const userId = await uid();
  const folderId = idSchema.parse(id);

  await db
    .delete(folders)
    .where(and(eq(folders.id, folderId), eq(folders.userId, userId)));

  revalidatePath("/code-files");
  return { ok: true as const };
}

/* ------------------------------- File CRUD ---------------------------------- */

const createFileSchema = z.object({
  name: nameSchema,
  language: languageSchema,
  folderId: z.string().uuid().nullable().optional(),
  content: z.string().max(500_000).optional(),
});

export async function createFile(input: z.infer<typeof createFileSchema>) {
  const userId = await uid();
  const data = createFileSchema.parse(input);

  const [row] = await db
    .insert(codeFiles)
    .values({
      userId,
      name: data.name,
      language: data.language,
      folderId: data.folderId ?? null,
      content: data.content ?? "",
    })
    .returning({ id: codeFiles.id });

  revalidatePath("/code-files");
  return { ok: true as const, fileId: row.id };
}

export async function renameFile(input: {
  id: string;
  name: string;
  language?: (typeof CODE_LANGUAGES)[number];
}) {
  const userId = await uid();
  const id = idSchema.parse(input.id);
  const name = nameSchema.parse(input.name);
  const language = input.language ? languageSchema.parse(input.language) : undefined;

  await db
    .update(codeFiles)
    .set({ name, ...(language ? { language } : {}), updatedAt: new Date() })
    .where(and(eq(codeFiles.id, id), eq(codeFiles.userId, userId)));

  revalidatePath("/code-files");
  return { ok: true as const };
}

export async function deleteFile(id: string) {
  const userId = await uid();
  const fileId = idSchema.parse(id);

  await db
    .delete(codeFiles)
    .where(and(eq(codeFiles.id, fileId), eq(codeFiles.userId, userId)));

  revalidatePath("/code-files");
  return { ok: true as const };
}

const saveContentSchema = z.object({
  id: z.string().uuid(),
  content: z.string().max(500_000),
  language: languageSchema.optional(),
});

/** Auto-save the body of a Code File (no revalidation to avoid list churn). */
export async function saveFileContent(input: z.infer<typeof saveContentSchema>) {
  const userId = await uid();
  const data = saveContentSchema.parse(input);

  await db
    .update(codeFiles)
    .set({
      content: data.content,
      ...(data.language ? { language: data.language } : {}),
      updatedAt: new Date(),
    })
    .where(and(eq(codeFiles.id, data.id), eq(codeFiles.userId, userId)));

  return { ok: true as const };
}
