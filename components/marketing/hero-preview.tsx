import {
  LayoutDashboard,
  Map,
  NotebookPen,
  Bookmark,
  RotateCcw,
  BarChart3,
  Play,
  CheckCircle2,
  Circle,
} from "lucide-react";

const sidebarItems = [
  { icon: LayoutDashboard, label: "Dashboard", active: true },
  { icon: Map, label: "Roadmaps" },
  { icon: NotebookPen, label: "Notes" },
  { icon: Bookmark, label: "Bookmarks" },
  { icon: RotateCcw, label: "Revision" },
  { icon: BarChart3, label: "Analytics" },
];

const problems = [
  { name: "Two Sum", done: true },
  { name: "Best Time to Buy & Sell Stock", done: true },
  { name: "Longest Substring Without Repeat", done: false },
  { name: "Trapping Rain Water", done: false },
];

export function HeroPreview() {
  return (
    <div className="relative mx-auto max-w-5xl">
      <div className="absolute inset-x-8 -bottom-6 -z-10 h-24 rounded-full bg-brand/20 blur-3xl" />
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-card shadow-2xl shadow-black/60">
        {/* Window chrome */}
        <div className="flex items-center gap-2 border-b border-white/[0.06] bg-white/[0.02] px-4 py-3">
          <div className="flex gap-1.5">
            <span className="size-3 rounded-full bg-white/15" />
            <span className="size-3 rounded-full bg-white/15" />
            <span className="size-3 rounded-full bg-white/15" />
          </div>
          <div className="mx-auto flex items-center gap-2 rounded-md border border-white/[0.06] bg-background/60 px-3 py-1 text-xs text-muted-foreground">
            trace.dev/roadmap/striver-a2z
          </div>
        </div>

        {/* Body */}
        <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr]">
          {/* Sidebar */}
          <aside className="hidden flex-col gap-1 border-r border-white/[0.06] p-3 sm:flex">
            {sidebarItems.map((item) => (
              <div
                key={item.label}
                className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm ${
                  item.active
                    ? "bg-white/[0.06] text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                <item.icon className="size-4" />
                {item.label}
              </div>
            ))}
          </aside>

          {/* Main content: lecture + problems split */}
          <div className="grid grid-cols-1 gap-4 p-4 lg:grid-cols-2">
            {/* Lecture player */}
            <div className="flex flex-col gap-3">
              <div className="relative grid aspect-video place-items-center overflow-hidden rounded-xl border border-white/[0.06] bg-gradient-to-br from-white/[0.05] to-transparent">
                <div className="grid size-12 place-items-center rounded-full bg-foreground/90 text-background">
                  <Play className="size-5 translate-x-0.5" />
                </div>
                <span className="absolute bottom-3 right-3 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] text-white/80">
                  18:24
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  Arrays: Two Pointer Technique
                </p>
                <p className="text-xs text-muted-foreground">
                  Topic 3 · Lecture 2
                </p>
              </div>
            </div>

            {/* Problem list */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-foreground">
                  Practice problems
                </p>
                <span className="rounded-md border border-white/[0.06] px-1.5 py-0.5 text-[10px] text-muted-foreground">
                  2 / 4 solved
                </span>
              </div>
              <div className="flex flex-col gap-1.5">
                {problems.map((p) => (
                  <div
                    key={p.name}
                    className="flex items-center gap-2.5 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2"
                  >
                    {p.done ? (
                      <CheckCircle2 className="size-4 shrink-0 text-brand" />
                    ) : (
                      <Circle className="size-4 shrink-0 text-muted-foreground" />
                    )}
                    <span
                      className={`truncate text-xs ${
                        p.done
                          ? "text-muted-foreground line-through"
                          : "text-foreground"
                      }`}
                    >
                      {p.name}
                    </span>
                  </div>
                ))}
              </div>

              {/* Progress bar */}
              <div className="mt-1">
                <div className="mb-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>Roadmap progress</span>
                  <span>47%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                  <div className="h-full w-[47%] rounded-full bg-gradient-to-r from-brand to-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
