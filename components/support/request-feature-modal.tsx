"use client";

import { useEffect, useState, useTransition } from "react";
import { X } from "lucide-react";
import { toast } from "@/components/ui/toast";
import { createFeatureRequest } from "@/lib/support/actions";

export function RequestFeatureModal({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [why, setWhy] = useState("");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  function submit() {
    if (title.trim().length < 3 || description.trim().length < 5) {
      toast("Add a title and a short description.", "error");
      return;
    }
    startTransition(async () => {
      try {
        await createFeatureRequest({
          title,
          description,
          whyUseful: why || undefined,
        });
        toast("Feature request submitted.", "success");
        onClose();
      } catch {
        toast("Couldn't submit your request. Try again.", "error");
      }
    });
  }

  return (
    <div className="fixed inset-0 z-[95] grid place-items-center p-4">
      <div
        aria-hidden="true"
        onClick={onClose}
        className="animate-in fade-in-0 absolute inset-0 bg-black/50 backdrop-blur-sm duration-200"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Request a feature"
        className="animate-in fade-in-0 zoom-in-95 surface relative flex max-h-[88dvh] w-full max-w-md flex-col rounded-2xl duration-150"
      >
        <header className="flex shrink-0 items-center justify-between border-b border-border px-5 py-4">
          <h3 className="text-base font-medium text-foreground">Request a feature</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid size-8 place-items-center rounded-lg text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="size-4" />
          </button>
        </header>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <label className="block">
            <span className="text-xs text-muted-foreground">Title</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={160}
              placeholder="What would you like to see?"
              className="mt-1.5 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>

          <label className="block">
            <span className="text-xs text-muted-foreground">Description</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Describe the feature"
              className="mt-1.5 w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>

          <label className="block">
            <span className="text-xs text-muted-foreground">
              Why is this useful?
            </span>
            <textarea
              value={why}
              onChange={(e) => setWhy(e.target.value)}
              rows={3}
              placeholder="How would it help you?"
              className="mt-1.5 w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>
        </div>

        <footer className="flex shrink-0 justify-end gap-2 border-t border-border px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="inline-flex h-9 items-center rounded-lg px-3 text-sm text-muted-foreground transition-colors hover:text-foreground disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={pending}
            className="inline-flex h-9 items-center rounded-lg bg-foreground px-4 text-sm font-medium text-background transition-transform hover:scale-[1.02] active:scale-[0.99] disabled:opacity-60"
          >
            {pending ? "Submitting…" : "Submit request"}
          </button>
        </footer>
      </div>
    </div>
  );
}
