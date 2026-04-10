"use client";

import { formatCurrency, formatNumber } from "@/lib/analytics";
import { useChartTheme } from "@/components/analytics/charts/useChartTheme";
import dynamic from "next/dynamic";
import type { EChartsOption } from "echarts";
import React, { useMemo } from "react";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });

export type ParetoCustomerPoint = {
  customer_name: string;
  revenue: number;
  orders: number;
};

type CustomerContributionParetoChartProps = {
  customers: ParetoCustomerPoint[];
  currency: string;
  height?: number;
  topN?: number;
};

function truncateLabel(value: string, max = 16) {
  const trimmed = (value ?? "").trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1)}…`;
}

export default function CustomerContributionParetoChart({
  customers,
  currency,
  height = 380,
  topN = 20,
}: CustomerContributionParetoChartProps) {
  const theme = useChartTheme();

  const normalized = useMemo(() => {
    return [...customers]
      .filter((c) => (c.customer_name ?? "").trim().length > 0)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, topN);
  }, [customers, topN]);

  const palette = useMemo(
    () => [
      theme.primary,
      theme.secondary,
      theme.tertiary,
      theme.quaternary,
      theme.success,
      theme.warning,
      theme.danger,
    ],
    [theme]
  );

  const legendItems = useMemo(() => {
    return normalized.map((c, index) => ({
      name: c.customer_name,
      color: palette[index % palette.length] ?? theme.primary,
    }));
  }, [normalized, palette, theme.primary]);

  const option: EChartsOption = useMemo(() => {
    const labels = normalized.map((c) => c.customer_name);
    const revenue = normalized.map((c) => c.revenue);

    const getIndex = (params: unknown) => {
      const first = Array.isArray(params) ? params[0] : params;
      if (!first || typeof first !== "object") return 0;
      const idx = (first as { dataIndex?: unknown }).dataIndex;
      return typeof idx === "number" ? idx : 0;
    };

    return {
      color: palette,
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        formatter: (params: unknown) => {
          const index = getIndex(params);
          const customer = normalized[index];
          if (!customer) return "";
          return [
            `<div style="font-weight:600;margin-bottom:4px">${customer.customer_name}</div>`,
            `Revenue: ${formatCurrency(customer.revenue, currency)}`,
            `Orders: ${formatNumber(customer.orders)}`,
          ].join("<br/>");
        },
      },
      grid: { left: 12, right: 18, top: 20, bottom: 54, containLabel: true },
      xAxis: {
        type: "category",
        name: "Customers",
        nameLocation: "middle",
        nameGap: 28,
        nameTextStyle: { color: theme.mutedForeground, fontSize: 12, fontWeight: 500 },
        data: labels,
        axisLabel: {
          show: false,
        },
        axisTick: { show: false },
        axisLine: { lineStyle: { color: theme.border } },
      },
      yAxis: {
        type: "value",
        name: "Revenue",
        axisLabel: {
          color: theme.mutedForeground,
          formatter: (value: number) =>
            new Intl.NumberFormat("en", {
              notation: "compact",
              maximumFractionDigits: 1,
            }).format(value),
        },
        splitLine: { lineStyle: { color: theme.border } },
      },
      dataZoom:
        normalized.length > 10
          ? [
              { type: "inside", zoomOnMouseWheel: true },
              { type: "slider", height: 18, bottom: 10 },
            ]
          : undefined,
      series: [
        {
          name: "Revenue",
          type: "bar",
          label: { show: false },
          data: revenue.map((value, index) => ({
            value,
            itemStyle: { color: palette[index % palette.length] ?? theme.secondary },
          })),
          barMaxWidth: 22,
          itemStyle: { opacity: 1 },
          emphasis: { focus: "none", itemStyle: { opacity: 0.85 } },
        },
      ],
    };
  }, [currency, normalized, palette, theme]);

  if (!normalized.length) {
    return <div className="text-sm text-muted-foreground">No customer data yet.</div>;
  }

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
      <div className="min-w-0 flex-1">
        <ReactECharts option={option} style={{ height }} />
      </div>
      <aside className="rounded-lg border bg-card p-3 lg:w-64">
        <div className="text-xs font-medium text-muted-foreground">Customers</div>
        <ul className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 lg:grid-cols-1">
          {legendItems.map((item) => (
            <li key={item.name} className="flex min-w-0 items-center gap-2">
              <span
                aria-hidden="true"
                className="size-3 shrink-0 rounded-sm"
                style={{ backgroundColor: item.color }}
              />
              <span className="min-w-0 truncate text-xs" title={item.name}>
                {truncateLabel(item.name, 26)}
              </span>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
