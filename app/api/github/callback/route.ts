import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { exchangeCode, safeReturnTo } from "@/lib/github/oauth";
import { fetchGitHubUser } from "@/lib/github/api";
import { upsertConnection } from "@/lib/github/connection";

export const runtime = "nodejs";

function back(origin: string, returnTo: string, status: string): NextResponse {
  const url = new URL(returnTo, origin);
  url.searchParams.set("github", status);
  return NextResponse.redirect(url);
}

/** GitHub OAuth callback: verify state, exchange code, store encrypted token. */
export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const store = await cookies();
  const raw = store.get("gh_oauth")?.value;
  store.delete("gh_oauth");

  let returnTo = "/code-files";
  try {
    if (!raw) throw new Error("Missing OAuth state cookie");
    const parsed = JSON.parse(raw) as { state: string; returnTo: string };
    returnTo = safeReturnTo(parsed.returnTo);

    const code = req.nextUrl.searchParams.get("code");
    const state = req.nextUrl.searchParams.get("state");
    if (!code || !state || state !== parsed.state) {
      throw new Error("Invalid OAuth state");
    }

    const { accessToken, scope } = await exchangeCode(code, origin);
    const ghUser = await fetchGitHubUser(accessToken);
    await upsertConnection({
      userId: session.user.id,
      githubUserId: String(ghUser.id),
      username: ghUser.login,
      avatarUrl: ghUser.avatarUrl,
      accessToken,
      scope,
    });

    return back(origin, returnTo, "connected");
  } catch {
    return back(origin, returnTo, "error");
  }
}
