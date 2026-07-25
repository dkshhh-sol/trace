import "server-only";

import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { githubConnections } from "@/lib/db/schema";
import { encryptSecret, decryptSecret } from "@/lib/crypto";
import { env } from "@/lib/env";

/** Whether GitHub integration is configured on this deployment. */
export function isGitHubConfigured(): boolean {
  return Boolean(
    env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET && env.ENCRYPTION_KEY,
  );
}

/** Public connection status — never includes the token (Requirement 7). */
export type GitHubStatus = {
  configured: boolean;
  connected: boolean;
  username: string | null;
  avatarUrl: string | null;
  defaultRepo: string | null;
  defaultBranch: string | null;
};

export async function getGitHubStatus(userId: string): Promise<GitHubStatus> {
  const configured = isGitHubConfigured();
  const [row] = await db
    .select({
      username: githubConnections.username,
      avatarUrl: githubConnections.avatarUrl,
      defaultRepo: githubConnections.defaultRepo,
      defaultBranch: githubConnections.defaultBranch,
    })
    .from(githubConnections)
    .where(eq(githubConnections.userId, userId))
    .limit(1);

  return {
    configured,
    connected: Boolean(row),
    username: row?.username ?? null,
    avatarUrl: row?.avatarUrl ?? null,
    defaultRepo: row?.defaultRepo ?? null,
    defaultBranch: row?.defaultBranch ?? null,
  };
}

/** Decrypted access token for server-side GitHub calls, or null if unconnected. */
export async function getAccessToken(userId: string): Promise<string | null> {
  const [row] = await db
    .select({ enc: githubConnections.accessTokenEnc })
    .from(githubConnections)
    .where(eq(githubConnections.userId, userId))
    .limit(1);
  if (!row) return null;
  return decryptSecret(row.enc);
}

export async function upsertConnection(input: {
  userId: string;
  githubUserId: string;
  username: string;
  avatarUrl: string | null;
  accessToken: string;
  scope: string | null;
}) {
  const enc = encryptSecret(input.accessToken);
  await db
    .insert(githubConnections)
    .values({
      userId: input.userId,
      githubUserId: input.githubUserId,
      username: input.username,
      avatarUrl: input.avatarUrl,
      accessTokenEnc: enc,
      scope: input.scope,
    })
    .onConflictDoUpdate({
      target: githubConnections.userId,
      set: {
        githubUserId: input.githubUserId,
        username: input.username,
        avatarUrl: input.avatarUrl,
        accessTokenEnc: enc,
        scope: input.scope,
        updatedAt: new Date(),
      },
    });
}

/** Remember the last commit target per user (Requirement 9). */
export async function setCommitDefaults(
  userId: string,
  defaultRepo: string,
  defaultBranch: string,
) {
  await db
    .update(githubConnections)
    .set({ defaultRepo, defaultBranch, updatedAt: new Date() })
    .where(eq(githubConnections.userId, userId));
}

export async function disconnectGitHub(userId: string) {
  await db
    .delete(githubConnections)
    .where(eq(githubConnections.userId, userId));
}
