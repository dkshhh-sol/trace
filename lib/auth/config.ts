import "server-only";

import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db/client";
import {
  users,
  accounts,
  sessions,
  verificationTokens,
  userSettings,
} from "@/lib/db/schema";
import { env } from "@/lib/env";

/**
 * Auth.js v5 configuration (server-only).
 *
 * - Google is the sole identity provider (Requirement 1.1), reading its client
 *   credentials from validated env (Requirement 1.8).
 * - Sessions are persisted in Neon via the Drizzle adapter so logout can
 *   invalidate them server-side (Requirement 3).
 * - Session expiry combines a 30-minute rolling inactivity window (`maxAge`)
 *   with a 7-day absolute lifetime cap enforced in the `session` callback
 *   (Requirements 1.4, 3.1).
 *
 * This module must never be imported into a Client Component: it pulls in the
 * DB client and secrets (Requirements 11.3, 11.6).
 */

/** Absolute session lifetime cap: 7 days, independent of activity (R3.1). */
const ABSOLUTE_SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export const authConfig = {
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: [
    Google({
      clientId: env.AUTH_GOOGLE_ID,
      clientSecret: env.AUTH_GOOGLE_SECRET,
    }),
  ],
  // Trust the deployment host (Vercel) and localhost when deriving callback URLs.
  trustHost: true,
  session: {
    strategy: "database",
    // 30-minute inactivity timeout; the adapter refreshes `expires` on access,
    // at most once per `updateAge` window (Requirement 1.4).
    maxAge: 30 * 60,
    updateAge: 5 * 60,
  },
  pages: { signIn: "/login" },
  callbacks: {
    /**
     * Enforce the 7-day absolute session cap. The adapter keeps `expires` as a
     * rolling inactivity window, so we compare against the fixed `createdAt`
     * timestamp on the session row. Once 7 days have elapsed we delete the
     * session and return an already-expired session, forcing re-authentication
     * regardless of recent activity.
     */
    async session({ session, user }) {
      // Expose the user id to the app (used for per-user progress, etc.).
      if (session.user) session.user.id = user.id;

      const [row] = await db
        .select({ createdAt: sessions.createdAt })
        .from(sessions)
        .where(eq(sessions.sessionToken, session.sessionToken))
        .limit(1);

      if (
        row?.createdAt &&
        Date.now() - row.createdAt.getTime() > ABSOLUTE_SESSION_MAX_AGE_MS
      ) {
        await db
          .delete(sessions)
          .where(eq(sessions.sessionToken, session.sessionToken));
        return { ...session, user, expires: new Date(0).toISOString() };
      }

      return session;
    },
  },
  events: {
    /**
     * Initialize exactly one user_settings row with system defaults when a new
     * user is created, before sign-in completes (Requirement 4.2).
     * `onConflictDoNothing` keeps this idempotent if it is ever retried.
     */
    async createUser({ user }) {
      if (!user.id) return;
      await db
        .insert(userSettings)
        .values({ userId: user.id })
        .onConflictDoNothing();
    },
    /**
     * Stamp the last login time on every successful sign-in
     * (Requirements 4.4, 4.6).
     */
    async signIn({ user }) {
      if (!user.id) return;
      await db
        .update(users)
        .set({ lastLogin: new Date() })
        .where(eq(users.id, user.id));
    },
  },
  secret: env.AUTH_SECRET,
} satisfies NextAuthConfig;
