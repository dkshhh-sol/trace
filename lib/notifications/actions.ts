"use server";

import { z } from "zod";
import { requireSession } from "@/lib/auth/guards";
import {
  listNotifications,
  getUnreadCount,
  markRead,
  markAllRead,
  deleteNotification,
  deleteReadNotifications,
} from "@/lib/db/queries/notifications";

/** The current user's unread count. Lightweight — no notification bodies. */
export async function getMyUnreadCount() {
  const session = await requireSession();
  return getUnreadCount(session.user.id);
}

/** Page of the current user's inbox, newest first. Loaded only when opened. */
export async function getMyNotifications(page: number) {
  const session = await requireSession();
  const safePage = Math.max(0, Math.floor(page || 0));
  return listNotifications(session.user.id, safePage);
}

export async function markNotificationRead(id: string) {
  const session = await requireSession();
  await markRead(session.user.id, z.string().uuid().parse(id));
  return { ok: true as const };
}

export async function markAllNotificationsRead() {
  const session = await requireSession();
  await markAllRead(session.user.id);
  return { ok: true as const };
}

export async function deleteMyNotification(id: string) {
  const session = await requireSession();
  await deleteNotification(session.user.id, z.string().uuid().parse(id));
  return { ok: true as const };
}

export async function deleteMyReadNotifications() {
  const session = await requireSession();
  await deleteReadNotifications(session.user.id);
  return { ok: true as const };
}
