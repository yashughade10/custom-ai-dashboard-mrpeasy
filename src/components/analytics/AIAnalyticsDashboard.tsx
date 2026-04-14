"use client";

import MetricCard from "@/components/analytics/MetricCard";
import SectionHeader from "@/components/analytics/SectionHeader";
import SimpleTable from "@/components/analytics/SimpleTable";
import ChannelPerformanceChart from "@/components/analytics/charts/ChannelPerformanceChart";
import InventoryRiskChart from "@/components/analytics/charts/InventoryRiskChart";
import OperationsHealthGaugeChart from "@/components/analytics/charts/OperationsHealthGaugeChart";
import RevenueHeatmapChart from "@/components/analytics/charts/RevenueHeatmapChart";
import SalesForecastChart from "@/components/analytics/charts/SalesForecastChart";
import TopProductsByQuantityChart from "@/components/analytics/charts/TopProductsByQuantityChart";
import TopProductsByRevenueChart from "@/components/analytics/charts/TopProductsByRevenueChart";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDays, formatNumber } from "@/lib/analytics";
import type { AIAnalyticsReport, AIInsight } from "@/lib/ai-report-types";
import { AlertTriangle, Boxes, ChartLine, Clock3, Sparkles, Users } from "lucide-react";
import React from "react";

type AIAnalyticsDashboardProps = {
  report: AIAnalyticsReport | null;
  isLoading?: boolean;
  error?: string | null;
};

function formatPct(value: number | null): string {
  if (value === null || Number.isNaN(value)) return "N/A";
  return `${value.toFixed(1)}%`;
}

function formatDate(value: string | null): string {
  if (!value) return "N/A";
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en", { month: "short", day: "2-digit", year: "numeric" }).format(date);
}

function impactBadgeVariant(impact: AIInsight["impact"]): "default" | "secondary" | "outline" {
  if (impact === "positive") return "default";
  if (impact === "negative") return "secondary";
  return "outline";
}

function priorityClass(priority: AIInsight["priority"]): string {
  if (priority === "high") return "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300";
  if (priority === "medium") return "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300";
  return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300";
}

export default function AIAnalyticsDashboard({ report, isLoading, error }: AIAnalyticsDashboardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>AI Analytics Dashboard</CardTitle>
          <CardDescription>Generating detailed report from live data and forecasts...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!report) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>AI Analytics Dashboard</CardTitle>
          <CardDescription>{error ?? "AI report is not available yet."}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const currency = report.currency;

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Advanced AI Insights"
        subtitle="Consistent analytics structure with automated insights, forecasting, and operational recommendations."
      />

      <Card id="executive-summary" className="scroll-mt-24">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" /> Executive Summary
          </CardTitle>
          <CardDescription>
            Generated {new Date(report.generatedAt).toLocaleString()} | Analysis window {formatDate(report.period.from)} - {formatDate(report.period.to)}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{report.ai.executiveSummary}</p>
          <div className="grid gap-3 md:grid-cols-2">
            {report.ai.keyInsights.map((insight) => (
              <div key={insight.id} className="rounded-md border p-3">
                <div className="mb-2 flex items-center gap-2">
                  <Badge variant={impactBadgeVariant(insight.impact)}>{insight.impact}</Badge>
                  <span className={`rounded px-2 py-0.5 text-xs font-medium ${priorityClass(insight.priority)}`}>
                    {insight.priority} priority
                  </span>
                </div>
                <p className="text-sm font-medium">{insight.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{insight.detail}</p>
                <p className="mt-2 text-xs text-muted-foreground">Evidence: {insight.evidence}</p>
                <p className="mt-1 text-xs font-medium">Action: {insight.recommendation}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Total Revenue"
          value={formatCurrency(report.kpis.totalRevenue, currency)}
          subtitle={`${formatNumber(report.kpis.totalOrders)} orders`}
          icon={ChartLine}
          accentClass="bg-[#DBEAFE] text-[#1D4ED8]"
        />
        <MetricCard
          title="Revenue Growth (MoM)"
          value={formatPct(report.kpis.revenueGrowthMonthPct)}
          subtitle={`Week-over-week ${formatPct(report.kpis.revenueGrowthWeekPct)}`}
          icon={ChartLine}
          accentClass="bg-[#FFEDD5] text-[#C2410C]"
        />
        {/* <MetricCard
          title="On-time Delivery"
          value={formatPct(report.kpis.onTimeDeliveryPct)}
          subtitle={`${formatNumber(report.kpis.delayedOrders)} delayed orders`}
          icon={Clock3}
        /> */}
        <MetricCard
          title="Repeat Customers"
          value={formatNumber(report.kpis.repeatCustomers)}
          subtitle={`${report.kpis.topCustomerSharePct.toFixed(2)}% top-customer share`}
          icon={Users}
          accentClass="bg-[#FEF9C3] text-[#A16207]"
        />
        <MetricCard
          title="Forecast (30 days)"
          value={formatCurrency(report.forecasting.sales.next30DaysTotal, currency)}
          subtitle={`7d: ${formatCurrency(report.forecasting.sales.next7DaysTotal, currency)}`}
          icon={Sparkles}
          accentClass="bg-[#DCFCE7] text-[#166534]"
        />
      </div>

      <div id="forecasting-engine" className="scroll-mt-10">
        <SectionHeader title="Forecasting Engine" subtitle="Sales, inventory, and production projections from historical trends." />
      </div>

      <div className="grid gap-6 xl:grid-cols-1">
        <Card>
          <CardHeader>
            <CardTitle>Sales Forecast (Next Quarter)</CardTitle>
            <CardDescription>{report.forecasting.sales.method}</CardDescription>
          </CardHeader>
          <CardContent>
            <SalesForecastChart points={report.forecasting.sales.points} currency={currency} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue Velocity Heatmap</CardTitle>
            <CardDescription>Weekly/day-of-week concentration of revenue.</CardDescription>
          </CardHeader>
          <CardContent>
            <RevenueHeatmapChart points={report.revenue.heatmap} currency={currency} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-1">
        <Card>
          <CardHeader>
            <CardTitle>Channel Performance</CardTitle>
            <CardDescription>Revenue, delayed orders, and on-time trend by status channel.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChannelPerformanceChart channels={report.revenue.channelPerformance} currency={currency} />
          </CardContent>
        </Card>
      </div>

      <div id="inventory-stockout-prediction" className="scroll-mt-10">
        <SectionHeader title="Inventory Prediction" subtitle="Predicted stockout scenarios for each SKU." />
      </div>
      <div className="grid gap-6 xl:grid-cols-1">
        <Card >
          <CardHeader>
            <CardTitle>Inventory Stockout Prediction</CardTitle>
            <CardDescription>SKU risk ranking by predicted stockout date.</CardDescription>
          </CardHeader>
          <CardContent>
            <InventoryRiskChart forecasts={report.forecasting.inventory} />
          </CardContent>
        </Card>
      </div>

      <div id="top-products" className="scroll-mt-10">
        <SectionHeader title="Top Products" subtitle="Best-performing products by revenue and quantity." />
      </div>
      <div className="grid gap-6 xl:grid-cols-1">
        <Card>
          <CardHeader>
            <CardTitle>Top Products by Revenue</CardTitle>
            <CardDescription>Primary contributors to revenue.</CardDescription>
          </CardHeader>
          <CardContent>
            <TopProductsByRevenueChart products={report.revenue.topByRevenue} currency={currency} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Products by Quantity</CardTitle>
            <CardDescription>Volume leaders by units sold.</CardDescription>
          </CardHeader>
          <CardContent>
            <TopProductsByQuantityChart products={report.revenue.topByQuantity} currency={currency} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Operations Health</CardTitle>
            <CardDescription>On-time delivery and projected capacity utilization.</CardDescription>
          </CardHeader>
          <CardContent>
            <OperationsHealthGaugeChart
              onTimeDeliveryPct={report.operations.onTimeDeliveryPct}
              capacityUtilizationPct={report.forecasting.production.capacityUtilizationPct}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Production Forecast</CardTitle>
            <CardDescription>Bottleneck and fulfillment outlook.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Current Fulfillment</p>
                <p className="text-lg font-semibold">{formatDays(report.forecasting.production.currentFulfillmentDays)}</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Projected Fulfillment</p>
                <p className="text-lg font-semibold">{formatDays(report.forecasting.production.projectedFulfillmentDays)}</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Workload Index</p>
                <p className="text-lg font-semibold">{report.forecasting.production.predictedWorkloadIndex}</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Bottleneck</p>
                <p className="text-lg font-semibold">{report.forecasting.production.bottleneckStatus}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div id="inventory-forecasting" className="scroll-mt-10">
        <SectionHeader title="Inventory Forecasting" subtitle="Predicted stockout and reorder suggestions for fast-moving SKUs." />
      </div>

      <Card>
        <CardContent>
          <SimpleTable
            columns={[
              { key: "sku", label: "SKU", className: "max-w-[120px] break-words whitespace-normal", },
              { key: "stock", label: "Current Stock (Est)", align: "right" },
              { key: "velocity", label: "Avg Daily Sales", align: "right" },
              { key: "stockout", label: "Predicted Stockout", align: "right" },
              { key: "reorder", label: "Suggested Reorder", align: "right" },
              { key: "risk", label: "Risk", align: "right" },
            ]}
            rows={report.forecasting.inventory.map((item) => ({
              sku: (
                <div className="max-w-[300px] break-all whitespace-normal">
                  {item.sku}
                </div>
              ),
              stock: formatNumber(item.estimatedCurrentStock),
              velocity: item.avgDailySales.toFixed(2),
              stockout:
                item.predictedStockoutDays === null
                  ? "N/A"
                  : `${item.predictedStockoutDays}d (${item.predictedStockoutDate ?? "N/A"})`,
              reorder: formatNumber(item.suggestedReorderUnits),
              risk: (
                <Badge
                  variant={item.riskLevel === "critical" || item.riskLevel === "high" ? "secondary" : "outline"}
                >
                  {item.riskLevel}
                </Badge>
              ),
            }))}
            emptyLabel="No inventory forecasts available"
          />
        </CardContent>
      </Card>

      <div id="ai-recommendations" className="scroll-mt-10">
        <SectionHeader title="AI Recommendations" subtitle="Action list grouped by business function." />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4" /> Risks
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            {report.ai.risks.map((risk) => (
              <p key={risk}>- {risk}</p>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Boxes className="h-4 w-4" /> Opportunities
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            {report.ai.opportunities.map((opportunity) => (
              <p key={opportunity}>- {opportunity}</p>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4" /> Action Plan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {report.ai.actions.map((action) => (
              <div key={`${action.owner}-${action.action}`} className="rounded-md border p-2 text-sm">
                <div className="mb-1 flex items-center justify-between">
                  <span className="font-medium">{action.owner}</span>
                  <Badge variant="outline">{action.priority}</Badge>
                </div>
                <p className="text-muted-foreground">{action.action}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
