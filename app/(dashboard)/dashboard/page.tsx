import { Suspense } from "react";
import type { Metadata } from "next";
import { getSession } from "@/lib/auth/guards";
import { WidgetSkeleton } from "@/components/dashboard/widgets/widget-card";
import { ContinueLearning } from "@/components/dashboard/widgets/continue-learning";
import { DailyGoal } from "@/components/dashboard/widgets/daily-goal";
import { Streak } from "@/components/dashboard/widgets/streak";
import { RevisionQueue } from "@/components/dashboard/widgets/revision-queue";
import { RecentNotes } from "@/components/dashboard/widgets/recent-notes";
import { Bookmarks } from "@/components/dashboard/widgets/bookmarks";
import { ActivityGraph } from "@/components/dashboard/widgets/activity-graph";
import { Announcements } from "@/components/dashboard/widgets/announcements";

export const metadata: Metadata = {
  title: "Dashboard",
};

function WidgetFallback({ span }: { span?: boolean }) {
  return (
    <div
      className={`rounded-2xl border border-border bg-card p-5 ${
        span ? "sm:col-span-2" : ""
      }`}
    >
      <WidgetSkeleton />
    </div>
  );
}

export default async function DashboardPage() {
  const session = await getSession();
  const firstName = session?.user?.name?.split(" ")[0] ?? "there";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl tracking-tight">
          Welcome back,{" "}
          <span className="font-serif italic text-gradient">{firstName}</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your interview-prep workspace. Pick up where you left off.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Suspense fallback={<WidgetFallback span />}>
          <ContinueLearning />
        </Suspense>
        <Suspense fallback={<WidgetFallback />}>
          <Streak />
        </Suspense>
        <Suspense fallback={<WidgetFallback />}>
          <DailyGoal />
        </Suspense>
        <Suspense fallback={<WidgetFallback />}>
          <RevisionQueue />
        </Suspense>
        <Suspense fallback={<WidgetFallback />}>
          <RecentNotes />
        </Suspense>
        <Suspense fallback={<WidgetFallback />}>
          <Bookmarks />
        </Suspense>
        <Suspense fallback={<WidgetFallback span />}>
          <ActivityGraph />
        </Suspense>
        <Suspense fallback={<WidgetFallback />}>
          <Announcements />
        </Suspense>
      </div>
    </div>
  );
}
