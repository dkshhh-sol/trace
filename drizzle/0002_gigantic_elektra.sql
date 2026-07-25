ALTER TABLE "user_settings" ALTER COLUMN "daily_goal" SET DEFAULT 2;--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN "weekly_goal" integer DEFAULT 14 NOT NULL;