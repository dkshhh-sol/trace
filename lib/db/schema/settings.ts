import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";
import { users } from "./auth";

/**
 * Per-user preferences. Exactly one row per user, created on first sign-in
 * with system defaults (Requirement 4.2).
 */
export const userSettings = pgTable("user_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  theme: text("theme").notNull().default("system"), // system | light | dark
  dailyGoal: integer("daily_goal").notNull().default(2),
  weeklyGoal: integer("weekly_goal").notNull().default(14),
  revisionEnabled: boolean("revision_enabled").notNull().default(true),
  notifications: boolean("notifications").notNull().default(true),
  // Lecture coding-workspace layout, remembered per user (Requirement 2).
  // Editor width as a percentage of the split; whether it is open by default.
  lectureSplitPct: integer("lecture_split_pct").notNull().default(50),
  lectureEditorOpen: boolean("lecture_editor_open").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});
