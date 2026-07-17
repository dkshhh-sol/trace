import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { getRoadmap, locateProblem } from "@/lib/content/striver";
import { parseYouTube, youTubeEmbedUrl } from "@/lib/content/youtube";
import { getSession } from "@/lib/auth/guards";
import { getCompletedProblemIds } from "@/lib/db/queries/progress";
import { MarkDoneButton } from "@/components/roadmap/mark-done-button";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; problemId: string }>;
}): Promise<Metadata> {
  const { slug, problemId } = await params;
  const located = locateProblem(slug, problemId);
  return { title: located ? `${located.problem.name} · Lecture` : "Lecture" };
}

export default async function LecturePage({
  params,
}: {
  params: Promise<{ slug: string; problemId: string }>;
}) {
  const { slug, problemId } = await params;
  const roadmap = getRoadmap(slug);
  const located = locateProblem(slug, problemId);
  if (!roadmap || !located) notFound();

  const { problem, stepName, topicName, prevId, nextId } = located;
  const embed = youTubeEmbedUrl(parseYouTube(problem.youtube));

  const session = await getSession();
  const completed = session?.user
    ? await getCompletedProblemIds(session.user.id, slug)
    : new Set<string>();
  const done = completed.has(problem.id);

  return (
    <div className="space-y-5">
      <Link
        href={`/roadmaps/${slug}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to {roadmap.title}
      </Link>

      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          {stepName} · {topicName}
        </p>
        <h1 className="mt-1 text-2xl tracking-tight">{problem.name}</h1>
      </div>

      {/* Embedded player */}
      {embed ? (
        <div className="overflow-hidden rounded-2xl border border-border bg-black">
          <div className="relative aspect-video">
            <iframe
              src={embed}
              title={`Lecture: ${problem.name}`}
              className="absolute inset-0 h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        </div>
      ) : (
        <div className="grid h-48 place-items-center rounded-2xl border border-border bg-card text-sm text-muted-foreground">
          No lecture available for this item yet.
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <MarkDoneButton
          roadmapSlug={slug}
          problemId={problem.id}
          initialDone={done}
        />
        {problem.leetcode && (
          <SolveLink href={problem.leetcode} label="Solve on LeetCode" />
        )}
        {problem.gfg && (
          <SolveLink href={problem.gfg} label="Solve on GeeksforGeeks" />
        )}
      </div>

      {/* Prev / next navigation */}
      <div className="flex items-center justify-between border-t border-border pt-4">
        {prevId ? (
          <Link
            href={`/roadmaps/${slug}/lecture/${prevId}`}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronLeft className="size-4" />
            Previous
          </Link>
        ) : (
          <span />
        )}
        {nextId ? (
          <Link
            href={`/roadmaps/${slug}/lecture/${nextId}`}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Next
            <ChevronRight className="size-4" />
          </Link>
        ) : (
          <span />
        )}
      </div>
    </div>
  );
}

function SolveLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-medium text-foreground transition-colors hover:border-foreground/40"
    >
      {label}
      <ExternalLink className="size-3.5" />
    </a>
  );
}
