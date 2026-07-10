"use client";

import AnalyticsDashboard from "@/components/analytics/AnalyticsDashboard";
import { RouteGuard } from "@/components/auth/RouteGuard";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { fetchAnalytics } from "@/services/api";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

function DashboardPage() {
  const {
    data: analytics,
    error: analyticsError,
    isLoading: analyticsLoading,
  } = useQuery({
    queryKey: ["analytics"],
    queryFn: fetchAnalytics,
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Dashboard Overview</h1>
          <p className="text-sm text-muted-foreground">
            Core operational and revenue overview from your MRP analytics feed.
          </p>
        </div>

        <Link
          href="/dashboard/ai-analytics"
          className={cn(buttonVariants({ variant: "default" }), "gap-2")}
        >
          Open AI Analytics
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <AnalyticsDashboard
        analytics={analytics ?? null}
        isLoading={analyticsLoading}
        error={analyticsError ? "Failed to load analytics." : null}
      />
    </div>
  );
}

function WelcomeDashboard() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-3xl font-bold tracking-tight">Welcome to the Dashboard</h2>
      <p className="text-muted-foreground max-w-md">
        Select a module from the sidebar to get started. More dashboard features will be available here soon.
      </p>
    </div>
  );
}

export default function DashboardPageGuarded() {
  return (
    <RouteGuard module="dashboard" fallback={<WelcomeDashboard />}>
      <DashboardPage />
    </RouteGuard>
  );
}
