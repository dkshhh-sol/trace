import "server-only";

import { eq } from "drizzle-orm";
import { db } from "../client";
import { users } from "../schema";
import { getUserGoals, getUserSolves } from "./activity";
import { computeActivity } from "@/lib/progress/compute";
import { striverA2Z } from "@/lib/content/striver";
import type { ProfileStats } from "@/lib/profile/types";

/** Full profile view: user info + goals + activity with a 365-day heatmap. */
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
    getUserGoals(userId),
  ]);

  const activity = computeActivity(solves, 365);

  return {
    name: userRow?.name ?? null,
    email: userRow?.email ?? null,
    image: userRow?.image ?? null,
    joinedAt: (userRow?.createdAt ?? new Date()).toISOString(),
    dailyGoal: goals.daily,
    weeklyGoal: goals.weekly,
    ...activity,
  };
}
