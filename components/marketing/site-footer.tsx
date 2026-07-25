import Link from "next/link";
import { Logo } from "@/components/ui/logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/[0.06]">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-12 sm:flex-row sm:justify-between sm:px-6">
        <div className="flex flex-col items-center gap-3 sm:items-start">
          <Logo />
          <p className="max-w-xs text-center text-sm text-muted-foreground sm:text-left">
            The modern way to complete Striver&rsquo;s A2Z DSA Sheet.
          </p>
        </div>

        <nav className="flex items-center gap-6 text-sm text-muted-foreground">
          <Link href="#why" className="transition-colors hover:text-foreground">
            Why Trace
          </Link>
          <Link
            href="#how-it-works"
            className="transition-colors hover:text-foreground"
          >
            How it works
          </Link>
          <Link href="/login" className="transition-colors hover:text-foreground">
            Sign in
          </Link>
        </nav>
      </div>

      <div className="border-t border-white/[0.06]">
        <p className="mx-auto max-w-6xl px-4 py-6 text-center text-xs text-muted-foreground sm:px-6">
          © {new Date().getFullYear()} Trace. Not affiliated with take U forward.
        </p>
      </div>
    </footer>
  );
}
