import "server-only";

import { and, eq, like } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { progress, userSettings } from "@/lib/db/schema";
import type { Solve } from "@/lib/progress/compute";

/** All completed solves (problemId + completedAt) for a roadmap. */
export async function getUserSolves(
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
}

export type Goals = { daily: number; weekly: number };

const DEFAULT_GOALS: Goals = { daily: 2, weekly: 14 };

/** The user's daily/weekly goals, falling back to sensible defaults. */
export async function getUserGoals(userId: string): Promise<Goals> {
  const [row] = await db
    .select({
      daily: userSettings.dailyGoal,
      weekly: userSettings.weeklyGoal,
    })
    .from(userSettings)
    .where(eq(userSettings.userId, userId))
    .limit(1);

  if (!row) return DEFAULT_GOALS;
  return {
    daily: row.daily ?? DEFAULT_GOALS.daily,
    weekly: row.weekly ?? DEFAULT_GOALS.weekly,
  };
}
