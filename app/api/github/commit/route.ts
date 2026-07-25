import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { getAccessToken, setCommitDefaults } from "@/lib/github/connection";
import { commitFile } from "@/lib/github/api";

export const runtime = "nodejs";

const schema = z.object({
  repoFullName: z.string().min(1).max(200),
  branch: z.string().min(1).max(200),
  path: z.string().min(1).max(400),
  message: z.string().min(1).max(1000),
  content: z.string().max(1_000_000),
});

/** Commit a file to GitHub via the Contents API and remember the target. */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const token = await getAccessToken(session.user.id);
  if (!token) {
    return NextResponse.json({ error: "not_connected" }, { status: 409 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  try {
    const result = await commitFile(token, parsed.data);
    await setCommitDefaults(
      session.user.id,
      parsed.data.repoFullName,
      parsed.data.branch,
    );
    return NextResponse.json({
      ok: true,
      url: result.url,
      updated: result.updated,
    });
  } catch (e) {
    return NextResponse.json(
      { error: "commit_failed", message: (e as Error).message },
      { status: 502 },
    );
  }
}
