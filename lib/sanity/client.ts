import { createClient } from "@sanity/client";
import { env } from "@/lib/env";

/**
 * The Sanity content client (server-side use).
 *
 * projectId/dataset/apiVersion come from public env; the token is server-only
 * (Requirement 11.3). A token is supplied so reads work whether the dataset is
 * public or private, so `useCdn` is disabled (the CDN bypasses auth).
 */
export const sanityClient = createClient({
  projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: env.NEXT_PUBLIC_SANITY_API_VERSION,
  token: env.SANITY_API_TOKEN,
  useCdn: false,
});
