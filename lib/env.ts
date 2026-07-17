import { z } from "zod";

/**
 * Centralized, validated environment configuration.
 *
 * This is the ONLY module that reads `process.env`. It validates at import time
 * so a missing or malformed variable fails fast with a named error, before any
 * request is served (Requirements 11.5, 14.3–14.5).
 *
 * Server secrets are validated only on the server. Public (`NEXT_PUBLIC_*`)
 * values are non-secret and safe to reference on the client.
 */

const serverSchema = z.object({
  AUTH_SECRET: z.string().min(1),
  AUTH_GOOGLE_ID: z.string().min(1),
  AUTH_GOOGLE_SECRET: z.string().min(1),
  // Optional: with `trustHost: true`, Auth.js derives the URL from the request
  // (correct on Vercel + preview deploys). Set it only to override.
  AUTH_URL: z
    .string()
    .refine((v) => !v || /^https?:\/\//.test(v), {
      message: "must be an http(s) URL",
    })
    .optional(),
  DATABASE_URL: z.string().min(1).refine((v) => v.startsWith("postgres"), {
    message: "must be a postgres connection string",
  }),
  DATABASE_URL_UNPOOLED: z.string().min(1).refine((v) => v.startsWith("postgres"), {
    message: "must be a postgres connection string",
  }),
  SANITY_API_TOKEN: z.string().min(1),
});

const publicSchema = z.object({
  NEXT_PUBLIC_SANITY_PROJECT_ID: z.string().min(1),
  NEXT_PUBLIC_SANITY_DATASET: z.string().min(1),
  NEXT_PUBLIC_SANITY_API_VERSION: z.string().min(1),
});

type ServerEnv = z.infer<typeof serverSchema>;
type PublicEnv = z.infer<typeof publicSchema>;

const problems: string[] = [];

function collect(error: z.ZodError) {
  for (const issue of error.issues) {
    problems.push(`  - ${issue.path.join(".")}: ${issue.message}`);
  }
}

// NEXT_PUBLIC_* must be referenced explicitly so Next.js can inline them.
const publicResult = publicSchema.safeParse({
  NEXT_PUBLIC_SANITY_PROJECT_ID: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  NEXT_PUBLIC_SANITY_DATASET: process.env.NEXT_PUBLIC_SANITY_DATASET,
  NEXT_PUBLIC_SANITY_API_VERSION: process.env.NEXT_PUBLIC_SANITY_API_VERSION,
});
if (!publicResult.success) collect(publicResult.error);

const isServer = typeof window === "undefined";
let serverData = {} as ServerEnv;
if (isServer) {
  const serverResult = serverSchema.safeParse(process.env);
  if (!serverResult.success) collect(serverResult.error);
  else serverData = serverResult.data;
}

if (problems.length > 0) {
  throw new Error(
    `Invalid environment configuration:\n${problems.join("\n")}\n` +
      `Set these variables in .env.local (local) and in the Vercel dashboard (deployed).`,
  );
}

export const env: ServerEnv & PublicEnv = {
  ...serverData,
  ...(publicResult.success ? publicResult.data : ({} as PublicEnv)),
};
