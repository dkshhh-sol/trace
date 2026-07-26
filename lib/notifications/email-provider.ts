import "server-only";

/**
 * EmailProvider abstraction. NotificationService depends on this interface,
 * never on a concrete provider, so swapping MockEmailProvider for
 * ResendEmailProvider later is a one-line change with no business-logic
 * refactor.
 */
export type SendEmailInput = {
  to: string;
  subject: string;
  react: React.ReactElement;
  template: string; // template key, for logging
};

export type SendEmailResult =
  | { ok: true }
  | { ok: false; error: string; disabled?: boolean };

export interface EmailProvider {
  send(input: SendEmailInput): Promise<SendEmailResult>;
}

/**
 * Default provider until a Resend API key is configured. Renders nothing and
 * sends nothing — it reports a clear "disabled" result so callers (and the
 * admin UI) can show that email delivery isn't active yet, without throwing.
 */
export class MockEmailProvider implements EmailProvider {
  async send(): Promise<SendEmailResult> {
    return {
      ok: false,
      error: "Email sending is not configured (no RESEND_API_KEY).",
      disabled: true,
    };
  }
}

/**
 * Resend-backed provider. Constructed lazily so importing this module never
 * requires the `resend` package or an API key until it's actually used.
 */
export class ResendEmailProvider implements EmailProvider {
  constructor(private apiKey: string, private from: string) {}

  async send(input: SendEmailInput): Promise<SendEmailResult> {
    try {
      const { Resend } = await import("resend");
      const { render } = await import("@react-email/render");
      const resend = new Resend(this.apiKey);
      const html = await render(input.react);
      const res = await resend.emails.send({
        from: this.from,
        to: input.to,
        subject: input.subject,
        html,
      });
      if (res.error) return { ok: false, error: res.error.message };
      return { ok: true };
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    }
  }
}

/**
 * Resolve the active provider from env. Returns MockEmailProvider until
 * RESEND_API_KEY is set — no code elsewhere needs to change when it is.
 */
export function resolveEmailProvider(): EmailProvider {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL || "Trace <onboarding@trace.dev>";
  if (apiKey) return new ResendEmailProvider(apiKey, from);
  return new MockEmailProvider();
}
