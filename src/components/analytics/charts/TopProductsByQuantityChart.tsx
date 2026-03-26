"use client";

import { formatCurrency, formatNumber } from "@/lib/analytics";
import { useChartTheme } from "@/components/analytics/charts/useChartTheme";
import dynamic from "next/dynamic";
import type { EChartsOption } from "echarts";
import React, { useMemo } from "react";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });

export type TopProductByQuantityPoint = {
  item_title: string;
  revenue: number;
  quantity: number;
  orders: number;
};

type TopProductsByQuantityChartProps = {
  products: TopProductByQuantityPoint[];
  currency: string;
  height?: number;
  topN?: number;
};

function truncateLabel(value: string, max = 18) {
  const trimmed = (value ?? "").trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1)}…`;
}

export default function TopProductsByQuantityChart({
  products,
  currency,
  height = 360,
  topN = 12,
}: TopProductsByQuantityChartProps) {
  const theme = useChartTheme();

  const normalized = useMemo(() => {
    return [...products]
      .filter((p) => (p.item_title ?? "").trim().length > 0)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, topN);
  }, [products, topN]);

  const option: EChartsOption = useMemo(() => {
    const labels = normalized.map((p) => p.item_title);
    const values = normalized.map((p) => p.quantity);

    const getIndex = (params: unknown) => {
      const first = Array.isArray(params) ? params[0] : params;
      if (!first || typeof first !== "object") return 0;
      const idx = (first as { dataIndex?: unknown }).dataIndex;
      return typeof idx === "number" ? idx : 0;
    };

    return {
      color: [theme.secondary],
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        formatter: (params: unknown) => {
          const index = getIndex(params);
          const product = normalized[index];
          if (!product) return "";
          return [
            `<div style="font-weight:600;margin-bottom:4px">${product.item_title}</div>`,
            `Qty: ${formatNumber(product.quantity)}`,
            `Revenue: ${formatCurrency(product.revenue, currency)}`,
            `Orders: ${formatNumber(product.orders)}`,
          ].join("<br/>");
        },
      },
      grid: { left: 12, right: 18, top: 20, bottom: 46, containLabel: true },
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
          name: "Quantity",
          type: "bar",
          data: values,
          barMaxWidth: 22,
          itemStyle: { opacity: 1, color: theme.secondary },
          emphasis: { focus: "none", itemStyle: { opacity: 0.85, color: theme.secondary } },
        },
      ],
    };
  }, [currency, normalized, theme]);

  if (!normalized.length) {
    return <div className="text-sm text-muted-foreground">No product quantities yet.</div>;
  }

  return <ReactECharts option={option} style={{ height }} />;
}
