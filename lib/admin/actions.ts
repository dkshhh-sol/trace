"use server";

import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  supportTickets,
  featureRequests,
  announcements,
  siteSettings,
  adminLogs,
  TICKET_STATUSES,
  TICKET_PRIORITIES,
  FEATURE_REQUEST_STATUSES,
  ANNOUNCEMENT_TYPES,
} from "@/lib/db/schema";
import {
  requireAdmin,
  getAdminSession,
  unlockWithPassword,
} from "@/lib/auth/admin";
import {
  getOverview,
  getAnalytics,
  listUsers,
  listTickets,
  listFeatureRequests,
  listAnnouncements,
  getSettings,
  getContentStats,
} from "@/lib/db/queries/admin";

async function logAdmin(
  adminId: string,
  action: string,
  target?: string,
  details?: unknown,
) {
  await db.insert(adminLogs).values({
    adminId,
    action,
    target: target ?? null,
    details: details ? JSON.stringify(details) : null,
  });
}

/* --------------------------------- Reads ----------------------------------- */

export async function adminOverview() {
  await requireAdmin();
  return getOverview();
}
export async function adminAnalytics() {
  await requireAdmin();
  return getAnalytics();
}
export async function adminUsers(query: string, page: number) {
  await requireAdmin();
  return listUsers(query ?? "", Math.max(0, Math.floor(page || 0)));
}
export async function adminTickets(status?: string) {
  await requireAdmin();
  return listTickets(status);
}
export async function adminFeatureRequests(status?: string, query?: string) {
  await requireAdmin();
  return listFeatureRequests(status, query);
}
export async function adminAnnouncements() {
  await requireAdmin();
  return listAnnouncements();
}
export async function adminSettings() {
  await requireAdmin();
  return getSettings();
}
export async function adminContent() {
  await requireAdmin();
  return getContentStats();
}

/* ------------------------------- Mutations --------------------------------- */

const ticketUpdate = z.object({
  id: z.string().uuid(),
  status: z.enum(TICKET_STATUSES).optional(),
  priority: z.enum(TICKET_PRIORITIES).optional(),
});

export async function adminUpdateTicket(input: z.infer<typeof ticketUpdate>) {
  const session = await requireAdmin();
  const data = ticketUpdate.parse(input);
  await db
    .update(supportTickets)
    .set({
      ...(data.status ? { status: data.status } : {}),
      ...(data.priority ? { priority: data.priority } : {}),
      updatedAt: new Date(),
    })
    .where(eq(supportTickets.id, data.id));
  await logAdmin(session.user.id, "ticket.update", data.id, data);
  return { ok: true as const };
}

export async function adminDeleteTicket(id: string) {
  const session = await requireAdmin();
  const ticketId = z.string().uuid().parse(id);
  await db.delete(supportTickets).where(eq(supportTickets.id, ticketId));
  await logAdmin(session.user.id, "ticket.delete", ticketId);
  return { ok: true as const };
}

const featureUpdate = z.object({
  id: z.string().uuid(),
  status: z.enum(FEATURE_REQUEST_STATUSES).optional(),
  internalNotes: z.string().max(5000).optional(),
});

export async function adminUpdateFeatureRequest(
  input: z.infer<typeof featureUpdate>,
) {
  const session = await requireAdmin();
  const data = featureUpdate.parse(input);
  await db
    .update(featureRequests)
    .set({
      ...(data.status ? { status: data.status } : {}),
      ...(data.internalNotes !== undefined
        ? { internalNotes: data.internalNotes }
        : {}),
      updatedAt: new Date(),
    })
    .where(eq(featureRequests.id, data.id));
  await logAdmin(session.user.id, "feature_request.update", data.id, data);
  return { ok: true as const };
}

const announcementCreate = z.object({
  title: z.string().trim().min(2).max(160),
  description: z.string().trim().min(2).max(5000),
  type: z.enum(ANNOUNCEMENT_TYPES),
  published: z.boolean(),
});

export async function adminCreateAnnouncement(
  input: z.infer<typeof announcementCreate>,
) {
  const session = await requireAdmin();
  const data = announcementCreate.parse(input);
  const [row] = await db
    .insert(announcements)
    .values(data)
    .returning({ id: announcements.id });
  await logAdmin(session.user.id, "announcement.create", row.id, {
    title: data.title,
    published: data.published,
  });
  return { ok: true as const, id: row.id };
}

const announcementUpdate = z.object({
  id: z.string().uuid(),
  title: z.string().trim().min(2).max(160).optional(),
  description: z.string().trim().min(2).max(5000).optional(),
  type: z.enum(ANNOUNCEMENT_TYPES).optional(),
  published: z.boolean().optional(),
});

export async function adminUpdateAnnouncement(
  input: z.infer<typeof announcementUpdate>,
) {
  const session = await requireAdmin();
  const { id, ...rest } = announcementUpdate.parse(input);
  await db
    .update(announcements)
    .set({ ...rest, updatedAt: new Date() })
    .where(eq(announcements.id, id));
  await logAdmin(session.user.id, "announcement.update", id, rest);
  return { ok: true as const };
}

export async function adminDeleteAnnouncement(id: string) {
  const session = await requireAdmin();
  const annId = z.string().uuid().parse(id);
  await db.delete(announcements).where(eq(announcements.id, annId));
  await logAdmin(session.user.id, "announcement.delete", annId);
  return { ok: true as const };
}

const settingsUpdate = z.object({
  maintenanceMode: z.boolean(),
  registrationsEnabled: z.boolean(),
  defaultDailyGoal: z.coerce.number().int().min(1).max(100),
  currentVersion: z.string().trim().min(1).max(40),
});

export async function adminUpdateSettings(
  input: z.infer<typeof settingsUpdate>,
) {
  const session = await requireAdmin();
  const data = settingsUpdate.parse(input);
  await db
    .insert(siteSettings)
    .values({ id: "global", ...data })
    .onConflictDoUpdate({
      target: siteSettings.id,
      set: { ...data, updatedAt: new Date() },
    });
  await logAdmin(session.user.id, "settings.update", "global", data);
  return { ok: true as const };
}

/* --------------------------------- Unlock ---------------------------------- */

/** Second-factor password unlock. Requires an allowlisted admin session. */
export async function adminUnlock(password: string) {
  const session = await getAdminSession();
  if (!session) throw new Error("forbidden");
  const ok = await unlockWithPassword(String(password ?? ""));
  return { ok };
}

/* ---------------------------- Onboarding backfill --------------------------- */

import { users as usersTable } from "@/lib/db/schema";
import { runOnboarding } from "@/lib/notifications/service";

/**
 * One-time backfill: run the onboarding sequence for every existing user who
 * has never received it. Each step inside runOnboarding is independently
 * idempotent (guarded by welcome_status), so this is safe to run more than
 * once and only ever sends missing pieces.
 */
export async function adminBackfillOnboarding() {
  const session = await requireAdmin();
  const rows = await db.select({ id: usersTable.id }).from(usersTable);

  let processed = 0;
  for (const row of rows) {
    await runOnboarding(row.id);
    processed++;
  }

  await logAdmin(session.user.id, "onboarding.backfill", undefined, { processed });
  return { ok: true as const, processed };
}

/* ------------------------------ Communications ------------------------------ */

import {
  inboxTemplates,
  adminMessages,
  NOTIFICATION_PRIORITIES,
  DELIVERY_TYPES,
} from "@/lib/db/schema";
import {
  listInboxTemplates,
  listEmailTemplates,
  searchRecipients,
  getAllUserIds,
  ensureWelcomeTemplate,
} from "@/lib/db/queries/comms-admin";
import { listMailLogs, listInboxDeliveries } from "@/lib/db/queries/notifications";
import { sendInbox, sendWelcomeEmail } from "@/lib/notifications/service";

export async function adminListInboxTemplates() {
  await requireAdmin();
  return listInboxTemplates();
}

const inboxTemplateSchema = z.object({
  title: z.string().trim().min(2).max(160),
  body: z.string().trim().min(2).max(5000),
  category: z.string().trim().min(1).max(60).default("general"),
  ctaLabel: z.string().trim().max(60).optional(),
  ctaUrl: z.string().trim().max(400).optional(),
  priority: z.enum(NOTIFICATION_PRIORITIES).default("normal"),
});

export async function adminSaveInboxTemplate(
  input: z.infer<typeof inboxTemplateSchema> & { id?: string },
) {
  const session = await requireAdmin();
  const { id, ...data } = inboxTemplateSchema.extend({ id: z.string().uuid().optional() }).parse(input);

  if (id) {
    await db
      .update(inboxTemplates)
      .set({
        title: data.title,
        body: data.body,
        category: data.category,
        ctaLabel: data.ctaLabel ?? null,
        ctaUrl: data.ctaUrl ?? null,
        priority: data.priority,
      })
      .where(eq(inboxTemplates.id, id));
    await logAdmin(session.user.id, "inbox_template.update", id);
    return { ok: true as const, id };
  }

  const [row] = await db
    .insert(inboxTemplates)
    .values({
      title: data.title,
      body: data.body,
      category: data.category,
      ctaLabel: data.ctaLabel ?? null,
      ctaUrl: data.ctaUrl ?? null,
      priority: data.priority,
    })
    .returning({ id: inboxTemplates.id });
  await logAdmin(session.user.id, "inbox_template.create", row.id);
  return { ok: true as const, id: row.id };
}

export async function adminDuplicateInboxTemplate(id: string) {
  const session = await requireAdmin();
  const templateId = z.string().uuid().parse(id);
  const [row] = await db.select().from(inboxTemplates).where(eq(inboxTemplates.id, templateId)).limit(1);
  if (!row) throw new Error("not_found");
  const [copy] = await db
    .insert(inboxTemplates)
    .values({
      title: `${row.title} (copy)`,
      body: row.body,
      category: row.category,
      ctaLabel: row.ctaLabel,
      ctaUrl: row.ctaUrl,
      priority: row.priority,
    })
    .returning({ id: inboxTemplates.id });
  await logAdmin(session.user.id, "inbox_template.duplicate", copy.id, { from: templateId });
  return { ok: true as const, id: copy.id };
}

export async function adminDeleteInboxTemplate(id: string) {
  const session = await requireAdmin();
  const templateId = z.string().uuid().parse(id);
  await db.delete(inboxTemplates).where(eq(inboxTemplates.id, templateId));
  await logAdmin(session.user.id, "inbox_template.delete", templateId);
  return { ok: true as const };
}

export async function adminListEmailTemplates() {
  await requireAdmin();
  await ensureWelcomeTemplate();
  return listEmailTemplates();
}

export async function adminSearchRecipients(query: string) {
  await requireAdmin();
  return searchRecipients(query ?? "");
}

/* -------------------------------- Sending ----------------------------------- */

const RECIPIENT_MODES = ["single", "selected", "all"] as const;

const sendInboxSchema = z.object({
  mode: z.enum(RECIPIENT_MODES),
  userIds: z.array(z.string().uuid()).max(5000).optional(),
  title: z.string().trim().min(2).max(160),
  body: z.string().trim().min(2).max(5000),
  ctaLabel: z.string().trim().max(60).optional(),
  ctaUrl: z.string().trim().max(400).optional(),
  priority: z.enum(NOTIFICATION_PRIORITIES).default("normal"),
});

async function resolveRecipients(
  mode: (typeof RECIPIENT_MODES)[number],
  userIds?: string[],
): Promise<string[]> {
  if (mode === "all") return getAllUserIds();
  const ids = (userIds ?? []).filter(Boolean);
  return [...new Set(ids)];
}

export async function adminSendInboxMessage(input: z.infer<typeof sendInboxSchema>) {
  const session = await requireAdmin();
  const data = sendInboxSchema.parse(input);
  const recipients = await resolveRecipients(data.mode, data.userIds);
  if (recipients.length === 0) throw new Error("no_recipients");

  const result = await sendInbox({
    userIds: recipients,
    type: "admin",
    priority: data.priority,
    title: data.title,
    body: data.body,
    actionLabel: data.ctaLabel,
    actionUrl: data.ctaUrl,
  });

  await logAdmin(session.user.id, "inbox.send", undefined, {
    mode: data.mode,
    count: result.count,
    title: data.title,
  });
  return { ok: true as const, count: result.count };
}

const sendEmailSchema = z.object({
  mode: z.enum(RECIPIENT_MODES),
  userIds: z.array(z.string().uuid()).max(5000).optional(),
});

/** Send the welcome email template to the chosen recipients (mock until Resend is configured). */
export async function adminSendEmail(input: z.infer<typeof sendEmailSchema>) {
  const session = await requireAdmin();
  const data = sendEmailSchema.parse(input);
  const recipients = await resolveRecipients(data.mode, data.userIds);
  if (recipients.length === 0) throw new Error("no_recipients");

  let sent = 0;
  for (const userId of recipients) {
    await sendWelcomeEmail(userId);
    sent++;
  }

  await logAdmin(session.user.id, "email.send", undefined, { mode: data.mode, count: sent });
  return { ok: true as const, count: sent };
}

/* -------------------------------- Broadcast ---------------------------------- */

const broadcastSchema = z.object({
  title: z.string().trim().min(2).max(160),
  body: z.string().trim().min(2).max(5000),
  deliveryType: z.enum(DELIVERY_TYPES),
  published: z.boolean(),
});

export async function adminCreateBroadcast(input: z.infer<typeof broadcastSchema>) {
  const session = await requireAdmin();
  const data = broadcastSchema.parse(input);

  const [row] = await db
    .insert(adminMessages)
    .values({ ...data, createdBy: session.user.id })
    .returning({ id: adminMessages.id });

  if (data.published) {
    if (data.deliveryType === "inbox" || data.deliveryType === "both") {
      const ids = await getAllUserIds();
      await sendInbox({
        userIds: ids,
        type: "announcement",
        priority: "normal",
        title: data.title,
        body: data.body,
      });
    }
    // Email delivery for broadcasts stays disabled until Resend is configured;
    // the mock provider already reports "disabled" per-recipient via mail_logs
    // if this is later wired to iterate recipients.
  }

  await logAdmin(session.user.id, "broadcast.create", row.id, {
    deliveryType: data.deliveryType,
    published: data.published,
  });
  return { ok: true as const, id: row.id };
}

export async function adminMailLogs(page: number) {
  await requireAdmin();
  return listMailLogs(Math.max(0, Math.floor(page || 0)));
}

export async function adminInboxDeliveries(page: number) {
  await requireAdmin();
  return listInboxDeliveries(Math.max(0, Math.floor(page || 0)));
}
