"use client";

import { formatCurrency, formatNumber } from "@/lib/analytics";
import { useChartTheme } from "@/components/analytics/charts/useChartTheme";
import dynamic from "next/dynamic";
import type { EChartsOption } from "echarts";
import React, { useMemo } from "react";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });

export type RevenueByCustomerPoint = {
  customer_name: string;
  revenue: number;
  orders: number;
  share_pct: number;
};

type RevenueByCustomerChartProps = {
  customers: RevenueByCustomerPoint[];
  currency: string;
  height?: number;
  topN?: number;
};

function truncateLabel(value: string, max = 34) {
  const trimmed = (value ?? "").trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1)}…`;
}

export default function RevenueByCustomerChart({
  customers,
  currency,
  height,
  topN = 12,
}: RevenueByCustomerChartProps) {
  const theme = useChartTheme();

  const normalized = useMemo(() => {
    return [...customers]
      .filter((c) => (c.customer_name ?? "").trim().length > 0)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, topN);
  }, [customers, topN]);

  const computedHeight = height ?? 360;

  const option: EChartsOption = useMemo(() => {
    const labels = normalized.map((c) => c.customer_name);
    const values = normalized.map((c) => c.revenue);

    const getIndex = (params: unknown) => {
      const first = Array.isArray(params) ? params[0] : params;
      if (!first || typeof first !== "object") return 0;
      const idx = (first as { dataIndex?: unknown }).dataIndex;
      return typeof idx === "number" ? idx : 0;
    };

    return {
      color: [theme.primary],
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
            `Share: ${customer.share_pct.toFixed(2)}%`,
          ].join("<br/>");
        },
      },
      grid: { left: 12, right: 18, top: 20, bottom: 52, containLabel: true },
      xAxis: {
        type: "category",
        data: labels,
        axisLabel: {
          color: theme.mutedForeground,
          interval: 0,
          rotate: 20,
          formatter: (v: string) => truncateLabel(v, 16),
        },
        axisTick: { alignWithLabel: true },
        axisLine: { lineStyle: { color: theme.border } },
      },
      yAxis: {
        type: "value",
        axisLabel: {
          color: theme.mutedForeground,
          formatter: (value: number) =>
            new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(
              value,
            ),
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
          data: values,
          barMaxWidth: 22,
          itemStyle: { opacity: 1, color: theme.primary },
          emphasis: { focus: "none", itemStyle: { opacity: 0.85, color: theme.primary } },
        },
      ],
    };
  }, [currency, normalized, theme]);

  if (!normalized.length) {
    return <div className="text-sm text-muted-foreground">No customer revenue yet.</div>;
  }

  return <ReactECharts option={option} style={{ height: computedHeight }} />;
}
