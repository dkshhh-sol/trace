"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import {
  X,
  LogOut,
  Settings,
  Flame,
  Trophy,
  CheckCircle2,
  Layers,
  TrendingUp,
  Check,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOutAction } from "@/lib/auth/actions";
import { toast } from "@/components/ui/toast";
import { GitHubMark } from "@/components/ui/github-mark";
import { AchievementsSection } from "@/components/achievements/achievements-section";
import { ContributionCalendar, HeatmapLegend } from "./contribution-calendar";
import { EditGoalsButton } from "./edit-goals-modal";
import { CountUp } from "./count-up";
import type { GoalPeriod } from "@/lib/db/schema/goals";
import type { GoalView, ProfileStats } from "@/lib/profile/types";

type SessionUser = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

function initials(name?: string | null, email?: string | null) {
  const source = name || email || "?";
  return source
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function ProfilePanel({ user }: { user: SessionUser }) {
  const [mounted, setMounted] = useState(false);
  const [show, setShow] = useState(false);
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [imgError, setImgError] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const loadStats = useCallback(() => {
    setError(false);
    fetch("/api/profile")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("failed"))))
      .then((data: ProfileStats) => setStats(data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const open = useCallback(() => {
    setMounted(true);
    requestAnimationFrame(() => setShow(true));
    setLoading(true);
    setStats(null);
    loadStats();
  }, [loadStats]);

  const close = useCallback(() => {
    setShow(false);
    setTimeout(() => setMounted(false), 260);
    triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!mounted) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [mounted, close]);

  const solvedZero = stats?.solved === 0;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={open}
        aria-haspopup="dialog"
        aria-label="Open your profile"
        className="flex size-8 items-center justify-center overflow-hidden rounded-full bg-secondary text-xs font-medium text-foreground outline-none ring-offset-2 ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
      >
        {user.image && !imgError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.image}
            alt=""
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className="size-full object-cover"
          />
        ) : (
          <span>{initials(user.name, user.email)}</span>
        )}
      </button>

      {mounted && (
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
            aria-label="Your profile"
            className={cn(
              "absolute right-0 top-0 flex h-dvh w-full max-w-md flex-col border-l border-border bg-background shadow-2xl transition-transform duration-300 ease-out",
              show ? "translate-x-0" : "translate-x-full",
            )}
          >
            <header className="flex shrink-0 items-center justify-between border-b border-border px-6 py-4">
              <span className="text-sm font-medium text-muted-foreground">
                Profile
              </span>
              <button
                ref={closeRef}
                type="button"
                onClick={close}
                aria-label="Close profile"
                className="grid size-8 place-items-center rounded-lg text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="size-4" />
              </button>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto">
              <div className="relative">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-brand/[0.12] to-transparent"
                />
                <div className="relative space-y-8 px-6 py-6">
                  <ProfileHeader
                    user={user}
                    stats={stats}
                    imgErrored={imgError}
                  />

                  {error ? (
                    <p className="text-sm text-muted-foreground">
                      Couldn&rsquo;t load your stats. Close and reopen to try
                      again.
                    </p>
                  ) : loading || !stats ? (
                    <PanelSkeleton />
                  ) : (
                    <>
                      <ActivitySection stats={stats} empty={solvedZero} />
                      <Statistics stats={stats} />
                      <Goals goals={stats.goals} onChanged={loadStats} />
                    </>
                  )}

                  <AchievementsSection />
                  <AccountInfo />
                </div>
              </div>
            </div>

            <footer className="shrink-0 border-t border-border p-4">
              <SignOutButton />
            </footer>
          </aside>
        </div>
      )}
    </>
  );
}

function ProfileHeader({
  user,
  stats,
  imgErrored,
}: {
  user: SessionUser;
  stats: ProfileStats | null;
  imgErrored: boolean;
}) {
  const [imgError, setImgError] = useState(imgErrored);
  const joined = stats?.joinedAt
    ? new Date(stats.joinedAt).toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div className="flex items-center gap-4">
      <div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-2xl bg-secondary text-lg font-medium text-foreground ring-1 ring-white/10">
        {user.image && !imgError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.image}
            alt=""
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className="size-full object-cover"
          />
        ) : (
          initials(user.name, user.email)
        )}
      </div>
      <div className="min-w-0">
        <h2 className="truncate font-serif text-2xl italic text-foreground">
          {user.name ?? "Your profile"}
        </h2>
        {user.email && (
          <p className="truncate text-sm text-muted-foreground">{user.email}</p>
        )}
        <p className="mt-0.5 text-xs text-muted-foreground">
          {joined ? `Joined ${joined}` : "\u00A0"}
        </p>
      </div>
    </div>
  );
}

function ActivitySection({
  stats,
  empty,
}: {
  stats: ProfileStats;
  empty: boolean;
}) {
  return (
    <section className="animate-in fade-in-0 duration-500">
      <h3 className="mb-3 text-sm font-medium text-foreground">
        Learning activity
      </h3>
      <ContributionCalendar
        days={stats.heatmap}
        variant="compact"
        currentStreak={stats.currentStreak}
      />
      <div className="mt-3">
        <HeatmapLegend />
      </div>
      {empty && (
        <p className="mt-3 text-sm text-muted-foreground">
          Start solving problems to build your learning history.
        </p>
      )}
    </section>
  );
}

function Statistics({ stats }: { stats: ProfileStats }) {
  const items = [
    { icon: Flame, label: "Current streak", value: stats.currentStreak, suffix: "d", accent: "text-success" },
    { icon: Trophy, label: "Longest streak", value: stats.longestStreak, suffix: "d", accent: "text-success" },
    { icon: CheckCircle2, label: "Problems solved", value: stats.solved, suffix: "", accent: "text-success" },
    { icon: Layers, label: "Topics completed", value: stats.topicsCompleted, suffix: `/${stats.totalTopics}`, accent: "text-brand" },
    { icon: TrendingUp, label: "Overall progress", value: stats.progressPct, suffix: "%", accent: "text-brand" },
  ];
  return (
    <section>
      <h3 className="mb-3 text-sm font-medium text-foreground">Statistics</h3>
      <div className="grid grid-cols-2 gap-3">
        {items.map((it) => (
          <div key={it.label} className="surface rounded-xl p-4">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <it.icon className={cn("size-3.5", it.accent)} />
              {it.label}
            </div>
            <p className="mt-2 text-2xl tracking-tight text-foreground">
              <CountUp value={it.value} />
              {it.suffix}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

const PERIOD_LABEL: Record<GoalPeriod, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  yearly: "Yearly",
};

function GoalBar({ goal }: { goal: GoalView }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
        <span className="flex min-w-0 items-center gap-2">
          <span className="truncate text-foreground">{goal.title}</span>
          <span className="shrink-0 rounded-full bg-white/[0.06] px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-muted-foreground">
            {PERIOD_LABEL[goal.period]}
          </span>
        </span>
        <span className="shrink-0 tabular-nums text-foreground">
          {goal.done} / {goal.targetCount}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-brand to-[#b9b3ff] transition-[width] duration-700 ease-out"
          style={{ width: `${goal.pct}%` }}
        />
      </div>
      <p className="mt-1 text-[11px]">
        {goal.complete ? (
          <span className="inline-flex items-center gap-1 text-brand motion-safe:animate-pulse">
            <Check className="size-3" /> Goal completed
          </span>
        ) : (
          <span className="text-muted-foreground">{goal.remaining} to go</span>
        )}
      </p>
    </div>
  );
}

function Goals({
  goals,
  onChanged,
}: {
  goals: GoalView[];
  onChanged: () => void;
}) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">Goals</h3>
        <EditGoalsButton
          goals={goals.map((g) => ({
            id: g.id,
            title: g.title,
            targetCount: g.targetCount,
            period: g.period,
          }))}
          onChanged={onChanged}
        />
      </div>
      {goals.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          No goals yet. Choose{" "}
          <span className="text-foreground">Edit goals</span> to set a target.
        </p>
      ) : (
        <div className="space-y-4">
          {goals.map((g) => (
            <GoalBar key={g.id} goal={g} />
          ))}
        </div>
      )}
    </section>
  );
}

type GitHubStatus = {
  configured: boolean;
  connected: boolean;
  username: string | null;
};

function AccountInfo() {
  const [gh, setGh] = useState<GitHubStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/github/status")
      .then((r) => (r.ok ? r.json() : null))
      .then((s) => {
        if (active) setGh(s);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  function connect() {
    const returnTo = window.location.pathname + window.location.search;
    window.location.href = `/api/github/connect?returnTo=${encodeURIComponent(returnTo)}`;
  }

  async function disconnect() {
    setWorking(true);
    try {
      await fetch("/api/github/disconnect", { method: "POST" });
      setGh((s) => (s ? { ...s, connected: false, username: null } : s));
      toast("GitHub disconnected");
    } catch {
      toast("Couldn't disconnect. Try again.", "error");
    } finally {
      setWorking(false);
    }
  }

  return (
    <section>
      <h3 className="mb-3 text-sm font-medium text-foreground">
        Connected accounts
      </h3>
      <div className="surface divide-y divide-border overflow-hidden rounded-xl">
        <div className="flex items-center justify-between gap-2 px-4 py-3">
          <span className="flex items-center gap-2 text-sm text-foreground">
            <GoogleMark className="size-4" />
            Google
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs text-success">
            <CheckCircle2 className="size-3.5" />
            Connected
          </span>
        </div>

        <div className="flex items-center justify-between gap-2 px-4 py-3">
          <span className="flex min-w-0 items-center gap-2 text-sm text-foreground">
            <GitHubMark className="size-4 shrink-0" />
            <span className="truncate">
              GitHub
              {gh?.connected && gh.username && (
                <span className="ml-1.5 text-muted-foreground">
                  @{gh.username}
                </span>
              )}
            </span>
          </span>
          {loading ? (
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          ) : gh?.connected ? (
            <button
              type="button"
              onClick={disconnect}
              disabled={working}
              className="rounded-lg px-2 py-1 text-xs text-muted-foreground transition-colors hover:text-destructive disabled:opacity-60"
            >
              Disconnect
            </button>
          ) : (
            <button
              type="button"
              onClick={connect}
              disabled={gh?.configured === false}
              title={
                gh?.configured === false
                  ? "GitHub isn't configured on this deployment"
                  : undefined
              }
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:border-foreground/40 disabled:opacity-50"
            >
              <GitHubMark className="size-3.5" />
              Connect
            </button>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 px-4 py-3 opacity-60">
          <span className="flex items-center gap-2 text-sm text-foreground">
            <Settings className="size-4" />
            Settings
          </span>
          <span className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[10px] text-muted-foreground">
            Soon
          </span>
        </div>
      </div>
    </section>
  );
}

function SignOutButton() {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => void signOutAction())}
      className={cn(
        "flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-border text-sm font-medium text-foreground outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring",
        pending && "opacity-60",
      )}
    >
      <LogOut className="size-4" />
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}

function PanelSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-28 w-full animate-pulse rounded-xl bg-white/[0.04]" />
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-xl bg-white/[0.04]" />
        ))}
      </div>
      <div className="h-16 w-full animate-pulse rounded-xl bg-white/[0.04]" />
    </div>
  );
}

function GoogleMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z" />
    </svg>
  );
}
