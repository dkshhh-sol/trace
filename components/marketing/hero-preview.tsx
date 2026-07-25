import {
  LayoutDashboard,
  ListChecks,
  Play,
  CheckCircle2,
  Layers,
  TrendingUp,
} from "lucide-react";
import { Logo } from "@/components/ui/logo";

const nav = [
  { icon: LayoutDashboard, label: "Dashboard", active: true },
  { icon: ListChecks, label: "Striver A2Z", active: false },
];

const stats = [
  { icon: CheckCircle2, label: "Solved", value: "137", sub: "of 455", accent: "text-success" },
  { icon: Layers, label: "Steps", value: "6", sub: "of 18", accent: "text-brand" },
  { icon: TrendingUp, label: "Progress", value: "30%", sub: "", accent: "text-brand" },
];

/**
 * Landing preview that mirrors the authenticated app shell + dashboard, so the
 * homepage already looks like the product. After sign-in the real dashboard
 * uses the same layout — no visual jump.
 */
export function HeroPreview() {
  return (
    <div className="relative mx-auto max-w-5xl">
      <div className="absolute inset-x-8 -bottom-6 -z-10 h-24 rounded-full bg-brand/20 blur-3xl" />
      <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-background shadow-2xl shadow-black/60">
        {/* Window chrome */}
        <div className="flex items-center gap-2 border-b border-white/[0.06] bg-white/[0.02] px-4 py-3">
          <div className="flex gap-1.5">
            <span className="size-3 rounded-full bg-white/15" />
            <span className="size-3 rounded-full bg-white/15" />
            <span className="size-3 rounded-full bg-white/15" />
          </div>
          <div className="mx-auto flex items-center gap-2 rounded-md border border-white/[0.06] bg-background/60 px-3 py-1 text-xs text-muted-foreground">
            trace.dev/dashboard
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-[190px_1fr]">
          {/* Sidebar — matches the real app shell */}
          <aside className="hidden flex-col gap-1 border-r border-white/[0.06] bg-sidebar p-3 sm:flex">
            <div className="mb-3 px-1">
              <Logo />
            </div>
            {nav.map((item) => (
              <div
                key={item.label}
                className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm ${
                  item.active
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                <item.icon
                  className={`size-4 ${item.active ? "text-brand" : ""}`}
                />
                {item.label}
              </div>
            ))}
          </aside>

          {/* Main — mirrors the dashboard hero + stats */}
          <div className="space-y-4 p-4 sm:p-5">
            <div>
              <p className="text-sm tracking-tight text-foreground">
                Welcome back,{" "}
                <span className="font-serif italic">Daksh</span>
              </p>
            </div>

            {/* Continue Learning hero */}
            <div className="card-hero rounded-2xl p-5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/15 px-2.5 py-0.5 text-[10px] font-medium text-brand">
                <span className="size-1 rounded-full bg-brand" />
                Continue where you left off
              </span>
              <p className="mt-3 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                Arrays · Medium
              </p>
              <p className="mt-1 font-serif text-xl italic text-foreground">
                Kadane&rsquo;s Algorithm
              </p>
              <div className="mt-3 flex items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="mb-1 flex items-center justify-between text-[10px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1 text-success">
                      <CheckCircle2 className="size-3" /> 137 solved
                    </span>
                    <span>30%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                    <div className="h-full w-[30%] rounded-full bg-gradient-to-r from-brand to-[#b9b3ff]" />
                  </div>
                </div>
                <div className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-foreground px-3 text-xs font-medium text-background">
                  <Play className="size-3" /> Resume
                </div>
              </div>
            </div>

            {/* Stats strip */}
            <div className="grid grid-cols-3 gap-3">
              {stats.map((s) => (
                <div key={s.label} className="surface rounded-xl p-3">
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <s.icon className={`size-3 ${s.accent}`} />
                    {s.label}
                  </div>
                  <div className="mt-1.5 flex items-baseline gap-1">
                    <span className="text-lg text-foreground">{s.value}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {s.sub}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
