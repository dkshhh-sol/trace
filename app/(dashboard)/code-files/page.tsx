import type { Metadata } from "next";
import { requireSession } from "@/lib/auth/guards";
import { getCodeTree } from "@/lib/db/queries/code";
import { CodeFilesExplorer } from "@/components/workspace/code-files-explorer";

export const metadata: Metadata = {
  title: "Code Files",
};

export default async function CodeFilesPage({
  searchParams,
}: {
  searchParams: Promise<{ open?: string }>;
}) {
  const session = await requireSession();
  const { open } = await searchParams;
  const { folders, files } = await getCodeTree(session.user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl tracking-tight">
          Code <span className="font-serif italic text-gradient">Files</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your personal code library. Edit with full highlighting, organize in
          folders, download, or commit straight to GitHub.
        </p>
      </div>

      <CodeFilesExplorer
        initialFolders={folders}
        initialFiles={files.map((f) => ({
          id: f.id,
          name: f.name,
          language: f.language,
          folderId: f.folderId,
          updatedAt: f.updatedAt.getTime(),
        }))}
        initialOpenId={open ?? null}
      />
    </div>
  );
}
