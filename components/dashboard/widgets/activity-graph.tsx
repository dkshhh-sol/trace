import { BarChart3 } from "lucide-react";
import { WidgetCard, WidgetEmptyState } from "./widget-card";

/** Learning heatmap. Sourced from Neon daily analytics in a later spec. */
export function ActivityGraph() {
  return (
    <WidgetCard title="Weekly activity" className="sm:col-span-2">
      <WidgetEmptyState
        icon={<BarChart3 className="size-6" />}
        message="Your learning activity will show here."
      />
    </WidgetCard>
  );
}
