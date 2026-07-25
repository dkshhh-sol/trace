import { striverA2Z } from "@/lib/content/striver";
import type { HeatmapDay } from "@/lib/profile/types";

/**
 * Single source of truth for progress-derived statistics. Pure and reusable —
 * both the dashboard (lightweight summary) and the profile (full 365-day view)
 * compute from the same functions so numbers never diverge.
 */

export type Solve = { problemId: string; completedAt: Date | null };

// Content maps built once per process.
const problemToTopic = new Map<string, string>();
const topicProblemIds: { topic: string; ids: string[] }[] = [];
for (const step of striverA2Z.steps) {
  for (const topic of step.topics) {
    const ids = topic.problems.map((p) => p.id);
    topicProblemIds.push({ topic: topic.name, ids });
    for (const p of topic.problems) problemToTopic.set(p.id, topic.name);
  }
}

export const TOTAL_PROBLEMS = striverA2Z.totalProblems;
export const TOTAL_TOPICS = topicProblemIds.length;

export const dayKey = (d: Date) => d.toISOString().slice(0, 10);

/** Monday 00:00 UTC of the week containing `now`. */
function startOfWeekMonday(now: Date): Date {
  const d = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  const dow = d.getUTCDay(); // 0=Sun..6=Sat
  const diff = (dow + 6) % 7; // days since Monday
  d.setUTCDate(d.getUTCDate() - diff);
  return d;
}

function computeStreaks(dates: Set<string>): {
  current: number;
  longest: number;
} {
  if (dates.size === 0) return { current: 0, longest: 0 };

  let current = 0;
  const cursor = new Date();
  if (!dates.has(dayKey(cursor))) cursor.setUTCDate(cursor.getUTCDate() - 1);
  while (dates.has(dayKey(cursor))) {
    current++;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  const sorted = [...dates].sort();
  let longest = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1] + "T00:00:00Z");
    prev.setUTCDate(prev.getUTCDate() + 1);
    if (dayKey(prev) === sorted[i]) run++;
    else run = 1;
    if (run > longest) longest = run;
  }
  return { current, longest };
}

export type Activity = {
  solved: number;
  totalProblems: number;
  progressPct: number;
  topicsCompleted: number;
  totalTopics: number;
  currentStreak: number;
  longestStreak: number;
  activeDays: number;
  avgPerActiveDay: number;
  solvedToday: number;
  solvedThisWeek: number;
  heatmap: HeatmapDay[];
};

/**
 * Compute all progress statistics from a user's solves.
 * @param heatmapDays how many days of heatmap history to build (e.g. 365 or 84)
 */
export function computeActivity(solves: Solve[], heatmapDays: number): Activity {
  const completedIds = new Set<string>();
  const perDay = new Map<string, { count: number; topics: Set<string> }>();
  const activeDates = new Set<string>();

  for (const s of solves) {
    completedIds.add(s.problemId);
    if (s.completedAt) {
      const key = dayKey(s.completedAt);
      activeDates.add(key);
      const bucket = perDay.get(key) ?? { count: 0, topics: new Set<string>() };
      bucket.count++;
      const topic = problemToTopic.get(s.problemId);
      if (topic) bucket.topics.add(topic);
      perDay.set(key, bucket);
    }
  }

  const solved = completedIds.size;
  const progressPct = Math.round((solved / TOTAL_PROBLEMS) * 100);
  const topicsCompleted = topicProblemIds.filter((t) =>
    t.ids.every((id) => completedIds.has(id)),
  ).length;

  const { current: currentStreak, longest: longestStreak } =
    computeStreaks(activeDates);

  const now = new Date();
  const todayKey = dayKey(now);
  const solvedToday = perDay.get(todayKey)?.count ?? 0;

  const weekStart = dayKey(startOfWeekMonday(now));
  let solvedThisWeek = 0;
  for (const [key, bucket] of perDay) {
    if (key >= weekStart) solvedThisWeek += bucket.count;
  }

  const activeDays = activeDates.size;
  const avgPerActiveDay =
    activeDays > 0 ? Math.round((solved / activeDays) * 10) / 10 : 0;

  // Heatmap: last `heatmapDays` days ending today (UTC), zero-filled.
  const heatmap: HeatmapDay[] = [];
  const start = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  start.setUTCDate(start.getUTCDate() - (heatmapDays - 1));
  for (let i = 0; i < heatmapDays; i++) {
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

  return {
    solved,
    totalProblems: TOTAL_PROBLEMS,
    progressPct,
    topicsCompleted,
    totalTopics: TOTAL_TOPICS,
    currentStreak,
    longestStreak,
    activeDays,
    avgPerActiveDay,
    solvedToday,
    solvedThisWeek,
    heatmap,
  };
}
