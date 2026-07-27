import { ListChecks, Code2, GitCommit, LineChart, Target, RotateCcw } from "lucide-react";

const pillars = [
  {
    icon: ListChecks,
    title: "Lecture + Problem Mapping",
    body: "Every Striver lecture is connected to its exact LeetCode and GFG problem. 449 problems, zero manual searching.",
  },
  {
    icon: Code2,
    title: "Built-in IDE",
    body: "Solve in C, C++, Java or Python without leaving Trace. Resize the editor beside the lecture, save your code, and reopen it later.",
  },
  {
    icon: GitCommit,
    title: "GitHub Sync",
    body: "Connect GitHub once, then commit your solution directly from the editor with one click. No copying, no Git terminal.",
  },
  {
    icon: LineChart,
    title: "Progress Tracking",
    body: "A GitHub-style activity graph, streaks and analytics that show exactly how consistent you've been.",
  },
  {
    icon: Target,
    title: "Goals & Consistency",
    body: "Daily, weekly and monthly targets with automatic progress tracking, so you always know what's left.",
  },
  {
    icon: RotateCcw,
    title: "Resume Anywhere",
    body: "Trace remembers exactly where you stopped, down to the problem and the code you were writing.",
  },
];

export function WhyTrace() {
  return (
    <section id="why" className="scroll-mt-24 mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-32">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-medium text-brand">Why Trace</p>
        <h2 className="mt-3 text-3xl tracking-tight sm:text-4xl">
          Not another sheet,{" "}
          <span className="font-serif italic text-muted-foreground">
            a full workspace
          </span>
        </h2>
      </div>

      <div className="mt-14 grid grid-cols-1 gap-4 md:grid-cols-3">
        {pillars.map((p) => (
          <div key={p.title} className="surface surface-hover rounded-2xl p-6">
            <div className="grid size-11 place-items-center rounded-xl bg-brand/10 text-brand">
              <p.icon className="size-5" />
            </div>
            <h3 className="mt-5 text-base font-semibold text-foreground">
              {p.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {p.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
