import "server-only";

import { and, eq, like } from "drizzle-orm";
import { db } from "../client";
import { progress, users, userSettings } from "../schema";
import { striverA2Z } from "@/lib/content/striver";
import type { HeatmapDay, ProfileStats } from "@/lib/profile/types";

const HEATMAP_DAYS = 182; // ~26 weeks

// Precomputed content maps (built once per server process).
const problemToTopic = new Map<string, string>();
const topicProblemIds: { topic: string; ids: string[] }[] = [];
for (const step of striverA2Z.steps) {
  for (const topic of step.topics) {
    const ids = topic.problems.map((p) => p.id);
    topicProblemIds.push({ topic: topic.name, ids });
    for (const p of topic.problems) problemToTopic.set(p.id, topic.name);
  }
}

const dayKey = (d: Date) => d.toISOString().slice(0, 10);

function computeStreaks(dates: Set<string>): {
  current: number;
  longest: number;
} {
  if (dates.size === 0) return { current: 0, longest: 0 };

  // current streak: consecutive days ending today or yesterday
  let current = 0;
  const cursor = new Date();
  if (!dates.has(dayKey(cursor))) cursor.setUTCDate(cursor.getUTCDate() - 1);
  while (dates.has(dayKey(cursor))) {
    current++;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  // longest streak: scan sorted unique days
  const sorted = [...dates].sort();
  let longest = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1] + "T00:00:00Z");
    prev.setUTCDate(prev.getUTCDate() + 1);
    if (dayKey(prev) === sorted[i]) {
      run++;
    } else {
      run = 1;
    }
    if (run > longest) longest = run;
  }
  return { current, longest };
}

export async function getProfileStats(userId: string): Promise<ProfileStats> {
  const [userRow] = await db
    .select({
      name: users.name,
      email: users.email,
      image: users.image,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const [settingsRow] = await db
    .select({ dailyGoal: userSettings.dailyGoal })
    .from(userSettings)
    .where(eq(userSettings.userId, userId))
    .limit(1);

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
        like(progress.sanityDocumentId, `${striverA2Z.slug}:%`),
      ),
    );

  const prefixLen = striverA2Z.slug.length + 1;
  const completedIds = new Set<string>();
  const perDay = new Map<string, { count: number; topics: Set<string> }>();
  const activeDates = new Set<string>();

  for (const r of rows) {
    const id = r.sid.slice(prefixLen);
    completedIds.add(id);
    if (r.completedAt) {
      const key = dayKey(r.completedAt);
      activeDates.add(key);
      const bucket = perDay.get(key) ?? { count: 0, topics: new Set<string>() };
      bucket.count++;
      const topic = problemToTopic.get(id);
      if (topic) bucket.topics.add(topic);
      perDay.set(key, bucket);
    }
  }

  const solved = completedIds.size;
  const totalProblems = striverA2Z.totalProblems;
  const progressPct = Math.round((solved / totalProblems) * 100);

  const totalTopics = topicProblemIds.length;
  const topicsCompleted = topicProblemIds.filter((t) =>
    t.ids.every((id) => completedIds.has(id)),
  ).length;

  const { current: currentStreak, longest: longestStreak } =
    computeStreaks(activeDates);

  // Heatmap: last HEATMAP_DAYS days ending today (UTC), zero-filled.
  const heatmap: HeatmapDay[] = [];
  const start = new Date();
  start.setUTCDate(start.getUTCDate() - (HEATMAP_DAYS - 1));
  for (let i = 0; i < HEATMAP_DAYS; i++) {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + i);
    const key = dayKey(d);
    const bucket = perDay.get(key);
    heatmap.push({
      date: key,
      count: bucket?.count ?? 0,
      topics: bucket ? [...bucket.topics] : [],
    });
  }

  // Goals
  const dailyGoal = settingsRow?.dailyGoal ?? 3;
  const today = dayKey(new Date());
  const solvedToday = perDay.get(today)?.count ?? 0;
  const weekAgo = new Date();
  weekAgo.setUTCDate(weekAgo.getUTCDate() - 6);
  let solvedThisWeek = 0;
  for (const [key, bucket] of perDay) {
    if (key >= dayKey(weekAgo)) solvedThisWeek += bucket.count;
  }

  return {
    name: userRow?.name ?? null,
    email: userRow?.email ?? null,
    image: userRow?.image ?? null,
    joinedAt: (userRow?.createdAt ?? new Date()).toISOString(),
    solved,
    totalProblems,
    progressPct,
    topicsCompleted,
    totalTopics,
    currentStreak,
    longestStreak,
    dailyGoal,
    solvedToday,
    weeklyGoal: dailyGoal * 7,
    solvedThisWeek,
    heatmap,
  };
}
