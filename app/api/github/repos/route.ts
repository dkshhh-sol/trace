import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAccessToken } from "@/lib/github/connection";
import { listRepos } from "@/lib/github/api";

export const runtime = "nodejs";

/** List the connected user's repositories for the commit modal dropdown. */
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const token = await getAccessToken(session.user.id);
  if (!token) {
    return NextResponse.json({ error: "not_connected" }, { status: 409 });
  }

  try {
    const repos = await listRepos(token);
    return NextResponse.json({ repos });
  } catch {
    return NextResponse.json({ error: "github_error" }, { status: 502 });
  }
}
