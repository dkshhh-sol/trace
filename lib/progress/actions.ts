"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { and, eq, sql } from "drizzle-orm";
import { requireSession } from "@/lib/auth/guards";
import { db } from "@/lib/db/client";
import { goals } from "@/lib/db/schema";
import { GOAL_PERIODS } from "@/lib/db/schema/goals";
import type { GoalInput } from "@/lib/progress/compute";

const periodSchema = z.enum(GOAL_PERIODS);

const createSchema = z.object({
  title: z.string().trim().min(1).max(60),
  targetCount: z.coerce.number().int().min(1).max(10000),
  period: periodSchema,
});

const updateSchema = createSchema.extend({
  id: z.string().uuid(),
});

const idSchema = z.string().uuid();

function toInput(row: {
  id: string;
  title: string;
  targetCount: number;
  period: string;
}): GoalInput {
  return {
    id: row.id,
    title: row.title,
    targetCount: row.targetCount,
    period: row.period as GoalInput["period"],
  };
}

/** Create a new goal for the current user. */
export async function createGoal(input: {
  title: string;
  targetCount: number;
  period: string;
}): Promise<GoalInput> {
  const session = await requireSession();
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) throw new Error("Invalid goal");

  const [{ max }] = await db
    .select({ max: sql<number>`coalesce(max(${goals.sortOrder}), -1)` })
    .from(goals)
    .where(eq(goals.userId, session.user.id));

  const [row] = await db
    .insert(goals)
    .values({
      userId: session.user.id,
      title: parsed.data.title,
      targetCount: parsed.data.targetCount,
      period: parsed.data.period,
      sortOrder: (max ?? -1) + 1,
    })
    .returning({
      id: goals.id,
      title: goals.title,
      targetCount: goals.targetCount,
      period: goals.period,
    });

  revalidatePath("/dashboard");
  return toInput(row);
}

/** Update one of the current user's goals. */
export async function updateGoal(input: {
  id: string;
  title: string;
  targetCount: number;
  period: string;
}): Promise<GoalInput> {
  const session = await requireSession();
  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) throw new Error("Invalid goal");

  const [row] = await db
    .update(goals)
    .set({
      title: parsed.data.title,
      targetCount: parsed.data.targetCount,
      period: parsed.data.period,
    })
    .where(and(eq(goals.id, parsed.data.id), eq(goals.userId, session.user.id)))
    .returning({
      id: goals.id,
      title: goals.title,
      targetCount: goals.targetCount,
      period: goals.period,
    });

  if (!row) throw new Error("Goal not found");
  revalidatePath("/dashboard");
  return toInput(row);
}

/** Delete one of the current user's goals. */
export async function deleteGoal(id: string): Promise<{ id: string }> {
  const session = await requireSession();
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) throw new Error("Invalid goal id");

  await db
    .delete(goals)
    .where(and(eq(goals.id, parsed.data), eq(goals.userId, session.user.id)));

  revalidatePath("/dashboard");
  return { id: parsed.data };
}
