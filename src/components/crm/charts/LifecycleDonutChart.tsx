"use client";

import ReactECharts from "echarts-for-react";
import { useChartTheme } from "@/components/analytics/charts/useChartTheme";
import { useMemo } from "react";

type LifecycleDonutChartProps = {
  data: { lifecycle_stage: string; count: number }[];
};

export default function LifecycleDonutChart({ data }: LifecycleDonutChartProps) {
  const theme = useChartTheme();

  const options = useMemo(() => {
    return {
      tooltip: {
        trigger: "item",
        formatter: "{b}: {c} ({d}%)",
      },
      legend: {
        orient: "vertical",
        left: "left",
        textStyle: { color: theme.mutedForeground },
      },
      series: [
        {
          name: "Lifecycle",
          type: "pie",
          radius: ["40%", "70%"],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: "#FFFFFF",
            borderWidth: 2,
          },
          label: {
            show: false,
            position: "center",
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 16,
              fontWeight: "bold",
            },
          },
          labelLine: { show: false },
          data: data.map((d) => ({ name: d.lifecycle_stage, value: d.count })),
        },
      ],
      color: [theme.primary, theme.secondary, theme.tertiary, theme.quaternary, theme.success],
    };
  }, [data, theme]);

  if (!data || data.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
        No lifecycle data available.
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
