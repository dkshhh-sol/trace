"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { requireSession } from "@/lib/auth/guards";
import { db } from "@/lib/db/client";
import { userSettings } from "@/lib/db/schema";
import type { Goals } from "@/lib/db/queries/activity";

const goalsSchema = z.object({
  daily: z.coerce.number().int().min(1).max(100),
  weekly: z.coerce.number().int().min(1).max(700),
});

/** Update the current user's daily/weekly goals. Returns the saved values. */
export async function updateGoals(input: {
  daily: number;
  weekly: number;
}): Promise<Goals> {
  const session = await requireSession();
  const parsed = goalsSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error("Invalid goals");
  }
  const { daily, weekly } = parsed.data;

  await db
    .insert(userSettings)
    .values({ userId: session.user.id, dailyGoal: daily, weeklyGoal: weekly })
    .onConflictDoUpdate({
      target: userSettings.userId,
      set: { dailyGoal: daily, weeklyGoal: weekly },
    });

  revalidatePath("/dashboard");
  return { daily, weekly };
}
