import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getProfileStats } from "@/lib/db/queries/profile";

/** Returns the current user's learning-journey stats for the profile panel. */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const stats = await getProfileStats(session.user.id);
    return NextResponse.json(stats);
  } catch {
    return NextResponse.json(
      { error: "Failed to load profile" },
      { status: 500 },
    );
  }
}
