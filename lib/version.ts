/**
 * App version metadata. `APP_VERSION` is the human-facing semver; the build
 * number is derived from the deployment's git commit when available (Vercel),
 * falling back to "dev" locally. Client-safe (no secrets).
 */
export const APP_VERSION = "1.0.0";

export const BUILD_NUMBER =
  process.env.NEXT_PUBLIC_BUILD_ID ||
  process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ||
  "dev";

export const BUILT_BY = "Daksh Mehta";
