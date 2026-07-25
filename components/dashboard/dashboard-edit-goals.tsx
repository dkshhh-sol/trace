"use client";

import { useRouter } from "next/navigation";
import { EditGoalsButton, type EditableGoal } from "./edit-goals-modal";

/**
 * Dashboard wrapper for the Edit-goals modal. Server components can't pass a
 * callback, so this client boundary wires `onChanged` to a soft router refresh,
 * which re-runs the server components and re-derives goal progress without a
 * full page reload.
 */
export function DashboardEditGoals({ goals }: { goals: EditableGoal[] }) {
  const router = useRouter();
  return <EditGoalsButton goals={goals} onChanged={() => router.refresh()} />;
}
