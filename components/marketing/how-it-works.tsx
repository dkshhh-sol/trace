const steps = [
  {
    step: "01",
    title: "Pick a roadmap",
    body: "Sign in with Google and choose a path. Start with Striver A2Z or any roadmap that matches your goal.",
  },
  {
    step: "02",
    title: "Learn & solve",
    body: "Watch the mapped lecture, jump to the right timestamp, then solve the linked problem on your favourite judge.",
  },
  {
    step: "03",
    title: "Track & revise",
    body: "Mark progress, capture notes, and let spaced revision resurface problems right when you're about to forget them.",
  },
];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="scroll-mt-24 border-y border-white/[0.06] bg-muted/40"
    >
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium text-brand">How it works</p>
          <h2 className="mt-3 text-3xl tracking-tight sm:text-4xl">
            From lost to{" "}
            <span className="font-serif italic text-muted-foreground">
              interview-ready
            </span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            Three steps, one workspace. Trace removes the friction between
            learning something and actually practising it.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-8 md:grid-cols-3">
          {steps.map((s, i) => (
            <div key={s.step} className="relative">
              {i < steps.length - 1 && (
                <div className="absolute left-6 top-12 hidden h-px w-[calc(100%-1rem)] bg-gradient-to-r from-white/15 to-transparent md:block" />
              )}
              <div className="grid size-12 place-items-center rounded-xl border border-white/[0.08] bg-card font-serif text-lg text-brand">
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
