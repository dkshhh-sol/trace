"use client";

import { useState, useTransition } from "react";
import { Check, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { setProblemDone } from "@/lib/content/actions";
import type { StriverProblem } from "@/lib/content/types";

export function ProblemRow({
  roadmapSlug,
  problem,
  initialDone,
}: {
  roadmapSlug: string;
  problem: StriverProblem;
  initialDone: boolean;
}) {
  const [done, setDone] = useState(initialDone);
  const [pending, startTransition] = useTransition();

  function toggle() {
    const next = !done;
    setDone(next); // optimistic
    startTransition(async () => {
      try {
        await setProblemDone(roadmapSlug, problem.id, next);
      } catch {
        setDone(!next); // revert on failure
      }
    });
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5">
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        aria-pressed={done}
        aria-label={
          done
            ? `Mark "${problem.name}" as not done`
            : `Mark "${problem.name}" as done`
        }
        className={cn(
          "grid size-5 shrink-0 place-items-center rounded-md border transition-colors",
          done
            ? "border-brand bg-brand text-white"
            : "border-border hover:border-foreground/40",
          pending && "opacity-60",
        )}
      >
        {done && <Check className="size-3.5" />}
      </button>

      <span
        className={cn(
          "flex-1 truncate text-sm",
          done ? "text-muted-foreground line-through" : "text-foreground",
        )}
      >
        {problem.name}
      </span>

      <div className="flex shrink-0 items-center gap-1.5">
        {problem.youtube && (
          <LinkChip href={problem.youtube} label="Lecture">
            <Play className="size-3" />
          </LinkChip>
        )}
        {problem.leetcode && <LinkChip href={problem.leetcode} label="LeetCode" />}
        {problem.gfg && <LinkChip href={problem.gfg} label="GFG" />}
      </div>
    </div>
  );
}

function LinkChip({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children?: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
    >
      {children}
      {label}
    </a>
  );
}
