"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Route-level error boundary for the authenticated area (Requirement 9.7). */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Centralized logging hook (no secrets are included in error messages).
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-64 flex-col items-center justify-center gap-4 text-center">
      <div className="grid size-12 place-items-center rounded-xl border border-border bg-card text-muted-foreground">
        <AlertTriangle className="size-5" />
      </div>
      <div>
        <h2 className="text-lg font-medium">Something went wrong</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          We couldn&apos;t load this section. Please try again.
        </p>
      </div>
      <Button onClick={reset} variant="outline" className="gap-2">
        Try again
      </Button>
    </div>
  );
}
