import { ArrowUpRight } from "lucide-react";

const roadmaps = [
  {
    title: "Striver A2Z",
    desc: "The complete DSA sheet — 450+ problems from basics to advanced.",
    tag: "Available now",
    available: true,
  },
  {
    title: "Blind 75",
    desc: "The classic must-solve list for focused interview prep.",
    tag: "Coming soon",
    available: false,
  },
  {
    title: "NeetCode 150",
    desc: "Pattern-based practice across every core topic.",
    tag: "Coming soon",
    available: false,
  },
  {
    title: "Dynamic Programming",
    desc: "Master DP from first principles to hard problems.",
    tag: "Coming soon",
    available: false,
  },
  {
    title: "Graph Theory",
    desc: "Traversals, shortest paths, MST and beyond.",
    tag: "Coming soon",
    available: false,
  },
  {
    title: "System Design",
    desc: "Scalable architecture for senior interviews.",
    tag: "Coming soon",
    available: false,
  },
];

export function Roadmaps() {
  return (
    <section id="roadmaps" className="scroll-mt-24">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium text-brand">Roadmaps</p>
          <h2 className="mt-3 text-3xl tracking-tight sm:text-4xl">
            Start with Striver A2Z.{" "}
            <span className="font-serif italic text-muted-foreground">
              More on the way.
            </span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            Every roadmap is fully content-driven, so new paths ship
            continuously — no waiting on updates.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {roadmaps.map((r) => (
            <div
              key={r.title}
              className={`group relative overflow-hidden rounded-2xl border p-6 transition-colors ${
                r.available
                  ? "border-brand/30 bg-gradient-to-b from-brand/[0.08] to-card hover:border-brand/50"
                  : "border-white/[0.06] bg-card hover:border-white/[0.12]"
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${
                    r.available
                      ? "bg-brand/15 text-brand"
                      : "bg-white/[0.05] text-muted-foreground"
                  }`}
                >
                  {r.available && (
                    <span className="size-1.5 rounded-full bg-brand" />
                  )}
                  {r.tag}
                </span>
                {r.available && (
                  <ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                )}
              </div>
              <h3 className="mt-4 text-lg font-semibold text-foreground">
                {r.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {r.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
