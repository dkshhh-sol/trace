import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  unique,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { users } from "./auth";

/**
 * Integrated coding workspace — user data (Neon).
 *
 * Two distinct persistence concerns, kept separate from GitHub and any future
 * execution service (Requirement 11):
 *   - `folders` + `codeFiles`: the user's personal code repository ("Code
 *     Files"), a lightweight VS Code-style explorer independent of any problem.
 *   - `problemDrafts`: the auto-saved editor state for a specific problem's
 *     lecture workspace, restored verbatim when the problem is reopened.
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
const ownerId = () =>
  uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" });

/** Supported languages for the workspace editor. */
export const CODE_LANGUAGES = ["c", "cpp", "java", "python"] as const;
export type CodeLanguage = (typeof CODE_LANGUAGES)[number];

/** Folders in the personal code repository. `parentId` nests folders. */
export const folders = pgTable("folders", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: ownerId(),
  name: text("name").notNull(),
  parentId: uuid("parent_id").references((): AnyPgColumn => folders.id, {
    onDelete: "cascade",
  }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

/**
 * A saved file in the personal code repository. Optionally associated with a
 * roadmap problem so it can be reopened from that problem ("Open Related File",
 * Requirement 10). Educational content itself is never stored here — only the
 * identifiers that link back to it.
 */
export const codeFiles = pgTable("code_files", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: ownerId(),
  folderId: uuid("folder_id").references(() => folders.id, {
    onDelete: "set null",
  }),
  name: text("name").notNull(),
  language: text("language").notNull().default("cpp"),
  content: text("content").notNull().default(""),
  // Optional association back to educational content (Requirement 10).
  linkedProblemId: text("linked_problem_id"),
  roadmapId: text("roadmap_id"),
  topicId: text("topic_id"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

/**
 * Auto-saved editor state for a problem's lecture workspace (Requirement 4).
 * Exactly one draft per (user, problem); switching language updates the same
 * row. Cursor position is stored so the exact editor state can be restored.
 */
export const problemDrafts = pgTable(
  "problem_drafts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: ownerId(),
    problemId: text("problem_id").notNull(),
    roadmapId: text("roadmap_id"),
    language: text("language").notNull().default("cpp"),
    fileName: text("file_name").notNull().default("solution.cpp"),
    content: text("content").notNull().default(""),
    cursorLine: integer("cursor_line").notNull().default(1),
    cursorColumn: integer("cursor_column").notNull().default(1),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [unique().on(t.userId, t.problemId)],
);
