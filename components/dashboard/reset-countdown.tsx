"use client";

import { useEffect, useState } from "react";
import type { GoalPeriod } from "@/lib/db/schema/goals";

/**
 * Live countdown to the next reset. Counters reset at the start of the next
 * period window (UTC), matching how solves are bucketed server-side:
 * daily → UTC midnight, weekly → Monday, monthly → 1st, yearly → Jan 1.
 */
export function ResetCountdown({ period }: { period: GoalPeriod }) {
  const [label, setLabel] = useState("");

  useEffect(() => {
    function nextReset(now: Date): Date {
      const y = now.getUTCFullYear();
      const m = now.getUTCMonth();
      const day = now.getUTCDate();
      switch (period) {
        case "daily":
          return new Date(Date.UTC(y, m, day + 1));
        case "weekly": {
          const dow = now.getUTCDay(); // 0 Sun..6 Sat
          const daysUntilMonday = (8 - dow) % 7 || 7;
          return new Date(Date.UTC(y, m, day + daysUntilMonday));
        }
        case "monthly":
          return new Date(Date.UTC(y, m + 1, 1));
        case "yearly":
          return new Date(Date.UTC(y + 1, 0, 1));
      }
    }

    function compute() {
      const now = new Date();
      const ms = nextReset(now).getTime() - now.getTime();
      const totalMin = Math.max(0, Math.floor(ms / 60000));
      const days = Math.floor(totalMin / 1440);
      const hours = Math.floor((totalMin % 1440) / 60);
      const mins = totalMin % 60;
      setLabel(days > 0 ? `${days}d ${hours}h` : `${hours}h ${mins}m`);
    }

    compute();
    const id = setInterval(compute, 60_000);
    return () => clearInterval(id);
  }, [period]);

  return <span>{label}</span>;
}
