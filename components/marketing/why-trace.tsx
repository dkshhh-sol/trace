import { MonitorPlay, ListChecks, LineChart } from "lucide-react";

const pillars = [
  {
    icon: MonitorPlay,
    title: "Watch inside Trace",
    body: "Every problem is mapped to its lecture. Watch it embedded, right next to the problem. No new tabs, no hunting through playlists.",
  },
  {
    icon: ListChecks,
    title: "The whole sheet, organized",
    body: "All 450+ problems in Striver's order, with LeetCode and GeeksforGeeks links one click away. Solve, then tick it off.",
  },
  {
    icon: LineChart,
    title: "Progress that follows you",
    body: "Your solved problems and place in the sheet are saved to your account and synced everywhere. Trace always knows what's next.",
  },
];

export function WhyTrace() {
  return (
    <section id="why" className="scroll-mt-24 mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-32">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-medium text-brand">Why Trace</p>
        <h2 className="mt-3 text-3xl tracking-tight sm:text-4xl">
          One workspace,{" "}
          <span className="font-serif italic text-muted-foreground">
            not five tabs
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
