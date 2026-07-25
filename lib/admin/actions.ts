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
