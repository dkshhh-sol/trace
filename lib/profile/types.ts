import type { GoalPeriod } from "@/lib/db/schema/goals";

export type HeatmapDay = {
  date: string; // YYYY-MM-DD (UTC)
  count: number;
  topics: string[];
  byDifficulty: { easy: number; medium: number; hard: number };
};

export type GoalView = {
  id: string;
  title: string;
  targetCount: number;
  period: GoalPeriod;
  done: number;
  pct: number;
  remaining: number;
  complete: boolean;
};

export type ProfileStats = {
  name: string | null;
  email: string | null;
  image: string | null;
  joinedAt: string; // ISO

  // Goals (persisted rows + derived progress)
  goals: GoalView[];

  // Activity (derived from solves)
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
