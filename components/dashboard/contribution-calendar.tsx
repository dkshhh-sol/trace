"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import type { CalendarDay } from "@/lib/progress/year-calendar";

/**
 * GitHub-style contribution calendar in the Trace purple palette (never green).
 * One square per calendar day, 7 rows (Sun–Sat) × N week columns, with month
 * labels on top and weekday labels on the left. A custom animated tooltip
 * (not the native title attribute) shows the day's detail on hover.
 *
 * Cells can carry two special states used by the dashboard's fixed-year view:
 *  - `available: false` → the account did not exist yet (muted, "Account not
 *    created yet." tooltip, no hover highlight).
 *  - `future: true`     → date after today (rendered empty, non-interactive).
 * The profile's rolling heatmap passes neither flag, so those cells behave as
 * ordinary available days.
 *
 * variant "fill":    squares stretch to fill the card width (dashboard).
 * variant "compact": fixed-size squares, horizontally scrollable (profile).
 */

// Intensity ramp (Trace purple, never green): 0 / 1 / 2-3 / 4-5 / 6+
const PALETTE = ["#17171d", "#2f2557", "#5542b7", "#7960ff", "#a68fff"];
// Distinct "account didn't exist yet" fill — clearly muted vs. an empty day.
const UNAVAILABLE_FILL = "rgba(255,255,255,0.03)";
const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function level(count: number): number {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count <= 3) return 2;
  if (count <= 5) return 3;
  return 4;
}

type Hovered = { day: CalendarDay; x: number; y: number };

export function ContributionCalendar({
  days,
  variant = "compact",
  currentStreak = 0,
  className,
}: {
  days: CalendarDay[];
  variant?: "fill" | "compact";
  currentStreak?: number;
  className?: string;
}) {
  const [hovered, setHovered] = useState<Hovered | null>(null);

  const { cells, weeks, monthLabels } = useMemo(() => {
    const firstWeekday = days[0]
      ? new Date(days[0].date + "T00:00:00Z").getUTCDay()
      : 0;
    const cells: (CalendarDay | null)[] = [
      ...Array.from({ length: firstWeekday }, () => null),
      ...days,
    ];
    const weeks = Math.ceil(cells.length / 7);

    // One month label per column where the month first changes.
    const monthLabels: { col: number; label: string }[] = [];
    let lastMonth = -1;
    for (let w = 0; w < weeks; w++) {
      const first = cells[w * 7] ?? cells.slice(w * 7, w * 7 + 7).find(Boolean);
      if (!first) continue;
      const m = new Date(first.date + "T00:00:00Z").getUTCMonth();
      if (m !== lastMonth) {
        monthLabels.push({ col: w, label: MONTHS[m] });
        lastMonth = m;
      }
    }
    return { cells, weeks, monthLabels };
  }, [days]);

  const fill = variant === "fill";
  const gap = fill ? "3px" : "3px";
  const cellSize = fill ? undefined : "11px";

  function onEnter(day: CalendarDay, e: React.MouseEvent<HTMLDivElement>) {
    const wrapper = e.currentTarget.closest("[data-cal-wrapper]");
    if (!wrapper) return;
    const cell = e.currentTarget.getBoundingClientRect();
    const w = wrapper.getBoundingClientRect();
    setHovered({
      day,
      x: cell.left - w.left + cell.width / 2,
      y: cell.top - w.top,
    });
  }

  return (
    <div data-cal-wrapper className={cn("relative", className)}>
      <div className={cn(fill ? "" : "overflow-x-auto pb-1")}>
        <div
          className={cn("animate-in fade-in-0 duration-700", fill ? "w-full" : "w-max")}
          style={{
            display: "grid",
            gap,
            gridTemplateColumns: `auto repeat(${weeks}, ${fill ? "minmax(0, 1fr)" : cellSize})`,
            gridTemplateRows: `auto repeat(7, ${fill ? "auto" : cellSize})`,
          }}
        >
          {/* Month labels (row 1) */}
          {monthLabels.map(({ col, label }) => (
            <span
              key={`${label}-${col}`}
              className="pointer-events-none whitespace-nowrap text-[10px] leading-none text-muted-foreground"
              style={{ gridRow: 1, gridColumnStart: col + 2, alignSelf: "end", paddingBottom: 2 }}
            >
              {label}
            </span>
          ))}

          {/* Weekday labels (column 1): Mon / Wed / Fri */}
          {[
            { row: 2, text: "Mon" },
            { row: 4, text: "Wed" },
            { row: 6, text: "Fri" },
          ].map(({ row, text }) => (
            <span
              key={text}
              className="pointer-events-none pr-1.5 text-[10px] leading-none text-muted-foreground"
              style={{ gridColumn: 1, gridRow: row + 1, alignSelf: "center" }}
            >
              {text}
            </span>
          ))}

          {/* Day cells */}
          {cells.map((d, i) => {
            const col = Math.floor(i / 7);
            const row = i % 7;
            if (!d) {
              return (
                <span
                  key={`pad-${i}`}
                  style={{ gridColumnStart: col + 2, gridRowStart: row + 2 }}
                />
              );
            }
            const unavailable = d.available === false;
            const future = d.future === true;
            // Future dates are inert placeholders that keep the year complete.
            const interactive = !future;
            const highlightable = interactive && !unavailable;
            const background = unavailable
              ? UNAVAILABLE_FILL
              : PALETTE[level(d.count)];
            return (
              <div
                key={d.date}
                onMouseEnter={
                  interactive ? (e) => onEnter(d, e) : undefined
                }
                onMouseLeave={interactive ? () => setHovered(null) : undefined}
                className={cn(
                  "rounded-[2px] transition-transform duration-150",
                  highlightable && "hover:scale-110 hover:ring-1 hover:ring-white/25",
                  unavailable && "opacity-50 ring-1 ring-inset ring-white/[0.04]",
                  fill && "aspect-square",
                )}
                style={{
                  gridColumnStart: col + 2,
                  gridRowStart: row + 2,
                  backgroundColor: background,
                  ...(fill ? {} : { width: cellSize, height: cellSize }),
                }}
              />
            );
          })}
        </div>
      </div>

      {hovered && (
        <CalendarTooltip hovered={hovered} currentStreak={currentStreak} />
      )}
    </div>
  );
}

function CalendarTooltip({
  hovered,
  currentStreak,
}: {
  hovered: Hovered;
  currentStreak: number;
}) {
  const { day, x, y } = hovered;
  const d = new Date(day.date + "T00:00:00Z");
  const dateLabel = d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
  const { easy, medium, hard } = day.byDifficulty;
  const hasDiff = easy + medium + hard > 0;
  const below = y < 72;
  const unavailable = day.available === false;

  return (
    <div
      role="tooltip"
      className={cn(
        "pointer-events-none absolute z-50 w-max max-w-[220px] rounded-lg border border-white/10 bg-[#0f0f14] px-3 py-2 text-left shadow-xl",
        "animate-in fade-in-0 zoom-in-95 duration-150",
      )}
      style={{
        left: x,
        top: below ? y + 16 : y - 8,
        transform: below ? "translate(-50%, 0)" : "translate(-50%, -100%)",
      }}
    >
      <p className="text-xs font-medium text-foreground">{dateLabel}</p>
      {unavailable ? (
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          Account not created yet.
        </p>
      ) : (
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          {day.count > 0
            ? `Solved ${day.count} problem${day.count === 1 ? "" : "s"}`
            : "No problems solved."}
        </p>
      )}
      {!unavailable && hasDiff && (
        <p className="mt-1 flex gap-2 text-[10px]">
          {easy > 0 && <span className="text-success">Easy {easy}</span>}
          {medium > 0 && <span className="text-[#e3b341]">Medium {medium}</span>}
          {hard > 0 && <span className="text-[#f85149]">Hard {hard}</span>}
        </p>
      )}
      {!unavailable && day.topics.length > 0 && (
        <div className="mt-1.5 space-y-0.5">
          {day.topics.slice(0, 4).map((t) => (
            <p key={t} className="truncate text-[10px] text-muted-foreground">
              {t}
            </p>
          ))}
          {day.topics.length > 4 && (
            <p className="text-[10px] text-muted-foreground">
              +{day.topics.length - 4} more
            </p>
          )}
        </div>
      )}
      {!unavailable && currentStreak > 0 && (
        <p className="mt-1.5 border-t border-white/5 pt-1.5 text-[10px] text-brand">
          Current streak: {currentStreak} day{currentStreak === 1 ? "" : "s"}
        </p>
      )}
    </div>
  );
}

export function HeatmapLegend() {
  return (
    <div className="flex items-center justify-end gap-1 text-[10px] text-muted-foreground">
      <span>Less</span>
      {PALETTE.map((c) => (
        <span
          key={c}
          className="size-3 rounded-[2px]"
          style={{ backgroundColor: c }}
        />
      ))}
      <span>More</span>
    </div>
  );
}
