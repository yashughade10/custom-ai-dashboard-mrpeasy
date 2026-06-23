"use client";

import ReactECharts from "echarts-for-react";
import { useChartTheme } from "@/components/analytics/charts/useChartTheme";
import { useMemo } from "react";

type IndustryBreakdownChartProps = {
  data: { industry: string; count: number }[];
};

export default function IndustryBreakdownChart({ data }: IndustryBreakdownChartProps) {
  const theme = useChartTheme();

  const options = useMemo(() => {
    return {
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
      },
      grid: { left: 40, right: 20, top: 20, bottom: 80 },
      xAxis: {
        type: "category",
        data: data.map((d) => d.industry),
        axisLabel: {
          color: theme.mutedForeground,
          rotate: 45,
          interval: 0,
        },
      },
      yAxis: {
        type: "value",
        axisLabel: { color: theme.mutedForeground },
        splitLine: {
          lineStyle: { color: theme.border, type: "dashed" },
        },
      },
      series: [
        {
          type: "bar",
          data: data.map((d) => d.count),
          itemStyle: {
            color: theme.success,
            borderRadius: [4, 4, 0, 0],
          },
        },
      ],
    };
  }, [data, theme]);

  if (!data || data.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
        No industry data available.
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
