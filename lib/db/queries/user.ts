import "server-only";

import { cache } from "react";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";

/**
 * The account creation timestamp, used to fix the lower bound of the dashboard
 * year calendar (dates before this render as an "unavailable" state). Wrapped
 * in React `cache()` to dedupe within a single request.
 */
export const getAccountCreatedAt = cache(async function getAccountCreatedAt(
  userId: string,
): Promise<Date> {
  const [row] = await db
    .select({ createdAt: users.createdAt })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return row?.createdAt ?? new Date();
});
