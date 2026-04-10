"use client";

import { useChartTheme } from "@/components/analytics/charts/useChartTheme";
import { formatCurrency } from "@/lib/analytics";
import type { SalesForecastPoint } from "@/lib/ai-report-types";
import type { EChartsOption } from "echarts";
import dynamic from "next/dynamic";
import React, { useMemo } from "react";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });

type SalesForecastChartProps = {
  points: SalesForecastPoint[];
  currency: string;
  height?: number;
};

function formatDateLabel(day: string): string {
  const date = new Date(`${day}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return day;
  return new Intl.DateTimeFormat("en", { month: "short", day: "2-digit" }).format(date);
}

export default function SalesForecastChart({ points, currency, height = 360 }: SalesForecastChartProps) {
  const theme = useChartTheme();

  const normalized = useMemo(
    () => [...points].filter((point) => point.date).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 60),
    [points],
  );

  const option: EChartsOption = useMemo(() => {
    const dates = normalized.map((point) => point.date);

    return {
      color: [theme.primary, theme.tertiary, theme.secondary],
      tooltip: {
        trigger: "axis",
        formatter: (params: unknown) => {
          const list = Array.isArray(params) ? params : [params];
          const head = (list[0] as { axisValue?: string } | undefined)?.axisValue ?? "";
          const date = formatDateLabel(head);

          const expected = normalized.find((p) => p.date === head);
          if (!expected) return "";

          return [
            `<div style=\"font-weight:600;margin-bottom:4px\">${date}</div>`,
            `Expected: ${formatCurrency(expected.expected, currency)}`,
            `Range: ${formatCurrency(expected.lower, currency)} - ${formatCurrency(expected.upper, currency)}`,
          ].join("<br/>");
        },
      },
      legend: {
        top: 0,
        textStyle: { color: theme.mutedForeground },
      },
      grid: { left: 12, right: 18, top: 42, bottom: 36, containLabel: true },
      xAxis: {
        type: "category",
        data: dates,
        axisLine: { lineStyle: { color: theme.border } },
        axisLabel: {
          color: theme.mutedForeground,
          formatter: (value: string) => formatDateLabel(value),
        },
      },
      yAxis: {
        type: "value",
        axisLine: { lineStyle: { color: theme.border } },
        axisLabel: {
          color: theme.mutedForeground,
          formatter: (value: number) =>
            new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value),
        },
        splitLine: { lineStyle: { color: theme.border } },
      },
      dataZoom:
        normalized.length > 22
          ? [
              { type: "inside", zoomOnMouseWheel: true },
              { type: "slider", height: 18, bottom: 8 },
            ]
          : undefined,
      series: [
        {
          name: "Upper",
          type: "line",
          data: normalized.map((point) => point.upper),
          symbol: "none",
          lineStyle: { opacity: 0 },
          emphasis: { disabled: true },
          stack: "confidence",
        },
        {
          name: "Lower",
          type: "line",
          data: normalized.map((point) => point.lower),
          symbol: "none",
          lineStyle: { opacity: 0 },
          areaStyle: { color: theme.tertiary, opacity: 0.15 },
          stack: "confidence",
          emphasis: { disabled: true },
        },
        {
          name: "Expected",
          type: "line",
          data: normalized.map((point) => point.expected),
          smooth: true,
          symbol: "none",
          lineStyle: { color: theme.primary, width: 3 },
          areaStyle: { color: theme.primary, opacity: 0.05 },
        },
      ],
    };
  }, [currency, normalized, theme]);

  if (!normalized.length) {
    return <div className="text-sm text-muted-foreground">No forecast points available.</div>;
  }

  return <ReactECharts option={option} style={{ height }} />;
}
