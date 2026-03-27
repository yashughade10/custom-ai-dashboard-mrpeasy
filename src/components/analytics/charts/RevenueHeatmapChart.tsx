"use client";

import { useChartTheme } from "@/components/analytics/charts/useChartTheme";
import { formatCurrency } from "@/lib/analytics";
import type { RevenueHeatPoint } from "@/lib/ai-report-types";
import type { EChartsOption } from "echarts";
import dynamic from "next/dynamic";
import React, { useMemo } from "react";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type RevenueHeatmapChartProps = {
  points: RevenueHeatPoint[];
  currency: string;
  height?: number;
};

export default function RevenueHeatmapChart({ points, currency, height = 360 }: RevenueHeatmapChartProps) {
  const theme = useChartTheme();

  const normalized = useMemo(() => [...points], [points]);

  const option: EChartsOption = useMemo(() => {
    const maxWeek = normalized.reduce((max, point) => Math.max(max, point.weekIndex), 0);
    const maxValue = normalized.reduce((max, point) => Math.max(max, point.value), 0);

    return {
      tooltip: {
        position: "top",
        formatter: (params: unknown) => {
          const data = (params as { data?: [number, number, number] } | undefined)?.data;
          if (!data) return "";
          return [
            `<div style=\"font-weight:600;margin-bottom:4px\">Week ${data[0] + 1} - ${WEEKDAY_LABELS[data[1]]}</div>`,
            `Revenue: ${formatCurrency(data[2], currency)}`,
          ].join("<br/>");
        },
      },
      grid: { left: 55, right: 18, top: 20, bottom: 32, containLabel: true },
      xAxis: {
        type: "category",
        data: Array.from({ length: maxWeek + 1 }, (_, i) => `W${i + 1}`),
        splitArea: { show: true },
        axisLabel: { color: theme.mutedForeground },
        axisLine: { lineStyle: { color: theme.border } },
      },
      yAxis: {
        type: "category",
        data: WEEKDAY_LABELS,
        splitArea: { show: true },
        axisLabel: { color: theme.mutedForeground },
        axisLine: { lineStyle: { color: theme.border } },
      },
      visualMap: {
        min: 0,
        max: Math.max(maxValue, 1),
        calculable: true,
        orient: "horizontal",
        left: "center",
        bottom: 0,
        inRange: {
          color: ["#e5f7ff", theme.tertiary, theme.secondary, theme.primary],
        },
        textStyle: { color: theme.mutedForeground },
      },
      series: [
        {
          name: "Revenue",
          type: "heatmap",
          data: normalized.map((point) => [point.weekIndex, point.weekday, point.value]),
          emphasis: {
            itemStyle: {
              shadowBlur: 8,
              shadowColor: "rgba(0,0,0,0.18)",
            },
          },
        },
      ],
    };
  }, [currency, normalized, theme]);

  if (!normalized.length) {
    return <div className="text-sm text-muted-foreground">No heatmap data available.</div>;
  }

  return <ReactECharts option={option} style={{ height }} />;
}
