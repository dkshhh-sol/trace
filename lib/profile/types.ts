export type HeatmapDay = {
  date: string; // YYYY-MM-DD (UTC)
  count: number;
  topics: string[];
};

export type ProfileStats = {
  name: string | null;
  email: string | null;
  image: string | null;
  joinedAt: string; // ISO

  // Goals (persisted)
  dailyGoal: number;
  weeklyGoal: number;

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
  heatmap: HeatmapDay[];
};
