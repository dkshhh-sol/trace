import { CheckCircle2, Layers, TrendingUp } from "lucide-react";
import { striverA2Z } from "@/lib/content/striver";
import { getSession } from "@/lib/auth/guards";
import { getCompletedProblemIds } from "@/lib/db/queries/progress";

/** A calm strip of real, derived stats — no placeholder widgets. */
export async function ProgressStats() {
  const session = await getSession();
  const completed = session?.user
    ? await getCompletedProblemIds(session.user.id, striverA2Z.slug)
    : new Set<string>();

  const solved = completed.size;
  const total = striverA2Z.totalProblems;
  const pct = Math.round((solved / total) * 100);

  const totalSteps = striverA2Z.steps.length;
  const stepsCompleted = striverA2Z.steps.filter((step) =>
    step.topics.every((t) => t.problems.every((p) => completed.has(p.id))),
  ).length;

  const tiles = [
    {
      icon: CheckCircle2,
      label: "Problems solved",
      value: `${solved}`,
      sub: `of ${total}`,
      accent: "text-success",
    },
    {
      icon: Layers,
      label: "Steps completed",
      value: `${stepsCompleted}`,
      sub: `of ${totalSteps}`,
      accent: "text-brand",
    },
    {
      icon: TrendingUp,
      label: "Overall progress",
      value: `${pct}%`,
      sub: "keep going",
      accent: "text-brand",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {tiles.map((t) => (
        <div key={t.label} className="surface rounded-2xl p-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <t.icon className={`size-4 ${t.accent}`} />
            {t.label}
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-3xl tracking-tight text-foreground">
              {t.value}
            </span>
            <span className="text-sm text-muted-foreground">{t.sub}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
