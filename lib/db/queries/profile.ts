import "server-only";

import { eq } from "drizzle-orm";
import { db } from "../client";
import { users } from "../schema";
import { getUserSolves } from "./activity";
import { getGoals } from "./goals";
import {
  computeActivity,
  computeGoalProgress,
  aggregateSolvesByDay,
} from "@/lib/progress/compute";
import { buildYearCalendar } from "@/lib/progress/year-calendar";
import { striverA2Z } from "@/lib/content/striver";
import type { ProfileStats } from "@/lib/profile/types";

/**
 * Full profile view: user info + goals + activity. The heatmap matches the
 * dashboard tracker exactly — the current calendar year (Jan 1 -> Dec 31),
 * never the account's join date. Only the displayed range changed here; all
 * other stats (streaks, solved counts, goals) are unaffected.
 */
export async function getProfileStats(userId: string): Promise<ProfileStats> {
  const [[userRow], solves, goals] = await Promise.all([
    db
      .select({
        name: users.name,
        email: users.email,
        image: users.image,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1),
    getUserSolves(userId, striverA2Z.slug),
    getGoals(userId),
  ]);

  // Metrics (streaks, solved counts, etc.) are all-time / current-period and
  // independent of the displayed calendar year.
  const activity = computeActivity(solves, 0);
  const goalProgress = computeGoalProgress(solves, goals);

  const now = new Date();
  const currentYear = now.getUTCFullYear();
  const aggregate = aggregateSolvesByDay(solves);
  // Account-creation gating isn't relevant on the profile (unlike the
  // dashboard's multi-year selector), so pass Jan 1 of the current year as the
  // "created" boundary — every day in the fixed range renders as available.
  const yearStart = new Date(Date.UTC(currentYear, 0, 1)).toISOString();
  const heatmap = buildYearCalendar(aggregate, currentYear, yearStart, now);

  return {
    name: userRow?.name ?? null,
    email: userRow?.email ?? null,
    image: userRow?.image ?? null,
    joinedAt: (userRow?.createdAt ?? new Date()).toISOString(),
    goals: goalProgress,
    ...activity,
    heatmap,
  };
}
