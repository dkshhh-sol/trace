import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";
import { auth } from "@/lib/auth";
import { isGitHubConfigured } from "@/lib/github/connection";
import { authorizeUrl, safeReturnTo } from "@/lib/github/oauth";

export const runtime = "nodejs";

/** Start the GitHub OAuth flow. Requires an authenticated Trace session. */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const returnTo = safeReturnTo(req.nextUrl.searchParams.get("returnTo"));

  if (!isGitHubConfigured()) {
    const url = new URL(returnTo, req.nextUrl.origin);
    url.searchParams.set("github", "unconfigured");
    return NextResponse.redirect(url);
  }

  const state = randomBytes(16).toString("hex");
  const store = await cookies();
  store.set("gh_oauth", JSON.stringify({ state, returnTo }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });

  return NextResponse.redirect(authorizeUrl(req.nextUrl.origin, state));
}
