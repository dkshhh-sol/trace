import "server-only";

import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { goals } from "@/lib/db/schema";
import type { GoalInput } from "@/lib/progress/compute";

/**
 * All of a user's goals in display order. Goals are entirely user-defined —
 * there are no seeded defaults and no assumption that any particular period
 * exists. New users simply have an empty list until they create a goal.
 */
export async function getGoals(userId: string): Promise<GoalInput[]> {
  const rows = await db
    .select({
      id: goals.id,
      title: goals.title,
      targetCount: goals.targetCount,
      period: goals.period,
    })
    .from(goals)
    .where(eq(goals.userId, userId))
    .orderBy(asc(goals.sortOrder), asc(goals.createdAt));

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    targetCount: r.targetCount,
    period: r.period as GoalInput["period"],
  }));
}
