import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { disconnectGitHub } from "@/lib/github/connection";

export const runtime = "nodejs";

/** Remove the current user's GitHub connection (deletes the stored token). */
export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  await disconnectGitHub(session.user.id);
  return NextResponse.json({ ok: true });
}
