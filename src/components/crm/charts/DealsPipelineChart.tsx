"use client";

import ReactECharts from "echarts-for-react";
import { useChartTheme } from "@/components/analytics/charts/useChartTheme";
import { useMemo } from "react";

type DealsPipelineChartProps = {
  data: { dealstage: string; total_value: number; deal_count: number }[];
};

export default function DealsPipelineChart({ data }: DealsPipelineChartProps) {
  const theme = useChartTheme();

  const options = useMemo(() => {
    return {
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        formatter: (params: any) => {
          const p = params[0];
          const raw = data[p.dataIndex];
          return `<strong>${p.name}</strong><br/>Value: $${raw.total_value.toLocaleString()}<br/>Count: ${raw.deal_count}`;
        },
      },
      grid: { left: 80, right: 20, top: 20, bottom: 40 },
      xAxis: {
        type: "value",
        axisLabel: {
          color: theme.mutedForeground,
          formatter: (value: number) => `$${value.toLocaleString()}`,
        },
        splitLine: {
          lineStyle: { color: theme.border, type: "dashed" },
        },
      },
      yAxis: {
        type: "category",
        data: data.map((d) => d.dealstage),
        axisLabel: { color: theme.mutedForeground, width: 100, overflow: 'truncate' },
      },
      series: [
        {
          type: "bar",
          data: data.map((d) => d.total_value),
          itemStyle: {
            color: theme.primary,
            borderRadius: [0, 4, 4, 0],
          },
        },
      ],
    };
  }, [data, theme]);

  if (!data || data.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
        No pipeline data available.
      </div>
    );
  }

  return (
    <ReactECharts
      option={options}
      style={{ height: 300 }}
      opts={{ renderer: "svg" }}
    />
  );
}
