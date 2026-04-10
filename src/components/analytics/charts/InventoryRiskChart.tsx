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

function shortLabel(value: string, max = 16) {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 3)}...`;
}

export default function InventoryRiskChart({ forecasts, height = 360 }: InventoryRiskChartProps) {
  const theme = useChartTheme();

  const normalized = useMemo(
    () => [...forecasts].sort((a, b) => (a.predictedStockoutDays ?? 999) - (b.predictedStockoutDays ?? 999)).slice(0, 10),
    [forecasts],
  );

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
    [theme],
  );

  const legendItems = useMemo(() => {
    return normalized.map((item, index) => ({
      name: item.sku,
      color: palette[index % palette.length] ?? theme.primary,
    }));
  }, [normalized, palette, theme.primary]);

  const option: EChartsOption = useMemo(() => {
    return {
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
      // Extra left padding prevents the y-axis name from getting clipped.
      grid: { left: 56, right: 18, top: 20, bottom: 52, containLabel: true },
      xAxis: {
        type: "category",
        name: "SKUs",
        nameLocation: "middle",
        nameGap: 28,
        nameTextStyle: { color: theme.mutedForeground, fontSize: 12, fontWeight: 500 },
        data: normalized.map((item) => item.sku),
        axisLabel: {
          show: false,
        },
        axisTick: { show: false },
        axisLine: { lineStyle: { color: theme.border } },
      },
      yAxis: {
        type: "value",
        name: "Days to Stockout",
        nameLocation: "middle",
        nameGap: 46,
        axisLabel: { color: theme.mutedForeground },
        splitLine: { lineStyle: { color: theme.border } },
      },
      series: [
        {
          type: "bar",
          barMaxWidth: 24,
          data: normalized.map((item, index) => ({
            value: item.predictedStockoutDays ?? 0,
            itemStyle: { color: palette[index % palette.length] ?? theme.primary },
          })),
        },
      ],
    };
  }, [normalized, palette, theme]);

  if (!normalized.length) {
    return <div className="text-sm text-muted-foreground">No stockout forecast data available.</div>;
  }

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
      <div className="min-w-0 flex-1">
        <ReactECharts option={option} style={{ height }} />
      </div>
      <aside className="rounded-lg border bg-card p-3 lg:w-64">
        <div className="text-xs font-medium text-muted-foreground">SKUs</div>
        <ul className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 lg:grid-cols-1">
          {legendItems.map((item) => (
            <li key={item.name} className="flex min-w-0 items-center gap-2">
              <span
                aria-hidden="true"
                className="size-3 shrink-0 rounded-sm"
                style={{ backgroundColor: item.color }}
              />
              <span className="min-w-0 truncate text-xs" title={item.name}>
                {shortLabel(item.name, 26)}
              </span>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
