import { Bookmark } from "lucide-react";
import { WidgetCard, WidgetEmptyState } from "./widget-card";

/** Saved lectures/problems. Sourced from Neon bookmarks in a later spec. */
export function Bookmarks() {
  return (
    <WidgetCard title="Bookmarks">
      <WidgetEmptyState
        icon={<Bookmark className="size-6" />}
        message="Bookmark lectures and problems to find them here."
      />
    </WidgetCard>
  );
}
