"use client";

import { useChartTheme } from "@/components/analytics/charts/useChartTheme";
import dynamic from "next/dynamic";
import type { EChartsOption } from "echarts";
import React, { useMemo } from "react";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });

export type OrdersOverTimeChartPoint = {
  day: string;
  orders: number;
};

type OrdersOverTimeChartProps = {
  points: OrdersOverTimeChartPoint[];
  height?: number;
};

function formatShortDateLabel(day: string): string {
  const date = new Date(`${day}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return day;
  return new Intl.DateTimeFormat("en", { month: "short", day: "2-digit" }).format(date);
}

export default function OrdersOverTimeChart({ points, height = 320 }: OrdersOverTimeChartProps) {
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
    const y = normalizedPoints.map((p) => p.orders);

    return {
      color: [theme.secondary],
      tooltip: {
        trigger: "axis",
        valueFormatter: (value) => new Intl.NumberFormat("en").format(Number(value)),
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
          name: "Orders",
          type: "bar",
          data: y,
          barMaxWidth: 18,
          itemStyle: { opacity: 1, color: theme.secondary },
          emphasis: {
            focus: "none",
            itemStyle: { opacity: 0.85, color: theme.secondary },
          },
        },
      ],
    };
  }, [normalizedPoints, theme]);

  if (!normalizedPoints.length) {
    return <div className="text-sm text-muted-foreground">No orders data yet.</div>;
  }

  return <ReactECharts option={option} style={{ height }} />;
}
