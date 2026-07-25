import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getGitHubStatus } from "@/lib/github/connection";

export const runtime = "nodejs";

/** Current user's GitHub connection status (never includes the token). */
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const status = await getGitHubStatus(session.user.id);
  return NextResponse.json(status);
}
