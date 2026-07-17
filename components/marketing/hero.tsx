import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";
import { HeroPreview } from "@/components/marketing/hero-preview";

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-36 sm:pt-44">
      {/* Decorative backdrop */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-grid mask-radial" />
        <div className="absolute left-1/2 top-[-10%] h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-brand/20 blur-[130px]" />
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <div className="animate-rise inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-muted-foreground">
            <span className="size-1.5 rounded-full bg-brand" />
            Now in early access — v1.0
          </div>

          <h1 className="animate-rise mt-6 text-balance text-4xl leading-[1.05] tracking-tight sm:text-6xl">
            Stop juggling tabs.
            <br />
            <span className="font-serif italic text-gradient">
              Start making progress.
            </span>
          </h1>

          <p className="animate-rise mx-auto mt-6 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
            Trace is the developer-first workspace that unifies roadmaps,
            embedded lectures, coding problems, notes, spaced revision and
            analytics — so you always know exactly what to learn next.
          </p>

          <div className="animate-rise mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="#get-started"
              className="group inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-foreground px-5 text-sm font-medium text-background transition-transform hover:scale-[1.02] active:scale-[0.99] sm:w-auto"
            >
              Get started free
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="#how-it-works"
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-5 text-sm font-medium text-foreground transition-colors hover:bg-white/[0.05] sm:w-auto"
            >
              <Play className="size-4" />
              See how it works
            </Link>
          </div>

          <p className="animate-rise mt-4 text-xs text-muted-foreground">
            Free to start · Sign in with Google · No credit card
          </p>
        </div>

        {/* Product preview */}
        <div className="animate-rise mt-16 sm:mt-20">
          <HeroPreview />
        </div>
      </div>
    </section>
  );
}
