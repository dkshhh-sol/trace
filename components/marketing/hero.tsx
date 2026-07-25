import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";
import { HeroPreview } from "@/components/marketing/hero-preview";

const loop = ["Lecture", "Problem", "Notes", "Progress", "Revision", "Next"];

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-36 sm:pt-44">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-grid mask-radial" />
        <div className="absolute left-1/2 top-[-10%] h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-brand/20 blur-[130px]" />
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <div className="animate-rise inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-muted-foreground">
            <span className="size-1.5 rounded-full bg-brand" />
            The modern workspace for Striver&rsquo;s A2Z DSA Sheet
          </div>

          <h1 className="animate-rise mt-6 text-balance text-4xl leading-[1.05] tracking-tight sm:text-6xl">
            Everything you need to
            <br />
            <span className="font-serif italic text-gradient">
              finish Striver A2Z.
            </span>
          </h1>

          <p className="animate-rise mx-auto mt-6 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
            Watch the lecture, solve the problem, keep your notes and track every
            step — all in one place. No more juggling YouTube, LeetCode and a
            spreadsheet across a dozen tabs.
          </p>

          {/* The loop — what Trace replaces tab-switching with */}
          <div className="animate-rise mt-7 flex flex-wrap items-center justify-center gap-x-1.5 gap-y-2 text-xs text-muted-foreground">
            {loop.map((step, i) => (
              <span key={step} className="inline-flex items-center gap-1.5">
                <span className="rounded-md border border-white/[0.06] bg-white/[0.02] px-2.5 py-1 text-foreground/80">
                  {step}
                </span>
                {i < loop.length - 1 && (
                  <ArrowRight className="size-3 text-brand/70" />
                )}
              </span>
            ))}
          </div>

          <div className="animate-rise mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/login"
              className="group inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-foreground px-5 text-sm font-medium text-background transition-transform hover:scale-[1.02] active:scale-[0.99] sm:w-auto"
            >
              Start Striver A2Z
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
            Free · Sign in with Google · 450+ problems mapped to lectures
          </p>
        </div>

        <div className="animate-rise mt-16 sm:mt-20">
          <HeroPreview />
        </div>
      </div>
    </section>
  );
}
