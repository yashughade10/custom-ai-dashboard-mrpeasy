"use client";

import { useChartTheme } from "@/components/analytics/charts/useChartTheme";
import type { EChartsOption } from "echarts";
import dynamic from "next/dynamic";
import React, { useMemo } from "react";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });

type OperationsHealthGaugeChartProps = {
  onTimeDeliveryPct: number | null;
  capacityUtilizationPct: number | null;
  height?: number;
};

export default function OperationsHealthGaugeChart({
  onTimeDeliveryPct,
  capacityUtilizationPct,
  height = 320,
}: OperationsHealthGaugeChartProps) {
  const theme = useChartTheme();

  const onTime = onTimeDeliveryPct ?? 0;
  const capacity = capacityUtilizationPct ?? 0;

  const option: EChartsOption = useMemo(
    () => ({
      series: [
        {
          type: "gauge",
          radius: "82%",
          min: 0,
          max: 100,
          splitNumber: 10,
          axisLine: {
            lineStyle: {
              width: 18,
              color: [
                [0.5, theme.danger],
                [0.8, theme.warning],
                [1, theme.success],
              ],
            },
          },
          progress: {
            show: true,
            width: 18,
            itemStyle: { color: theme.secondary },
          },
          axisTick: { distance: -25, splitNumber: 5, lineStyle: { color: "#fff", width: 1 } },
          splitLine: { distance: -25, length: 10, lineStyle: { color: "#fff", width: 2 } },
          axisLabel: { color: theme.mutedForeground, distance: 25 },
          pointer: { width: 5, length: "65%", itemStyle: { color: theme.primary } },
          anchor: { show: true, size: 10, itemStyle: { color: theme.primary } },
          title: {
            show: true,
            offsetCenter: [0, "72%"],
            color: theme.mutedForeground,
            fontSize: 12,
          },
          detail: {
            valueAnimation: true,
            formatter: (value: number) => `${value.toFixed(1)}%`,
            color: theme.primary,
            fontSize: 20,
            offsetCenter: [0, "35%"],
          },
          data: [{ value: onTime, name: "On-time Delivery" }],
        },
        {
          type: "gauge",
          radius: "56%",
          min: 0,
          max: 100,
          axisLine: {
            lineStyle: {
              width: 10,
              color: [[1, "rgba(107,114,128,0.2)"]],
            },
          },
          progress: {
            show: true,
            width: 10,
            itemStyle: {
              color: capacity >= 85 ? theme.danger : capacity >= 70 ? theme.warning : theme.success,
            },
          },
          pointer: { show: false },
          axisTick: { show: false },
          splitLine: { show: false },
          axisLabel: { show: false },
          title: {
            show: true,
            offsetCenter: [0, "-70%"],
            color: theme.mutedForeground,
            fontSize: 11,
          },
          detail: {
            formatter: (value: number) => `Capacity ${value.toFixed(1)}%`,
            color: theme.mutedForeground,
            fontSize: 12,
            offsetCenter: [0, "-44%"],
          },
          data: [{ value: capacity, name: "Utilization" }],
        },
      ],
    }),
    [capacity, onTime, theme],
  );

  return <ReactECharts option={option} style={{ height }} />;
}
