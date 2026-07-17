import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Shared shell for every dashboard widget: consistent header, surface, and
 * loading/empty states. Each widget renders inside a WidgetCard and is
 * independently loadable (Requirements 9.5–9.7).
 */
export function WidgetCard({
  title,
  action,
  className,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "flex flex-col rounded-2xl border border-border bg-card p-5",
        className,
      )}
    >
      <header className="mb-4 flex items-center justify-between gap-2">
        <h2 className="text-sm font-medium text-foreground">{title}</h2>
        {action}
      </header>
      <div className="flex-1">{children}</div>
    </section>
  );
}

/** Loading fallback shown while a widget awaits its data source. */
export function WidgetSkeleton() {
  return (
    <div className="space-y-3" aria-hidden="true">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-9 w-full" />
    </div>
  );
}

/** Empty state for widgets whose data source is not yet populated. */
export function WidgetEmptyState({
  icon,
  message,
}: {
  icon?: React.ReactNode;
  message: string;
}) {
  return (
    <div className="flex h-full min-h-24 flex-col items-center justify-center gap-2 text-center">
      {icon && <div className="text-muted-foreground">{icon}</div>}
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
