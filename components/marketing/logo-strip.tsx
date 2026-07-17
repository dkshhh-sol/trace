const items = [
  "Striver A2Z",
  "Blind 75",
  "NeetCode 150",
  "LeetCode",
  "GeeksforGeeks",
  "Codeforces",
];

export function LogoStrip() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
      <p className="text-center text-xs uppercase tracking-[0.2em] text-muted-foreground">
        Built to organize the resources you already use
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 sm:gap-x-12">
        {items.map((item) => (
          <span
            key={item}
            className="text-lg font-medium tracking-tight text-muted-foreground/70 transition-colors hover:text-foreground"
          >
            {item}
          </span>
        ))}
      </div>
    </section>
  );
}
