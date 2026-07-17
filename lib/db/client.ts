import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { env } from "@/lib/env";
import * as schema from "./schema";

/**
 * The single Drizzle database instance for the app runtime.
 *
 * Uses the Neon serverless HTTP driver over the POOLED connection string
 * (Requirement 5.3), which suits Vercel's serverless model. All queries go
 * through Drizzle and are parameterized by construction (Requirements 5.1–5.2).
 */
const sql = neon(env.DATABASE_URL);

export const db = drizzle(sql, { schema });

export type DB = typeof db;
