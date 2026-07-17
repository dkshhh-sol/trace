import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  date,
} from "drizzle-orm/pg-core";
import { users } from "./auth";

/**
 * Scaffolding for tables activated by later module specs (Requirement 6.2).
 * Each carries a UUID PK, a userId FK, and UTC timestamps. Where a row relates
 * to educational content it stores the Sanity document id (Requirement 6.6) —
 * never a copy of the content.
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
const userId = () =>
  uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" });

export const progress = pgTable("progress", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: userId(),
  sanityDocumentId: text("sanity_document_id").notNull(),
  status: text("status").notNull().default("not_started"), // not_started | in_progress | completed
  completedAt: timestamp("completed_at", { withTimezone: true, mode: "date" }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const notes = pgTable("notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: userId(),
  sanityDocumentId: text("sanity_document_id").notNull(),
  bodyMarkdown: text("body_markdown").notNull().default(""),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const bookmarks = pgTable("bookmarks", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: userId(),
  sanityDocumentId: text("sanity_document_id").notNull(),
  kind: text("kind").notNull(), // roadmap | topic | lecture | problem
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const revisionQueue = pgTable("revision_queue", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: userId(),
  sanityDocumentId: text("sanity_document_id").notNull(),
  dueAt: timestamp("due_at", { withTimezone: true, mode: "date" }).notNull(),
  intervalIndex: integer("interval_index").notNull().default(0),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const revisionHistory = pgTable("revision_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: userId(),
  sanityDocumentId: text("sanity_document_id").notNull(),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const analyticsDaily = pgTable("analytics_daily", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: userId(),
  date: date("date", { mode: "string" }).notNull(),
  problemsSolved: integer("problems_solved").notNull().default(0),
  minutesLearned: integer("minutes_learned").notNull().default(0),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});
