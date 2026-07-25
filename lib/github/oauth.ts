import "server-only";

import { env } from "@/lib/env";

/**
 * GitHub OAuth (Authorization Code) helpers for the "Connect GitHub" flow.
 * Independent of Auth.js identity — GitHub is a *connected account* for pushing
 * code, not a login method.
 */

const AUTHORIZE = "https://github.com/login/oauth/authorize";
const TOKEN = "https://github.com/login/oauth/access_token";

// `repo` is required to create/update files in private repositories via the
// Contents API; public-only would be `public_repo`.
export const GITHUB_SCOPE = "repo";

export function callbackUrl(origin: string): string {
  const base = env.AUTH_URL?.replace(/\/$/, "") || origin;
  return `${base}/api/github/callback`;
}

export function authorizeUrl(origin: string, state: string): string {
  const params = new URLSearchParams({
    client_id: env.GITHUB_CLIENT_ID ?? "",
    redirect_uri: callbackUrl(origin),
    scope: GITHUB_SCOPE,
    state,
    allow_signup: "true",
  });
  return `${AUTHORIZE}?${params.toString()}`;
}

export async function exchangeCode(
  code: string,
  origin: string,
): Promise<{ accessToken: string; scope: string | null }> {
  const res = await fetch(TOKEN, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: callbackUrl(origin),
    }),
  });
  if (!res.ok) throw new Error(`Token exchange failed (${res.status})`);
  const j = (await res.json()) as {
    access_token?: string;
    scope?: string;
    error?: string;
  };
  if (!j.access_token) throw new Error(j.error || "No access token returned");
  return { accessToken: j.access_token, scope: j.scope ?? null };
}

/** Only allow same-site relative redirect targets (prevents open redirects). */
export function safeReturnTo(value: string | null | undefined): string {
  if (value && value.startsWith("/") && !value.startsWith("//")) return value;
  return "/code-files";
}
