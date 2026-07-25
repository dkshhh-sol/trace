import { Flame, Trophy, CalendarDays, Gauge, CalendarCheck } from "lucide-react";
import { getSession } from "@/lib/auth/guards";
import { getUserSolves } from "@/lib/db/queries/activity";
import { computeActivity } from "@/lib/progress/compute";
import { striverA2Z } from "@/lib/content/striver";
import { Heatmap, HeatmapLegend } from "./heatmap";
import { CountUp } from "./count-up";

/** Dashboard "Learning Activity" summary — 12-week heatmap + key metrics. */
export async function ActivityWidget() {
  const session = await getSession();
  if (!session?.user) return null;

  const solves = await getUserSolves(session.user.id, striverA2Z.slug);
  const a = computeActivity(solves, 84); // last 12 weeks

  const metrics = [
    { icon: Flame, label: "Current streak", value: a.currentStreak, suffix: "d", accent: "text-success" },
    { icon: Trophy, label: "Longest streak", value: a.longestStreak, suffix: "d", accent: "text-success" },
    { icon: CalendarCheck, label: "This week", value: a.solvedThisWeek, suffix: "", accent: "text-brand" },
    { icon: Gauge, label: "Avg / active day", value: a.avgPerActiveDay, suffix: "", accent: "text-brand" },
    { icon: CalendarDays, label: "Active days", value: a.activeDays, suffix: "", accent: "text-brand" },
  ];

  return (
    <section className="surface animate-in fade-in-0 rounded-2xl p-6 duration-500">
      <h2 className="mb-4 text-sm font-medium text-foreground">
        Learning activity
      </h2>

      {a.solved === 0 ? (
        <>
          <Heatmap days={a.heatmap} />
          <p className="mt-4 text-sm text-muted-foreground">
            Start solving problems to build your learning streak.
          </p>
        </>
      ) : (
        <>
          <Heatmap days={a.heatmap} />
          <div className="mt-3">
            <HeatmapLegend />
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-5">
            {metrics.map((m) => (
              <div key={m.label}>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <m.icon className={`size-3.5 ${m.accent}`} />
                  <span className="truncate">{m.label}</span>
                </div>
                <p className="mt-1.5 text-xl tracking-tight text-foreground">
                  {Number.isInteger(m.value) ? (
                    <CountUp value={m.value} />
                  ) : (
                    m.value
                  )}
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
