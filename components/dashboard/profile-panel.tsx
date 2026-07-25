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
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOutAction } from "@/lib/auth/actions";
import type { ProfileStats, HeatmapDay } from "@/lib/profile/types";

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

  const open = useCallback(() => {
    setMounted(true);
    requestAnimationFrame(() => setShow(true));
    setError(false);
    setLoading(true);
    setStats(null);
    fetch("/api/profile")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("failed"))))
      .then((data: ProfileStats) => setStats(data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

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
    // lock body scroll while open
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [mounted, close]);

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
          {/* Backdrop */}
          <div
            aria-hidden="true"
            onClick={close}
            className={cn(
              "absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300",
              show ? "opacity-100" : "opacity-0",
            )}
          />

          {/* Panel: header / scrollable body / pinned footer */}
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Your profile"
            className={cn(
              "absolute right-0 top-0 flex h-dvh w-full max-w-md flex-col border-l border-border bg-background shadow-2xl transition-transform duration-300 ease-out",
              show ? "translate-x-0" : "translate-x-full",
            )}
          >
            {/* Header (fixed) */}
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

            {/* Body (scrolls independently) */}
            <div className="min-h-0 flex-1 overflow-y-auto">
              <div className="relative">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-brand/[0.12] to-transparent"
                />
                <div className="relative space-y-8 px-6 py-6">
                  <ProfileHeader user={user} stats={stats} imgErrored={imgError} />

                  {error ? (
                    <p className="text-sm text-muted-foreground">
                      Couldn&rsquo;t load your stats. Close and reopen to try
                      again.
                    </p>
                  ) : loading || !stats ? (
                    <PanelSkeleton />
                  ) : (
                    <>
                      <Heatmap days={stats.heatmap} />
                      <Statistics stats={stats} />
                      <Goals stats={stats} />
                    </>
                  )}

                  <Achievements />
                  <AccountInfo />
                </div>
              </div>
            </div>

            {/* Footer (pinned) */}
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

function heatLevel(count: number) {
  if (count <= 0) return "bg-white/[0.05]";
  if (count === 1) return "bg-brand/30";
  if (count <= 3) return "bg-brand/50";
  if (count <= 5) return "bg-brand/75";
  return "bg-brand";
}

function Heatmap({ days }: { days: HeatmapDay[] }) {
  const firstDay = days[0]
    ? new Date(days[0].date + "T00:00:00Z").getUTCDay()
    : 0;
  const cells: (HeatmapDay | null)[] = [
    ...Array.from({ length: firstDay }, () => null),
    ...days,
  ];

  return (
    <section>
      <h3 className="mb-3 text-sm font-medium text-foreground">
        Learning activity
      </h3>
      <div className="grid grid-flow-col grid-rows-7 gap-1 overflow-x-auto pb-1">
        {cells.map((d, i) =>
          d ? (
            <div
              key={d.date}
              title={`${d.date}\n${d.count} problem${
                d.count === 1 ? "" : "s"
              } solved${
                d.topics.length ? `\nTopics: ${d.topics.join(", ")}` : ""
              }`}
              className={cn("size-3 rounded-[3px]", heatLevel(d.count))}
            />
          ) : (
            <div key={`pad-${i}`} className="size-3" />
          ),
        )}
      </div>
      <div className="mt-3 flex items-center justify-end gap-1.5 text-[10px] text-muted-foreground">
        <span>Less</span>
        <span className="size-3 rounded-[3px] bg-white/[0.05]" />
        <span className="size-3 rounded-[3px] bg-brand/30" />
        <span className="size-3 rounded-[3px] bg-brand/50" />
        <span className="size-3 rounded-[3px] bg-brand/75" />
        <span className="size-3 rounded-[3px] bg-brand" />
        <span>More</span>
      </div>
    </section>
  );
}

function Statistics({ stats }: { stats: ProfileStats }) {
  const items = [
    { icon: Flame, label: "Current streak", value: `${stats.currentStreak}d`, accent: "text-success" },
    { icon: Trophy, label: "Longest streak", value: `${stats.longestStreak}d`, accent: "text-success" },
    { icon: CheckCircle2, label: "Problems solved", value: `${stats.solved}`, accent: "text-success" },
    { icon: Layers, label: "Topics completed", value: `${stats.topicsCompleted}/${stats.totalTopics}`, accent: "text-brand" },
    { icon: TrendingUp, label: "Overall progress", value: `${stats.progressPct}%`, accent: "text-brand" },
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
              {it.value}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function GoalBar({
  label,
  value,
  goal,
}: {
  label: string;
  value: number;
  goal: number;
}) {
  const pct = goal > 0 ? Math.min(100, Math.round((value / goal) * 100)) : 0;
  const remaining = Math.max(0, goal - value);
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="text-foreground">
          {value} / {goal}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-brand to-[#b9b3ff]"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-1 text-[11px] text-muted-foreground">
        {remaining === 0 ? "Goal reached 🎉" : `${remaining} to go`}
      </p>
    </div>
  );
}

function Goals({ stats }: { stats: ProfileStats }) {
  return (
    <section>
      <h3 className="mb-3 text-sm font-medium text-foreground">Goals</h3>
      <div className="space-y-4">
        <GoalBar label="Today" value={stats.solvedToday} goal={stats.dailyGoal} />
        <GoalBar
          label="This week"
          value={stats.solvedThisWeek}
          goal={stats.weeklyGoal}
        />
      </div>
    </section>
  );
}

function Achievements() {
  const badges = ["First solve", "7-day streak", "Finish a step", "Finish A2Z"];
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">Achievements</h3>
        <span className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[10px] text-muted-foreground">
          Soon
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {badges.map((b) => (
          <div
            key={b}
            className="surface flex items-center gap-2.5 rounded-xl px-3 py-3 opacity-60"
          >
            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white/[0.05] text-muted-foreground">
              <Lock className="size-3.5" />
            </span>
            <span className="truncate text-sm text-muted-foreground">{b}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function AccountInfo() {
  return (
    <section>
      <h3 className="mb-3 text-sm font-medium text-foreground">Account</h3>
      <div className="surface divide-y divide-border overflow-hidden rounded-xl">
        <div className="flex items-center justify-between gap-2 px-4 py-3">
          <span className="flex items-center gap-2 text-sm text-foreground">
            <GoogleMark className="size-4" />
            Google account
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs text-success">
            <CheckCircle2 className="size-3.5" />
            Connected
          </span>
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
