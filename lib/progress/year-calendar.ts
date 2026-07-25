import type { DayAggregate } from "@/lib/progress/compute";

/**
 * Dashboard calendar generator.
 *
 * Unlike the profile's rolling 365-day timeline, the dashboard renders a fixed
 * calendar year (Jan 1 → Dec 31 of `year`) so the graph always behaves like a
 * proper GitHub yearly contribution calendar. Days before the account was
 * created are marked `available: false` (rendered as an "unavailable" state),
 * and days after today are marked `future: true`. Leap years fall out naturally
 * because we iterate real UTC dates, so 2028 yields 366 cells and 2025/2026
 * yield 365.
 *
 * This is deliberately separate from the profile generator — the two views have
 * different UX requirements and must not share logic.
 */

export type CalendarDay = {
  date: string; // YYYY-MM-DD (UTC)
  count: number;
  topics: string[];
  byDifficulty: { easy: number; medium: number; hard: number };
  /** False for dates before the account existed. Defaults to true. */
  available?: boolean;
  /** True for dates after today. Defaults to false. */
  future?: boolean;
};

const EMPTY_DIFFICULTY = { easy: 0, medium: 0, hard: 0 } as const;
const toKey = (d: Date) => d.toISOString().slice(0, 10);

export function buildYearCalendar(
  aggregate: Record<string, DayAggregate>,
  year: number,
  accountCreatedAtISO: string,
  now: Date = new Date(),
): CalendarDay[] {
  const createdKey = accountCreatedAtISO.slice(0, 10); // YYYY-MM-DD (UTC)
  const todayKey = toKey(now);

  const cells: CalendarDay[] = [];
  const cursor = new Date(Date.UTC(year, 0, 1));
  const end = Date.UTC(year, 11, 31);

  while (cursor.getTime() <= end) {
    const key = toKey(cursor);
    const agg = aggregate[key];
    cells.push({
      date: key,
      count: agg?.count ?? 0,
      topics: agg?.topics ?? [],
      byDifficulty: agg?.byDifficulty ?? { ...EMPTY_DIFFICULTY },
      available: key >= createdKey,
      future: key > todayKey,
    });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return cells;
}
