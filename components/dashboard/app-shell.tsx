import { Sidebar } from "./sidebar";
import { BottomNav } from "./bottom-nav";
import { UserMenu } from "./user-menu";
import { Logo } from "@/components/ui/logo";

type SessionUser = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

/**
 * Authenticated layout frame (Server Component). Wraps protected pages with the
 * responsive navigation shell: sidebar (desktop/tablet), bottom nav (mobile),
 * and a top bar carrying the account menu. Only the interactive pieces
 * (sidebar, bottom nav, user menu) are Client Components (Requirement 10).
 */
export function AppShell({
  user,
  children,
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh">
      <Sidebar />

      {/* Content column, offset for the sidebar on md+ */}
      <div className="md:pl-16 lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-border bg-background/80 px-4 backdrop-blur-xl sm:px-6">
          {/* Logo shows on mobile where the sidebar is hidden */}
          <div className="md:hidden">
            <Logo />
          </div>
          <div className="flex flex-1 items-center justify-end">
            <UserMenu user={user} />
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl px-4 pb-24 pt-6 sm:px-6 md:pb-10">
          {children}
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
