import "server-only";

import { sanityClient } from "./client";
import type { Announcement } from "./types";

/** Single typed entry point for content queries (Requirement 7.2). */
export async function sanityFetch<T>(
  query: string,
  params: Record<string, unknown> = {},
): Promise<T> {
  return sanityClient.fetch<T>(query, params);
}

export type HealthResult = { ok: true } | { ok: false; error: string };

/**
 * Verifies connectivity to Sanity within a 5-second bound (Requirement 7.3–7.6).
 */
export async function healthCheck(): Promise<HealthResult> {
  try {
    await Promise.race([
      sanityClient.fetch(`*[_type == "sanity.imageAsset"][0]._id`),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), 5000),
      ),
    ]);
    return { ok: true };
  } catch {
    return { ok: false, error: "Sanity is not reachable" };
  }
}

const ANNOUNCEMENTS_QUERY = `*[_type == "announcement"] | order(publishedAt desc)[0...5]{ _id, title, publishedAt }`;

/** Latest product announcements (empty until content is authored in Sanity). */
export async function getAnnouncements(): Promise<Announcement[]> {
  return sanityFetch<Announcement[]>(ANNOUNCEMENTS_QUERY);
}
