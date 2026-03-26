"use client";

import { formatCurrency, formatNumber } from "@/lib/analytics";
import { useChartTheme } from "@/components/analytics/charts/useChartTheme";
import dynamic from "next/dynamic";
import type { EChartsOption } from "echarts";
import React, { useMemo } from "react";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });

export type TopProductByRevenuePoint = {
  item_title: string;
  revenue: number;
  quantity: number;
  orders: number;
};

type TopProductsByRevenueChartProps = {
  products: TopProductByRevenuePoint[];
  currency: string;
  height?: number;
  topN?: number;
};

function truncateLabel(value: string, max = 34) {
  const trimmed = (value ?? "").trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1)}…`;
}

export default function TopProductsByRevenueChart({
  products,
  currency,
  height,
  topN = 10,
}: TopProductsByRevenueChartProps) {
  const theme = useChartTheme();

  const normalized = useMemo(() => {
    return [...products]
      .filter((p) => (p.item_title ?? "").trim().length > 0)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, topN);
  }, [products, topN]);

  const computedHeight = height ?? Math.min(520, Math.max(320, normalized.length * 34));

  const option: EChartsOption = useMemo(() => {
    const labels = normalized.map((p) => p.item_title);
    const values = normalized.map((p) => p.revenue);

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
          const product = normalized[index];
          if (!product) return "";
          return [
            `<div style="font-weight:600;margin-bottom:4px">${product.item_title}</div>`,
            `Revenue: ${formatCurrency(product.revenue, currency)}`,
            `Qty: ${formatNumber(product.quantity)}`,
            `Orders: ${formatNumber(product.orders)}`,
          ].join("<br/>");
        },
      },
      grid: { left: 180, right: 18, top: 10, bottom: 18, containLabel: true },
      xAxis: {
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
      yAxis: {
        type: "category",
        data: labels,
        axisLabel: { color: theme.mutedForeground, formatter: (v: string) => truncateLabel(v) },
        axisLine: { lineStyle: { color: theme.border } },
      },
      series: [
        {
          name: "Revenue",
          type: "bar",
          data: values,
          barMaxWidth: 18,
          itemStyle: { opacity: 1, color: theme.primary },
          emphasis: { focus: "none", itemStyle: { opacity: 0.85, color: theme.primary } },
        },
      ],
    };
  }, [currency, normalized, theme]);

  if (!normalized.length) {
    return <div className="text-sm text-muted-foreground">No product revenue yet.</div>;
  }

  return <ReactECharts option={option} style={{ height: computedHeight }} />;
}
