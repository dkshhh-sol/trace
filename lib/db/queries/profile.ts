import "server-only";

import { eq } from "drizzle-orm";
import { db } from "../client";
import { users } from "../schema";
import { getUserSolves } from "./activity";
import { getGoals } from "./goals";
import { computeActivity, computeGoalProgress } from "@/lib/progress/compute";
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
    getGoals(userId),
  ]);

  const activity = computeActivity(solves, 365);
  const goalProgress = computeGoalProgress(solves, goals);

  return {
    name: userRow?.name ?? null,
    email: userRow?.email ?? null,
    image: userRow?.image ?? null,
    joinedAt: (userRow?.createdAt ?? new Date()).toISOString(),
    goals: goalProgress,
    ...activity,
  };
}
