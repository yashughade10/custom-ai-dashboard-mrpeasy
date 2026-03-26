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
        data: labels,
        axisLabel: {
          color: theme.mutedForeground,
          interval: 0,
          rotate: 20,
          formatter: (v: string) => truncateLabel(v),
        },
        axisTick: { alignWithLabel: true },
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
          data: revenue,
          barMaxWidth: 22,
          itemStyle: { opacity: 1, color: theme.secondary },
          emphasis: { focus: "none", itemStyle: { opacity: 0.85, color: theme.secondary } },
        },
      ],
    };
  }, [currency, normalized, theme]);

  if (!normalized.length) {
    return <div className="text-sm text-muted-foreground">No customer data yet.</div>;
  }

  return <ReactECharts option={option} style={{ height }} />;
}
