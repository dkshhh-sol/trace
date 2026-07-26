import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import { users } from "./auth";

/**
 * Communication system — two independent channels (in-app Inbox and Email),
 * both routed through a single NotificationService (lib/notifications). Do not
 * insert into these tables directly from feature code; always go through the
 * service so the architecture stays provider-agnostic.
 */

const createdAt = () =>
  timestamp("created_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow();

export const NOTIFICATION_TYPES = [
  "onboarding",
  "reminder",
  "achievement",
  "support",
  "announcement",
  "admin",
] as const;
export const NOTIFICATION_PRIORITIES = ["low", "normal", "high"] as const;

/** A single in-app inbox message for a user. */
export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  body: text("body").notNull(),
  type: text("type").notNull().default("announcement"),
  priority: text("priority").notNull().default("normal"),
  read: boolean("read").notNull().default(false),
  actionLabel: text("action_label"),
  actionUrl: text("action_url"),
  // Free-form JSON string for extra context (e.g. { templateId, campaignId }).
  metadata: text("metadata"),
  createdAt: createdAt(),
  expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" }),
});

export const MAIL_STATUSES = ["sent", "failed", "disabled", "queued"] as const;

/** A record of every email delivery attempt, regardless of provider. */
export const mailLogs = pgTable("mail_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  recipient: text("recipient").notNull(),
  subject: text("subject").notNull(),
  template: text("template").notNull(),
  status: text("status").notNull().default("queued"),
  error: text("error"),
  sentAt: createdAt(),
});

export const DELIVERY_TYPES = ["inbox", "email", "both"] as const;

/** An admin-authored broadcast, independent of the inbox template library. */
export const adminMessages = pgTable("admin_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  deliveryType: text("delivery_type").notNull().default("inbox"),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => users.id, { onDelete: "set null" }),
  published: boolean("published").notNull().default(false),
  createdAt: createdAt(),
});

/**
 * Per-user onboarding progress. Prevents duplicate onboarding messages across
 * both the automatic new-user flow and the existing-user backfill migration.
 */
export const welcomeStatus = pgTable("welcome_status", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  welcomeEmailSent: boolean("welcome_email_sent").notNull().default(false),
  welcomeInboxSent: boolean("welcome_inbox_sent").notNull().default(false),
  featuresInboxSent: boolean("features_inbox_sent").notNull().default(false),
  githubReminderSent: boolean("github_reminder_sent").notNull().default(false),
  welcomeEmailSentAt: timestamp("welcome_email_sent_at", {
    withTimezone: true,
    mode: "date",
  }),
  githubReminderSentAt: timestamp("github_reminder_sent_at", {
    withTimezone: true,
    mode: "date",
  }),
});

/** Reusable inbox message templates, authored by admins. */
export const inboxTemplates = pgTable("inbox_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  category: text("category").notNull().default("general"),
  ctaLabel: text("cta_label"),
  ctaUrl: text("cta_url"),
  priority: text("priority").notNull().default("normal"),
  createdAt: createdAt(),
});

/** Reusable email templates. Initially only "welcome" is seeded. */
export const emailTemplates = pgTable("email_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: text("key").notNull().unique(), // e.g. "welcome"
  subject: text("subject").notNull(),
  description: text("description"),
  createdAt: createdAt(),
});

/** Count of distinct calendar days a user has logged in (for onboarding rules). */
export const loginDays = pgTable(
  "login_days",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    day: text("day").notNull(), // YYYY-MM-DD (UTC)
    createdAt: createdAt(),
  },
  (t) => [unique().on(t.userId, t.day)],
);
