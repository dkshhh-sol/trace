import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { signInWithGoogle } from "@/lib/auth/actions";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to Trace to start your interview preparation.",
};

/** Maps Auth.js / flow error codes to friendly, non-technical messages. */
const ERROR_MESSAGES: Record<string, string> = {
  OAuthSignin: "Sign-in could not be started. Please try again.",
  OAuthCallback: "Sign-in could not be completed. Please try again.",
  OAuthAccountNotLinked: "This email is already linked to another sign-in method.",
  AccessDenied: "Access was denied. Please try again.",
  Verification: "Sign-in could not be verified. Please try again.",
  Configuration: "Sign-in is temporarily unavailable. Please try again later.",
  timeout: "Sign-in timed out. Please try again.",
  default: "Something went wrong during sign-in. Please try again.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; callbackUrl?: string }>;
}) {
  const { error, callbackUrl } = await searchParams;
  const errorMessage = error
    ? ERROR_MESSAGES[error] ?? ERROR_MESSAGES.default
    : null;

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center px-4">
      {/* Decorative backdrop, matching the marketing aesthetic */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-grid mask-radial" />
        <div className="absolute left-1/2 top-1/3 h-72 w-[540px] -translate-x-1/2 rounded-full bg-brand/15 blur-[130px]" />
      </div>

      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center">
          <Link href="/" aria-label="Trace home">
            <Logo />
          </Link>
          <h1 className="mt-8 text-2xl tracking-tight">
            Welcome to{" "}
            <span className="font-serif italic text-gradient">Trace</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to start your interview preparation.
          </p>
        </div>

        <div className="mt-8 rounded-2xl border border-white/[0.08] bg-card p-6">
          {errorMessage && (
            <div
              role="alert"
              className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {errorMessage}
            </div>
          )}

          <form action={signInWithGoogle}>
            <input
              type="hidden"
              name="callbackUrl"
              value={callbackUrl ?? "/dashboard"}
            />
            <Button type="submit" className="h-11 w-full gap-2 text-sm">
              <GoogleIcon className="size-4" />
              Continue with Google
            </Button>
          </form>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            Free to start · No credit card required
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          By continuing you agree to our Terms and Privacy Policy.
        </p>
      </div>
    </main>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z"
      />
    </svg>
  );
}
