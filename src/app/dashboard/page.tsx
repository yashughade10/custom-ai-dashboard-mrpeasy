"use client";

import AnalyticsDashboard from "@/components/analytics/AnalyticsDashboard";
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

export default DashboardPage;
