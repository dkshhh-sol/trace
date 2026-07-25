"use client";

import { useEffect, useState, useTransition } from "react";
import { X, Paperclip } from "lucide-react";
import { toast } from "@/components/ui/toast";
import { createSupportTicket } from "@/lib/support/actions";

/** Derive a coarse browser + OS label from the user agent (best-effort). */
function detectEnv() {
  const ua = navigator.userAgent;
  let browser = "Unknown";
  if (/edg/i.test(ua)) browser = "Edge";
  else if (/chrome|crios/i.test(ua)) browser = "Chrome";
  else if (/firefox|fxios/i.test(ua)) browser = "Firefox";
  else if (/safari/i.test(ua)) browser = "Safari";

  let os = "Unknown";
  if (/windows/i.test(ua)) os = "Windows";
  else if (/mac os/i.test(ua)) os = "macOS";
  else if (/android/i.test(ua)) os = "Android";
  else if (/iphone|ipad|ipod/i.test(ua)) os = "iOS";
  else if (/linux/i.test(ua)) os = "Linux";

  return {
    browser,
    operatingSystem: os,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    screenResolution: `${window.screen.width}x${window.screen.height}`,
    route: window.location.pathname,
  };
}

const CATEGORIES = [
  { value: "bug", label: "Bug" },
  { value: "feature_request", label: "Feature Request" },
  { value: "question", label: "Question" },
] as const;

export function ReportIssueModal({ onClose }: { onClose: () => void }) {
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]["value"]>("bug");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [steps, setSteps] = useState("");
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [screenshotName, setScreenshotName] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1_000_000) {
      toast("Screenshot must be under 1 MB.", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setScreenshot(reader.result as string);
      setScreenshotName(file.name);
    };
    reader.readAsDataURL(file);
  }

  function submit() {
    if (title.trim().length < 3 || description.trim().length < 5) {
      toast("Add a title and a short description.", "error");
      return;
    }
    startTransition(async () => {
      try {
        await createSupportTicket({
          category,
          title,
          description,
          stepsToReproduce: steps || undefined,
          screenshot: screenshot || undefined,
          ...detectEnv(),
        });
        toast("Issue submitted successfully.", "success");
        onClose();
      } catch {
        toast("Couldn't submit your issue. Try again.", "error");
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
        aria-label="Report an issue"
        className="animate-in fade-in-0 zoom-in-95 surface relative flex max-h-[88dvh] w-full max-w-md flex-col rounded-2xl duration-150"
      >
        <header className="flex shrink-0 items-center justify-between border-b border-border px-5 py-4">
          <h3 className="text-base font-medium text-foreground">Report an issue</h3>
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
            <span className="text-xs text-muted-foreground">Category</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as typeof category)}
              className="mt-1.5 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-xs text-muted-foreground">Title</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={160}
              placeholder="Short summary"
              className="mt-1.5 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>

          <label className="block">
            <span className="text-xs text-muted-foreground">Description</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="What happened?"
              className="mt-1.5 w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>

          {category === "bug" && (
            <label className="block">
              <span className="text-xs text-muted-foreground">
                Steps to reproduce (optional)
              </span>
              <textarea
                value={steps}
                onChange={(e) => setSteps(e.target.value)}
                rows={3}
                placeholder="1. Go to…  2. Click…  3. See…"
                className="mt-1.5 w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </label>
          )}

          <div>
            <span className="text-xs text-muted-foreground">
              Screenshot (optional)
            </span>
            <label className="mt-1.5 flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border px-3 text-sm text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground">
              <Paperclip className="size-4" />
              <span className="truncate">{screenshotName ?? "Attach an image"}</span>
              <input type="file" accept="image/*" onChange={onFile} className="hidden" />
            </label>
          </div>

          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Your account and device details (route, browser, OS, viewport,
            streak, solved count) are attached automatically to help us
            diagnose.
          </p>
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
            {pending ? "Submitting…" : "Submit issue"}
          </button>
        </footer>
      </div>
    </div>
  );
}
