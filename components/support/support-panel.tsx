"use client";

import { useCallback, useEffect, useState } from "react";
import {
  X,
  MessageSquare,
  Bug,
  Lightbulb,
  Star,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { GitHubMark } from "@/components/ui/github-mark";
import { LinkedInMark, InstagramMark } from "@/components/ui/social-marks";
import { APP_VERSION, BUILD_NUMBER, BUILT_BY } from "@/lib/version";
import { ReportIssueModal } from "./report-issue-modal";
import { RequestFeatureModal } from "./request-feature-modal";

const SUPPORT_EVENT = "trace:open-support";
const REPO_URL = "https://github.com/dkshhh-sol/trace";
const LINKEDIN_URL = "https://www.linkedin.com/in/daksh-mehta-303975232/";
const INSTAGRAM_URL = "https://www.instagram.com/dksh.creates/";

/** Open the Feedback & Support slide-over from anywhere. */
export function openSupport() {
  window.dispatchEvent(new Event(SUPPORT_EVENT));
}

export function SupportPanel() {
  const [mounted, setMounted] = useState(false);
  const [show, setShow] = useState(false);
  const [modal, setModal] = useState<null | "issue" | "feature">(null);

  const open = useCallback(() => {
    setMounted(true);
    requestAnimationFrame(() => setShow(true));
  }, []);

  const close = useCallback(() => {
    setShow(false);
    setModal(null);
    setTimeout(() => setMounted(false), 260);
  }, []);

  useEffect(() => {
    window.addEventListener(SUPPORT_EVENT, open);
    return () => window.removeEventListener(SUPPORT_EVENT, open);
  }, [open]);

  useEffect(() => {
    if (!mounted) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (modal) setModal(null);
        else close();
      }
    }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [mounted, modal, close]);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-[70]">
      <div
        aria-hidden="true"
        onClick={close}
        className={cn(
          "absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300",
          show ? "opacity-100" : "opacity-0",
        )}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Feedback and support"
        className={cn(
          "absolute right-0 top-0 flex h-dvh w-full max-w-md flex-col border-l border-border bg-background shadow-2xl transition-transform duration-300 ease-out",
          show ? "translate-x-0" : "translate-x-full",
        )}
      >
        <header className="flex shrink-0 items-center justify-between border-b border-border px-6 py-4">
          <span className="flex items-center gap-2 text-sm font-medium text-foreground">
            <MessageSquare className="size-4 text-brand" />
            Feedback &amp; Support
          </span>
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="grid size-8 place-items-center rounded-lg text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="size-4" />
          </button>
        </header>

        <div className="min-h-0 flex-1 space-y-8 overflow-y-auto px-6 py-6">
          {/* Report an issue (primary) */}
          <section className="space-y-3">
            <button
              type="button"
              onClick={() => setModal("issue")}
              className="group flex w-full items-center gap-3 rounded-2xl bg-brand/[0.08] p-4 text-left ring-1 ring-brand/25 outline-none transition-transform hover:scale-[1.01] focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand/15 text-brand">
                <Bug className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-foreground">
                  Report an issue
                </span>
                <span className="block text-xs text-muted-foreground">
                  Bugs, questions, or anything not working
                </span>
              </span>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </button>

            <button
              type="button"
              onClick={() => setModal("feature")}
              className="group flex w-full items-center gap-3 rounded-2xl bg-white/[0.02] p-4 text-left ring-1 ring-white/[0.06] outline-none transition-colors hover:bg-white/[0.04] focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/[0.05] text-muted-foreground">
                <Lightbulb className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-foreground">
                  Request a feature
                </span>
                <span className="block text-xs text-muted-foreground">
                  Suggest something you&rsquo;d like to see
                </span>
              </span>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </button>
          </section>

          {/* Connect */}
          <section>
            <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Connect
            </h3>
            <div className="surface divide-y divide-border overflow-hidden rounded-xl">
              <div className="flex items-center gap-2 px-4 py-3">
                <GitHubMark className="size-4 text-foreground" />
                <span className="flex-1 text-sm text-foreground">Repository</span>
                <a
                  href={REPO_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  View <ExternalLink className="size-3" />
                </a>
                <a
                  href={`${REPO_URL}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs text-foreground transition-colors hover:border-foreground/40"
                >
                  <Star className="size-3" /> Star
                </a>
              </div>
              <ExternalRow
                icon={<LinkedInMark className="size-4" />}
                label="LinkedIn"
                href={LINKEDIN_URL}
              />
              <ExternalRow
                icon={<InstagramMark className="size-4" />}
                label="Instagram"
                href={INSTAGRAM_URL}
              />
            </div>
          </section>

          {/* About */}
          <section>
            <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              About
            </h3>
            <div className="surface rounded-xl px-4 py-4 text-sm">
              <p className="font-medium text-foreground">Trace</p>
              <dl className="mt-2 space-y-1 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <dt>Version</dt>
                  <dd className="tabular-nums text-foreground">{APP_VERSION}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Build</dt>
                  <dd className="tabular-nums text-foreground">{BUILD_NUMBER}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Built by</dt>
                  <dd className="text-foreground">{BUILT_BY}</dd>
                </div>
              </dl>
            </div>
          </section>
        </div>
      </aside>

      {modal === "issue" && <ReportIssueModal onClose={() => setModal(null)} />}
      {modal === "feature" && (
        <RequestFeatureModal onClose={() => setModal(null)} />
      )}
    </div>
  );
}

function ExternalRow({
  icon,
  label,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  href: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 px-4 py-3 text-sm text-foreground transition-colors hover:bg-accent/50"
    >
      <span className="text-muted-foreground">{icon}</span>
      <span className="flex-1">{label}</span>
      <ExternalLink className="size-3.5 text-muted-foreground" />
    </a>
  );
}
