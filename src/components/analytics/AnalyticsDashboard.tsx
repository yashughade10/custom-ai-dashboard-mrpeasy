"use client";

import MetricCard from "@/components/analytics/MetricCard";
import SectionHeader from "@/components/analytics/SectionHeader";
import SimpleTable from "@/components/analytics/SimpleTable";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  buildAnalytics,
  formatCurrency,
  formatDays,
  formatNumber,
  formatPercent,
  RawOrder,
} from "@/lib/analytics";
import {
  AlertTriangle,
  Calendar,
  Clock,
  Package,
  RefreshCw,
  TrendingUp,
  Truck,
  Users,
} from "lucide-react";
import React from "react";

type AnalyticsDashboardProps = {
  orders: RawOrder[];
};

const PERIOD_LABELS: Record<string, string> = {
  day: "Daily",
  week: "Weekly",
  month: "Monthly",
  none: "Trend",
};

export default function AnalyticsDashboard({ orders }: AnalyticsDashboardProps) {
  const analytics = React.useMemo(() => buildAnalytics(orders ?? []), [orders]);
  const currency = analytics.currency;

  const trendLabel = analytics.revenue.trend.period === "none"
    ? "Not enough data"
    : analytics.revenue.trend.changePct === null
      ? "Trend building"
      : `${analytics.revenue.trend.changePct.toFixed(1)}% ${analytics.revenue.trend.direction}`;

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Revenue Analytics"
        subtitle="Track revenue flow, growth momentum, and top contributors."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Total Revenue"
          value={formatCurrency(analytics.totals.totalRevenue, currency)}
          subtitle={`${analytics.totals.totalOrders} orders`}
          icon={TrendingUp}
        />
        <MetricCard
          title="Average Order Value"
          value={formatCurrency(analytics.totals.averageOrderValue, currency)}
          subtitle="Across all orders"
          icon={Calendar}
        />
        <MetricCard
          title="Growth Trend"
          value={trendLabel}
          subtitle={PERIOD_LABELS[analytics.revenue.trend.period] + " comparison"}
          icon={RefreshCw}
        />
        <MetricCard
          title="Top Customers (80/20)"
          value={
            analytics.customers.pareto.totalCustomers
              ? `${analytics.customers.pareto.topCustomerCount} of ${analytics.customers.pareto.totalCustomers}`
              : "Not enough data"
          }
          subtitle={
            analytics.customers.pareto.shareOfRevenue !== null
              ? `${(analytics.customers.pareto.shareOfRevenue * 100).toFixed(1)}% of revenue`
              : ""
          }
          icon={Users}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Revenue Per Day</CardTitle>
            <CardDescription>Daily totals based on order created date.</CardDescription>
          </CardHeader>
          <CardContent>
            <SimpleTable
              columns={[
                { key: "date", label: "Date" },
                { key: "revenue", label: "Revenue", align: "right" },
              ]}
              rows={analytics.revenue.perDay.map((point) => ({
                date: point.key,
                revenue: formatCurrency(point.revenue, currency),
              }))}
              emptyLabel="No daily revenue yet"
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Revenue Per Week</CardTitle>
            <CardDescription>Weeks start on Monday (UTC).</CardDescription>
          </CardHeader>
          <CardContent>
            <SimpleTable
              columns={[
                { key: "week", label: "Week Start" },
                { key: "revenue", label: "Revenue", align: "right" },
              ]}
              rows={analytics.revenue.perWeek.map((point) => ({
                week: point.key,
                revenue: formatCurrency(point.revenue, currency),
              }))}
              emptyLabel="No weekly revenue yet"
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Revenue Per Month</CardTitle>
            <CardDescription>Monthly totals based on order created date.</CardDescription>
          </CardHeader>
          <CardContent>
            <SimpleTable
              columns={[
                { key: "month", label: "Month" },
                { key: "revenue", label: "Revenue", align: "right" },
              ]}
              rows={analytics.revenue.perMonth.map((point) => ({
                month: point.key,
                revenue: formatCurrency(point.revenue, currency),
              }))}
              emptyLabel="No monthly revenue yet"
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Selling Products</CardTitle>
            <CardDescription>Ranked by revenue and quantity.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">By Revenue</p>
              <SimpleTable
                columns={[
                  { key: "product", label: "Product" },
                  { key: "revenue", label: "Revenue", align: "right" },
                ]}
                rows={analytics.products.topByRevenue.map((product) => ({
                  product: product.code ? `${product.name} (${product.code})` : product.name,
                  revenue: formatCurrency(product.revenue, currency),
                }))}
                emptyLabel="No product revenue yet"
              />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">By Quantity</p>
              <SimpleTable
                columns={[
                  { key: "product", label: "Product" },
                  { key: "quantity", label: "Quantity", align: "right" },
                ]}
                rows={analytics.products.topByQuantity.map((product) => ({
                  product: product.code ? `${product.name} (${product.code})` : product.name,
                  quantity: formatNumber(product.quantity),
                }))}
                emptyLabel="No product quantities yet"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue By Customer</CardTitle>
            <CardDescription>Top customers and revenue concentration.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <SimpleTable
              columns={[
                { key: "customer", label: "Customer" },
                { key: "revenue", label: "Revenue", align: "right" },
              ]}
              rows={analytics.customers.topByRevenue.map((customer) => ({
                customer: customer.customerName,
                revenue: formatCurrency(customer.revenue, currency),
              }))}
              emptyLabel="No customer revenue yet"
            />
            <div className="rounded-md border px-3 py-2 text-sm text-muted-foreground">
              {analytics.customers.pareto.totalCustomers === 0
                ? "Not enough data to calculate revenue concentration."
                : `${analytics.customers.pareto.topCustomerCount} customers contribute ${
                    ((analytics.customers.pareto.shareOfRevenue ?? 0) * 100).toFixed(1)
                  }% of revenue.`}
            </div>
          </CardContent>
        </Card>
      </div>

      <SectionHeader
        title="Operations Analytics"
        subtitle="Monitor fulfillment, delivery performance, and production pipeline health."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Fulfillment Time"
          value={formatDays(analytics.operations.fulfillment.avgDays)}
          subtitle={
            analytics.operations.fulfillment.count
              ? `Median ${formatDays(analytics.operations.fulfillment.medianDays)} across ${analytics.operations.fulfillment.count} orders`
              : "No delivered orders yet"
          }
          icon={Clock}
        />
        <MetricCard
          title="On-Time Delivery"
          value={formatPercent(analytics.operations.onTimeRate)}
          subtitle="Delivered on or before promise date"
          icon={Truck}
        />
        <MetricCard
          title="Delayed Orders"
          value={formatNumber(analytics.operations.delayedOrders.length)}
          subtitle="Orders delivered after promise date"
          icon={AlertTriangle}
        />
        <MetricCard
          title="Production Cycle"
          value="Needs start date"
          subtitle="Manufacturing start date not available"
          icon={RefreshCw}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Delayed Orders</CardTitle>
            <CardDescription>Orders delivered after the promised date.</CardDescription>
          </CardHeader>
          <CardContent>
            <SimpleTable
              columns={[
                { key: "order", label: "Order" },
                { key: "customer", label: "Customer" },
                { key: "daysLate", label: "Days Late", align: "right" },
              ]}
              rows={analytics.operations.delayedOrders.map((order) => ({
                order: order.code ?? "-",
                customer: order.customerName,
                daysLate: order.daysLate.toFixed(1),
              }))}
              emptyLabel="No delayed orders found"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Manufacturing Status</CardTitle>
            <CardDescription>Status count from manufacturing orders.</CardDescription>
          </CardHeader>
          <CardContent>
            <SimpleTable
              columns={[
                { key: "status", label: "Status" },
                { key: "count", label: "Count", align: "right" },
              ]}
              rows={analytics.operations.productionStatuses.map((status) => ({
                status: status.status,
                count: formatNumber(status.count),
              }))}
              emptyLabel="No manufacturing status data"
            />
            <div className="mt-3 rounded-md border px-3 py-2 text-sm text-muted-foreground">
              Production cycle time requires manufacturing start dates to be tracked.
            </div>
          </CardContent>
        </Card>
      </div>

      <SectionHeader
        title="Inventory Analytics"
        subtitle="Identify fast movers and potential stock risks."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Fast Moving SKUs</CardTitle>
            <CardDescription>High frequency and quantity items.</CardDescription>
          </CardHeader>
          <CardContent>
            <SimpleTable
              columns={[
                { key: "sku", label: "SKU" },
                { key: "frequency", label: "Frequency", align: "right" },
                { key: "quantity", label: "Quantity", align: "right" },
              ]}
              rows={analytics.products.fastMoving.map((product) => ({
                sku: product.code ? `${product.name} (${product.code})` : product.name,
                frequency: formatNumber(product.frequency),
                quantity: formatNumber(product.quantity),
              }))}
              emptyLabel="No SKU movement yet"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dead Stock</CardTitle>
            <CardDescription>Items that do not appear in orders.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border px-3 py-2 text-sm text-muted-foreground">
              {analytics.inventory.deadStockNote}
            </div>
          </CardContent>
        </Card>
      </div>

      <SectionHeader
        title="Customer Analytics"
        subtitle="Spot repeat business and lifetime value at a glance."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Repeat Customers"
          value={formatNumber(analytics.customers.repeatCount)}
          subtitle={
            analytics.customers.repeatRate === null
              ? "Not enough data"
              : `${(analytics.customers.repeatRate * 100).toFixed(1)}% of customers`
          }
          icon={Users}
        />
        <MetricCard
          title="Customer Lifetime Value"
          value={formatCurrency(
            analytics.customers.clvTop[0]?.revenue ?? 0,
            currency
          )}
          subtitle={analytics.customers.clvTop[0]?.customerName ?? "Top customer"}
          icon={TrendingUp}
        />
        <MetricCard
          title="Average Order Value"
          value={formatCurrency(analytics.totals.averageOrderValue, currency)}
          subtitle="Total revenue / orders"
          icon={Package}
        />
        <MetricCard
          title="Total Customers"
          value={formatNumber(analytics.customers.pareto.totalCustomers)}
          subtitle="Unique customers"
          icon={Users}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Customer CLV</CardTitle>
            <CardDescription>Lifetime revenue per customer.</CardDescription>
          </CardHeader>
          <CardContent>
            <SimpleTable
              columns={[
                { key: "customer", label: "Customer" },
                { key: "orders", label: "Orders", align: "right" },
                { key: "revenue", label: "Revenue", align: "right" },
              ]}
              rows={analytics.customers.clvTop.map((customer) => ({
                customer: customer.customerName,
                orders: formatNumber(customer.orders),
                revenue: formatCurrency(customer.revenue, currency),
              }))}
              emptyLabel="No customer history yet"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Customer Segmentation</CardTitle>
            <CardDescription>Quick view of repeat vs one-time buyers.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">
                Repeat: {formatNumber(analytics.customers.repeatCount)}
              </Badge>
              <Badge variant="outline">
                One-time: {formatNumber(
                  Math.max(
                    analytics.customers.pareto.totalCustomers - analytics.customers.repeatCount,
                    0
                  )
                )}
              </Badge>
            </div>
            <div className="mt-3 text-sm text-muted-foreground">
              Repeat customers are defined as those with more than one order.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
