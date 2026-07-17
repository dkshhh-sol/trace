import { NotebookPen } from "lucide-react";
import { WidgetCard, WidgetEmptyState } from "./widget-card";

/** Recently edited notes. Sourced from Neon notes in a later spec. */
export function RecentNotes() {
  return (
    <WidgetCard title="Recent notes">
      <WidgetEmptyState
        icon={<NotebookPen className="size-6" />}
        message="Your notes will appear here."
      />
    </WidgetCard>
  );
}
