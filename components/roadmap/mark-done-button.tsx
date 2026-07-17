"use client";

import { useState, useTransition } from "react";
import { Check, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { setProblemDone } from "@/lib/content/actions";

export function MarkDoneButton({
  roadmapSlug,
  problemId,
  initialDone,
}: {
  roadmapSlug: string;
  problemId: string;
  initialDone: boolean;
}) {
  const [done, setDone] = useState(initialDone);
  const [pending, startTransition] = useTransition();

  function toggle() {
    const next = !done;
    setDone(next);
    startTransition(async () => {
      try {
        await setProblemDone(roadmapSlug, problemId, next);
      } catch {
        setDone(!next);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-pressed={done}
      className={cn(
        "inline-flex h-10 items-center gap-2 rounded-lg border px-4 text-sm font-medium transition-colors",
        done
          ? "border-brand bg-brand text-white"
          : "border-border bg-card text-foreground hover:border-foreground/40",
        pending && "opacity-60",
      )}
    >
      {done ? <Check className="size-4" /> : <Circle className="size-4" />}
      {done ? "Completed" : "Mark as done"}
    </button>
  );
}
