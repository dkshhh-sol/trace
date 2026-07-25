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
 * Operations system — support, feature requests, announcements, site settings
 * and admin audit logs. All operational data lives in Neon (never Sanity).
 */

const createdAt = () =>
  timestamp("created_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow();
const updatedAt = () =>
  timestamp("updated_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date());

export const TICKET_CATEGORIES = ["bug", "feature_request", "question"] as const;
export const TICKET_STATUSES = [
  "open",
  "investigating",
  "in_progress",
  "resolved",
  "closed",
] as const;
export const TICKET_PRIORITIES = ["none", "low", "medium", "high", "urgent"] as const;

export const supportTickets = pgTable("support_tickets", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  category: text("category").notNull(), // bug | feature_request | question
  title: text("title").notNull(),
  description: text("description").notNull(),
  stepsToReproduce: text("steps_to_reproduce"),
  screenshot: text("screenshot"), // optional data URL
  // Captured diagnostic context
  browser: text("browser"),
  operatingSystem: text("operating_system"),
  viewport: text("viewport"),
  screenResolution: text("screen_resolution"),
  route: text("route"),
  version: text("version"),
  githubConnected: boolean("github_connected").notNull().default(false),
  currentStreak: integer("current_streak").notNull().default(0),
  problemsSolved: integer("problems_solved").notNull().default(0),
  // Triage
  status: text("status").notNull().default("open"),
  priority: text("priority").notNull().default("none"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const FEATURE_REQUEST_STATUSES = [
  "under_review",
  "planned",
  "in_progress",
  "released",
  "declined",
] as const;

export const featureRequests = pgTable("feature_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  whyUseful: text("why_useful"),
  status: text("status").notNull().default("under_review"),
  votes: integer("votes").notNull().default(0),
  internalNotes: text("internal_notes"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const ANNOUNCEMENT_TYPES = ["information", "maintenance", "update"] as const;

export const announcements = pgTable("announcements", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull().default("information"),
  published: boolean("published").notNull().default(false),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

/** Singleton row (id = 'global') holding platform-wide settings. */
export const siteSettings = pgTable("site_settings", {
  id: text("id").primaryKey().default("global"),
  maintenanceMode: boolean("maintenance_mode").notNull().default(false),
  registrationsEnabled: boolean("registrations_enabled").notNull().default(true),
  defaultDailyGoal: integer("default_daily_goal").notNull().default(2),
  currentVersion: text("current_version").notNull().default("1.0.0"),
  updatedAt: updatedAt(),
});

export const adminLogs = pgTable("admin_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  adminId: uuid("admin_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  action: text("action").notNull(),
  target: text("target"),
  details: text("details"),
  timestamp: createdAt(),
});
