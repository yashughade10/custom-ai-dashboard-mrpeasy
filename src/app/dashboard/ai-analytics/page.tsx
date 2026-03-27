"use client";

import AIAnalyticsChat from "@/components/analytics/AIAnalyticsChat";
import AIAnalyticsDashboard from "@/components/analytics/AIAnalyticsDashboard";
import { Button } from "@/components/ui/button";
import { fetchAIReport } from "@/services/api";
import { useQuery } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";

export default function AIAnalyticsPage() {
  const {
    data: aiReport,
    error: aiReportError,
    isLoading: aiReportLoading,
    refetch: refetchAIReport,
    isFetching: aiReportFetching,
  } = useQuery({
    queryKey: ["ai-report"],
    queryFn: () => fetchAIReport(false),
    staleTime: 2 * 60 * 1000,
  });

  return (
    <div className="space-y-8 pb-24">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">AI Analytics</h1>
          <p className="text-sm text-muted-foreground">
            Dedicated business intelligence report with forecasting and AI-generated insights.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => refetchAIReport()}
          disabled={aiReportLoading || aiReportFetching}
        >
          <RefreshCw className={`h-4 w-4 ${aiReportFetching ? "animate-spin" : ""}`} />
          Refresh AI Report
        </Button>
      </div>

      <AIAnalyticsDashboard
        report={aiReport ?? null}
        isLoading={aiReportLoading}
        error={aiReportError ? "Failed to generate AI analytics report." : null}
      />

      <AIAnalyticsChat />
    </div>
  );
}
