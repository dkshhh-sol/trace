import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function CTA() {
  return (
    <section id="get-started" className="scroll-mt-24">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-card px-6 py-16 text-center sm:px-16 sm:py-20">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-grid mask-radial" />
            <div className="absolute left-1/2 top-0 h-64 w-[600px] -translate-x-1/2 rounded-full bg-accent/25 blur-[120px]" />
          </div>

          <h2 className="mx-auto max-w-2xl text-balance text-3xl leading-tight tracking-tight sm:text-5xl">
            Your interview prep,{" "}
            <span className="font-serif italic text-gradient">
              finally in one place
            </span>
          </h2>
          <p className="mx-auto mt-5 max-w-lg text-muted-foreground">
            Join Trace and turn scattered resources into a clear, trackable
            path to your next offer.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="#"
              className="group inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-foreground px-6 text-sm font-medium text-background transition-transform hover:scale-[1.02] active:scale-[0.99] sm:w-auto"
            >
              Continue with Google
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Free to start · No credit card required
          </p>
        </div>
      </div>
    </section>
  );
}
