import { Megaphone } from "lucide-react";
import { WidgetCard, WidgetEmptyState } from "./widget-card";

/**
 * Product announcements. This is the ONLY dashboard widget sourced from Sanity
 * (Requirement 8.5); wired to the content client in the Sanity task. Until
 * content exists it renders an empty state — never hardcoded content (R8.3).
 */
export function Announcements() {
  return (
    <WidgetCard title="Announcements">
      <WidgetEmptyState
        icon={<Megaphone className="size-6" />}
        message="No announcements right now."
      />
    </WidgetCard>
  );
}
