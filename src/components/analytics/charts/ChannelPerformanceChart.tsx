"use client";

import { useChartTheme } from "@/components/analytics/charts/useChartTheme";
import { formatCurrency, formatNumber } from "@/lib/analytics";
import type { ChannelPerformance } from "@/lib/ai-report-types";
import type { EChartsOption } from "echarts";
import dynamic from "next/dynamic";
import React, { useMemo } from "react";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });

type ChannelPerformanceChartProps = {
  channels: ChannelPerformance[];
  currency: string;
  height?: number;
};

function shortLabel(value: string, max = 20) {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 3)}...`;
}

export default function ChannelPerformanceChart({
  channels,
  currency,
  height = 350,
}: ChannelPerformanceChartProps) {
  const theme = useChartTheme();

  const normalized = useMemo(
    () => [...channels].sort((a, b) => b.revenue - a.revenue).slice(0, 8),
    [channels],
  );

  const option: EChartsOption = useMemo(() => {
    const labels = normalized.map((channel) => channel.channel);

    return {
      color: [theme.primary, theme.secondary, theme.danger],
      legend: {
        top: 0,
        textStyle: { color: theme.mutedForeground },
      },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        formatter: (params: unknown) => {
          const list = Array.isArray(params) ? params : [params];
          const idx = (list[0] as { dataIndex?: number } | undefined)?.dataIndex ?? 0;
          const channel = normalized[idx];
          if (!channel) return "";

          return [
            `<div style=\"font-weight:600;margin-bottom:4px\">${channel.channel}</div>`,
            `Revenue: ${formatCurrency(channel.revenue, currency)}`,
            `Orders: ${formatNumber(channel.orders)}`,
            `Delayed: ${formatNumber(channel.delayedOrders)}`,
            `On-time: ${channel.onTimePct ?? 0}%`,
          ].join("<br/>");
        },
      },
      grid: { left: 12, right: 18, top: 42, bottom: 36, containLabel: true },
      xAxis: {
        type: "category",
        data: labels,
        axisLine: { lineStyle: { color: theme.border } },
        axisLabel: {
          color: theme.mutedForeground,
          interval: 0,
          rotate: 0,
          formatter: (value: string) => shortLabel(value),
        },
      },
      yAxis: [
        {
          type: "value",
          name: "Revenue",
          axisLabel: {
            color: theme.mutedForeground,
            formatter: (value: number) =>
              new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value),
          },
          splitLine: { lineStyle: { color: theme.border } },
        },
        {
          type: "value",
          name: "Rate / Count",
          axisLabel: { color: theme.mutedForeground },
          splitLine: { show: false },
        },
      ],
      series: [
        {
          name: "Revenue",
          type: "bar",
          barMaxWidth: 22,
          data: normalized.map((channel) => channel.revenue),
          itemStyle: { color: theme.primary },
        },
        {
          name: "On-time %",
          type: "line",
          yAxisIndex: 1,
          smooth: true,
          symbol: "circle",
          symbolSize: 7,
          data: normalized.map((channel) => channel.onTimePct ?? 0),
          lineStyle: { color: theme.secondary, width: 2 },
          itemStyle: { color: theme.secondary },
        },
        {
          name: "Delayed Orders",
          type: "line",
          yAxisIndex: 1,
          smooth: true,
          symbol: "none",
          data: normalized.map((channel) => channel.delayedOrders),
          lineStyle: { color: theme.danger, width: 2, type: "dashed" },
        },
      ],
    };
  }, [currency, normalized, theme]);

  if (!normalized.length) {
    return <div className="text-sm text-muted-foreground">No channel performance data available.</div>;
  }

  return <ReactECharts option={option} style={{ height }} />;
}
