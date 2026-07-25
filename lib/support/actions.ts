"use server";

import { z } from "zod";
import { eq } from "drizzle-orm";
import { requireSession } from "@/lib/auth/guards";
import { db } from "@/lib/db/client";
import {
  supportTickets,
  featureRequests,
  githubConnections,
  TICKET_CATEGORIES,
} from "@/lib/db/schema";
import { getUserSolves } from "@/lib/db/queries/activity";
import { computeActivity } from "@/lib/progress/compute";
import { striverA2Z } from "@/lib/content/striver";
import { emitEvent } from "@/lib/events/events";
import { APP_VERSION } from "@/lib/version";

const clientContext = z.object({
  route: z.string().max(400).optional(),
  browser: z.string().max(200).optional(),
  operatingSystem: z.string().max(200).optional(),
  viewport: z.string().max(50).optional(),
  screenResolution: z.string().max(50).optional(),
});

const ticketSchema = clientContext.extend({
  category: z.enum(TICKET_CATEGORIES),
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().min(5).max(5000),
  stepsToReproduce: z.string().trim().max(5000).optional(),
  // Optional screenshot as a data URL, capped to keep the row reasonable.
  screenshot: z.string().max(1_500_000).optional(),
});

/**
 * Create a support ticket. Diagnostic context comes from the client; identity
 * and account signals (GitHub connection, streak, solved count) are attached
 * server-side so they can't be spoofed.
 */
export async function createSupportTicket(input: z.infer<typeof ticketSchema>) {
  const session = await requireSession();
  const data = ticketSchema.parse(input);

  const [solves, gh] = await Promise.all([
    getUserSolves(session.user.id, striverA2Z.slug),
    db
      .select({ id: githubConnections.id })
      .from(githubConnections)
      .where(eq(githubConnections.userId, session.user.id))
      .limit(1),
  ]);
  const activity = computeActivity(solves, 0);

  const [row] = await db
    .insert(supportTickets)
    .values({
      userId: session.user.id,
      category: data.category,
      title: data.title,
      description: data.description,
      stepsToReproduce: data.stepsToReproduce ?? null,
      screenshot: data.screenshot ?? null,
      route: data.route ?? null,
      browser: data.browser ?? null,
      operatingSystem: data.operatingSystem ?? null,
      viewport: data.viewport ?? null,
      screenResolution: data.screenResolution ?? null,
      version: APP_VERSION,
      githubConnected: gh.length > 0,
      currentStreak: activity.currentStreak,
      problemsSolved: activity.solved,
    })
    .returning({ id: supportTickets.id });

  await emitEvent({
    type: "support.ticket.created",
    userId: session.user.id,
    ticketId: row.id,
    category: data.category,
  });

  return { ok: true as const, id: row.id };
}

const featureSchema = z.object({
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().min(5).max(5000),
  whyUseful: z.string().trim().max(2000).optional(),
});

/** Create a feature request (stored separately from support tickets). */
export async function createFeatureRequest(input: z.infer<typeof featureSchema>) {
  const session = await requireSession();
  const data = featureSchema.parse(input);

  const [row] = await db
    .insert(featureRequests)
    .values({
      userId: session.user.id,
      title: data.title,
      description: data.description,
      whyUseful: data.whyUseful ?? null,
    })
    .returning({ id: featureRequests.id });

  await emitEvent({
    type: "feature.request.created",
    userId: session.user.id,
    requestId: row.id,
  });

  return { ok: true as const, id: row.id };
}
