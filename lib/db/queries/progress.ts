import "server-only";

import { and, eq, like } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { progress } from "@/lib/db/schema";

/**
 * Progress is stored per user in Neon (user data stays in Neon). Each row keys
 * a content item as `${roadmapSlug}:${problemId}` in `sanityDocumentId`.
 */

export async function getCompletedProblemIds(
  userId: string,
  roadmapSlug: string,
): Promise<Set<string>> {
  const rows = await db
    .select({ sid: progress.sanityDocumentId })
    .from(progress)
    .where(
      and(
        eq(progress.userId, userId),
        eq(progress.status, "completed"),
        like(progress.sanityDocumentId, `${roadmapSlug}:%`),
      ),
    );

  const prefixLen = roadmapSlug.length + 1;
  const set = new Set<string>();
  for (const r of rows) set.add(r.sid.slice(prefixLen));
  return set;
}
