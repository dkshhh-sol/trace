import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Trace brand lockup: the logo glyph (public/logo.png) plus the optional
 * wordmark. The glyph is the square brand mark; the wordmark can be hidden
 * (e.g. the collapsed sidebar rail).
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
      <Image
        src="/logo.png"
        alt="Trace"
        width={32}
        height={32}
        priority
        className="size-8 rounded-[10px] object-contain"
      />
      {showWordmark && (
        <span className="text-[17px] font-semibold tracking-tight text-foreground">
          Trace
        </span>
      )}
    </span>
  );
}
