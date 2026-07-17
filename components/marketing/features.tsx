import {
  Map,
  MonitorPlay,
  Code2,
  NotebookPen,
  RotateCcw,
  LineChart,
} from "lucide-react";

const features = [
  {
    icon: Map,
    title: "Structured roadmaps",
    body: "Follow curated paths like Striver A2Z, topic by topic. Trace always surfaces the next thing to learn, so you never lose the thread.",
  },
  {
    icon: MonitorPlay,
    title: "Lecture workspace",
    body: "Watch embedded lessons in a distraction-free split view. Jump straight to the exact timestamp mapped to each problem.",
  },
  {
    icon: Code2,
    title: "Problem workspace",
    body: "Every problem's context, hints and links in one place. Solve on LeetCode or GFG, then track completion independently.",
  },
  {
    icon: NotebookPen,
    title: "Markdown notes",
    body: "Private, auto-saving notes with rich code blocks attached to any problem, topic or lecture. Search across everything.",
  },
  {
    icon: RotateCcw,
    title: "Spaced revision",
    body: "Add solved problems to a revision queue with smart intervals. A daily queue keeps concepts from slipping away.",
  },
  {
    icon: LineChart,
    title: "Progress analytics",
    body: "Meaningful insights, not vanity metrics: completion by difficulty, streaks, weekly activity and revision rate.",
  },
];

export function Features() {
  return (
    <section id="features" className="scroll-mt-24">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium text-brand">Everything in one place</p>
          <h2 className="mt-3 text-3xl tracking-tight sm:text-4xl">
            A complete prep workspace,{" "}
            <span className="font-serif italic text-muted-foreground">
              not another spreadsheet
            </span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            Trace connects your learning resources into a single coherent
            experience — so the tools finally get out of your way.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-2xl border border-white/[0.06] bg-card p-6 transition-colors hover:border-white/[0.12]"
            >
              <div className="grid size-11 place-items-center rounded-xl border border-white/[0.08] bg-gradient-to-b from-white/[0.06] to-transparent text-brand transition-transform group-hover:scale-105">
                <feature.icon className="size-5" />
              </div>
              <h3 className="mt-5 text-base font-semibold text-foreground">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {feature.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
