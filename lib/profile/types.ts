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
  solved: number;
  totalProblems: number;
  progressPct: number;
  topicsCompleted: number;
  totalTopics: number;
  currentStreak: number;
  longestStreak: number;
  dailyGoal: number;
  solvedToday: number;
  weeklyGoal: number;
  solvedThisWeek: number;
  heatmap: HeatmapDay[];
};
