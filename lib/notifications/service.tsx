import "server-only";

import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import {
  insertNotifications,
  logMail,
  getWelcomeStatus,
  markWelcomeFlags,
} from "@/lib/db/queries/notifications";
import { resolveEmailProvider } from "./email-provider";
import { WelcomeEmail } from "./emails/welcome-email";
import { emitEvent } from "@/lib/events/events";

/**
 * NotificationService — the ONLY entry point for sending notifications.
 * No feature/component should insert into `notifications`/`mail_logs` or call
 * an email provider directly; everything routes through here so channels stay
 * swappable (mock -> Resend) with zero call-site changes.
 *
 *   Feature -> NotificationService -> Inbox
 *                                  -> Email
 */

export type NotificationType =
  | "onboarding"
  | "reminder"
  | "achievement"
  | "support"
  | "announcement"
  | "admin";
export type NotificationPriority = "low" | "normal" | "high";

export type SendInboxInput = {
  userIds: string[];
  title: string;
  body: string;
  type?: NotificationType;
  priority?: NotificationPriority;
  actionLabel?: string;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
};

/** Send an in-app inbox message to one or many users. */
export async function sendInbox(input: SendInboxInput): Promise<{ count: number }> {
  const ids = [...new Set(input.userIds)].filter(Boolean);
  if (ids.length === 0) return { count: 0 };

  await insertNotifications(
    ids.map((userId) => ({
      userId,
      title: input.title,
      body: input.body,
      type: input.type ?? "announcement",
      priority: input.priority ?? "normal",
      actionLabel: input.actionLabel ?? null,
      actionUrl: input.actionUrl ?? null,
      metadata: input.metadata ? JSON.stringify(input.metadata) : null,
    })),
  );

  return { count: ids.length };
}

/**
 * Send the welcome email to a user, exactly once (guarded by welcome_status).
 * Uses the injected EmailProvider — swapping Mock for Resend requires no
 * change here.
 */
export async function sendWelcomeEmail(userId: string): Promise<void> {
  const status = await getWelcomeStatus(userId);
  if (status.welcomeEmailSent) return;

  const [user] = await db
    .select({ email: users.email, name: users.name })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!user?.email) return;

  const provider = resolveEmailProvider();
  const dashboardUrl =
    (process.env.AUTH_URL?.replace(/\/$/, "") || "https://trace-delta-three.vercel.app") +
    "/dashboard";

  const result = await provider.send({
    to: user.email,
    subject: "Welcome to Trace",
    react: <WelcomeEmail name={user.name} dashboardUrl={dashboardUrl} />,
    template: "welcome",
  });

  await logMail({
    recipient: user.email,
    subject: "Welcome to Trace",
    template: "welcome",
    status: result.ok ? "sent" : result.disabled ? "disabled" : "failed",
    error: result.ok ? null : result.error,
  });

  // Mark as sent even when the provider is disabled: the *attempt* is
  // considered fulfilled so we never retry-spam once Resend is configured.
  await markWelcomeFlags(userId, { welcomeEmailSent: true });
}

/** Onboarding message 1 — sent immediately after first successful signup. */
export async function sendWelcomeInbox(userId: string): Promise<void> {
  const status = await getWelcomeStatus(userId);
  if (status.welcomeInboxSent) return;

  await sendInbox({
    userIds: [userId],
    type: "onboarding",
    priority: "normal",
    title: "Welcome to Trace",
    body:
      "Welcome to Trace. You're all set to begin mastering Striver's A2Z Sheet. Use the dashboard to track your progress, set goals, and organize your learning.",
    actionLabel: "Open Dashboard",
    actionUrl: "/dashboard",
  });

  await markWelcomeFlags(userId, { welcomeInboxSent: true });
}

/** Onboarding message 2 — sent immediately after the welcome message. */
export async function sendFeaturesInbox(userId: string): Promise<void> {
  const status = await getWelcomeStatus(userId);
  if (status.featuresInboxSent) return;

  await sendInbox({
    userIds: [userId],
    type: "onboarding",
    priority: "normal",
    title: "Explore Trace",
    body:
      "Trace includes:\nStriver A2Z Roadmap\nProgress Tracking\nDynamic Goals\nCode Files\nIntegrated Code Editor\nOne-click GitHub Commit\nAchievement System\nSupport Center",
    actionLabel: "Explore Features",
    actionUrl: "/dashboard",
  });

  await markWelcomeFlags(userId, { featuresInboxSent: true });
}

/**
 * GitHub reminder — sent once, only when all trigger conditions are true.
 * Never time-based. Caller supplies the already-computed signals.
 */
export async function maybeSendGitHubReminder(input: {
  userId: string;
  githubConnected: boolean;
  problemsSolved: number;
  distinctLoginDays: number;
}): Promise<void> {
  if (input.githubConnected) return;

  const status = await getWelcomeStatus(input.userId);
  if (status.githubReminderSent) return;

  const eligible = input.problemsSolved >= 5 || input.distinctLoginDays >= 3;
  if (!eligible) return;

  await sendInbox({
    userIds: [input.userId],
    type: "reminder",
    priority: "normal",
    title: "Connect GitHub",
    body:
      "Connect your GitHub account to commit solutions directly from the integrated code editor and keep your work synchronized.",
    actionLabel: "Connect GitHub",
    actionUrl: "/code-files",
  });

  await markWelcomeFlags(input.userId, { githubReminderSent: true });
}

/**
 * Full onboarding sequence for a new (or backfilled) user: welcome inbox,
 * explore-features inbox, and the welcome email. Each step is independently
 * idempotent, so calling this repeatedly (e.g. the existing-users migration)
 * never duplicates anything.
 */
export async function runOnboarding(userId: string): Promise<void> {
  await sendWelcomeInbox(userId);
  await sendFeaturesInbox(userId);
  await sendWelcomeEmail(userId);
  await emitEvent({ type: "user.created", userId });
}
