import "server-only";

import { desc, or, ilike, gte } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  inboxTemplates,
  emailTemplates,
  users,
  progress,
  githubConnections,
} from "@/lib/db/schema";

export async function listInboxTemplates() {
  const rows = await db.select().from(inboxTemplates).orderBy(desc(inboxTemplates.createdAt));
  return rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }));
}

export async function listEmailTemplates() {
  const rows = await db.select().from(emailTemplates).orderBy(desc(emailTemplates.createdAt));
  return rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }));
}

/** Ensure the "welcome" email template row exists (metadata only; the React
 * component is the source of truth for content). */
export async function ensureWelcomeTemplate() {
  await db
    .insert(emailTemplates)
    .values({ key: "welcome", subject: "Welcome to Trace", description: "Sent once on first signup." })
    .onConflictDoNothing();
}

/** Search users for the "send to" picker (name/email/joined/solved/GitHub/streak). */
export async function searchRecipients(query: string) {
  const q = query.trim();
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      image: users.image,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(q ? or(ilike(users.name, `%${q}%`), ilike(users.email, `%${q}%`)) : undefined)
    .orderBy(desc(users.createdAt))
    .limit(50);

  return rows.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    image: u.image,
    joinedAt: u.createdAt.toISOString(),
  }));
}

export async function getAllUserIds(): Promise<string[]> {
  const rows = await db.select({ id: users.id }).from(users);
  return rows.map((r) => r.id);
}

/** Users who joined recently, for a quick "recently active" filter shortcut. */
export async function getRecentlyActiveUserIds(days: number): Promise<string[]> {
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - days);
  const rows = await db
    .select({ userId: progress.userId })
    .from(progress)
    .where(gte(progress.completedAt, since));
  return [...new Set(rows.map((r) => r.userId))];
}

export async function getGithubConnectedUserIds(): Promise<string[]> {
  const rows = await db.select({ userId: githubConnections.userId }).from(githubConnections);
  return rows.map((r) => r.userId);
}
