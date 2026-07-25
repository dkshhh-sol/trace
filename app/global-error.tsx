"use client";

import { useEffect } from "react";

/**
 * Root error boundary. Catches errors that escape route-segment boundaries
 * (e.g. thrown from the root layout) so users never see the bare browser
 * error page. Must render its own <html>/<body>.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en" className="dark">
      <body className="min-h-dvh bg-background text-foreground antialiased">
        <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
          <h1 className="text-2xl tracking-tight">Something went wrong</h1>
          <p className="max-w-sm text-sm text-muted-foreground">
            An unexpected error occurred. Try again, or head back to your
            dashboard.
          </p>
          <div className="mt-2 flex gap-3">
            <button
              type="button"
              onClick={reset}
              className="inline-flex h-10 items-center rounded-lg bg-foreground px-4 text-sm font-medium text-background"
            >
              Try again
            </button>
            <a
              href="/dashboard"
              className="inline-flex h-10 items-center rounded-lg border border-border px-4 text-sm font-medium text-foreground"
            >
              Go to dashboard
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
