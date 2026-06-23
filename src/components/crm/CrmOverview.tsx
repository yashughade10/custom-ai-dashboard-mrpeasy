"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import MetricCard from "@/components/analytics/MetricCard";
import SimpleTable from "@/components/analytics/SimpleTable";
import DealsPipelineChart from "@/components/crm/charts/DealsPipelineChart";
import LifecycleDonutChart from "@/components/crm/charts/LifecycleDonutChart";
import IndustryBreakdownChart from "@/components/crm/charts/IndustryBreakdownChart";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Building2, Handshake, DollarSign } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchCrmStats, fetchDealsPipeline, fetchLifecycles, fetchIndustries, fetchDeals } from "@/services/api";

export default function CrmOverview() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["crm-stats"],
    queryFn: fetchCrmStats,
  });

  const { data: pipelineData, isLoading: pipelineLoading } = useQuery({
    queryKey: ["crm-pipeline"],
    queryFn: fetchDealsPipeline,
  });

  const { data: lifecycleData, isLoading: lifecycleLoading } = useQuery({
    queryKey: ["crm-lifecycle"],
    queryFn: fetchLifecycles,
  });

  const { data: industryData, isLoading: industryLoading } = useQuery({
    queryKey: ["crm-industry"],
    queryFn: fetchIndustries,
  });

  const { data: recentDealsData, isLoading: recentDealsLoading } = useQuery({
    queryKey: ["crm-recent-deals"],
    queryFn: () => fetchDeals({ page: 1 }),
  });

  if (statsLoading || pipelineLoading || lifecycleLoading || industryLoading || recentDealsLoading) {
    return (
      <div className="space-y-8">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Skeleton className="h-32 w-full rounded-3xl" />
          <Skeleton className="h-32 w-full rounded-3xl" />
          <Skeleton className="h-32 w-full rounded-3xl" />
          <Skeleton className="h-32 w-full rounded-3xl" />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-[400px] w-full rounded-xl" />
          <Skeleton className="h-[400px] w-full rounded-xl" />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-[400px] w-full rounded-xl" />
          <Skeleton className="h-[400px] w-full rounded-xl" />
        </div>
      </div>
    );
  }

  const recentDeals = recentDealsData?.data?.slice(0, 10) || [];

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Total Contacts"
          value={stats?.total_contacts?.toString() || "0"}
          icon={Users}
          accentClass="bg-[#DBEAFE] text-[#1D4ED8]"
        />
        <MetricCard
          title="Total Companies"
          value={stats?.total_companies?.toString() || "0"}
          icon={Building2}
          accentClass="bg-[#FFEDD5] text-[#C2410C]"
        />
        <MetricCard
          title="Total Deals"
          value={stats?.total_deals?.toString() || "0"}
          icon={Handshake}
          accentClass="bg-[#FEF9C3] text-[#A16207]"
        />
        <MetricCard
          title="Pipeline Value"
          value={`$${Number(stats?.total_pipeline_value || 0).toLocaleString()}`}
          subtitle={`${stats?.won_deals || 0} won deals`}
          icon={DollarSign}
          accentClass="bg-[#DCFCE7] text-[#166534]"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Deals by Pipeline Stage</CardTitle>
            <CardDescription>Value of deals in each stage.</CardDescription>
          </CardHeader>
          <CardContent>
            <DealsPipelineChart data={pipelineData || []} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contacts by Lifecycle</CardTitle>
            <CardDescription>Distribution of contacts across lifecycle stages.</CardDescription>
          </CardHeader>
          <CardContent>
            <LifecycleDonutChart data={lifecycleData || []} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Industries</CardTitle>
            <CardDescription>Number of companies per industry.</CardDescription>
          </CardHeader>
          <CardContent>
            <IndustryBreakdownChart data={industryData || []} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Deals</CardTitle>
            <CardDescription>Latest 10 deals created or updated.</CardDescription>
          </CardHeader>
          <CardContent>
            <SimpleTable
              columns={[
                { key: "dealname", label: "Deal Name" },
                { key: "dealstage", label: "Stage" },
                { key: "amount", label: "Amount", align: "right" },
              ]}
              rows={recentDeals.map((deal: any) => ({
                dealname: deal.dealname,
                dealstage: (
                  <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-primary/10 text-primary">
                    {deal.dealstage}
                  </span>
                ),
                amount: `$${Number(deal.amount).toLocaleString()}`,
              }))}
              emptyLabel="No recent deals found"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
