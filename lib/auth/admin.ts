import "server-only";

import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";
import type { Session } from "next-auth";
import { auth } from "./index";
import { env } from "@/lib/env";

/**
 * Trace Console access control. Two layers:
 *  1. The signed-in Google account's email must be in ADMIN_EMAILS.
 *  2. If ADMIN_PANEL_PASSWORD is set, a valid unlock cookie must be present
 *     (obtained by entering the password at the console gate).
 * Never trust client-side role checks — every admin action re-verifies here.
 */

const UNLOCK_COOKIE = "trace_admin_unlock";

export function adminEmails(): string[] {
  return (env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return adminEmails().includes(email.toLowerCase());
}

export function passwordRequired(): boolean {
  return Boolean(env.ADMIN_PANEL_PASSWORD);
}

function unlockToken(): string {
  return createHmac("sha256", env.AUTH_SECRET)
    .update(`admin-unlock:${env.ADMIN_PANEL_PASSWORD ?? ""}`)
    .digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export async function isUnlocked(): Promise<boolean> {
  if (!passwordRequired()) return true;
  const store = await cookies();
  const val = store.get(UNLOCK_COOKIE)?.value;
  return Boolean(val && safeEqual(val, unlockToken()));
}

/** Verify the entered password and, if correct, set the unlock cookie. */
export async function unlockWithPassword(password: string): Promise<boolean> {
  if (!passwordRequired()) return true;
  if (!safeEqual(password, env.ADMIN_PANEL_PASSWORD ?? "")) return false;
  const store = await cookies();
  store.set(UNLOCK_COOKIE, unlockToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  return true;
}

export type AdminSession = Session & { user: NonNullable<Session["user"]> };

/** Session for an allowlisted admin, or null. Does not check the password gate. */
export async function getAdminSession(): Promise<AdminSession | null> {
  const session = await auth();
  if (!session?.user || !isAdminEmail(session.user.email)) return null;
  return session as AdminSession;
}

/**
 * Full gate for server actions/APIs: throws unless the caller is an allowlisted
 * admin AND (if configured) has passed the password gate.
 */
export async function requireAdmin(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) throw new Error("forbidden");
  if (!(await isUnlocked())) throw new Error("locked");
  return session;
}
