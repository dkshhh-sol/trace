import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { SignInDialog } from "@/components/marketing/sign-in-dialog";

const navLinks = [
  { label: "Why Trace", href: "#why" },
  { label: "How it works", href: "#how-it-works" },
];

export function SiteHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mt-3 flex h-14 items-center justify-between rounded-2xl border border-white/[0.06] bg-background/70 px-3 pl-4 backdrop-blur-xl sm:mt-4">
          <Link href="/" aria-label="Trace home">
            <Logo />
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1.5">
            <SignInDialog className="hidden rounded-lg px-3 py-2 text-sm text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring sm:inline-flex">
              Sign in
            </SignInDialog>
            <SignInDialog className="inline-flex h-9 items-center rounded-lg bg-foreground px-3.5 text-sm font-medium text-background outline-none transition-transform hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.99]">
              Get started
            </SignInDialog>
          </div>
        </div>
      </div>
    </header>
  );
}
