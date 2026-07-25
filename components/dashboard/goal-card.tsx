import { Check, Target } from "lucide-react";
import { getSession } from "@/lib/auth/guards";
import { getUserGoals, getUserSolves } from "@/lib/db/queries/activity";
import { computeActivity } from "@/lib/progress/compute";
import { striverA2Z } from "@/lib/content/striver";
import { CountUp } from "./count-up";
import { ResetCountdown } from "./reset-countdown";

function GoalRow({
  label,
  done,
  goal,
  type,
}: {
  label: string;
  done: number;
  goal: number;
  type: "daily" | "weekly";
}) {
  const pct = goal > 0 ? Math.min(100, Math.round((done / goal) * 100)) : 0;
  const remaining = Math.max(0, goal - done);
  const complete = done >= goal && goal > 0;

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="tabular-nums text-foreground">
          <CountUp value={done} /> / {goal}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-brand to-[#b9b3ff] transition-[width] duration-700 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-1.5 text-xs">
        {complete ? (
          <span className="inline-flex items-center gap-1.5 text-success">
            <Check className="size-3.5 animate-pulse" />
            Goal completed · resets in <ResetCountdown type={type} />
          </span>
        ) : (
          <span className="text-muted-foreground">
            {remaining} remaining · resets in <ResetCountdown type={type} />
          </span>
        )}
      </p>
    </div>
  );
}

/** Dashboard "Today's Target" card — daily + weekly goal progress, live. */
export async function GoalCard() {
  const session = await getSession();
  if (!session?.user) return null;

  const [solves, goals] = await Promise.all([
    getUserSolves(session.user.id, striverA2Z.slug),
    getUserGoals(session.user.id),
  ]);
  const a = computeActivity(solves, 1);

  return (
    <section className="surface rounded-2xl p-6">
      <div className="mb-5 flex items-center gap-2">
        <Target className="size-4 text-brand" />
        <h2 className="text-sm font-medium text-foreground">Today&rsquo;s target</h2>
      </div>
      <div className="space-y-5">
        <GoalRow
          label="Today"
          done={a.solvedToday}
          goal={goals.daily}
          type="daily"
        />
        <GoalRow
          label="This week"
          done={a.solvedThisWeek}
          goal={goals.weekly}
          type="weekly"
        />
      </div>
    </section>
  );
}
