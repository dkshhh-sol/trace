import "server-only";

import { cache } from "react";
import { and, eq, like } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { progress } from "@/lib/db/schema";
import type { Solve } from "@/lib/progress/compute";

/**
 * All completed solves (problemId + completedAt) for a roadmap.
 *
 * Wrapped in React `cache()` so that multiple server components in the same
 * request (e.g. the dashboard's goals card and activity widget) share a single
 * database round-trip and a single aggregation pass instead of recomputing.
 */
export const getUserSolves = cache(async function getUserSolves(
  userId: string,
  roadmapSlug: string,
): Promise<Solve[]> {
  const rows = await db
    .select({
      sid: progress.sanityDocumentId,
      completedAt: progress.completedAt,
    })
    .from(progress)
    .where(
      and(
        eq(progress.userId, userId),
        eq(progress.status, "completed"),
        like(progress.sanityDocumentId, `${roadmapSlug}:%`),
      ),
    );

  const prefixLen = roadmapSlug.length + 1;
  return rows.map((r) => ({
    problemId: r.sid.slice(prefixLen),
    completedAt: r.completedAt,
  }));
});
