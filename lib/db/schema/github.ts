import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { users } from "./auth";

/**
 * GitHub connection for pushing code from Trace (Requirement 7).
 *
 * Exactly one connection per user. The OAuth access token is stored ENCRYPTED
 * at rest (AES-256-GCM via `lib/crypto`) and is only ever read server-side —
 * it is never sent to the client. `defaultRepo`/`defaultBranch` remember the
 * user's last commit target (Requirement 9).
 */
export const githubConnections = pgTable("github_connections", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  githubUserId: text("github_user_id").notNull(),
  username: text("username").notNull(),
  avatarUrl: text("avatar_url"),
  // Encrypted OAuth access token — never exposed to the frontend.
  accessTokenEnc: text("access_token_enc").notNull(),
  scope: text("scope"),
  defaultRepo: text("default_repo"),
  defaultBranch: text("default_branch"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});
