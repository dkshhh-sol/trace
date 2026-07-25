import { pgTable, uuid, text, timestamp, unique } from "drizzle-orm/pg-core";
import { users } from "./auth";

/**
 * Unlocked achievements. We persist ONLY the fact + timestamp of an unlock;
 * all metadata (title, description, category, icon, condition) lives in the
 * predefined catalog (lib/achievements/catalog). Unlocks are computed from the
 * user's real activity and inserted once — never manually toggled.
 */
export const userAchievements = pgTable(
  "user_achievements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    achievementId: text("achievement_id").notNull(),
    unlockedAt: timestamp("unlocked_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (t) => [unique().on(t.userId, t.achievementId)],
);
