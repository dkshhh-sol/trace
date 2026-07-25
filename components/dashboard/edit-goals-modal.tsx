"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { createGoal, deleteGoal, updateGoal } from "@/lib/progress/actions";
import { GOAL_PERIODS, type GoalPeriod } from "@/lib/db/schema/goals";

/**
 * Reusable "Edit goals" experience: a trigger button plus a modal that lets a
 * user create, edit, and delete any number of goals across periods. Changes are
 * batched and persisted on save via server actions, then `onChanged` lets the
 * host re-sync its server-computed progress (no full page reload).
 */

export type EditableGoal = {
  id: string;
  title: string;
  targetCount: number;
  period: GoalPeriod;
};

const PERIOD_LABEL: Record<GoalPeriod, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  yearly: "Yearly",
};

type Row = {
  /** Stable key for React; new rows get a temp key and no `id`. */
  key: string;
  id?: string;
  title: string;
  targetCount: string; // kept as string for controlled input
  period: GoalPeriod;
};

let tempSeq = 0;
const nextKey = () => `new-${tempSeq++}`;

function toRow(g: EditableGoal): Row {
  return {
    key: g.id,
    id: g.id,
    title: g.title,
    targetCount: String(g.targetCount),
    period: g.period,
  };
}

export function EditGoalsButton({
  goals,
  onChanged,
  className,
  label = "Edit goals",
}: {
  goals: EditableGoal[];
  onChanged?: () => void;
  className?: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring",
          className,
        )}
      >
        <Pencil className="size-3" />
        {label}
      </button>
      {open && (
        <EditGoalsModal
          goals={goals}
          onClose={() => setOpen(false)}
          onChanged={onChanged}
        />
      )}
    </>
  );
}

export function EditGoalsModal({
  goals,
  onClose,
  onChanged,
}: {
  goals: EditableGoal[];
  onClose: () => void;
  onChanged?: () => void;
}) {
  const [rows, setRows] = useState<Row[]>(() => goals.map(toRow));
  const [removedIds, setRemovedIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const initial = useRef(new Map(goals.map((g) => [g.id, g] as const)));
  const firstFieldRef = useRef<HTMLInputElement>(null);

  const close = useCallback(() => {
    if (!pending) onClose();
  }, [onClose, pending]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [close]);

  function patch(key: string, next: Partial<Row>) {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...next } : r)));
  }

  function addRow() {
    setRows((prev) => [
      ...prev,
      { key: nextKey(), title: "", targetCount: "1", period: "daily" },
    ]);
  }

  function removeRow(key: string) {
    setRows((prev) => {
      const row = prev.find((r) => r.key === key);
      if (row?.id) setRemovedIds((ids) => [...ids, row.id!]);
      return prev.filter((r) => r.key !== key);
    });
  }

  function save() {
    // Validate all rows first.
    const cleaned: { row: Row; title: string; target: number }[] = [];
    for (const r of rows) {
      const title = r.title.trim();
      const target = Number(r.targetCount);
      if (!title) {
        setError("Give every goal a name.");
        return;
      }
      if (title.length > 60) {
        setError("Goal names must be 60 characters or fewer.");
        return;
      }
      if (!Number.isInteger(target) || target < 1 || target > 10000) {
        setError("Targets must be whole numbers between 1 and 10000.");
        return;
      }
      cleaned.push({ row: r, title, target });
    }
    setError(null);

    startTransition(async () => {
      try {
        for (const id of removedIds) {
          await deleteGoal(id);
        }
        for (const { row, title, target } of cleaned) {
          if (row.id) {
            const before = initial.current.get(row.id);
            const changed =
              !before ||
              before.title !== title ||
              before.targetCount !== target ||
              before.period !== row.period;
            if (changed) {
              await updateGoal({
                id: row.id,
                title,
                targetCount: target,
                period: row.period,
              });
            }
          } else {
            await createGoal({ title, targetCount: target, period: row.period });
          }
        }
        onChanged?.();
        onClose();
      } catch {
        setError("Couldn't save your goals. Please try again.");
      }
    });
  }

  return (
    <div className="fixed inset-0 z-[90] grid place-items-center p-4">
      <div
        aria-hidden="true"
        onClick={close}
        className="animate-in fade-in-0 absolute inset-0 bg-black/50 backdrop-blur-sm duration-200"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Edit goals"
        className="animate-in fade-in-0 zoom-in-95 surface relative flex max-h-[85dvh] w-full max-w-md flex-col rounded-2xl duration-150"
      >
        <header className="flex shrink-0 items-center justify-between border-b border-border px-5 py-4">
          <h3 className="text-base font-medium text-foreground">Edit goals</h3>
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="grid size-8 place-items-center rounded-lg text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="size-4" />
          </button>
        </header>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-4">
          {rows.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No goals yet. Add one to start tracking your target.
            </p>
          )}

          {rows.map((row, i) => (
            <div
              key={row.key}
              className="animate-in fade-in-0 slide-in-from-bottom-1 rounded-xl border border-border bg-card/60 p-3 duration-200"
            >
              <div className="flex items-start gap-2">
                <input
                  ref={i === 0 ? firstFieldRef : undefined}
                  type="text"
                  value={row.title}
                  maxLength={60}
                  placeholder="Goal name"
                  onChange={(e) => patch(row.key, { title: e.target.value })}
                  className="h-9 min-w-0 flex-1 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground/60 focus-visible:ring-2 focus-visible:ring-ring"
                />
                <button
                  type="button"
                  onClick={() => removeRow(row.key)}
                  aria-label="Delete goal"
                  className="grid size-9 shrink-0 place-items-center rounded-lg text-muted-foreground outline-none transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>

              <div className="mt-2 flex items-center gap-2">
                <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span>Target</span>
                  <input
                    type="number"
                    min={1}
                    max={10000}
                    value={row.targetCount}
                    onChange={(e) =>
                      patch(row.key, { targetCount: e.target.value })
                    }
                    className="h-9 w-20 rounded-lg border border-border bg-background px-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </label>
                <select
                  value={row.period}
                  onChange={(e) =>
                    patch(row.key, { period: e.target.value as GoalPeriod })
                  }
                  aria-label="Goal period"
                  className="h-9 flex-1 rounded-lg border border-border bg-background px-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {GOAL_PERIODS.map((p) => (
                    <option key={p} value={p}>
                      {PERIOD_LABEL[p]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addRow}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-border py-2.5 text-sm text-muted-foreground outline-none transition-colors hover:border-brand/40 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Plus className="size-4" />
            Add goal
          </button>

          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>

        <footer className="flex shrink-0 justify-end gap-2 border-t border-border px-5 py-4">
          <button
            type="button"
            onClick={close}
            disabled={pending}
            className="inline-flex h-9 items-center rounded-lg px-3 text-sm text-muted-foreground transition-colors hover:text-foreground disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            disabled={pending}
            className="inline-flex h-9 items-center rounded-lg bg-foreground px-4 text-sm font-medium text-background transition-transform hover:scale-[1.02] active:scale-[0.99] disabled:opacity-60"
          >
            {pending ? "Saving…" : "Save changes"}
          </button>
        </footer>
      </div>
    </div>
  );
}
