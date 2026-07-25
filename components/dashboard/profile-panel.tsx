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
  Pencil,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOutAction } from "@/lib/auth/actions";
import { updateGoals } from "@/lib/progress/actions";
import { Heatmap, HeatmapLegend } from "./heatmap";
import { CountUp } from "./count-up";
import type { ProfileStats } from "@/lib/profile/types";

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
  const [editing, setEditing] = useState(false);
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
    setEditing(false);
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
                      <Goals stats={stats} onEdit={() => setEditing(true)} />
                    </>
                  )}

                  <Achievements />
                  <AccountInfo />
                </div>
              </div>
            </div>

            <footer className="shrink-0 border-t border-border p-4">
              <SignOutButton />
            </footer>
          </aside>

          {editing && stats && (
            <EditGoalsModal
              daily={stats.dailyGoal}
              weekly={stats.weeklyGoal}
              onCancel={() => setEditing(false)}
              onSaved={(daily, weekly) => {
                setStats((prev) =>
                  prev ? { ...prev, dailyGoal: daily, weeklyGoal: weekly } : prev,
                );
                setEditing(false);
              }}
            />
          )}
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
      <Heatmap days={stats.heatmap} />
      <div className="mt-3">
        <HeatmapLegend />
      </div>
      {empty && (
        <p className="mt-3 text-sm text-muted-foreground">
          Start solving problems to build your learning streak.
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
  const complete = value >= goal && goal > 0;
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="tabular-nums text-foreground">
          {value} / {goal}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-brand to-[#b9b3ff] transition-[width] duration-700 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-1 text-[11px]">
        {complete ? (
          <span className="inline-flex items-center gap-1 text-success">
            <Check className="size-3 animate-pulse" /> Goal completed
          </span>
        ) : (
          <span className="text-muted-foreground">{remaining} to go</span>
        )}
      </p>
    </div>
  );
}

function Goals({
  stats,
  onEdit,
}: {
  stats: ProfileStats;
  onEdit: () => void;
}) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">Goals</h3>
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Pencil className="size-3" />
          Edit goals
        </button>
      </div>
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

function EditGoalsModal({
  daily,
  weekly,
  onCancel,
  onSaved,
}: {
  daily: number;
  weekly: number;
  onCancel: () => void;
  onSaved: (daily: number, weekly: number) => void;
}) {
  const [d, setD] = useState(String(daily));
  const [w, setW] = useState(String(weekly));
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel]);

  function save() {
    const dn = Number(d);
    const wn = Number(w);
    if (!Number.isFinite(dn) || dn < 1 || !Number.isFinite(wn) || wn < 1) {
      setErr("Enter values of 1 or more.");
      return;
    }
    setErr(null);
    startTransition(async () => {
      try {
        const saved = await updateGoals({ daily: dn, weekly: wn });
        onSaved(saved.daily, saved.weekly);
      } catch {
        setErr("Couldn't save. Please try again.");
      }
    });
  }

  return (
    <div className="absolute inset-0 z-[80] grid place-items-center p-4">
      <div
        aria-hidden="true"
        onClick={onCancel}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Edit goals"
        className="animate-in fade-in-0 zoom-in-95 surface relative w-full max-w-xs rounded-2xl p-5 duration-150"
      >
        <h3 className="text-base font-medium text-foreground">Edit goals</h3>
        <div className="mt-4 space-y-4">
          <label className="block">
            <span className="text-xs text-muted-foreground">
              Daily goal (problems / day)
            </span>
            <input
              type="number"
              min={1}
              max={100}
              value={d}
              onChange={(e) => setD(e.target.value)}
              className="mt-1.5 h-10 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>
          <label className="block">
            <span className="text-xs text-muted-foreground">
              Weekly goal (problems / week)
            </span>
            <input
              type="number"
              min={1}
              max={700}
              value={w}
              onChange={(e) => setW(e.target.value)}
              className="mt-1.5 h-10 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>
          {err && <p className="text-xs text-destructive">{err}</p>}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex h-9 items-center rounded-lg px-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            disabled={pending}
            className="inline-flex h-9 items-center rounded-lg bg-foreground px-4 text-sm font-medium text-background transition-transform hover:scale-[1.02] active:scale-[0.99] disabled:opacity-60"
          >
            {pending ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
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
