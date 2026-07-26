import "server-only";

import { and, count, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { notifications, welcomeStatus, loginDays, mailLogs } from "@/lib/db/schema";

const PAGE_SIZE = 20;

export async function insertNotifications(
  rows: {
    userId: string;
    title: string;
    body: string;
    type: string;
    priority: string;
    actionLabel?: string | null;
    actionUrl?: string | null;
    metadata?: string | null;
  }[],
) {
  if (rows.length === 0) return;
  // Batch in chunks to keep a single INSERT reasonable for large broadcasts.
  const CHUNK = 500;
  for (let i = 0; i < rows.length; i += CHUNK) {
    await db.insert(notifications).values(rows.slice(i, i + CHUNK));
  }
}

export async function getUnreadCount(userId: string): Promise<number> {
  const [row] = await db
    .select({ n: count() })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.read, false)));
  return Number(row?.n ?? 0);
}

export async function listNotifications(userId: string, page: number) {
  const rows = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(PAGE_SIZE)
    .offset(page * PAGE_SIZE);

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    body: r.body,
    type: r.type,
    priority: r.priority,
    read: r.read,
    actionLabel: r.actionLabel,
    actionUrl: r.actionUrl,
    createdAt: r.createdAt.toISOString(),
  }));
}

export async function markRead(userId: string, id: string) {
  await db
    .update(notifications)
    .set({ read: true })
    .where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
}

export async function markAllRead(userId: string) {
  await db
    .update(notifications)
    .set({ read: true })
    .where(and(eq(notifications.userId, userId), eq(notifications.read, false)));
}

export async function deleteNotification(userId: string, id: string) {
  await db
    .delete(notifications)
    .where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
}

export async function deleteReadNotifications(userId: string) {
  await db
    .delete(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.read, true)));
}

/* ------------------------------- Onboarding -------------------------------- */

export async function getWelcomeStatus(userId: string) {
  const [row] = await db
    .select()
    .from(welcomeStatus)
    .where(eq(welcomeStatus.userId, userId))
    .limit(1);
  if (row) return row;
  const [created] = await db
    .insert(welcomeStatus)
    .values({ userId })
    .onConflictDoNothing()
    .returning();
  return (
    created ?? {
      userId,
      welcomeEmailSent: false,
      welcomeInboxSent: false,
      featuresInboxSent: false,
      githubReminderSent: false,
      welcomeEmailSentAt: null,
      githubReminderSentAt: null,
    }
  );
}

export async function markWelcomeFlags(
  userId: string,
  patch: Partial<{
    welcomeEmailSent: boolean;
    welcomeInboxSent: boolean;
    featuresInboxSent: boolean;
    githubReminderSent: boolean;
  }>,
) {
  const now = new Date();
  await db
    .insert(welcomeStatus)
    .values({
      userId,
      ...patch,
      ...(patch.welcomeEmailSent ? { welcomeEmailSentAt: now } : {}),
      ...(patch.githubReminderSent ? { githubReminderSentAt: now } : {}),
    })
    .onConflictDoUpdate({
      target: welcomeStatus.userId,
      set: {
        ...patch,
        ...(patch.welcomeEmailSent ? { welcomeEmailSentAt: now } : {}),
        ...(patch.githubReminderSent ? { githubReminderSentAt: now } : {}),
      },
    });
}

/** Record today (UTC) as a login day for the user; returns distinct-day count. */
export async function recordLoginDay(userId: string): Promise<number> {
  const day = new Date().toISOString().slice(0, 10);
  await db.insert(loginDays).values({ userId, day }).onConflictDoNothing();
  const [row] = await db
    .select({ n: count() })
    .from(loginDays)
    .where(eq(loginDays.userId, userId));
  return Number(row?.n ?? 0);
}

/* --------------------------------- Mail log --------------------------------- */

export async function logMail(input: {
  recipient: string;
  subject: string;
  template: string;
  status: string;
  error?: string | null;
}) {
  await db.insert(mailLogs).values(input);
}

export async function listMailLogs(page: number) {
  const rows = await db
    .select()
    .from(mailLogs)
    .orderBy(desc(mailLogs.sentAt))
    .limit(PAGE_SIZE)
    .offset(page * PAGE_SIZE);
  return rows.map((r) => ({ ...r, sentAt: r.sentAt.toISOString() }));
}

export async function listInboxDeliveries(page: number) {
  const rows = await db
    .select()
    .from(notifications)
    .orderBy(desc(notifications.createdAt))
    .limit(PAGE_SIZE)
    .offset(page * PAGE_SIZE);
  return rows.map((r) => ({
    id: r.id,
    userId: r.userId,
    title: r.title,
    type: r.type,
    createdAt: r.createdAt.toISOString(),
  }));
}
