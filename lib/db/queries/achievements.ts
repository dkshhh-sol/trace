import "server-only";

import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  users,
  goals,
  codeFiles,
  githubConnections,
  analyticsDaily,
  revisionHistory,
  userAchievements,
} from "@/lib/db/schema";
import { getUserSolves } from "./activity";
import {
  computeActivity,
  computeMastery,
  computeGoalAchievementStats,
  type GoalWithMeta,
} from "@/lib/progress/compute";
import {
  evaluateAchievements,
  type AchievementInput,
  type AchievementView,
} from "@/lib/achievements/engine";
import { striverA2Z } from "@/lib/content/striver";

export type NewlyUnlocked = {
  id: string;
  title: string;
  icon: string;
  category: string;
};

export type AchievementResult = {
  achievements: AchievementView[];
  recentlyUnlocked: AchievementView[];
  newlyUnlocked: NewlyUnlocked[];
};

/**
 * Compute the user's achievements from real activity, persist any newly-earned
 * unlocks (once), and return the full view plus what unlocked in this pass.
 * Idempotent — safe to call on every profile open or dashboard load.
 */
export async function syncAchievements(
  userId: string,
): Promise<AchievementResult> {
  const [solves, goalRows, counts, gh, userRow, unlockedRows] =
    await Promise.all([
      getUserSolves(userId, striverA2Z.slug),
      db
        .select({
          targetCount: goals.targetCount,
          period: goals.period,
          createdAt: goals.createdAt,
        })
        .from(goals)
        .where(eq(goals.userId, userId)),
      db
        .select({
          codeFiles: sql<number>`(select count(*) from ${codeFiles} where ${codeFiles.userId} = ${userId})`,
          learningMinutes: sql<number>`coalesce((select sum(${analyticsDaily.minutesLearned}) from ${analyticsDaily} where ${analyticsDaily.userId} = ${userId}), 0)`,
          revisions: sql<number>`(select count(*) from ${revisionHistory} where ${revisionHistory.userId} = ${userId})`,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1),
      db
        .select({
          commitCount: githubConnections.commitCount,
        })
        .from(githubConnections)
        .where(eq(githubConnections.userId, userId))
        .limit(1),
      db
        .select({ createdAt: users.createdAt })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1),
      db
        .select({
          achievementId: userAchievements.achievementId,
          unlockedAt: userAchievements.unlockedAt,
        })
        .from(userAchievements)
        .where(eq(userAchievements.userId, userId)),
    ]);

  const activity = computeActivity(solves, 0);
  const completedIds = new Set(solves.map((s) => s.problemId));
  const mastery = computeMastery(completedIds);

  const goalsMeta: GoalWithMeta[] = goalRows.map((g) => ({
    targetCount: g.targetCount,
    period: g.period as GoalWithMeta["period"],
    createdAt: g.createdAt,
  }));
  const goalStats = computeGoalAchievementStats(goalsMeta, solves);

  const joinedAt = userRow[0]?.createdAt ?? new Date();

  const input: AchievementInput = {
    solvedCount: activity.solved,
    totalProblems: activity.totalProblems,
    longestStreak: activity.longestStreak,
    currentStreak: activity.currentStreak,
    topicsCompleted: mastery.topicsCompleted,
    totalTopics: mastery.totalTopics,
    steps: mastery.steps,
    everyTopicComplete: mastery.everyTopicComplete,
    everyProblemComplete: mastery.everyProblemComplete,
    goalsTotalCompleted: goalStats.totalCompleted,
    goalsMaxDailyConsecutive: goalStats.maxDailyConsecutive,
    goalsMaxWeeklyConsecutive: goalStats.maxWeeklyConsecutive,
    goalsMonthlyCompleted: goalStats.monthlyCompleted,
    codeFilesCount: Number(counts[0]?.codeFiles ?? 0),
    githubConnected: gh.length > 0,
    githubCommits: gh[0]?.commitCount ?? 0,
    learningMinutes: Number(counts[0]?.learningMinutes ?? 0),
    revisionsCount: Number(counts[0]?.revisions ?? 0),
  };

  const unlockedMap = new Map<string, Date>(
    unlockedRows.map((r) => [r.achievementId, r.unlockedAt] as const),
  );

  // First pass to find conditions that are met but not yet persisted.
  const pass = evaluateAchievements(input, unlockedMap);
  const toInsert: { achievementId: string; unlockedAt: Date }[] = [];
  const newlyUnlocked: NewlyUnlocked[] = [];

  for (const v of pass) {
    if (v.met && !unlockedMap.has(v.id)) {
      // "Joined Trace" is dated to account creation; others unlock now.
      const unlockedAt = v.id === "journey_joined" ? joinedAt : new Date();
      unlockedMap.set(v.id, unlockedAt);
      toInsert.push({ achievementId: v.id, unlockedAt });
      newlyUnlocked.push({
        id: v.id,
        title: v.title,
        icon: v.icon,
        category: v.category,
      });
    }
  }

  if (toInsert.length > 0) {
    await db
      .insert(userAchievements)
      .values(toInsert.map((t) => ({ userId, ...t })))
      .onConflictDoNothing();
  }

  // Final view with the freshly-inserted unlocks reflected.
  const achievements = evaluateAchievements(input, unlockedMap);
  const recentlyUnlocked = achievements
    .filter((a) => a.unlocked && a.unlockedAt)
    .sort((a, b) => (b.unlockedAt! < a.unlockedAt! ? -1 : 1))
    .slice(0, 3);

  return { achievements, recentlyUnlocked, newlyUnlocked };
}
