"use client";

import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { signInWithGoogle } from "@/lib/auth/actions";

/**
 * Lightweight, in-place sign-in. Opens a centered modal over the current page
 * (no navigation to a separate login route). Base UI's Dialog handles the
 * focus trap, Escape / outside-click close, focus restore and animations.
 *
 * The trigger is styled by the caller via `className` + `children`, so it can
 * be a ghost link or a primary button while sharing one dialog.
 */
export function SignInDialog({
  className,
  children,
  callbackUrl = "/dashboard",
}: {
  className?: string;
  children: React.ReactNode;
  callbackUrl?: string;
}) {
  return (
    <Dialog>
      <DialogTrigger className={className}>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <div className="flex flex-col items-center gap-5 px-2 py-5 text-center">
          <Logo showWordmark={false} className="scale-110" />

          <div className="space-y-1.5">
            <DialogTitle className="text-2xl tracking-tight">
              Welcome to{" "}
              <span className="font-serif italic text-gradient">Trace</span>
            </DialogTitle>
            <DialogDescription>
              Sign in to start Striver&rsquo;s A2Z DSA Sheet.
            </DialogDescription>
          </div>

          <form action={signInWithGoogle} className="w-full">
            <input type="hidden" name="callbackUrl" value={callbackUrl} />
            <Button type="submit" className="h-11 w-full gap-2 text-sm">
              <GoogleIcon className="size-4" />
              Continue with Google
            </Button>
          </form>

          <p className="text-xs text-muted-foreground">
            Free to start. No credit card required.
          </p>
        </div>
      </DialogContent>
    </Dialog>
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
