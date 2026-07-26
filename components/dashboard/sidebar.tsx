"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeft, LifeBuoy, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/logo";
import { openSupport } from "@/components/support/support-panel";
import { openInbox, INBOX_UNREAD_EVENT } from "@/components/inbox/inbox-panel";
import { getMyUnreadCount } from "@/lib/notifications/actions";
import { navItems } from "./nav-items";

/**
 * Left navigation. Persistent and expanded on desktop (>=1024px); a
 * collapsible icon rail on tablet (768–1023px); hidden on mobile, where the
 * bottom nav takes over (Requirements 9.2–9.4, 13).
 */
export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    function refresh() {
      getMyUnreadCount().then(setUnread).catch(() => {});
    }
    refresh();
    window.addEventListener(INBOX_UNREAD_EVENT, refresh);
    const id = window.setInterval(refresh, 60_000);
    return () => {
      window.removeEventListener(INBOX_UNREAD_EVENT, refresh);
      window.clearInterval(id);
    };
  }, []);

  return (
    <aside
      data-collapsed={collapsed}
      className={cn(
        "fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-border bg-sidebar md:flex",
        collapsed ? "w-16" : "w-64",
      )}
    >
      <div className="flex h-16 items-center gap-2 px-4">
        <Link href="/dashboard" aria-label="Trace home">
          <Logo showWordmark={!collapsed} />
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-2" aria-label="Primary">
        {navItems.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                collapsed && "justify-center px-0",
              )}
            >
              <item.icon className="size-4 shrink-0" />
              {!collapsed && (
                <span className="flex-1 truncate">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Inbox — pinned above Support, opens a slide-over */}
      <div className="px-3 pb-1">
        <button
          type="button"
          onClick={openInbox}
          title={collapsed ? "Inbox" : undefined}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground",
            collapsed && "justify-center px-0",
          )}
        >
          <span className="relative shrink-0">
            <Bell className="size-4" />
            {unread > 0 && (
              <span className="absolute -right-1 -top-1 size-2 rounded-full bg-brand" />
            )}
          </span>
          {!collapsed && (
            <span className="flex-1 truncate text-left">
              Inbox{unread > 0 ? ` (${unread})` : ""}
            </span>
          )}
        </button>
      </div>

      {/* Feedback & Support — pinned to the bottom, opens a slide-over */}
      <div className="px-3 pb-1">
        <button
          type="button"
          onClick={openSupport}
          title={collapsed ? "Feedback & Support" : undefined}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground",
            collapsed && "justify-center px-0",
          )}
        >
          <LifeBuoy className="size-4 shrink-0" />
          {!collapsed && <span className="flex-1 truncate text-left">Feedback &amp; Support</span>}
        </button>
      </div>

      <div className="border-t border-border p-3">
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-pressed={collapsed}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground",
            collapsed && "justify-center px-0",
          )}
        >
          {collapsed ? (
            <PanelLeft className="size-4" />
          ) : (
            <PanelLeftClose className="size-4" />
          )}
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
