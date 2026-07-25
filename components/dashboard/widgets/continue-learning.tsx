import Link from "next/link";
import { ArrowRight, Play, CheckCircle2 } from "lucide-react";
import { striverA2Z, getResumePoint } from "@/lib/content/striver";
import { getSession } from "@/lib/auth/guards";
import { getCompletedProblemIds } from "@/lib/db/queries/progress";

/** Strip the leading "Step N:" from a step label for cleaner display. */
function cleanStep(name: string | null) {
  return name?.replace(/^Step\s+\d+:\s*/i, "") ?? "";
}

/**
 * The dashboard hero. Answers the one question that matters — "what do I do
 * next?" — with the current topic, the next lecture, live progress, and a
 * single primary action to resume.
 */
export async function ContinueLearning() {
  const session = await getSession();
  const completed = session?.user
    ? await getCompletedProblemIds(session.user.id, striverA2Z.slug)
    : new Set<string>();

  const solved = completed.size;
  const total = striverA2Z.totalProblems;
  const pct = Math.round((solved / total) * 100);
  const resume = getResumePoint(striverA2Z.slug, completed);
  const done = resume.problem === null;

  const resumeHref = done
    ? `/roadmaps/${striverA2Z.slug}`
    : `/roadmaps/${striverA2Z.slug}/lecture/${resume.problem!.id}`;

  return (
    <section className="card-hero relative overflow-hidden rounded-3xl p-6 sm:p-8">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 space-y-4">
          <span className="inline-flex items-center gap-2 rounded-full bg-brand/15 px-3 py-1 text-xs font-medium text-brand">
            <span className="size-1.5 rounded-full bg-brand" />
            {done ? "Roadmap complete" : "Continue where you left off"}
          </span>

          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
              {done
                ? striverA2Z.title
                : `${cleanStep(resume.stepName)} · ${resume.topicName}`}
            </p>
            <h2 className="mt-1.5 truncate font-serif text-3xl italic leading-tight text-foreground sm:text-4xl">
              {done ? "You finished Striver A2Z" : resume.problem!.name}
            </h2>
          </div>

          <div className="flex items-center gap-5 text-sm">
            <span className="inline-flex items-center gap-1.5 text-success">
              <CheckCircle2 className="size-4" />
              {solved} solved
            </span>
            <span className="text-muted-foreground">
              {total - solved} remaining
            </span>
          </div>

          <div className="max-w-md">
            <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
              <span>Overall progress</span>
              <span className="text-foreground">{pct}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand to-[#b9b3ff] transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-3 sm:flex-row lg:flex-col">
          <Link
            href={resumeHref}
            className="group inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-foreground px-6 text-sm font-medium text-background transition-transform hover:scale-[1.02] active:scale-[0.99]"
          >
            {done ? "Review roadmap" : "Resume learning"}
            {done ? (
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            ) : (
              <Play className="size-4" />
            )}
          </Link>
          <Link
            href={`/roadmaps/${striverA2Z.slug}`}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl px-6 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            View full roadmap
          </Link>
        </div>
      </div>
    </section>
  );
}
