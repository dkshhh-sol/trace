import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getCodeFile } from "@/lib/db/queries/code";

export const runtime = "nodejs";

/** Fetch a single Code File (with body) for the current user. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const file = await getCodeFile(session.user.id, id);
  if (!file) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({
    id: file.id,
    name: file.name,
    language: file.language,
    content: file.content,
    linkedProblemId: file.linkedProblemId,
  });
}
