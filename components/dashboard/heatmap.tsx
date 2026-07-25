import { cn } from "@/lib/utils";
import type { HeatmapDay } from "@/lib/profile/types";

/**
 * GitHub-style contribution graph in the Trace purple palette. Pure and
 * presentational — safe to render from both server and client components.
 * 7 rows (weekdays), columns are weeks; scrolls horizontally when wide.
 */

// Intensity ramp (never green): 0 / 1 / 2-3 / 4-5 / 6+
const PALETTE = ["#17171d", "#3d2d78", "#5b46c7", "#7a63ff", "#a48dff"];

function level(count: number): number {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count <= 3) return 2;
  if (count <= 5) return 3;
  return 4;
}

function tooltip(day: HeatmapDay): string {
  const d = new Date(day.date + "T00:00:00Z");
  const label = d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
  const head = `${label}\nSolved ${day.count} problem${day.count === 1 ? "" : "s"}`;
  return day.topics.length ? `${head}\n${day.topics.join("\n")}` : head;
}

export function Heatmap({
  days,
  className,
}: {
  days: HeatmapDay[];
  className?: string;
}) {
  const firstWeekday = days[0]
    ? new Date(days[0].date + "T00:00:00Z").getUTCDay()
    : 0;
  const cells: (HeatmapDay | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...days,
  ];

  return (
    <div className={cn("overflow-x-auto pb-1", className)}>
      <div className="grid w-max grid-flow-col grid-rows-7 gap-1">
        {cells.map((d, i) =>
          d ? (
            <div
              key={d.date}
              title={tooltip(d)}
              className="size-3 rounded-[3px]"
              style={{ backgroundColor: PALETTE[level(d.count)] }}
            />
          ) : (
            <div key={`pad-${i}`} className="size-3" />
          ),
        )}
      </div>
    </div>
  );
}

export function HeatmapLegend() {
  return (
    <div className="flex items-center justify-end gap-1.5 text-[10px] text-muted-foreground">
      <span>Less</span>
      {PALETTE.map((c) => (
        <span
          key={c}
          className="size-3 rounded-[3px]"
          style={{ backgroundColor: c }}
        />
      ))}
      <span>More</span>
    </div>
  );
}
