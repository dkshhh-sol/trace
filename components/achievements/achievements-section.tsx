"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { AchievementIcon } from "./achievement-icon";
import { notifyUnlocks, type UnlockNotice } from "./notify";

type AchievementView = {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: string;
  requirement: string;
  target: number;
  progress: number;
  met: boolean;
  unlocked: boolean;
  unlockedAt: string | null;
};

type Result = {
  achievements: AchievementView[];
  recentlyUnlocked: AchievementView[];
  newlyUnlocked: UnlockNotice[];
};

const CATEGORIES = [
  { key: "streak", label: "Streak", emoji: "🔥" },
  { key: "problems", label: "Problem Solving", emoji: "💻" },
  { key: "topics", label: "Topic Mastery", emoji: "📚" },
  { key: "goals", label: "Goals", emoji: "🎯" },
  { key: "workspace", label: "Workspace", emoji: "⚡" },
  { key: "journey", label: "Trace Journey", emoji: "🚀" },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function AchievementsSection() {
  const [data, setData] = useState<Result | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selected, setSelected] = useState<AchievementView | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/achievements")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("failed"))))
      .then((d: Result) => {
        if (!active) return;
        setData(d);
        notifyUnlocks(d.newlyUnlocked);
      })
      .catch(() => active && setError(true))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const total = data?.achievements.length ?? 0;
  const unlockedCount = data?.achievements.filter((a) => a.unlocked).length ?? 0;

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">Achievements</h3>
        {data && (
          <span className="text-xs tabular-nums text-muted-foreground">
            {unlockedCount} / {total} unlocked
          </span>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-white/[0.04]" />
          ))}
        </div>
      ) : error || !data ? (
        <p className="text-sm text-muted-foreground">
          Couldn&rsquo;t load achievements. Close and reopen to try again.
        </p>
      ) : (
        <>
          {/* Recently unlocked / empty state */}
          {data.recentlyUnlocked.length > 0 ? (
            <div className="mb-5">
              <p className="mb-2 text-[11px] uppercase tracking-wide text-muted-foreground">
                Recently unlocked
              </p>
              <div className="grid grid-cols-3 gap-2">
                {data.recentlyUnlocked.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setSelected(a)}
                    className="flex flex-col items-center gap-1.5 rounded-xl bg-brand/[0.08] p-2.5 text-center ring-1 ring-brand/25 outline-none transition-transform hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <AchievementIcon icon={a.icon} className="size-4 text-brand" />
                    <span className="line-clamp-2 text-[10px] leading-tight text-foreground">
                      {a.title}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <p className="mb-5 rounded-xl bg-white/[0.03] px-4 py-4 text-center text-sm text-muted-foreground ring-1 ring-white/[0.05]">
              Your journey has just begun.
            </p>
          )}

          {/* Grid grouped by category */}
          <div className="space-y-4">
            {CATEGORIES.map((cat) => {
              const items = data.achievements.filter(
                (a) => a.category === cat.key,
              );
              if (items.length === 0) return null;
              return (
                <div key={cat.key}>
                  <p className="mb-2 text-[11px] font-medium text-muted-foreground">
                    <span className="mr-1">{cat.emoji}</span>
                    {cat.label}
                  </p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {items.map((a) => (
                      <AchievementCard
                        key={a.id}
                        a={a}
                        onClick={() => setSelected(a)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {selected && (
        <AchievementModal a={selected} onClose={() => setSelected(null)} />
      )}
    </section>
  );
}

function AchievementCard({
  a,
  onClick,
}: {
  a: AchievementView;
  onClick: () => void;
}) {
  const pct = a.target > 0 ? Math.round((a.progress / a.target) * 100) : 0;
  const measurable = a.target > 1;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex flex-col gap-2 rounded-xl p-2.5 text-left outline-none transition-transform hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-ring",
        a.unlocked
          ? "bg-brand/[0.08] ring-1 ring-brand/25 shadow-[0_0_22px_-10px_rgba(139,124,255,0.7)]"
          : "bg-white/[0.03] ring-1 ring-white/[0.05]",
      )}
    >
      <span
        className={cn(
          "grid size-8 place-items-center rounded-lg",
          a.unlocked
            ? "bg-brand/15 text-brand"
            : "bg-white/[0.04] text-muted-foreground/60",
        )}
      >
        <AchievementIcon icon={a.icon} className="size-4" />
      </span>

      <span
        className={cn(
          "line-clamp-2 text-[11px] font-medium leading-tight",
          a.unlocked ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {a.title}
      </span>

      {a.unlocked ? (
        <span className="text-[10px] text-brand">Unlocked</span>
      ) : measurable ? (
        <div className="space-y-1">
          <div className="h-1 w-full overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="h-full rounded-full bg-brand/70 transition-[width] duration-700 ease-out"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-[10px] tabular-nums text-muted-foreground">
            {a.progress} / {a.target}
          </span>
        </div>
      ) : (
        <span className="text-[10px] text-muted-foreground/70">Locked</span>
      )}
    </button>
  );
}

function AchievementModal({
  a,
  onClose,
}: {
  a: AchievementView;
  onClose: () => void;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const pct = a.target > 0 ? Math.round((a.progress / a.target) * 100) : 0;
  const categoryLabel =
    CATEGORIES.find((c) => c.key === a.category)?.label ?? a.category;

  return (
    <div className="fixed inset-0 z-[85] grid place-items-center p-4">
      <div
        aria-hidden="true"
        onClick={onClose}
        className="animate-in fade-in-0 absolute inset-0 bg-black/50 backdrop-blur-sm duration-200"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={a.title}
        className="animate-in fade-in-0 zoom-in-95 surface relative w-full max-w-xs rounded-2xl p-5 text-center duration-150"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 grid size-8 place-items-center rounded-lg text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="size-4" />
        </button>

        <span
          className={cn(
            "mx-auto grid size-16 place-items-center rounded-2xl",
            a.unlocked
              ? "bg-brand/15 text-brand shadow-[0_0_30px_-8px_rgba(139,124,255,0.8)]"
              : "bg-white/[0.04] text-muted-foreground/60",
          )}
        >
          <AchievementIcon icon={a.icon} className="size-7" />
        </span>

        <h3 className="mt-4 text-lg font-medium text-foreground">{a.title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{a.description}</p>

        <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] px-2.5 py-1 text-[11px] text-muted-foreground">
          {categoryLabel}
        </div>

        <div className="mt-4 space-y-2 text-left">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
            Requirement
          </p>
          <p className="text-sm text-foreground">{a.requirement}</p>

          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand to-[#b9b3ff] transition-[width] duration-700 ease-out"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-xs tabular-nums text-muted-foreground">
            {a.progress} / {a.target}
          </p>
        </div>

        {a.unlocked && a.unlockedAt && (
          <p className="mt-4 border-t border-white/5 pt-3 text-xs text-brand">
            Unlocked {formatDate(a.unlockedAt)}
          </p>
        )}
      </div>
    </div>
  );
}
