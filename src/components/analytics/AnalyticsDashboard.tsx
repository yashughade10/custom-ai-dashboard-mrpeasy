"use client";

import MetricCard from "@/components/analytics/MetricCard";
import PaginatedSimpleTable from "@/components/analytics/PaginatedSimpleTable";
import SectionHeader from "@/components/analytics/SectionHeader";
import SimpleTable from "@/components/analytics/SimpleTable";
import OrdersOverTimeChart from "@/components/analytics/charts/OrdersOverTimeChart";
import RevenueOverTimeChart from "@/components/analytics/charts/RevenueOverTimeChart";
import CustomerContributionParetoChart from "@/components/analytics/charts/CustomerContributionParetoChart";
import RevenueByCustomerChart from "@/components/analytics/charts/RevenueByCustomerChart";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AnalyticsApiData,
  formatCurrency,
  formatDays,
  formatNumber,
  formatPercent,
  median,
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
  analytics: AnalyticsApiData | null;
  isLoading?: boolean;
  error?: string | null;
};

export default function AnalyticsDashboard({ analytics, isLoading, error }: AnalyticsDashboardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Analytics</CardTitle>
          <CardDescription>Loading analytics data.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!analytics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Analytics</CardTitle>
          <CardDescription>{error ?? "Analytics data is not available yet."}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const currency = analytics.revenue.totals.currency;
  const growth = analytics.revenue.growth?.month ?? { previous: 0, current: 0, pct: Number.NaN };
  const growthLabel = Number.isFinite(growth.pct)
    ? `${growth.pct.toFixed(2)}% month over month`
    : "Not enough data";

  const fulfillmentSamples = analytics.operations.order_fulfillment_time.samples || [];
  const fulfillmentMedian = median(fulfillmentSamples.map((sample) => sample.fulfillment_days));

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Revenue Analytics"
        subtitle="Track revenue flow, growth momentum, and top contributors."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Total Revenue"
          value={formatCurrency(analytics.revenue.totals.revenue, currency)}
          subtitle={`${analytics.revenue.totals.orders} orders`}
          icon={TrendingUp}
          accentClass="bg-[#DBEAFE] text-[#1D4ED8]"
        />
        <MetricCard
          title="Average Order Value"
          value={formatCurrency(analytics.customers.average_order_value, currency)}
          subtitle="Across all orders"
          icon={Calendar}
          accentClass="bg-[#FFEDD5] text-[#C2410C]"
        />
        <MetricCard
          title="Growth Trend"
          value={growthLabel}
          subtitle={`Prev: ${formatCurrency(growth.previous, currency)} | Current: ${formatCurrency(growth.current, currency)}`}
          icon={RefreshCw}
          accentClass="bg-[#FEF9C3] text-[#A16207]"
        />
        <MetricCard
          title="Top Customers (80/20)"
          value={`${analytics.revenue.revenue_by_customer.pareto.customers_for_80_pct} of ${analytics.revenue.revenue_by_customer.pareto.total_customers}`}
          subtitle={`${analytics.revenue.revenue_by_customer.pareto.top_20_pct_customers_share_pct.toFixed(2)}% share`}
          icon={Users}
          accentClass="bg-[#DCFCE7] text-[#166534]"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Over Time</CardTitle>
            <CardDescription>Daily revenue trend (line).</CardDescription>
          </CardHeader>
          <CardContent>
            <RevenueOverTimeChart points={analytics.revenue.over_time.day} currency={currency} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Orders Over Time</CardTitle>
            <CardDescription>Daily orders trend (bar).</CardDescription>
          </CardHeader>
          <CardContent>
            <OrdersOverTimeChart points={analytics.revenue.over_time.day} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Revenue Per Day</CardTitle>
            <CardDescription>Daily totals based on order created date.</CardDescription>
          </CardHeader>
          <CardContent>
            <PaginatedSimpleTable
              columns={[
                { key: "date", label: "Date" },
                { key: "orders", label: "Orders", align: "right" },
                { key: "revenue", label: "Revenue", align: "right" },
              ]}
              rows={analytics.revenue.over_time.day.slice().reverse().map((point) => ({
                date: point.day,
                orders: formatNumber(point.orders),
                revenue: formatCurrency(point.revenue, currency),
              }))}
              rowClassName={(row) => (row.date === today ? "bg-yellow-100" : "")}
              emptyLabel="No daily revenue yet"
              initialPageSize={10}
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Revenue Per Week</CardTitle>
            <CardDescription>Week totals by ISO week.</CardDescription>
          </CardHeader>
          <CardContent>
            <PaginatedSimpleTable
              columns={[
                { key: "week", label: "Week" },
                { key: "orders", label: "Orders", align: "right" },
                { key: "revenue", label: "Revenue", align: "right" },
              ]}
              rows={analytics.revenue.over_time.week.slice().reverse().map((point) => ({
                week: point.week,
                orders: formatNumber(point.orders),
                revenue: formatCurrency(point.revenue, currency),
              }))}
              emptyLabel="No weekly revenue yet"
              initialPageSize={10}
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Revenue Per Month</CardTitle>
            <CardDescription>Monthly totals based on order created date.</CardDescription>
          </CardHeader>
          <CardContent>
            <PaginatedSimpleTable
              columns={[
                { key: "month", label: "Month" },
                { key: "orders", label: "Orders", align: "right" },
                { key: "revenue", label: "Revenue", align: "right" },
              ]}
              rows={analytics.revenue.over_time.month.slice().reverse().map((point) => ({
                month: point.month,
                orders: formatNumber(point.orders),
                revenue: formatCurrency(point.revenue, currency),
              }))}
              emptyLabel="No monthly revenue yet"
              initialPageSize={10}
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Top Selling Products</CardTitle>
            <CardDescription>Ranked by revenue and quantity.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="mb-2 text-sm font-medium text-muted-foreground">By Revenue</p>
              <SimpleTable
                columns={[
                  { key: "product", label: "Product", className: "max-w-[12rem] whitespace-normal break-words" },
                  { key: "revenue", label: "Revenue", align: "right" },
                  { key: "quantity", label: "Qty", align: "right" },
                ]}
                rows={analytics.revenue.top_selling_products.by_revenue.map((product) => ({
                  product: product.item_title,
                  revenue: formatCurrency(product.revenue, currency),
                  quantity: formatNumber(product.quantity),
                }))}
                emptyLabel="No product revenue yet"
              />
            </div>
            <div>
              <p className="mb-2 text-sm font-medium text-muted-foreground">By Quantity</p>
              <SimpleTable
                columns={[
                  { key: "product", label: "Product", className: "max-w-[12rem] whitespace-normal break-words" },
                  { key: "quantity", label: "Qty", align: "right" },
                  { key: "revenue", label: "Revenue", align: "right" },
                ]}
                rows={analytics.revenue.top_selling_products.by_quantity.map((product) => ({
                  product: product.item_title,
                  quantity: formatNumber(product.quantity),
                  revenue: formatCurrency(product.revenue, currency),
                }))}
                emptyLabel="No product quantities yet"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Revenue By Customer</CardTitle>
            <CardDescription>Top customers and revenue concentration.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <SimpleTable
              columns={[
                { key: "customer", label: "Customer", className: "max-w-[12rem] whitespace-normal break-words" },
                { key: "orders", label: "Orders", align: "right" },
                { key: "revenue", label: "Revenue", align: "right" },
                { key: "share", label: "Share", align: "right", className: "hidden sm:table-cell" },
              ]}
              rows={analytics.revenue.revenue_by_customer.customers.map((customer) => ({
                customer: customer.customer_name,
                orders: formatNumber(customer.orders),
                revenue: formatCurrency(customer.revenue, currency),
                share: `${customer.share_pct.toFixed(2)}%`,
              }))}
              emptyLabel="No customer revenue yet"
            />
            <div className="rounded-md border px-3 py-2 text-sm text-muted-foreground">
              {analytics.revenue.revenue_by_customer.pareto.customers_for_80_pct} customers contribute {analytics.revenue.revenue_by_customer.pareto.top_20_pct_customers_share_pct.toFixed(2)}% of revenue.
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
          value={formatDays(analytics.operations.order_fulfillment_time.average_days)}
          // subtitle={
          //   fulfillmentSamples.length
          //     ? `Median ${formatDays(fulfillmentMedian)} across ${formatNumber(fulfillmentSamples.length)} samples`
          //     : analytics.operations.order_fulfillment_time.note ?? "No delivered orders yet"
          // }
          icon={Clock}
          accentClass="bg-[#FFEDD5] text-[#C2410C]"
        />
        {/* <MetricCard
          title="On-Time Delivery"
          value={formatPercent(analytics.operations.on_time_delivery_pct)}
          subtitle={analytics.operations.delayed_orders.note ?? "Delivered on or before promise date"}
          icon={Truck}
        /> */}
        {/* <MetricCard
          title="Delayed Orders"
          value={formatNumber(analytics.operations.delayed_orders.delayed)}
          subtitle={analytics.operations.delayed_orders.note ?? "Orders delivered after promise date"}
          icon={AlertTriangle}
        /> */}
        <MetricCard
          title="Production Cycle"
          value={formatNumber(analytics.operations.production_cycle_time.manufacturing_orders_seen)}
          // subtitle={analytics.operations.production_cycle_time.note ?? "Manufacturing orders tracked"}
          icon={RefreshCw}
          accentClass="bg-[#DBEAFE] text-[#1D4ED8]"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Fulfillments</CardTitle>
            <CardDescription>Order fulfillment durations.</CardDescription>
          </CardHeader>
          <CardContent>
            <SimpleTable
              columns={[
                { key: "order", label: "Order" },
                { key: "days", label: "Days", align: "right" },
              ]}
              rows={fulfillmentSamples.map((sample) => ({
                order: sample.order_code,
                days: sample.fulfillment_days.toFixed(2),
              }))}
              emptyLabel="No fulfillment samples available"
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
              rows={Object.entries(analytics.operations.production_cycle_time.by_status).map(([status, count]) => ({
                status,
                count: formatNumber(count),
              }))}
              emptyLabel="No manufacturing status data"
            />
          </CardContent>
        </Card>
      </div>

      <SectionHeader
        title="Inventory Analytics"
        subtitle="Identify fast movers and potential stock risks."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Fast Moving SKUs</CardTitle>
            <CardDescription>High frequency and quantity items.</CardDescription>
          </CardHeader>
          <CardContent>
            <SimpleTable
              columns={[
                { key: "sku", label: "SKU", className: "max-w-[12rem] whitespace-normal break-words" },
                { key: "frequency", label: "Frequency", align: "right", className: "hidden sm:table-cell" },
                { key: "quantity", label: "Quantity", align: "right" },
                { key: "revenue", label: "Revenue", align: "right" },
              ]}
              rows={analytics.inventory.fast_moving_skus.map((sku) => ({
                sku: sku.sku,
                frequency: formatNumber(sku.frequency),
                quantity: formatNumber(sku.quantity),
                revenue: formatCurrency(sku.revenue, currency),
              }))}
              emptyLabel="No SKU movement yet"
            />
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
          value={formatNumber(analytics.customers.repeat_customers.length)}
          subtitle="More than one order"
          icon={Users}
          accentClass="bg-[#DCFCE7] text-[#166534]"

        />
        <MetricCard
          title="Customer Lifetime Value"
          value={formatCurrency(analytics.customers.clv_top_customers[0]?.clv ?? 0, currency)}
          subtitle={analytics.customers.clv_top_customers[0]?.customer_name ?? "Top customer"}
          icon={TrendingUp}
          accentClass="bg-[#DBEAFE] text-[#1D4ED8]"
        />
        <MetricCard
          title="Average Order Value"
          value={formatCurrency(analytics.customers.average_order_value, currency)}
          subtitle="Total revenue / orders"
          icon={Package}
          accentClass="bg-[#FFEDD5] text-[#C2410C]"
        />
        <MetricCard
          title="Total Customers"
          value={formatNumber(analytics.revenue.revenue_by_customer.pareto.total_customers)}
          subtitle="Unique customers"
          icon={Users}
          accentClass="bg-[#FEF9C3] text-[#A16207]"
        />
      </div>

      <SectionHeader
        title="Customer Analytics Charts"
        subtitle="Revenue concentration and customer contribution."
      />

      <div className="grid gap-6 lg:grid-cols-1">
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Customer</CardTitle>
            <CardDescription>Horizontal ranking by revenue.</CardDescription>
          </CardHeader>
          <CardContent>
            <RevenueByCustomerChart
              customers={analytics.revenue.revenue_by_customer.customers}
              currency={currency}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Customer Contribution (Pareto)</CardTitle>
            <CardDescription>Bars = revenue, line = cumulative %.</CardDescription>
          </CardHeader>
          <CardContent>
            <CustomerContributionParetoChart
              customers={analytics.revenue.revenue_by_customer.customers.map((c) => ({
                customer_name: c.customer_name,
                revenue: c.revenue,
                orders: c.orders,
              }))}
              currency={currency}
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Repeat Customers</CardTitle>
            <CardDescription>Customers with more than one order.</CardDescription>
          </CardHeader>
          <CardContent>
            <SimpleTable
              columns={[
                { key: "customer", label: "Customer", className: "max-w-[12rem] whitespace-normal break-words" },
                { key: "orders", label: "Orders", align: "right", className: "hidden sm:table-cell whitespace-nowrap" },
                { key: "revenue", label: "Revenue", align: "right", className: "whitespace-nowrap" },
              ]}
              rows={analytics.customers.repeat_customers.map((customer) => ({
                customer: customer.customer_name,
                orders: formatNumber(customer.orders),
                revenue: formatCurrency(customer.revenue, currency),
              }))}
              emptyLabel="No repeat customers yet"
            />
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Top Customer CLV</CardTitle>
            <CardDescription>Lifetime revenue per customer.</CardDescription>
          </CardHeader>
          <CardContent>
            <SimpleTable
              columns={[
                { key: "customer", label: "Customer", className: "max-w-[12rem] whitespace-normal break-words" },
                { key: "orders", label: "Orders", align: "right", className: "hidden sm:table-cell whitespace-nowrap" },
                { key: "clv", label: "CLV", align: "right", className: "whitespace-nowrap" },
              ]}
              rows={analytics.customers.clv_top_customers.map((customer) => ({
                customer: customer.customer_name,
                orders: formatNumber(customer.orders),
                clv: formatCurrency(customer.clv, currency),
              }))}
              emptyLabel="No customer history yet"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
