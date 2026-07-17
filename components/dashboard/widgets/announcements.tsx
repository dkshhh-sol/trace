import { Megaphone } from "lucide-react";
import { WidgetCard, WidgetEmptyState } from "./widget-card";
import { getAnnouncements } from "@/lib/sanity/queries";
import type { Announcement } from "@/lib/sanity/types";

/**
 * Product announcements. This is the ONLY dashboard widget sourced from Sanity
 * (Requirement 8.5). Renders an empty state when no content exists or the
 * source is unreachable — never hardcoded content (Requirements 8.3, 8.6).
 */
export async function Announcements() {
  let items: Announcement[] = [];
  try {
    items = await getAnnouncements();
  } catch {
    // Source unavailable — fall through to the empty state; no substitute data.
    items = [];
  }

  return (
    <WidgetCard title="Announcements">
      {items.length === 0 ? (
        <WidgetEmptyState
          icon={<Megaphone className="size-6" />}
          message="No announcements right now."
        />
      ) : (
        <ul className="space-y-3">
          {items.map((a) => (
            <li key={a._id} className="flex flex-col gap-0.5">
              <span className="text-sm text-foreground">{a.title}</span>
              {a.publishedAt && (
                <span className="text-xs text-muted-foreground">
                  {new Date(a.publishedAt).toLocaleDateString()}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </WidgetCard>
  );
}
