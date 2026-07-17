import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Load local env for the drizzle-kit CLI (runs outside the Next.js runtime).
config({ path: ".env.local" });

const url = process.env.DATABASE_URL_UNPOOLED;
if (!url) {
  throw new Error(
    "DATABASE_URL_UNPOOLED is not set. Add it to .env.local before running migrations.",
  );
}

export default defineConfig({
  schema: "./lib/db/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url },
  strict: true,
  verbose: true,
});
