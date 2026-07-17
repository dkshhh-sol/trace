import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { WidgetCard } from "./widget-card";
import { striverA2Z } from "@/lib/content/striver";
import { getSession } from "@/lib/auth/guards";
import { getCompletedProblemIds } from "@/lib/db/queries/progress";

/**
 * Resume the active roadmap. Sources completion from Neon and points the user
 * straight into the Striver A2Z list — the core loop of the product.
 */
export async function ContinueLearning() {
  const session = await getSession();
  const completed = session?.user
    ? (await getCompletedProblemIds(session.user.id, striverA2Z.slug)).size
    : 0;
  const pct = Math.round((completed / striverA2Z.totalProblems) * 100);

  return (
    <WidgetCard title="Continue learning" className="sm:col-span-2">
      <Link
        href={`/roadmaps/${striverA2Z.slug}`}
        className="group flex items-center justify-between gap-4 rounded-xl border border-brand/30 bg-gradient-to-b from-brand/[0.08] to-transparent p-4 transition-colors hover:border-brand/50"
      >
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">
            {striverA2Z.title}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {completed} / {striverA2Z.totalProblems} solved · {pct}%
          </p>
          <div className="mt-2 h-1.5 w-48 max-w-full overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand to-white"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
        <ArrowRight className="size-4 shrink-0 text-brand transition-transform group-hover:translate-x-0.5" />
      </Link>
    </WidgetCard>
  );
}
