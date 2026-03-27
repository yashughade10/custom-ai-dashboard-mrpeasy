"use client";

import { useChartTheme } from "@/components/analytics/charts/useChartTheme";
import type { InventoryForecast } from "@/lib/ai-report-types";
import type { EChartsOption } from "echarts";
import dynamic from "next/dynamic";
import React, { useMemo } from "react";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });

type InventoryRiskChartProps = {
  forecasts: InventoryForecast[];
  height?: number;
};

function riskColor(level: InventoryForecast["riskLevel"], colors: ReturnType<typeof useChartTheme>) {
  if (level === "critical") return colors.danger;
  if (level === "high") return colors.warning;
  if (level === "medium") return colors.tertiary;
  return colors.success;
}

function shortLabel(value: string, max = 16) {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 3)}...`;
}

export default function InventoryRiskChart({ forecasts, height = 350 }: InventoryRiskChartProps) {
  const theme = useChartTheme();

  const normalized = useMemo(
    () => [...forecasts].sort((a, b) => (a.predictedStockoutDays ?? 999) - (b.predictedStockoutDays ?? 999)).slice(0, 10),
    [forecasts],
  );

  const option: EChartsOption = useMemo(() => {
    return {
      color: [theme.primary, theme.secondary],
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        formatter: (params: unknown) => {
          const list = Array.isArray(params) ? params : [params];
          const idx = (list[0] as { dataIndex?: number } | undefined)?.dataIndex ?? 0;
          const item = normalized[idx];
          if (!item) return "";

          return [
            `<div style=\"font-weight:600;margin-bottom:4px\">${item.sku}</div>`,
            `Stockout in: ${item.predictedStockoutDays ?? "N/A"} days`,
            `Current stock(est): ${item.estimatedCurrentStock}`,
            `Avg daily sales: ${item.avgDailySales}`,
            `Suggested reorder: ${item.suggestedReorderUnits}`,
          ].join("<br/>");
        },
      },
      grid: { left: 12, right: 18, top: 20, bottom: 52, containLabel: true },
      xAxis: {
        type: "category",
        data: normalized.map((item) => item.sku),
        axisLabel: {
          color: theme.mutedForeground,
          interval: 0,
          rotate: 20,
          formatter: (value: string) => shortLabel(value),
        },
        axisLine: { lineStyle: { color: theme.border } },
      },
      yAxis: {
        type: "value",
        name: "Days to Stockout",
        axisLabel: { color: theme.mutedForeground },
        splitLine: { lineStyle: { color: theme.border } },
      },
      series: [
        {
          type: "bar",
          barMaxWidth: 24,
          data: normalized.map((item) => ({
            value: item.predictedStockoutDays ?? 0,
            itemStyle: { color: riskColor(item.riskLevel, theme) },
          })),
        },
      ],
    };
  }, [normalized, theme]);

  if (!normalized.length) {
    return <div className="text-sm text-muted-foreground">No stockout forecast data available.</div>;
  }

  return <ReactECharts option={option} style={{ height }} />;
}
