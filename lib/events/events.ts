import "server-only";

/**
 * Internal event layer. Domain flows emit typed events; subscribers react. For
 * now there are no side effects beyond whatever handlers register (analytics /
 * DB), and NO emails are sent. When Resend is added it simply registers
 * handlers via `on(...)` — no caller needs to change. This keeps email support
 * a pure addition rather than a refactor.
 */

export type TraceEvent =
  | { type: "user.created"; userId: string }
  | { type: "github.connected"; userId: string }
  | { type: "achievement.unlocked"; userId: string; achievementId: string }
  | { type: "goal.completed"; userId: string; goalId?: string }
  | { type: "topic.completed"; userId: string; topic: string }
  | {
      type: "support.ticket.created";
      userId: string;
      ticketId: string;
      category: string;
    }
  | { type: "feature.request.created"; userId: string; requestId: string };

export type EventType = TraceEvent["type"];
export type EventHandler = (event: TraceEvent) => void | Promise<void>;

const handlers = new Map<EventType, EventHandler[]>();

/** Register a handler for an event type (e.g. a future Resend email sender). */
export function on(type: EventType, handler: EventHandler) {
  const list = handlers.get(type) ?? [];
  list.push(handler);
  handlers.set(type, list);
}

/**
 * Emit an event to all subscribers. Never throws to callers — a failing
 * handler must not break the originating operation.
 */
export async function emitEvent(event: TraceEvent): Promise<void> {
  const list = handlers.get(event.type);
  if (!list || list.length === 0) return;
  await Promise.allSettled(list.map((h) => Promise.resolve(h(event))));
}
