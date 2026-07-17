import { Target } from "lucide-react";
import { WidgetCard, WidgetEmptyState } from "./widget-card";

/** Daily target progress. Sourced from Neon user settings in a later spec. */
export function DailyGoal() {
  return (
    <WidgetCard title="Today's goal">
      <WidgetEmptyState
        icon={<Target className="size-6" />}
        message="Set a daily goal to track your pace."
      />
    </WidgetCard>
  );
}
