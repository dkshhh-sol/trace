import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getRoadmap, stepProblemCount } from "@/lib/content/striver";
import { getSession } from "@/lib/auth/guards";
import { getCompletedProblemIds } from "@/lib/db/queries/progress";
import { ProblemRow } from "@/components/roadmap/problem-row";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const roadmap = getRoadmap(slug);
  return { title: roadmap?.title ?? "Roadmap" };
}

export default async function RoadmapDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const roadmap = getRoadmap(slug);
  if (!roadmap) notFound();

  const session = await getSession();
  const completed = session?.user
    ? await getCompletedProblemIds(session.user.id, slug)
    : new Set<string>();

  const doneCount = completed.size;
  const pct = Math.round((doneCount / roadmap.totalProblems) * 100);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl tracking-tight">{roadmap.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {roadmap.description}
        </p>
        <div className="mt-4 max-w-md">
          <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
            <span>Progress</span>
            <span>
              {doneCount} / {roadmap.totalProblems} · {pct}%
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand to-white transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </header>

      <div className="space-y-3">
        {roadmap.steps.map((step, i) => {
          const total = stepProblemCount(step);
          const stepDone = step.topics.reduce(
            (n, t) => n + t.problems.filter((p) => completed.has(p.id)).length,
            0,
          );
          return (
            <details
              key={step.name}
              open={i === 0}
              className="group overflow-hidden rounded-2xl border border-border bg-card"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 text-sm font-medium marker:hidden hover:bg-white/[0.02]">
                <span>{step.name}</span>
                <span className="rounded-full bg-white/[0.05] px-2 py-0.5 text-xs font-normal text-muted-foreground">
                  {stepDone}/{total}
                </span>
              </summary>
              <div className="space-y-5 border-t border-border px-4 py-4 sm:px-5">
                {step.topics.map((topic) => (
                  <div key={topic.name}>
                    <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {topic.name}
                    </h3>
                    <div className="space-y-1.5">
                      {topic.problems.map((p) => (
                        <ProblemRow
                          key={p.id}
                          roadmapSlug={slug}
                          problem={p}
                          initialDone={completed.has(p.id)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </details>
          );
        })}
      </div>
    </div>
  );
}
