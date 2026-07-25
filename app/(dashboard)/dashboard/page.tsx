import { Suspense } from "react";
import type { Metadata } from "next";
import { getSession } from "@/lib/auth/guards";
import { ContinueLearning } from "@/components/dashboard/widgets/continue-learning";
import { GoalCard } from "@/components/dashboard/goal-card";
import { ActivityWidget } from "@/components/dashboard/activity-widget";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const session = await getSession();
  const firstName = session?.user?.name?.split(" ")[0] ?? "there";

  return (
    <div className="relative">
      <div className="app-glow" aria-hidden="true" />

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl tracking-tight">
            Welcome back,{" "}
            <span className="font-serif italic text-gradient">{firstName}</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Everything you need to finish Striver A2Z, in one place.
          </p>
        </div>

        <Suspense fallback={<Skeleton className="h-64 w-full rounded-3xl" />}>
          <ContinueLearning />
        </Suspense>

        <Suspense fallback={<Skeleton className="h-44 w-full rounded-2xl" />}>
          <GoalCard />
        </Suspense>

        <Suspense fallback={<Skeleton className="h-72 w-full rounded-2xl" />}>
          <ActivityWidget />
        </Suspense>
      </div>
    </div>
  );
}
