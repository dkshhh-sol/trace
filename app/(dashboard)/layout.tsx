import { requireSession } from "@/lib/auth/guards";
import { AppShell } from "@/components/dashboard/app-shell";

/**
 * Protected layout for the authenticated app. `requireSession()` is the
 * authoritative server-side gate: unauthenticated visitors are redirected to
 * /login before any protected content renders (Requirements 2.1–2.3).
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();

  return <AppShell user={session.user}>{children}</AppShell>;
}
