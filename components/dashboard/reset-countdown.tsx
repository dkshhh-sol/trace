"use client";

import { useEffect, useState } from "react";

/**
 * Live countdown to the next reset. Daily counters reset at UTC midnight,
 * weekly counters at the start of Monday (UTC) — matching how solves are
 * bucketed server-side.
 */
export function ResetCountdown({ type }: { type: "daily" | "weekly" }) {
  const [label, setLabel] = useState("");

  useEffect(() => {
    function compute() {
      const now = new Date();
      const target = new Date(
        Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth(),
          now.getUTCDate() + 1,
        ),
      );
      if (type === "weekly") {
        // next Monday 00:00 UTC
        const dow = now.getUTCDay(); // 0 Sun..6 Sat
        const daysUntilMonday = ((8 - dow) % 7) || 7;
        target.setUTCDate(now.getUTCDate() + daysUntilMonday);
        target.setUTCHours(0, 0, 0, 0);
      }
      const ms = target.getTime() - now.getTime();
      const totalMin = Math.max(0, Math.floor(ms / 60000));
      const days = Math.floor(totalMin / 1440);
      const hours = Math.floor((totalMin % 1440) / 60);
      const mins = totalMin % 60;
      setLabel(days > 0 ? `${days}d ${hours}h` : `${hours}h ${mins}m`);
    }
    compute();
    const id = setInterval(compute, 60_000);
    return () => clearInterval(id);
  }, [type]);

  return <span>{label}</span>;
}
