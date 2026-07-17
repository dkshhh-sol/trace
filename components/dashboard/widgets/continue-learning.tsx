import { PlayCircle } from "lucide-react";
import { WidgetCard, WidgetEmptyState } from "./widget-card";

/**
 * Resume the last lecture/problem. Data source (Neon progress) arrives in a
 * later spec; renders an empty state for now (no hardcoded content).
 */
export function ContinueLearning() {
  return (
    <WidgetCard title="Continue learning" className="sm:col-span-2">
      <WidgetEmptyState
        icon={<PlayCircle className="size-6" />}
        message="Pick a roadmap to start — you'll resume right here."
      />
    </WidgetCard>
  );
}
