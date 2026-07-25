/**
 * Achievement engine — the single source of truth for the achievement catalog
 * and unlock logic. Pure and framework-agnostic: given a snapshot of the user's
 * real activity it returns each achievement's unlocked state and progress.
 *
 * Persistence stores only { achievementId, unlockedAt }; everything else lives
 * here so new achievements can be added without touching the UI or the DB.
 * The output shape is plain data (no functions), so it is safe to send to the
 * client and to reuse inside a future notification feed.
 */

export type AchievementCategory =
  | "streak"
  | "problems"
  | "topics"
  | "goals"
  | "workspace"
  | "journey";

export const CATEGORY_META: Record<
  AchievementCategory,
  { label: string; icon: string }
> = {
  streak: { label: "Streak", icon: "Flame" },
  problems: { label: "Problem Solving", icon: "Code2" },
  topics: { label: "Topic Mastery", icon: "BookOpen" },
  goals: { label: "Goals", icon: "Target" },
  workspace: { label: "Workspace", icon: "FolderCode" },
  journey: { label: "Trace Journey", icon: "Compass" },
};

export const CATEGORY_ORDER: AchievementCategory[] = [
  "streak",
  "problems",
  "topics",
  "goals",
  "workspace",
  "journey",
];

/** Snapshot of real user activity that drives every unlock decision. */
export type AchievementInput = {
  solvedCount: number;
  totalProblems: number;
  longestStreak: number;
  currentStreak: number;
  topicsCompleted: number;
  totalTopics: number;
  steps: {
    arrays: boolean;
    binarySearch: boolean;
    trees: boolean;
    graphs: boolean;
    dp: boolean;
  };
  everyTopicComplete: boolean;
  everyProblemComplete: boolean;
  goalsTotalCompleted: number;
  goalsMaxDailyConsecutive: number;
  goalsMaxWeeklyConsecutive: number;
  goalsMonthlyCompleted: number;
  codeFilesCount: number;
  githubConnected: boolean;
  githubCommits: number;
  learningMinutes: number;
  revisionsCount: number;
};

type AchievementDef = {
  id: string;
  title: string;
  description: string;
  category: AchievementCategory;
  icon: string; // Lucide icon key (mapped in the UI) or "github"
  requirement: string;
  target: number;
  /** Current progress toward `target`, derived from the input snapshot. */
  progress: (i: AchievementInput) => number;
};

const bool = (v: boolean) => (v ? 1 : 0);

export const ACHIEVEMENTS: AchievementDef[] = [
  // Streak
  { id: "streak_1", title: "First Day", description: "Solve a problem on any day.", category: "streak", icon: "Footprints", requirement: "Reach a 1-day streak", target: 1, progress: (i) => i.longestStreak },
  { id: "streak_3", title: "3 Day Streak", description: "Stay consistent for three days.", category: "streak", icon: "Flame", requirement: "Reach a 3-day streak", target: 3, progress: (i) => i.longestStreak },
  { id: "streak_7", title: "7 Day Streak", description: "A full week of momentum.", category: "streak", icon: "Flame", requirement: "Reach a 7-day streak", target: 7, progress: (i) => i.longestStreak },
  { id: "streak_14", title: "14 Day Streak", description: "Two weeks of discipline.", category: "streak", icon: "Flame", requirement: "Reach a 14-day streak", target: 14, progress: (i) => i.longestStreak },
  { id: "streak_30", title: "30 Day Streak", description: "A month of showing up.", category: "streak", icon: "Flame", requirement: "Reach a 30-day streak", target: 30, progress: (i) => i.longestStreak },
  { id: "streak_60", title: "60 Day Streak", description: "Two months, unbroken.", category: "streak", icon: "Flame", requirement: "Reach a 60-day streak", target: 60, progress: (i) => i.longestStreak },
  { id: "streak_100", title: "100 Day Streak", description: "Triple digits of consistency.", category: "streak", icon: "Trophy", requirement: "Reach a 100-day streak", target: 100, progress: (i) => i.longestStreak },
  { id: "streak_365", title: "365 Day Streak", description: "A full year, every single day.", category: "streak", icon: "Trophy", requirement: "Reach a 365-day streak", target: 365, progress: (i) => i.longestStreak },

  // Problem Solving
  { id: "solve_1", title: "First Problem", description: "Solve your very first problem.", category: "problems", icon: "CheckCircle2", requirement: "Solve 1 problem", target: 1, progress: (i) => i.solvedCount },
  { id: "solve_10", title: "10 Problems", description: "Ten down, momentum building.", category: "problems", icon: "CheckCircle2", requirement: "Solve 10 problems", target: 10, progress: (i) => i.solvedCount },
  { id: "solve_25", title: "25 Problems", description: "A quarter-century of solves.", category: "problems", icon: "CheckCircle2", requirement: "Solve 25 problems", target: 25, progress: (i) => i.solvedCount },
  { id: "solve_50", title: "50 Problems", description: "Halfway to a hundred.", category: "problems", icon: "Target", requirement: "Solve 50 problems", target: 50, progress: (i) => i.solvedCount },
  { id: "solve_100", title: "100 Problems", description: "A hundred problems solved.", category: "problems", icon: "Target", requirement: "Solve 100 problems", target: 100, progress: (i) => i.solvedCount },
  { id: "solve_200", title: "200 Problems", description: "Serious depth of practice.", category: "problems", icon: "Trophy", requirement: "Solve 200 problems", target: 200, progress: (i) => i.solvedCount },
  { id: "solve_300", title: "300 Problems", description: "Elite consistency.", category: "problems", icon: "Trophy", requirement: "Solve 300 problems", target: 300, progress: (i) => i.solvedCount },
  { id: "solve_all", title: "Complete Every Problem", description: "Solve every problem in the sheet.", category: "problems", icon: "Award", requirement: "Solve all problems", target: 1, progress: (i) => bool(i.everyProblemComplete) },

  // Topic Mastery
  { id: "topic_first", title: "First Topic Completed", description: "Finish every problem in a topic.", category: "topics", icon: "BookOpen", requirement: "Complete 1 topic", target: 1, progress: (i) => Math.min(i.topicsCompleted, 1) },
  { id: "topic_arrays", title: "Complete Arrays", description: "Master the Arrays step.", category: "topics", icon: "Layers", requirement: "Complete every Arrays problem", target: 1, progress: (i) => bool(i.steps.arrays) },
  { id: "topic_binary_search", title: "Complete Binary Search", description: "Master the Binary Search step.", category: "topics", icon: "Layers", requirement: "Complete every Binary Search problem", target: 1, progress: (i) => bool(i.steps.binarySearch) },
  { id: "topic_trees", title: "Complete Trees", description: "Master the Binary Trees step.", category: "topics", icon: "Layers", requirement: "Complete every Binary Trees problem", target: 1, progress: (i) => bool(i.steps.trees) },
  { id: "topic_graphs", title: "Complete Graphs", description: "Master the Graphs step.", category: "topics", icon: "Layers", requirement: "Complete every Graphs problem", target: 1, progress: (i) => bool(i.steps.graphs) },
  { id: "topic_dp", title: "Complete Dynamic Programming", description: "Master the DP step.", category: "topics", icon: "Brain", requirement: "Complete every DP problem", target: 1, progress: (i) => bool(i.steps.dp) },
  { id: "topic_all", title: "Complete Every Topic", description: "Finish every topic in the sheet.", category: "topics", icon: "GraduationCap", requirement: "Complete all topics", target: 1, progress: (i) => bool(i.everyTopicComplete) },

  // Goal Achievements
  { id: "goal_first", title: "First Goal Completed", description: "Hit one of your goals.", category: "goals", icon: "Target", requirement: "Complete 1 goal", target: 1, progress: (i) => i.goalsTotalCompleted },
  { id: "goal_10", title: "Complete 10 Goals", description: "Ten goals achieved.", category: "goals", icon: "Target", requirement: "Complete 10 goals", target: 10, progress: (i) => i.goalsTotalCompleted },
  { id: "goal_50", title: "Complete 50 Goals", description: "Fifty goals achieved.", category: "goals", icon: "Trophy", requirement: "Complete 50 goals", target: 50, progress: (i) => i.goalsTotalCompleted },
  { id: "goal_daily_7", title: "Daily Goal ×7", description: "Complete a daily goal 7 days in a row.", category: "goals", icon: "Flame", requirement: "Hit a daily goal 7 days running", target: 7, progress: (i) => i.goalsMaxDailyConsecutive },
  { id: "goal_weekly_4", title: "Weekly Goal ×4", description: "Complete a weekly goal 4 weeks running.", category: "goals", icon: "CalendarCheck", requirement: "Hit a weekly goal 4 weeks running", target: 4, progress: (i) => i.goalsMaxWeeklyConsecutive },
  { id: "goal_monthly", title: "Monthly Goal", description: "Complete a monthly goal.", category: "goals", icon: "CalendarCheck", requirement: "Complete a monthly goal", target: 1, progress: (i) => Math.min(i.goalsMonthlyCompleted, 1) },

  // Workspace
  { id: "ws_file_1", title: "First Code File", description: "Create your first Code File.", category: "workspace", icon: "FileCode2", requirement: "Create 1 code file", target: 1, progress: (i) => i.codeFilesCount },
  { id: "ws_file_10", title: "10 Code Files", description: "Build out your code library.", category: "workspace", icon: "Code2", requirement: "Create 10 code files", target: 10, progress: (i) => i.codeFilesCount },
  { id: "ws_gh_connect", title: "First GitHub Connection", description: "Link your GitHub account.", category: "workspace", icon: "github", requirement: "Connect GitHub", target: 1, progress: (i) => bool(i.githubConnected) },
  { id: "ws_commit_1", title: "First GitHub Commit", description: "Push code from Trace.", category: "workspace", icon: "github", requirement: "Make 1 commit", target: 1, progress: (i) => i.githubCommits },
  { id: "ws_commit_50", title: "50 GitHub Commits", description: "Fifty commits from Trace.", category: "workspace", icon: "github", requirement: "Make 50 commits", target: 50, progress: (i) => i.githubCommits },
  { id: "ws_commit_100", title: "100 GitHub Commits", description: "A hundred commits from Trace.", category: "workspace", icon: "github", requirement: "Make 100 commits", target: 100, progress: (i) => i.githubCommits },

  // Trace Journey
  { id: "journey_joined", title: "Joined Trace", description: "Welcome aboard.", category: "journey", icon: "Rocket", requirement: "Create your account", target: 1, progress: () => 1 },
  { id: "journey_first_lecture", title: "Completed First Lecture", description: "Finish your first lecture problem.", category: "journey", icon: "BookOpen", requirement: "Complete 1 lecture", target: 1, progress: (i) => Math.min(i.solvedCount, 1) },
  { id: "journey_first_revision", title: "Completed First Revision", description: "Revise a solved problem.", category: "journey", icon: "Brain", requirement: "Complete 1 revision", target: 1, progress: (i) => Math.min(i.revisionsCount, 1) },
  { id: "journey_100_hours", title: "100 Learning Hours", description: "Spend 100 hours learning on Trace.", category: "journey", icon: "Clock", requirement: "Accumulate 100 learning hours", target: 100, progress: (i) => Math.floor(i.learningMinutes / 60) },
  { id: "journey_complete_a2z", title: "Completed Striver A2Z", description: "Finish the entire A2Z sheet.", category: "journey", icon: "GraduationCap", requirement: "Solve every problem in A2Z", target: 1, progress: (i) => bool(i.everyProblemComplete) },
];

export type AchievementView = {
  id: string;
  title: string;
  description: string;
  category: AchievementCategory;
  icon: string;
  requirement: string;
  target: number;
  progress: number; // clamped to [0, target]
  met: boolean; // condition currently satisfied
  unlocked: boolean; // persisted unlock exists
  unlockedAt: string | null; // ISO
};

/**
 * Evaluate the whole catalog against the input snapshot and merge in any
 * persisted unlock timestamps. `met` reflects the live condition; `unlocked`
 * reflects a stored unlock (so the date is stable once earned).
 */
export function evaluateAchievements(
  input: AchievementInput,
  unlockedMap: Map<string, Date>,
): AchievementView[] {
  return ACHIEVEMENTS.map((def) => {
    const raw = def.progress(input);
    const progress = Math.max(0, Math.min(def.target, raw));
    const met = raw >= def.target;
    const unlockedAt = unlockedMap.get(def.id) ?? null;
    return {
      id: def.id,
      title: def.title,
      description: def.description,
      category: def.category,
      icon: def.icon,
      requirement: def.requirement,
      target: def.target,
      progress,
      met,
      unlocked: Boolean(unlockedAt),
      unlockedAt: unlockedAt ? unlockedAt.toISOString() : null,
    };
  });
}
