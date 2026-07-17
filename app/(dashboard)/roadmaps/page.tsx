import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { roadmaps } from "@/lib/content/striver";
import { getSession } from "@/lib/auth/guards";
import { getCompletedProblemIds } from "@/lib/db/queries/progress";

export const metadata: Metadata = { title: "Roadmaps" };

export default async function RoadmapsPage() {
  const session = await getSession();
  const userId = session?.user?.id;

  const cards = await Promise.all(
    roadmaps.map(async (r) => {
      const completed = userId
        ? (await getCompletedProblemIds(userId, r.slug)).size
        : 0;
      const pct = Math.round((completed / r.totalProblems) * 100);
      return { roadmap: r, completed, pct };
    }),
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl tracking-tight">Roadmaps</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Structured learning paths. Watch the lecture, solve the problem, mark
          it done.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {cards.map(({ roadmap, completed, pct }) => (
          <Link
            key={roadmap.slug}
            href={`/roadmaps/${roadmap.slug}`}
            className="group rounded-2xl border border-border bg-card p-6 transition-colors hover:border-white/[0.14]"
          >
            <div className="flex items-start justify-between">
              <h2 className="text-lg font-semibold">{roadmap.title}</h2>
              <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </div>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {roadmap.description}
            </p>
            <div className="mt-5">
              <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {completed} / {roadmap.totalProblems} solved
                </span>
                <span>{pct}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brand to-white"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
