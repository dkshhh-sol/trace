"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { TrendingUp, ArrowRight, Play, ChevronDown, Flame } from "lucide-react";
import { SignInDialog } from "@/components/marketing/sign-in-dialog";

/**
 * Landing hero — cinematic, glass-forward composition over a looping
 * background video. Client component so it can run the custom rAF video-fade
 * loop and subtle motion. All auth reuses the existing <SignInDialog>; when the
 * visitor is already signed in the CTAs link straight to the dashboard. Nothing
 * here reads real user data — the floating cards are purely decorative.
 */

const VIDEO_URL =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260328_115001_bcdaa3b4-03de-47e7-ad63-ae3e392c32d4.mp4";

const SERIF = { fontFamily: "var(--font-instrument-serif), 'Instrument Serif', serif" };
const SECONDARY = "rgba(255,255,255,0.72)";

const navLinks = [
  { label: "Roadmap", href: "#how-it-works" },
  { label: "Progress", href: "#why" },
  { label: "Community", href: "#get-started" },
];

export function Hero({ isAuthed }: { isAuthed: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  /**
   * Custom fade loop (no CSS transitions): fade in over 500ms, and 0.55s before
   * the clip ends fade out over 500ms; once ended, hold at 0, wait 100ms, seek
   * to start, play, and fade back in. rAF-driven, resuming from current opacity,
   * cancelling any in-flight frame; `fadingOut` guards against double fades.
   */
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const FADE = 500;
    const FADE_OUT_LEAD = 0.55; // seconds before end
    let raf = 0;
    const fadingOut = { current: false };

    const getOpacity = () => parseFloat(video.style.opacity || "0");
    const setOpacity = (o: number) =>
      (video.style.opacity = String(Math.max(0, Math.min(1, o))));

    function fade(target: number, duration: number, done?: () => void) {
      cancelAnimationFrame(raf);
      const from = getOpacity();
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        setOpacity(from + (target - from) * t);
        if (t < 1) raf = requestAnimationFrame(tick);
        else done?.();
      };
      raf = requestAnimationFrame(tick);
    }

    function onTimeUpdate() {
      if (!video || !video.duration || Number.isNaN(video.duration)) return;
      const remaining = video.duration - video.currentTime;
      if (remaining <= FADE_OUT_LEAD && !fadingOut.current) {
        fadingOut.current = true;
        fade(0, FADE);
      }
    }

    function restart() {
      setOpacity(0);
      window.setTimeout(() => {
        if (!video) return;
        video.currentTime = 0;
        void video.play().catch(() => {});
        fadingOut.current = false;
        fade(1, FADE);
      }, 100);
    }

    function onReady() {
      if (!fadingOut.current && getOpacity() === 0) fade(1, FADE);
    }

    setOpacity(0);
    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("ended", restart);
    video.addEventListener("loadeddata", onReady);
    video.addEventListener("playing", onReady);
    void video.play().catch(() => {});

    return () => {
      cancelAnimationFrame(raf);
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("ended", restart);
      video.removeEventListener("loadeddata", onReady);
      video.removeEventListener("playing", onReady);
    };
  }, []);

  return (
    <section className="relative min-h-screen overflow-hidden bg-black">
      {/* Background video */}
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full translate-y-[17%] object-cover"
        style={{ opacity: 0 }}
        muted
        autoPlay
        playsInline
        preload="auto"
      >
        <source src={VIDEO_URL} type="video/mp4" />
      </video>

      {/* Cinematic scrim for legibility (dark, no color) */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 85% at 50% 28%, rgba(7,7,10,0.15), rgba(7,7,10,0.72) 68%, #07070A 100%)",
        }}
      />

      <Navbar isAuthed={isAuthed} />
      <FloatingCards />

      {/* Hero content */}
      <div className="relative z-10 mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-4 pb-24 pt-28 text-center sm:px-6">
        <div className="-translate-y-[8%]">
          {/* Eyebrow */}
          <div
            className="hero-rise liquid-glass mx-auto inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs"
            style={{ color: SECONDARY, animationDelay: "0.05s" }}
          >
            <span className="size-1.5 rounded-full bg-[#8B7DFF] shadow-[0_0_8px_#8B7DFF]" />
            Built for consistent developers
          </div>

          {/* Heading — Instrument Serif */}
          <h1
            className="hero-rise mx-auto mt-7 max-w-4xl text-balance text-5xl font-normal leading-[1.05] tracking-tight text-white sm:text-6xl md:text-7xl"
            style={{ ...SERIF, animationDelay: "0.12s" }}
          >
            Master DSA.
            <br />
            <span className="text-white/90">One problem at a time.</span>
          </h1>

          {/* Supporting paragraph */}
          <p
            className="hero-rise mx-auto mt-6 max-w-2xl text-pretty text-base leading-relaxed sm:text-lg"
            style={{ color: SECONDARY, animationDelay: "0.2s" }}
          >
            The complete workspace for mastering Striver&rsquo;s A2Z Sheet. Watch
            lectures, solve problems, track progress, revise intelligently, and
            stay consistent—all in one place.
          </p>

          {/* Primary CTAs */}
          <div
            className="hero-rise mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row"
            style={{ animationDelay: "0.28s" }}
          >
            <PrimaryCta isAuthed={isAuthed} />
            <button
              type="button"
              className="glass-glow liquid-glass inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 text-sm font-medium text-white outline-none"
            >
              <Play className="size-4" />
              Watch Demo
            </button>
          </div>

          {/* Trust */}
          <div
            className="hero-rise mt-10 flex flex-col items-center gap-1.5 text-xs"
            style={{ color: SECONDARY, animationDelay: "0.36s" }}
          >
            <span className="uppercase tracking-[0.18em] text-white/45">
              Trusted by students preparing for
            </span>
            <span className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-white/70">
              <span>FAANG</span>
              <Dot />
              <span>Product Companies</span>
              <Dot />
              <span>Placements</span>
            </span>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <Link
        href="#why"
        className="glass-glow liquid-glass absolute bottom-6 left-1/2 z-10 inline-flex -translate-x-1/2 items-center gap-2 rounded-full px-4 py-2 text-xs text-white/70 outline-none"
        aria-label="Explore Trace"
      >
        <ChevronDown className="hero-nudge size-3.5" />
        Explore Trace
      </Link>
    </section>
  );
}

function Dot() {
  return <span className="size-1 rounded-full bg-white/30" />;
}

function PrimaryCta({ isAuthed }: { isAuthed: boolean }) {
  const inner = (
    <>
      Start Learning
      <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
    </>
  );
  const className =
    "group glass-glow liquid-glass inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 text-sm font-medium text-white outline-none";

  if (isAuthed) {
    return (
      <Link href="/dashboard" className={className}>
        {inner}
      </Link>
    );
  }
  return <SignInDialog className={className}>{inner}</SignInDialog>;
}

function Navbar({ isAuthed }: { isAuthed: boolean }) {
  return (
    <nav className="absolute left-1/2 top-5 z-20 w-[calc(100%-1.5rem)] max-w-5xl -translate-x-1/2 sm:top-6">
      <div className="liquid-glass flex items-center justify-between gap-4 rounded-full px-6 py-3">
        {/* Left — brand */}
        <Link href="/" className="flex items-center gap-2" aria-label="Trace home">
          <TrendingUp className="size-5 text-[#8B7DFF]" />
          <span className="text-lg font-semibold text-white">Trace</span>
        </Link>

        {/* Center — links */}
        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-3 py-1.5 text-sm text-white/60 transition-colors hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right — auth */}
        <div className="flex items-center gap-1.5">
          {isAuthed ? (
            <Link
              href="/dashboard"
              className="glass-glow liquid-glass inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-sm font-medium text-white outline-none"
            >
              Continue Learning
              <ArrowRight className="size-4" />
            </Link>
          ) : (
            <>
              <SignInDialog className="hidden rounded-full px-3.5 py-2 text-sm text-white/70 outline-none transition-colors hover:text-white sm:inline-flex">
                Sign In
              </SignInDialog>
              <SignInDialog className="glass-glow liquid-glass inline-flex h-9 items-center rounded-full px-4 text-sm font-medium text-white outline-none">
                Get Started
              </SignInDialog>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

/* --------------------------- Decorative cards ---------------------------- */

function FloatingCards() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-10 hidden lg:block">
      {/* Card 1 — Today's Goal */}
      <div className="hero-float-a absolute left-[4%] top-[30%]">
        <div className="liquid-glass w-52 rounded-2xl p-4">
          <p className="text-[11px] uppercase tracking-wide" style={{ color: SECONDARY }}>
            Today&rsquo;s Goal
          </p>
          <div className="mt-2 flex items-center gap-3">
            <ProgressRing pct={66} />
            <div>
              <p className="text-lg font-medium text-white">2 / 3</p>
              <p className="text-[11px]" style={{ color: SECONDARY }}>
                Problems
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Card 2 — Current Streak */}
      <div className="hero-float-b absolute bottom-[24%] left-[7%]">
        <div className="liquid-glass w-48 rounded-2xl p-4">
          <p className="text-[11px] uppercase tracking-wide" style={{ color: SECONDARY }}>
            Current Streak
          </p>
          <p className="mt-2 flex items-center gap-1.5 text-lg font-medium text-white">
            <Flame className="size-4 text-[#8B7DFF]" />
            18 Days
          </p>
        </div>
      </div>

      {/* Card 3 — Progress */}
      <div className="hero-float-c absolute right-[5%] top-[36%]">
        <div className="liquid-glass w-56 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-wide" style={{ color: SECONDARY }}>
              Progress
            </p>
            <span className="text-[11px] text-white/70">147 / 449</span>
          </div>
          <p className="mt-1.5 text-sm text-white">Solved</p>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full"
              style={{
                width: "33%",
                background: "linear-gradient(90deg, #8B7DFF, #A69BFF)",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function ProgressRing({ pct }: { pct: number }) {
  const r = 16;
  const c = 2 * Math.PI * r;
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" className="shrink-0 -rotate-90">
      <circle cx="22" cy="22" r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="4" />
      <circle
        cx="22"
        cy="22"
        r={r}
        fill="none"
        stroke="#8B7DFF"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c - (c * pct) / 100}
      />
    </svg>
  );
}
