import "server-only";

/**
 * Thin GitHub REST client. Decoupled from persistence and the editor
 * (Requirement 11): callers pass a token and plain arguments.
 */

const API = "https://api.github.com";

function headers(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "Trace",
  };
}

export type GitHubUser = {
  id: number;
  login: string;
  avatarUrl: string | null;
};

export async function fetchGitHubUser(token: string): Promise<GitHubUser> {
  const res = await fetch(`${API}/user`, { headers: headers(token) });
  if (!res.ok) throw new Error(`GitHub user fetch failed (${res.status})`);
  const j = (await res.json()) as {
    id: number;
    login: string;
    avatar_url: string | null;
  };
  return { id: j.id, login: j.login, avatarUrl: j.avatar_url };
}

export type GitHubRepo = {
  fullName: string;
  name: string;
  defaultBranch: string;
  private: boolean;
};

export async function listRepos(token: string): Promise<GitHubRepo[]> {
  const res = await fetch(
    `${API}/user/repos?per_page=100&sort=updated&affiliation=owner,collaborator,organization_member`,
    { headers: headers(token) },
  );
  if (!res.ok) throw new Error(`GitHub repos fetch failed (${res.status})`);
  const rows = (await res.json()) as Array<{
    full_name: string;
    name: string;
    default_branch: string;
    private: boolean;
  }>;
  return rows.map((r) => ({
    fullName: r.full_name,
    name: r.name,
    defaultBranch: r.default_branch,
    private: r.private,
  }));
}

function encodePath(path: string): string {
  return path
    .split("/")
    .filter(Boolean)
    .map((seg) => encodeURIComponent(seg))
    .join("/");
}

export type CommitResult = { url: string | null; updated: boolean };

/**
 * Create or update a file in a repo via the Contents API. If the file exists on
 * the branch it is updated (using its blob sha); otherwise it is created.
 */
export async function commitFile(
  token: string,
  input: {
    repoFullName: string;
    branch: string;
    path: string;
    message: string;
    content: string;
  },
): Promise<CommitResult> {
  const [owner, repo] = input.repoFullName.split("/");
  if (!owner || !repo) throw new Error("Invalid repository");

  const base = `${API}/repos/${owner}/${repo}/contents/${encodePath(input.path)}`;

  // Look up an existing blob sha (required to update, absent to create).
  let sha: string | undefined;
  const getRes = await fetch(`${base}?ref=${encodeURIComponent(input.branch)}`, {
    headers: headers(token),
  });
  if (getRes.ok) {
    const j = (await getRes.json()) as { sha?: string };
    sha = j.sha;
  } else if (getRes.status !== 404) {
    throw new Error(`GitHub read failed (${getRes.status})`);
  }

  const putRes = await fetch(base, {
    method: "PUT",
    headers: headers(token),
    body: JSON.stringify({
      message: input.message,
      content: Buffer.from(input.content, "utf8").toString("base64"),
      branch: input.branch,
      ...(sha ? { sha } : {}),
    }),
  });

  if (!putRes.ok) {
    const detail = await putRes.text().catch(() => "");
    throw new Error(
      `GitHub commit failed (${putRes.status})${detail ? `: ${detail.slice(0, 200)}` : ""}`,
    );
  }

  const j = (await putRes.json()) as {
    content?: { html_url?: string };
    commit?: { html_url?: string };
  };
  return {
    url: j.content?.html_url ?? j.commit?.html_url ?? null,
    updated: Boolean(sha),
  };
}
