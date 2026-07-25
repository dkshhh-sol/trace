import { pgTable, uuid, text, integer, timestamp } from "drizzle-orm/pg-core";
import { users } from "./auth";

/**
 * User-defined goals. Each user can have many goals across periods; the schema
 * is period-agnostic (daily | weekly | monthly | yearly) so new periods can be
 * added without a migration. Progress is derived from solves, never stored.
 */
export const goals = pgTable("goals", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  targetCount: integer("target_count").notNull(),
  period: text("period").notNull(), // daily | weekly | monthly | yearly
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const GOAL_PERIODS = ["daily", "weekly", "monthly", "yearly"] as const;
export type GoalPeriod = (typeof GOAL_PERIODS)[number];
