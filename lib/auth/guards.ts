import "server-only";

import { redirect } from "next/navigation";
import { auth } from "./index";

/**
 * Authoritative, server-side session helpers.
 *
 * `requireSession()` is the real authorization gate for protected routes and
 * server functions (Requirements 2.3–2.5). The optimistic cookie check in
 * `proxy.ts` is only a fast UX redirect and is never the security boundary.
 */

/** Returns the current session, or null if unauthenticated. */
export async function getSession() {
  return auth();
}

/**
 * Requires an authenticated session. Redirects to /login when absent, so
 * protected content never renders for unauthenticated visitors (Requirement 2.1).
 */
export async function requireSession() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  return session;
}
