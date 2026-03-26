"use client";
import AnalyticsDashboard from "@/components/analytics/AnalyticsDashboard";
import { fetchAnalytics, fetchOrders } from "@/services/api";
import { useQuery } from "@tanstack/react-query";

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
      <div>
        <h1 className="text-xl font-bold">Dashboard</h1>
        <p>Welcome to the dashboard! This is where you can manage your view analytics, and more.</p>
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
