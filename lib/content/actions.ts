"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { requireSession } from "@/lib/auth/guards";
import { db } from "@/lib/db/client";
import { progress } from "@/lib/db/schema";

/**
 * Toggle a problem's completion for the current user. Verifies the session
 * server-side before any write (Requirements 2.4, 2.5), then upserts the
 * progress row keyed by `${roadmapSlug}:${problemId}`.
 */
export async function setProblemDone(
  roadmapSlug: string,
  problemId: string,
  done: boolean,
): Promise<boolean> {
  const session = await requireSession();
  const userId = session.user.id;
  const sid = `${roadmapSlug}:${problemId}`;

  const existing = await db
    .select({ id: progress.id })
    .from(progress)
    .where(and(eq(progress.userId, userId), eq(progress.sanityDocumentId, sid)))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(progress)
      .set({
        status: done ? "completed" : "not_started",
        completedAt: done ? new Date() : null,
      })
      .where(
        and(eq(progress.userId, userId), eq(progress.sanityDocumentId, sid)),
      );
  } else if (done) {
    await db.insert(progress).values({
      userId,
      sanityDocumentId: sid,
      status: "completed",
      completedAt: new Date(),
    });
  }

  revalidatePath(`/roadmaps/${roadmapSlug}`);
  return done;
}
