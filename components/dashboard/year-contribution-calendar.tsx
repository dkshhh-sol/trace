"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ContributionCalendar } from "./contribution-calendar";
import { buildYearCalendar } from "@/lib/progress/year-calendar";
import type { DayAggregate } from "@/lib/progress/compute";

/**
 * Dashboard contribution calendar with a year selector. The selected year
 * defaults to the current calendar year; changing it rebuilds the fixed
 * Jan 1 → Dec 31 grid for that year from the pre-aggregated day map, instantly
 * and without a server round-trip.
 */
export function YearContributionCalendar({
  aggregate,
  accountCreatedAt,
  minYear,
  maxYear,
  currentStreak,
}: {
  aggregate: Record<string, DayAggregate>;
  accountCreatedAt: string;
  minYear: number;
  maxYear: number;
  currentStreak: number;
}) {
  const [year, setYear] = useState(maxYear);

  const days = useMemo(
    () => buildYearCalendar(aggregate, year, accountCreatedAt),
    [aggregate, year, accountCreatedAt],
  );

  const canPrev = year > minYear;
  const canNext = year < maxYear;

  return (
    <div>
      <div className="mb-3 flex items-center justify-end gap-1">
        <button
          type="button"
          onClick={() => canPrev && setYear((y) => y - 1)}
          disabled={!canPrev}
          aria-label="Previous year"
          className="grid size-7 place-items-center rounded-lg text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-30"
        >
          <ChevronLeft className="size-4" />
        </button>
        <span className="w-12 text-center text-sm font-medium tabular-nums text-foreground">
          {year}
        </span>
        <button
          type="button"
          onClick={() => canNext && setYear((y) => y + 1)}
          disabled={!canNext}
          aria-label="Next year"
          className="grid size-7 place-items-center rounded-lg text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-30"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      <ContributionCalendar
        key={year}
        days={days}
        variant="fill"
        currentStreak={currentStreak}
      />
    </div>
  );
}
