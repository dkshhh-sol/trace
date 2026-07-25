import { Check, Target } from "lucide-react";
import { getSession } from "@/lib/auth/guards";
import { getUserSolves } from "@/lib/db/queries/activity";
import { getGoals } from "@/lib/db/queries/goals";
import { computeGoalProgress, type GoalProgress } from "@/lib/progress/compute";
import type { GoalPeriod } from "@/lib/db/schema/goals";
import { striverA2Z } from "@/lib/content/striver";
import { CountUp } from "./count-up";
import { ResetCountdown } from "./reset-countdown";
import { DashboardEditGoals } from "./dashboard-edit-goals";

const PERIOD_LABEL: Record<GoalPeriod, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  yearly: "Yearly",
};

function GoalRow({ goal }: { goal: GoalProgress }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
        <span className="flex min-w-0 items-center gap-2">
          <span className="truncate text-foreground">{goal.title}</span>
          <span className="shrink-0 rounded-full bg-white/[0.06] px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            {PERIOD_LABEL[goal.period]}
          </span>
        </span>
        <span className="shrink-0 tabular-nums text-muted-foreground">
          <CountUp value={goal.done} /> / {goal.targetCount}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-brand to-[#b9b3ff] transition-[width] duration-700 ease-out"
          style={{ width: `${goal.pct}%` }}
        />
      </div>
      <p className="mt-1.5 text-xs">
        {goal.complete ? (
          <span className="inline-flex items-center gap-1.5 text-brand motion-safe:animate-pulse">
            <Check className="size-3.5" />
            Goal completed · resets in <ResetCountdown period={goal.period} />
          </span>
        ) : (
          <span className="text-muted-foreground">
            {goal.remaining} remaining · resets in{" "}
            <ResetCountdown period={goal.period} />
          </span>
        )}
      </p>
    </div>
  );
}

/** Dashboard goals card — renders every active goal, live, fully user-defined. */
export async function GoalCard() {
  const session = await getSession();
  if (!session?.user) return null;

  const [solves, goals] = await Promise.all([
    getUserSolves(session.user.id, striverA2Z.slug),
    getGoals(session.user.id),
  ]);
  const progress = computeGoalProgress(solves, goals);

  return (
    <section className="surface rounded-2xl p-6">
      <div className="mb-5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Target className="size-4 text-brand" />
          <h2 className="text-sm font-medium text-foreground">Your goals</h2>
        </div>
        <DashboardEditGoals goals={goals} />
      </div>

      {progress.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No goals yet. Choose{" "}
          <span className="text-foreground">Edit goals</span> to set a target and
          start tracking.
        </p>
      ) : (
        <div className="space-y-5">
          {progress.map((g) => (
            <GoalRow key={g.id} goal={g} />
          ))}
        </div>
      )}
    </section>
  );
}
