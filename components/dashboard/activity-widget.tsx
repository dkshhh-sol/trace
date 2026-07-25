import { Flame, Trophy, CalendarDays, CalendarRange, CalendarCheck } from "lucide-react";
import { getSession } from "@/lib/auth/guards";
import { getUserSolves } from "@/lib/db/queries/activity";
import { getAccountCreatedAt } from "@/lib/db/queries/user";
import { aggregateSolvesByDay, computeActivity } from "@/lib/progress/compute";
import { striverA2Z } from "@/lib/content/striver";
import { HeatmapLegend } from "./contribution-calendar";
import { YearContributionCalendar } from "./year-contribution-calendar";
import { CountUp } from "./count-up";

/** Dashboard "Learning Activity" summary — fixed-year calendar + key metrics. */
export async function ActivityWidget() {
  const session = await getSession();
  if (!session?.user) return null;

  const [solves, createdAt] = await Promise.all([
    getUserSolves(session.user.id, striverA2Z.slug),
    getAccountCreatedAt(session.user.id),
  ]);

  // Metrics are all-time / current-period and independent of the selected year.
  const a = computeActivity(solves, 0);
  const aggregate = aggregateSolvesByDay(solves);
  const currentYear = new Date().getUTCFullYear();
  const minYear = Math.min(createdAt.getUTCFullYear(), currentYear);

  const metrics = [
    { icon: Flame, label: "Current streak", value: a.currentStreak, suffix: "d", accent: "text-success" },
    { icon: Trophy, label: "Longest streak", value: a.longestStreak, suffix: "d", accent: "text-success" },
    { icon: CalendarCheck, label: "This month", value: a.solvedThisMonth, suffix: "", accent: "text-brand" },
    { icon: CalendarRange, label: "This year", value: a.solvedThisYear, suffix: "", accent: "text-brand" },
    { icon: CalendarDays, label: "Active days", value: a.activeDays, suffix: "", accent: "text-brand" },
    { icon: Trophy, label: "Completion", value: a.progressPct, suffix: "%", accent: "text-brand" },
  ];

  return (
    <section className="surface animate-in fade-in-0 rounded-2xl p-6 duration-500">
      <h2 className="mb-4 text-sm font-medium text-foreground">
        Learning activity
      </h2>

      <YearContributionCalendar
        aggregate={aggregate}
        accountCreatedAt={createdAt.toISOString()}
        minYear={minYear}
        maxYear={currentYear}
        currentStreak={a.currentStreak}
      />

      {a.solved === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Start solving problems to build your learning history.
        </p>
      ) : (
        <>
          <div className="mt-3">
            <HeatmapLegend />
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {metrics.map((m) => (
              <div key={m.label}>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <m.icon className={`size-3.5 ${m.accent}`} />
                  <span className="truncate">{m.label}</span>
                </div>
                <p className="mt-1.5 text-xl tracking-tight text-foreground">
                  <CountUp value={m.value} />
                  {m.suffix}
                </p>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
