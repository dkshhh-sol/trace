"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, CircleX, Info, Trophy, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Dependency-free toasts. Two forms:
 *  - toast(message, variant): a single-line status toast.
 *  - toastRich({ title, message, icon, variant }): icon + title + description,
 *    used for things like achievement unlocks.
 * Both dispatch a window event that the mounted <Toaster /> renders. Icons come
 * from Lucide (Trace's icon language) — no emojis.
 */

type ToastVariant = "success" | "error" | "info";

type ToastPayload = {
  title?: string;
  message: string;
  variant: ToastVariant;
  icon?: string; // Lucide icon key; falls back to the variant icon
};

type ToastItem = ToastPayload & { id: number };

const EVENT = "trace:toast";
let seq = 0;

const ICONS: Record<string, LucideIcon> = { Trophy, CheckCircle2, CircleX, Info };

export function toast(message: string, variant: ToastVariant = "info") {
  dispatch({ message, variant });
}

export function toastRich(payload: Omit<ToastPayload, "variant"> & {
  variant?: ToastVariant;
}) {
  dispatch({ variant: "info", ...payload });
}

function dispatch(payload: ToastPayload) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<ToastPayload>(EVENT, { detail: payload }));
}

function IconFor({ item }: { item: ToastItem }) {
  const Cmp =
    (item.icon && ICONS[item.icon]) ||
    (item.variant === "success"
      ? CheckCircle2
      : item.variant === "error"
        ? CircleX
        : Info);
  return <Cmp className="size-4 text-brand" strokeWidth={1.75} />;
}

export function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    function onToast(e: Event) {
      const detail = (e as CustomEvent<ToastPayload>).detail;
      const id = ++seq;
      setItems((prev) => [...prev, { id, ...detail }]);
      window.setTimeout(() => {
        setItems((prev) => prev.filter((t) => t.id !== id));
      }, 3600);
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
            "animate-in fade-in-0 slide-in-from-bottom-2 pointer-events-auto flex items-start gap-3 rounded-xl border border-border bg-popover px-4 py-3 text-sm text-popover-foreground shadow-xl duration-200",
          )}
        >
          <span
            className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full"
            style={{
              background: "rgba(139,125,255,0.10)",
              border: "1px solid rgba(139,125,255,0.20)",
            }}
          >
            <IconFor item={t} />
          </span>
          <div className="min-w-0">
            {t.title && (
              <p className="font-medium leading-tight text-foreground">
                {t.title}
              </p>
            )}
            <p
              className={cn(
                "leading-tight",
                t.title ? "text-xs text-muted-foreground" : "text-foreground",
              )}
            >
              {t.message}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
