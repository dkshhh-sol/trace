"use client";

import { useCallback, useEffect, useState } from "react";
import { X, Loader2, ExternalLink } from "lucide-react";
import { GitHubMark } from "@/components/ui/github-mark";
import { toast } from "@/components/ui/toast";

/**
 * "Commit to GitHub" dialog. Handles both states (Requirement 8):
 *  - connected → repository / branch / path / message form, commits via the
 *    Contents API through our server route.
 *  - not connected → a prompt to connect that starts OAuth, returning to the
 *    same page so the user can retry immediately.
 */

type Status = {
  configured: boolean;
  connected: boolean;
  username: string | null;
  defaultRepo: string | null;
  defaultBranch: string | null;
};

type Repo = {
  fullName: string;
  name: string;
  defaultBranch: string;
  private: boolean;
};

export function CommitDialog({
  fileName,
  content,
  onClose,
}: {
  fileName: string;
  content: string;
  onClose: () => void;
}) {
  const [status, setStatus] = useState<Status | null>(null);
  const [repos, setRepos] = useState<Repo[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [committing, setCommitting] = useState(false);

  const [repo, setRepo] = useState("");
  const [branch, setBranch] = useState("");
  const [path, setPath] = useState(fileName);
  const [message, setMessage] = useState(`Add ${fileName} via Trace`);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const s: Status = await fetch("/api/github/status").then((r) => r.json());
        if (!active) return;
        setStatus(s);
        if (s.connected) {
          const data = await fetch("/api/github/repos").then((r) => r.json());
          if (!active) return;
          const list: Repo[] = data.repos ?? [];
          setRepos(list);
          const initialRepo =
            s.defaultRepo && list.some((r) => r.fullName === s.defaultRepo)
              ? s.defaultRepo
              : (list[0]?.fullName ?? "");
          setRepo(initialRepo);
          const repoObj = list.find((r) => r.fullName === initialRepo);
          setBranch(s.defaultBranch || repoObj?.defaultBranch || "main");
        }
      } catch {
        if (active) toast("Couldn't reach GitHub. Try again.", "error");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const onRepoChange = useCallback(
    (fullName: string) => {
      setRepo(fullName);
      const repoObj = repos?.find((r) => r.fullName === fullName);
      setBranch((prev) => prev || repoObj?.defaultBranch || "main");
    },
    [repos],
  );

  function connect() {
    const returnTo = window.location.pathname + window.location.search;
    window.location.href = `/api/github/connect?returnTo=${encodeURIComponent(returnTo)}`;
  }

  async function commit() {
    if (!repo || !branch.trim() || !path.trim() || !message.trim()) {
      toast("Fill in repository, branch, path and message.", "error");
      return;
    }
    setCommitting(true);
    try {
      const res = await fetch("/api/github/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repoFullName: repo,
          branch: branch.trim(),
          path: path.trim(),
          message: message.trim(),
          content,
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        toast("Committed to GitHub", "success");
        onClose();
      } else if (res.status === 409) {
        toast("GitHub disconnected. Reconnect and retry.", "error");
        setStatus((s) => (s ? { ...s, connected: false } : s));
      } else {
        toast(data.message ? `Commit failed: ${data.message}` : "Commit failed.", "error");
      }
    } catch {
      toast("Commit failed. Try again.", "error");
    } finally {
      setCommitting(false);
    }
  }

  const connected = status?.connected ?? false;

  return (
    <div className="fixed inset-0 z-[95] grid place-items-center p-4">
      <div
        aria-hidden="true"
        onClick={onClose}
        className="animate-in fade-in-0 absolute inset-0 bg-black/50 backdrop-blur-sm duration-200"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Commit to GitHub"
        className="animate-in fade-in-0 zoom-in-95 surface relative flex w-full max-w-md flex-col rounded-2xl duration-150"
      >
        <header className="flex shrink-0 items-center justify-between border-b border-border px-5 py-4">
          <h3 className="flex items-center gap-2 text-base font-medium text-foreground">
            <GitHubMark className="size-4" />
            Commit to GitHub
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid size-8 place-items-center rounded-lg text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="size-4" />
          </button>
        </header>

        <div className="space-y-4 px-5 py-4">
          {loading ? (
            <div className="grid place-items-center py-8 text-muted-foreground">
              <Loader2 className="size-5 animate-spin" />
            </div>
          ) : !connected ? (
            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">
                GitHub not connected
              </p>
              <p className="text-sm text-muted-foreground">
                {status?.configured === false
                  ? "GitHub integration isn't configured on this deployment yet."
                  : "Connect your GitHub account to push code directly from Trace."}
              </p>
            </div>
          ) : (
            <>
              <label className="block">
                <span className="text-xs text-muted-foreground">Repository</span>
                <select
                  value={repo}
                  onChange={(e) => onRepoChange(e.target.value)}
                  className="mt-1.5 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {repos?.length === 0 && <option value="">No repositories</option>}
                  {repos?.map((r) => (
                    <option key={r.fullName} value={r.fullName}>
                      {r.fullName}
                      {r.private ? " (private)" : ""}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-xs text-muted-foreground">Branch</span>
                <input
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  placeholder="main"
                  className="mt-1.5 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </label>

              <label className="block">
                <span className="text-xs text-muted-foreground">File path</span>
                <input
                  value={path}
                  onChange={(e) => setPath(e.target.value)}
                  placeholder="solution.cpp"
                  className="mt-1.5 h-10 w-full rounded-lg border border-border bg-background px-3 font-mono text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </label>

              <label className="block">
                <span className="text-xs text-muted-foreground">Commit message</span>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  className="mt-1.5 w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </label>
            </>
          )}
        </div>

        <footer className="flex shrink-0 items-center justify-end gap-2 border-t border-border px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={committing}
            className="inline-flex h-9 items-center rounded-lg px-3 text-sm text-muted-foreground transition-colors hover:text-foreground disabled:opacity-60"
          >
            Cancel
          </button>
          {!loading && !connected ? (
            <button
              type="button"
              onClick={connect}
              disabled={status?.configured === false}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-foreground px-4 text-sm font-medium text-background transition-transform hover:scale-[1.02] active:scale-[0.99] disabled:opacity-50"
            >
              <GitHubMark className="size-4" />
              Connect GitHub
            </button>
          ) : (
            <button
              type="button"
              onClick={commit}
              disabled={loading || committing || !repo}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-foreground px-4 text-sm font-medium text-background transition-transform hover:scale-[1.02] active:scale-[0.99] disabled:opacity-60"
            >
              {committing ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ExternalLink className="size-4" />
              )}
              {committing ? "Committing…" : "Commit"}
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}
