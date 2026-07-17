import { Flame } from "lucide-react";
import { WidgetCard, WidgetEmptyState } from "./widget-card";

/** Consecutive learning days. Sourced from Neon activity in a later spec. */
export function Streak() {
  return (
    <WidgetCard title="Current streak">
      <WidgetEmptyState
        icon={<Flame className="size-6" />}
        message="Learn today to start your streak."
      />
    </WidgetCard>
  );
}
