import { RotateCcw } from "lucide-react";
import { WidgetCard, WidgetEmptyState } from "./widget-card";

/** Problems due for revision. Sourced from Neon revision queue in a later spec. */
export function RevisionQueue() {
  return (
    <WidgetCard title="Revision queue">
      <WidgetEmptyState
        icon={<RotateCcw className="size-6" />}
        message="Nothing due for revision yet."
      />
    </WidgetCard>
  );
}
