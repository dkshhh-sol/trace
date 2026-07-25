import { striverA2Z } from "@/lib/content/striver";
import type { GoalPeriod } from "@/lib/db/schema/goals";
import type { HeatmapDay } from "@/lib/profile/types";

/**
 * Single source of truth for progress-derived statistics. Pure and reusable —
 * both the dashboard (lightweight summary) and the profile (full 365-day view)
 * compute from the same functions so numbers never diverge.
 */

export type Solve = { problemId: string; completedAt: Date | null };

export type Difficulty = "easy" | "medium" | "hard";

/** Compact per-day aggregate keyed by `YYYY-MM-DD` (UTC). */
export type DayAggregate = {
  count: number;
  topics: string[];
  byDifficulty: { easy: number; medium: number; hard: number };
};

// Content maps built once per process.
const problemToTopic = new Map<string, string>();
const problemToDifficulty = new Map<string, Difficulty>();
const topicProblemIds: { topic: string; ids: string[] }[] = [];
const stepProblemIds: { step: string; ids: string[] }[] = [];

/**
 * Derive a problem's difficulty from its topic name. The Striver content has
 * no per-problem difficulty field, so we parse topic labels like "3.1 Easy",
 * "10.2 Hard Problems", "6.3 Medium Problems of LL". Ambiguous labels such as
 * "12.2 Medium/Hard Problems" yield no difficulty (honest partial coverage).
 */
function difficultyFromTopic(topicName: string): Difficulty | null {
  const easy = /\beasy\b/i.test(topicName);
  const medium = /\bmedium\b/i.test(topicName);
  const hard = /\bhard\b/i.test(topicName);
  const hits = [easy, medium, hard].filter(Boolean).length;
  if (hits !== 1) return null; // none, or ambiguous ("Medium/Hard")
  if (easy) return "easy";
  if (medium) return "medium";
  return "hard";
}

for (const step of striverA2Z.steps) {
  const stepIds: string[] = [];
  for (const topic of step.topics) {
    const ids = topic.problems.map((p) => p.id);
    topicProblemIds.push({ topic: topic.name, ids });
    stepIds.push(...ids);
    const diff = difficultyFromTopic(topic.name);
    for (const p of topic.problems) {
      problemToTopic.set(p.id, topic.name);
      if (diff) problemToDifficulty.set(p.id, diff);
    }
  }
  stepProblemIds.push({ step: step.name, ids: stepIds });
}

export const TOTAL_PROBLEMS = striverA2Z.totalProblems;
export const TOTAL_TOPICS = topicProblemIds.length;

/** Public helper: a problem's derived difficulty, or null when unknown. */
export function problemDifficulty(problemId: string): Difficulty | null {
  return problemToDifficulty.get(problemId) ?? null;
}

export const dayKey = (d: Date) => d.toISOString().slice(0, 10);

/**
 * Aggregate solves into a compact per-day map (UTC). This is intentionally
 * date-window agnostic: it's the shared input for the dashboard's fixed-year
 * calendar generator, which can rebuild any calendar year from this map
 * client-side without another database round-trip.
 */
export function aggregateSolvesByDay(solves: Solve[]): Record<string, DayAggregate> {
  const map = new Map<
    string,
    { count: number; topics: Set<string>; easy: number; medium: number; hard: number }
  >();

  for (const s of solves) {
    if (!s.completedAt) continue;
    const key = dayKey(s.completedAt);
    const bucket =
      map.get(key) ??
      { count: 0, topics: new Set<string>(), easy: 0, medium: 0, hard: 0 };
    bucket.count++;
    const topic = problemToTopic.get(s.problemId);
    if (topic) bucket.topics.add(topic);
    const diff = problemToDifficulty.get(s.problemId);
    if (diff) bucket[diff]++;
    map.set(key, bucket);
  }

  const out: Record<string, DayAggregate> = {};
  for (const [key, b] of map) {
    out[key] = {
      count: b.count,
      topics: [...b.topics],
      byDifficulty: { easy: b.easy, medium: b.medium, hard: b.hard },
    };
  }
  return out;
}

/** Start of the current period window (UTC), for a given `now`. */
export function periodStart(period: GoalPeriod, now: Date): Date {
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  const day = now.getUTCDate();
  switch (period) {
    case "daily":
      return new Date(Date.UTC(y, m, day));
    case "weekly": {
      const d = new Date(Date.UTC(y, m, day));
      const dow = d.getUTCDay(); // 0=Sun..6=Sat
      d.setUTCDate(d.getUTCDate() - ((dow + 6) % 7)); // back to Monday
      return d;
    }
    case "monthly":
      return new Date(Date.UTC(y, m, 1));
    case "yearly":
      return new Date(Date.UTC(y, 0, 1));
  }
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
  solvedThisMonth: number;
  solvedThisYear: number;
  heatmap: HeatmapDay[];
};

/**
 * Compute all progress statistics from a user's solves.
 * @param heatmapDays how many days of heatmap history to build (e.g. 365 or 84)
 */
export function computeActivity(solves: Solve[], heatmapDays: number): Activity {
  const completedIds = new Set<string>();
  const perDay = new Map<
    string,
    { count: number; topics: Set<string>; easy: number; medium: number; hard: number }
  >();
  const activeDates = new Set<string>();

  for (const s of solves) {
    completedIds.add(s.problemId);
    if (s.completedAt) {
      const key = dayKey(s.completedAt);
      activeDates.add(key);
      const bucket =
        perDay.get(key) ??
        { count: 0, topics: new Set<string>(), easy: 0, medium: 0, hard: 0 };
      bucket.count++;
      const topic = problemToTopic.get(s.problemId);
      if (topic) bucket.topics.add(topic);
      const diff = problemToDifficulty.get(s.problemId);
      if (diff) bucket[diff]++;
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

  const weekStart = dayKey(periodStart("weekly", now));
  const monthStart = dayKey(periodStart("monthly", now));
  const yearStart = dayKey(periodStart("yearly", now));
  let solvedThisWeek = 0;
  let solvedThisMonth = 0;
  let solvedThisYear = 0;
  for (const [key, bucket] of perDay) {
    if (key >= weekStart) solvedThisWeek += bucket.count;
    if (key >= monthStart) solvedThisMonth += bucket.count;
    if (key >= yearStart) solvedThisYear += bucket.count;
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
      byDifficulty: {
        easy: bucket?.easy ?? 0,
        medium: bucket?.medium ?? 0,
        hard: bucket?.hard ?? 0,
      },
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
    solvedThisMonth,
    solvedThisYear,
    heatmap,
  };
}

export type GoalInput = {
  id: string;
  title: string;
  targetCount: number;
  period: GoalPeriod;
};

export type GoalProgress = GoalInput & {
  done: number;
  pct: number;
  remaining: number;
  complete: boolean;
};

/**
 * Derive per-goal progress from solves. `done` counts solves whose
 * `completedAt` falls inside the goal's current period window. Only progress
 * resets by period; the goal row itself persists.
 */
export function computeGoalProgress(
  solves: Solve[],
  goals: GoalInput[],
  now: Date = new Date(),
): GoalProgress[] {
  const starts: Record<GoalPeriod, string> = {
    daily: dayKey(periodStart("daily", now)),
    weekly: dayKey(periodStart("weekly", now)),
    monthly: dayKey(periodStart("monthly", now)),
    yearly: dayKey(periodStart("yearly", now)),
  };

  const perPeriod: Record<GoalPeriod, number> = {
    daily: 0,
    weekly: 0,
    monthly: 0,
    yearly: 0,
  };
  for (const s of solves) {
    if (!s.completedAt) continue;
    const key = dayKey(s.completedAt);
    if (key >= starts.daily) perPeriod.daily++;
    if (key >= starts.weekly) perPeriod.weekly++;
    if (key >= starts.monthly) perPeriod.monthly++;
    if (key >= starts.yearly) perPeriod.yearly++;
  }

  return goals.map((g) => {
    const done = perPeriod[g.period];
    const pct =
      g.targetCount > 0 ? Math.min(100, Math.round((done / g.targetCount) * 100)) : 0;
    const remaining = Math.max(0, g.targetCount - done);
    return { ...g, done, pct, remaining, complete: g.targetCount > 0 && done >= g.targetCount };
  });
}

/* ----------------------------- Achievements -------------------------------- */

/**
 * Named Striver steps used by the "topic mastery" achievements. Matched by
 * exact step-name substring so "Binary Search" never collides with
 * "Binary Search Trees".
 */
const NAMED_STEPS = {
  arrays: "Step 3: Arrays",
  binarySearch: "Step 4: Binary Search",
  trees: "Step 13: Binary Trees",
  graphs: "Step 15: Graphs",
  dp: "Step 16: Dynamic Programming",
} as const;

export type Mastery = {
  topicsCompleted: number;
  totalTopics: number;
  everyTopicComplete: boolean;
  everyProblemComplete: boolean;
  steps: {
    arrays: boolean;
    binarySearch: boolean;
    trees: boolean;
    graphs: boolean;
    dp: boolean;
  };
};

function stepComplete(name: string, completed: Set<string>): boolean {
  const entry = stepProblemIds.find((s) => s.step.includes(name));
  return Boolean(entry && entry.ids.length > 0 && entry.ids.every((id) => completed.has(id)));
}

/** Topic/step completion derived from the set of solved problem ids. */
export function computeMastery(completed: Set<string>): Mastery {
  const topicsCompleted = topicProblemIds.filter(
    (t) => t.ids.length > 0 && t.ids.every((id) => completed.has(id)),
  ).length;

  return {
    topicsCompleted,
    totalTopics: TOTAL_TOPICS,
    everyTopicComplete: topicsCompleted === TOTAL_TOPICS,
    everyProblemComplete: completed.size >= TOTAL_PROBLEMS,
    steps: {
      arrays: stepComplete(NAMED_STEPS.arrays, completed),
      binarySearch: stepComplete(NAMED_STEPS.binarySearch, completed),
      trees: stepComplete(NAMED_STEPS.trees, completed),
      graphs: stepComplete(NAMED_STEPS.graphs, completed),
      dp: stepComplete(NAMED_STEPS.dp, completed),
    },
  };
}

export type GoalWithMeta = {
  targetCount: number;
  period: GoalPeriod;
  createdAt: Date;
};

export type GoalAchievementStats = {
  totalCompleted: number;
  maxDailyConsecutive: number;
  maxWeeklyConsecutive: number;
  monthlyCompleted: number;
};

function addUTC(d: Date, days: number): Date {
  const n = new Date(d);
  n.setUTCDate(n.getUTCDate() + days);
  return n;
}

/**
 * Replay every goal's period windows from its creation to now, deriving goal
 * completions purely from solves (no separate history table needed). A period
 * counts as completed when solves inside it meet the goal's target.
 */
export function computeGoalAchievementStats(
  goals: GoalWithMeta[],
  solves: Solve[],
  now: Date = new Date(),
): GoalAchievementStats {
  const perDay = new Map<string, number>();
  for (const s of solves) {
    if (!s.completedAt) continue;
    const k = dayKey(s.completedAt);
    perDay.set(k, (perDay.get(k) ?? 0) + 1);
  }
  const rangeSum = (startInclusive: Date, endExclusive: Date): number => {
    let sum = 0;
    for (let d = new Date(startInclusive); d < endExclusive; d = addUTC(d, 1)) {
      sum += perDay.get(dayKey(d)) ?? 0;
    }
    return sum;
  };

  const stats: GoalAchievementStats = {
    totalCompleted: 0,
    maxDailyConsecutive: 0,
    maxWeeklyConsecutive: 0,
    monthlyCompleted: 0,
  };

  for (const goal of goals) {
    if (goal.targetCount <= 0) continue;
    const results: boolean[] = [];

    if (goal.period === "daily") {
      let cur = periodStart("daily", goal.createdAt);
      const end = periodStart("daily", now);
      while (cur <= end) {
        const next = addUTC(cur, 1);
        results.push(rangeSum(cur, next) >= goal.targetCount);
        cur = next;
      }
    } else if (goal.period === "weekly") {
      let cur = periodStart("weekly", goal.createdAt);
      const end = periodStart("weekly", now);
      while (cur <= end) {
        const next = addUTC(cur, 7);
        results.push(rangeSum(cur, next) >= goal.targetCount);
        cur = next;
      }
    } else if (goal.period === "monthly") {
      let cur = periodStart("monthly", goal.createdAt);
      const end = periodStart("monthly", now);
      while (cur <= end) {
        const next = new Date(
          Date.UTC(cur.getUTCFullYear(), cur.getUTCMonth() + 1, 1),
        );
        results.push(rangeSum(cur, next) >= goal.targetCount);
        cur = next;
      }
    } else {
      // yearly (not targeted by achievements, but counted toward totals)
      let cur = periodStart("yearly", goal.createdAt);
      const end = periodStart("yearly", now);
      while (cur <= end) {
        const next = new Date(Date.UTC(cur.getUTCFullYear() + 1, 0, 1));
        results.push(rangeSum(cur, next) >= goal.targetCount);
        cur = next;
      }
    }

    const completed = results.filter(Boolean).length;
    stats.totalCompleted += completed;

    let run = 0;
    let maxRun = 0;
    for (const ok of results) {
      run = ok ? run + 1 : 0;
      if (run > maxRun) maxRun = run;
    }

    if (goal.period === "daily")
      stats.maxDailyConsecutive = Math.max(stats.maxDailyConsecutive, maxRun);
    else if (goal.period === "weekly")
      stats.maxWeeklyConsecutive = Math.max(stats.maxWeeklyConsecutive, maxRun);
    else if (goal.period === "monthly")
      stats.monthlyCompleted += completed;
  }

  return stats;
}

/** Current streak from a solve list (platform admin: per-user, page-bounded). */
export function currentStreakFromSolves(solves: Solve[]): number {
  const dates = new Set<string>();
  for (const s of solves) if (s.completedAt) dates.add(dayKey(s.completedAt));
  return computeStreaks(dates).current;
}

/**
 * Platform-wide solved distribution per topic, given a flat list of solved
 * problem ids (duplicates across users allowed — each counts once per solve).
 * Returns every topic with its solved count and total size.
 */
export function topicSolveDistribution(
  problemIds: string[],
): { topic: string; solved: number; total: number }[] {
  const solvedByTopic = new Map<string, number>();
  for (const id of problemIds) {
    const topic = problemToTopic.get(id);
    if (!topic) continue;
    solvedByTopic.set(topic, (solvedByTopic.get(topic) ?? 0) + 1);
  }
  return topicProblemIds.map((t) => ({
    topic: t.topic,
    solved: solvedByTopic.get(t.topic) ?? 0,
    total: t.ids.length,
  }));
}
