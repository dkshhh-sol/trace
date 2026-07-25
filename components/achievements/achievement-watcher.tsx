"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { notifyUnlocks } from "./notify";

// Shared across mounts so navigations don't hammer the endpoint.
let lastSync = 0;

/**
 * Silently syncs achievements as the user navigates and surfaces any newly
 * unlocked ones as toasts. Renders nothing. Throttled so it runs at most once
 * every 12s. Kept modular so the same signal can later feed a notification
 * center.
 */
export function AchievementWatcher() {
  const pathname = usePathname();

  useEffect(() => {
    const now = Date.now();
    if (now - lastSync < 12_000) return;
    lastSync = now;

    let active = true;
    fetch("/api/achievements")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (active && d?.newlyUnlocked) notifyUnlocks(d.newlyUnlocked);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [pathname]);

  return null;
}
