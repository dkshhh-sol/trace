import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getAdminSession,
  passwordRequired,
  isUnlocked,
} from "@/lib/auth/admin";
import { Console } from "@/components/admin/console";
import { AdminGate } from "@/components/admin/admin-gate";

// Never advertise or index this route; always render per-request.
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Trace Console",
  robots: { index: false, follow: false },
};

export default async function TraceConsolePage() {
  const session = await getAdminSession();
  // Hide the route's existence from non-admins.
  if (!session) notFound();

  if (passwordRequired() && !(await isUnlocked())) {
    return <AdminGate />;
  }

  return <Console adminEmail={session.user.email ?? ""} />;
}
