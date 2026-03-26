"use client";

import { formatCurrency } from "@/lib/analytics";
import { useChartTheme } from "@/components/analytics/charts/useChartTheme";
import dynamic from "next/dynamic";
import type { EChartsOption } from "echarts";
import React, { useMemo } from "react";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });

export type RevenueOverTimeChartPoint = {
  day: string;
  revenue: number;
};

type RevenueOverTimeChartProps = {
  points: RevenueOverTimeChartPoint[];
  currency: string;
  height?: number;
};

function formatShortDateLabel(day: string): string {
  const date = new Date(`${day}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return day;
  return new Intl.DateTimeFormat("en", { month: "short", day: "2-digit" }).format(date);
}

export default function RevenueOverTimeChart({
  points,
  currency,
  height = 320,
}: RevenueOverTimeChartProps) {
  const theme = useChartTheme();

  const normalizedPoints = useMemo(
    () =>
      [...points]
        .filter((p) => Boolean(p.day))
        .sort((a, b) => a.day.localeCompare(b.day)),
    [points],
  );

  const option: EChartsOption = useMemo(() => {
    const x = normalizedPoints.map((p) => p.day);
    const y = normalizedPoints.map((p) => p.revenue);

    return {
      color: [theme.primary],
      tooltip: {
        trigger: "axis",
        valueFormatter: (value) => formatCurrency(Number(value), currency),
      },
      grid: { left: 12, right: 18, top: 20, bottom: 36, containLabel: true },
      xAxis: {
        type: "category",
        data: x,
        axisLabel: {
          color: theme.mutedForeground,
          formatter: (value: string) => formatShortDateLabel(value),
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
        normalizedPoints.length > 20
          ? [
              { type: "inside", zoomOnMouseWheel: true },
              { type: "slider", height: 18, bottom: 8 },
            ]
          : undefined,
      series: [
        {
          name: "Revenue",
          type: "line",
          data: y,
          smooth: true,
          showSymbol: false,
          lineStyle: { width: 3, color: theme.primary },
          itemStyle: { opacity: 1, color: theme.primary },
          areaStyle: { opacity: 0.12, color: theme.primary },
          emphasis: {
            focus: "none",
            lineStyle: { opacity: 1, width: 4, color: theme.primary },
            itemStyle: { opacity: 1, color: theme.primary },
          },
        },
      ],
    };
  }, [currency, normalizedPoints, theme]);

  if (!normalizedPoints.length) {
    return <div className="text-sm text-muted-foreground">No revenue data yet.</div>;
  }

  return <ReactECharts option={option} style={{ height }} />;
}
