import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Optimistic route protection (Next.js 16 Proxy — formerly Middleware).
 *
 * This is a fast, edge-level UX guard ONLY: it checks for the presence of the
 * Auth.js session cookie on protected paths and redirects to /login when it is
 * absent. It performs no database lookup and is NOT the security boundary — the
 * authoritative check is `requireSession()` in the (dashboard) layout and in
 * every server function (Requirements 2.1, 2.6).
 */
export function proxy(request: NextRequest) {
  const hasSessionCookie =
    request.cookies.has("authjs.session-token") ||
    request.cookies.has("__Secure-authjs.session-token");

  if (!hasSessionCookie) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
