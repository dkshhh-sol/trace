import { ArrowRight } from "lucide-react";
import { SignInDialog } from "@/components/marketing/sign-in-dialog";

export function CTA() {
  return (
    <section id="get-started" className="scroll-mt-24">
      <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-32">
        <div className="card-hero relative overflow-hidden rounded-3xl px-6 py-16 text-center sm:px-16 sm:py-20">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-grid mask-radial" />
          </div>

          <h2 className="mx-auto max-w-2xl text-balance text-3xl leading-tight tracking-tight sm:text-5xl">
            Finish{" "}
            <span className="font-serif italic text-gradient">
              Striver A2Z
            </span>
            . Stay consistent. Track everything.
          </h2>
          <p className="mx-auto mt-5 max-w-lg text-muted-foreground">
            Lectures, a built-in code editor, one-click GitHub commits and real
            progress tracking, all in one focused workspace. Pick up exactly
            where you left off.
          </p>

          <div className="mt-9 flex justify-center">
            <SignInDialog className="group inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-foreground px-6 text-sm font-medium text-background outline-none transition-transform hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.99] sm:w-auto">
              Continue with Google
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </SignInDialog>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Free · No credit card required
          </p>
        </div>
      </div>
    </section>
  );
}
