import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { syncAchievements } from "@/lib/db/queries/achievements";

export const runtime = "nodejs";

/**
 * Compute + persist the current user's achievements and return the full view
 * (unlocked state, progress, recently unlocked, and anything newly unlocked in
 * this pass, for toast notifications). Consumed by the profile and the
 * dashboard achievement watcher.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const result = await syncAchievements(session.user.id);
  return NextResponse.json(result);
}
