import { cn } from "@/lib/utils";

/**
 * Trace wordmark + glyph.
 * The glyph is a "traced path": connected nodes suggesting a learning journey.
 */
export function Logo({
  className,
  showWordmark = true,
}: {
  className?: string;
  showWordmark?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span className="relative grid size-8 place-items-center rounded-[10px] border border-white/10 bg-gradient-to-b from-white/[0.08] to-transparent">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="size-[18px]"
          aria-hidden="true"
        >
          <path
            d="M4 17.5 10 11l4 3.5L20 6.5"
            stroke="url(#trace-stroke)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="4" cy="17.5" r="2" fill="#8b7cff" />
          <circle cx="20" cy="6.5" r="2" fill="#fff" />
          <defs>
            <linearGradient
              id="trace-stroke"
              x1="4"
              y1="17.5"
              x2="20"
              y2="6.5"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#8b7cff" />
              <stop offset="1" stopColor="#ffffff" />
            </linearGradient>
          </defs>
        </svg>
      </span>
      {showWordmark && (
        <span className="text-[17px] font-semibold tracking-tight text-foreground">
          Trace
        </span>
      )}
    </span>
  );
}
