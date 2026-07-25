const steps = [
  {
    step: "01",
    title: "Open the sheet",
    body: "Sign in with Google and open Striver A2Z. Trace drops you exactly at your next unsolved problem.",
  },
  {
    step: "02",
    title: "Watch & solve",
    body: "Watch the mapped lecture embedded in Trace, then jump to LeetCode or GeeksforGeeks to solve it.",
  },
  {
    step: "03",
    title: "Track & continue",
    body: "Mark it done, and your progress saves to your account while Trace surfaces the next problem automatically.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-24 border-y border-white/[0.06] bg-muted/40">
      <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-32">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium text-brand">How it works</p>
          <h2 className="mt-3 text-3xl tracking-tight sm:text-4xl">
            From lost to{" "}
            <span className="font-serif italic text-muted-foreground">
              interview-ready
            </span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            Three steps, one workspace. No tab-switching between lectures,
            problems and a spreadsheet.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-8 md:grid-cols-3">
          {steps.map((s, i) => (
            <div key={s.step} className="relative">
              {i < steps.length - 1 && (
                <div className="absolute left-6 top-12 hidden h-px w-[calc(100%-1rem)] bg-gradient-to-r from-white/15 to-transparent md:block" />
              )}
              <div className="surface grid size-12 place-items-center rounded-xl font-serif text-lg text-brand">
                {s.step}
              </div>
              <h3 className="mt-5 text-lg font-semibold text-foreground">
                {s.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
