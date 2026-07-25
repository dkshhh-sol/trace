"use client";

import { useEffect, useMemo, useState } from "react";
import {
  X,
  ChevronDown,
  Flame,
  Code2,
  BookOpen,
  Target,
  FolderCode,
  Compass,
  type LucideIcon,
} from "lucide-react";
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

const CATEGORIES: { key: string; label: string; Icon: LucideIcon }[] = [
  { key: "streak", label: "Streak", Icon: Flame },
  { key: "problems", label: "Problem Solving", Icon: Code2 },
  { key: "topics", label: "Topic Mastery", Icon: BookOpen },
  { key: "goals", label: "Goals", Icon: Target },
  { key: "workspace", label: "Workspace", Icon: FolderCode },
  { key: "journey", label: "Trace Journey", Icon: Compass },
];

// Marquee achievements used to fill the preview when the user has little
// activity yet, so the section never looks empty.
const MILESTONES = [
  "solve_1",
  "streak_7",
  "topic_arrays",
  "solve_100",
  "goal_first",
  "journey_complete_a2z",
];

const PREVIEW_COUNT = 6;

/**
 * Personalized preview: recently unlocked first, then in-progress (highest
 * completion first), then important milestones, then anything else — capped at
 * six and de-duplicated.
 */
function buildPreview(list: AchievementView[]): AchievementView[] {
  const byId = new Map(list.map((a) => [a.id, a] as const));
  const chosen: AchievementView[] = [];
  const seen = new Set<string>();
  const push = (a?: AchievementView) => {
    if (a && !seen.has(a.id) && chosen.length < PREVIEW_COUNT) {
      seen.add(a.id);
      chosen.push(a);
    }
  };

  list
    .filter((a) => a.unlocked && a.unlockedAt)
    .sort((a, b) => (b.unlockedAt! < a.unlockedAt! ? -1 : 1))
    .forEach(push);

  list
    .filter((a) => !a.unlocked && a.progress > 0)
    .sort((a, b) => b.progress / b.target - a.progress / a.target)
    .forEach(push);

  for (const id of MILESTONES) push(byId.get(id));
  for (const a of list) push(a);

  return chosen;
}

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
  const [expanded, setExpanded] = useState(false);

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
  const preview = useMemo(
    () => (data ? buildPreview(data.achievements) : []),
    [data],
  );

  return (
    <section>
      <div className="mb-3">
        <h3 className="text-sm font-medium text-foreground">Achievements</h3>
        {data && (
          <p className="text-xs text-muted-foreground">
            <span className="tabular-nums">{unlockedCount}</span> of{" "}
            <span className="tabular-nums">{total}</span> unlocked
          </p>
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
          {unlockedCount === 0 && (
            <p className="mb-3 text-xs text-muted-foreground">
              No achievements unlocked yet.
            </p>
          )}

          {/* Preview (collapsed only) */}
          {!expanded && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {preview.map((a) => (
                <AchievementCard
                  key={a.id}
                  a={a}
                  onClick={() => setSelected(a)}
                />
              ))}
            </div>
          )}

          {/* Full list (expanded) — smooth height + fade via grid-rows */}
          <div
            className={cn(
              "grid transition-[grid-template-rows] duration-300 ease-out",
              expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
            )}
          >
            <div
              className={cn(
                "min-h-0 overflow-hidden transition-opacity duration-300",
                expanded ? "opacity-100" : "opacity-0",
              )}
            >
              <div className="space-y-4">
                {CATEGORIES.map((cat) => {
                  const items = data.achievements.filter(
                    (a) => a.category === cat.key,
                  );
                  if (items.length === 0) return null;
                  return (
                    <div key={cat.key}>
                      <p className="mb-2 flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                        <span
                          className="grid size-5 place-items-center rounded-full"
                          style={{
                            background: "rgba(139,125,255,0.10)",
                            border: "1px solid rgba(139,125,255,0.20)",
                          }}
                        >
                          <cat.Icon className="size-3 text-brand" strokeWidth={1.75} />
                        </span>
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
            </div>
          </div>

          {/* Toggle */}
          <div className="mt-4 flex justify-center">
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white/[0.02] px-3.5 py-1.5 text-xs font-medium text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            >
              {expanded ? "Show Less" : "Show All Achievements"}
              <ChevronDown
                className={cn(
                  "size-3.5 transition-transform duration-300",
                  expanded && "rotate-180",
                )}
              />
            </button>
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
          "grid size-8 place-items-center rounded-full",
          a.unlocked ? "text-brand" : "bg-white/[0.04] text-muted-foreground/60",
        )}
        style={
          a.unlocked
            ? {
                background: "rgba(139,125,255,0.10)",
                border: "1px solid rgba(139,125,255,0.20)",
              }
            : undefined
        }
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
            "mx-auto grid size-16 place-items-center rounded-full",
            a.unlocked
              ? "text-brand shadow-[0_0_30px_-8px_rgba(139,124,255,0.8)]"
              : "bg-white/[0.04] text-muted-foreground/60",
          )}
          style={
            a.unlocked
              ? {
                  background: "rgba(139,125,255,0.10)",
                  border: "1px solid rgba(139,125,255,0.20)",
                }
              : undefined
          }
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
