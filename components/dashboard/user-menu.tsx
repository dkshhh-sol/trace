"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { LogOut, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { signOutAction } from "@/lib/auth/actions";

type SessionUser = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

function initials(user: SessionUser) {
  const source = user.name || user.email || "?";
  return source
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/**
 * Accessible account dropdown — a small self-contained menu (no external menu
 * primitive). Closes on outside-click and Escape, restores focus to the
 * trigger, and only surfaces actions that exist (Settings is disabled).
 */
export function UserMenu({ user }: { user: SessionUser }) {
  const [open, setOpen] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [pending, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointer(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        className="flex size-8 items-center justify-center overflow-hidden rounded-full bg-secondary text-xs font-medium text-foreground outline-none ring-offset-2 ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
      >
        {user.image && !imgError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.image}
            alt=""
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className="size-full object-cover"
          />
        ) : (
          <span>{initials(user)}</span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Account"
          className="surface animate-in fade-in-0 zoom-in-95 absolute right-0 z-50 mt-2 w-56 origin-top-right rounded-xl p-1 duration-100"
        >
          <div className="flex flex-col gap-0.5 px-2.5 py-2">
            {user.name && (
              <span className="truncate text-sm font-medium text-foreground">
                {user.name}
              </span>
            )}
            {user.email && (
              <span className="truncate text-xs text-muted-foreground">
                {user.email}
              </span>
            )}
          </div>

          <div className="my-1 h-px bg-border" />

          <div
            role="menuitem"
            aria-disabled="true"
            className="flex cursor-not-allowed items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-sm text-muted-foreground opacity-60"
          >
            <span className="flex items-center gap-2">
              <Settings className="size-4" />
              Settings
            </span>
            <span className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[10px]">
              Soon
            </span>
          </div>

          <button
            type="button"
            role="menuitem"
            disabled={pending}
            onClick={() => {
              setOpen(false);
              startTransition(() => void signOutAction());
            }}
            className={cn(
              "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-foreground outline-none transition-colors hover:bg-accent focus-visible:bg-accent",
              pending && "opacity-60",
            )}
          >
            <LogOut className="size-4" />
            {pending ? "Signing out…" : "Sign out"}
          </button>
        </div>
      )}
    </div>
  );
}
