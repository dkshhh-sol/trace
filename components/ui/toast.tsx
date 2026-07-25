"use client";

import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Tiny dependency-free toast. `toast()` dispatches a window event that the
 * mounted <Toaster /> renders. Kept minimal to match Trace's styling system
 * without pulling in a toast library.
 */

type ToastVariant = "success" | "error" | "info";
type ToastItem = { id: number; message: string; variant: ToastVariant };

const EVENT = "trace:toast";
let seq = 0;

export function toast(message: string, variant: ToastVariant = "info") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<Omit<ToastItem, "id">>(EVENT, {
      detail: { message, variant },
    }),
  );
}

export function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    function onToast(e: Event) {
      const detail = (e as CustomEvent<Omit<ToastItem, "id">>).detail;
      const id = ++seq;
      setItems((prev) => [...prev, { id, ...detail }]);
      window.setTimeout(() => {
        setItems((prev) => prev.filter((t) => t.id !== id));
      }, 3200);
    }
    window.addEventListener(EVENT, onToast);
    return () => window.removeEventListener(EVENT, onToast);
  }, []);

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
      {items.map((t) => (
        <div
          key={t.id}
          role="status"
          className={cn(
            "animate-in fade-in-0 slide-in-from-bottom-2 pointer-events-auto flex items-center gap-2 rounded-xl border border-border bg-popover px-4 py-3 text-sm text-popover-foreground shadow-xl duration-200",
          )}
        >
          {t.variant === "success" && (
            <Check className="size-4 shrink-0 text-success" />
          )}
          {t.variant === "error" && (
            <X className="size-4 shrink-0 text-destructive" />
          )}
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}
