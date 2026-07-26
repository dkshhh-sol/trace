"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { X, Bell, CheckCheck, Trash2, Inbox as InboxIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/toast";
import {
  getMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteMyNotification,
  deleteMyReadNotifications,
} from "@/lib/notifications/actions";

const INBOX_EVENT = "trace:open-inbox";
export const INBOX_UNREAD_EVENT = "trace:inbox-unread-changed";

/** Open the Inbox slide-over from anywhere (e.g. the sidebar bell). */
export function openInbox() {
  window.dispatchEvent(new Event(INBOX_EVENT));
}

type Item = {
  id: string;
  title: string;
  body: string;
  type: string;
  priority: string;
  read: boolean;
  actionLabel: string | null;
  actionUrl: string | null;
  createdAt: string;
};

function fmtTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function InboxPanel() {
  const [mounted, setMounted] = useState(false);
  const [show, setShow] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (nextPage: number, replace: boolean) => {
    setLoading(true);
    try {
      const rows = (await getMyNotifications(nextPage)) as Item[];
      setItems((prev) => (replace ? rows : [...prev, ...rows]));
      setHasMore(rows.length === 20);
      setPage(nextPage);
    } catch {
      toast("Couldn't load your inbox.", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  const open = useCallback(() => {
    setMounted(true);
    requestAnimationFrame(() => setShow(true));
    void load(0, true);
  }, [load]);

  const close = useCallback(() => {
    setShow(false);
    setTimeout(() => setMounted(false), 260);
  }, []);

  useEffect(() => {
    window.addEventListener(INBOX_EVENT, open);
    return () => window.removeEventListener(INBOX_EVENT, open);
  }, [open]);

  useEffect(() => {
    if (!mounted) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [mounted, close]);

  function notifyUnreadChanged() {
    window.dispatchEvent(new Event(INBOX_UNREAD_EVENT));
  }

  async function onRead(id: string) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, read: true } : i)));
    notifyUnreadChanged();
    try {
      await markNotificationRead(id);
    } catch {
      /* optimistic; ignore */
    }
  }

  async function onMarkAllRead() {
    setItems((prev) => prev.map((i) => ({ ...i, read: true })));
    notifyUnreadChanged();
    try {
      await markAllNotificationsRead();
    } catch {
      toast("Couldn't mark all as read.", "error");
    }
  }

  async function onDelete(id: string) {
    const wasUnread = items.find((i) => i.id === id)?.read === false;
    setItems((prev) => prev.filter((i) => i.id !== id));
    if (wasUnread) notifyUnreadChanged();
    try {
      await deleteMyNotification(id);
    } catch {
      toast("Couldn't delete the message.", "error");
    }
  }

  async function onDeleteRead() {
    setItems((prev) => prev.filter((i) => !i.read));
    try {
      await deleteMyReadNotifications();
    } catch {
      toast("Couldn't delete read messages.", "error");
    }
  }

  if (!mounted) return null;

  const unreadInList = items.some((i) => !i.read);
  const readInList = items.some((i) => i.read);

  return (
    <div className="fixed inset-0 z-[70]">
      <div
        aria-hidden="true"
        onClick={close}
        className={cn(
          "absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300",
          show ? "opacity-100" : "opacity-0",
        )}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Inbox"
        className={cn(
          "absolute right-0 top-0 flex h-dvh w-full max-w-md flex-col border-l border-border bg-background shadow-2xl transition-transform duration-300 ease-out",
          show ? "translate-x-0" : "translate-x-full",
        )}
      >
        <header className="flex shrink-0 items-center justify-between border-b border-border px-6 py-4">
          <span className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Bell className="size-4 text-brand" />
            Inbox
          </span>
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="grid size-8 place-items-center rounded-lg text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="size-4" />
          </button>
        </header>

        {items.length > 0 && (
          <div className="flex shrink-0 items-center justify-end gap-2 border-b border-border px-6 py-2.5">
            <button
              type="button"
              onClick={onMarkAllRead}
              disabled={!unreadInList}
              className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
            >
              <CheckCheck className="size-3.5" /> Mark all read
            </button>
            <button
              type="button"
              onClick={onDeleteRead}
              disabled={!readInList}
              className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
            >
              <Trash2 className="size-3.5" /> Delete read
            </button>
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          {items.length === 0 && !loading ? (
            <div className="grid h-full place-items-center px-6 text-center">
              <div>
                <InboxIcon className="mx-auto size-8 text-muted-foreground" />
                <p className="mt-3 text-sm text-muted-foreground">
                  No messages yet.
                </p>
              </div>
            </div>
          ) : (
            <ul className="space-y-2">
              {items.map((n) => (
                <li
                  key={n.id}
                  className={cn(
                    "rounded-xl p-4 ring-1",
                    n.read
                      ? "bg-white/[0.02] ring-white/[0.05]"
                      : "bg-brand/[0.06] ring-brand/20",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-2">
                      {!n.read && (
                        <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand" />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">
                          {n.title}
                        </p>
                        <p className="mt-1 whitespace-pre-line text-xs leading-relaxed text-muted-foreground">
                          {n.body}
                        </p>
                        <p className="mt-1.5 text-[10px] text-muted-foreground/70">
                          {fmtTime(n.createdAt)}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onDelete(n.id)}
                      aria-label="Delete"
                      className="grid size-7 shrink-0 place-items-center rounded-lg text-muted-foreground outline-none transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>

                  <div className="mt-2.5 flex items-center gap-3">
                    {n.actionLabel && n.actionUrl && (
                      <Link
                        href={n.actionUrl}
                        onClick={() => {
                          if (!n.read) onRead(n.id);
                          close();
                        }}
                        className="text-xs font-medium text-brand transition-colors hover:text-[#a69bff]"
                      >
                        {n.actionLabel}
                      </Link>
                    )}
                    {!n.read && (
                      <button
                        type="button"
                        onClick={() => onRead(n.id)}
                        className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}

          {loading && (
            <div className="grid place-items-center py-6 text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
            </div>
          )}

          {hasMore && !loading && (
            <button
              type="button"
              onClick={() => load(page + 1, false)}
              className="mt-2 w-full rounded-lg py-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Load more
            </button>
          )}
        </div>
      </aside>
    </div>
  );
}
