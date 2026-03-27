type ChartTheme = {
  primary: string;
  secondary: string;
  tertiary: string;
  quaternary: string;
  mutedForeground: string;
  border: string;
  success: string;
  warning: string;
  danger: string;
};

const fallbackTheme: ChartTheme = {
  primary: "#3b82f6",
  secondary: "#6366f1",
  tertiary: "#0ea5e9",
  quaternary: "#f59e0b",
  mutedForeground: "#6b7280",
  border: "rgba(0,0,0,0.12)",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
};

function isEChartsParsableColor(value: string) {
  const trimmed = value.trim();
  return /^(#|rgb\(|rgba\(|hsl\(|hsla\()/.test(trimmed);
}

export function useChartTheme(): ChartTheme {
  if (typeof window === "undefined") return fallbackTheme;

  const styles = getComputedStyle(document.documentElement);
  const read = (name: string, fallback: string) => styles.getPropertyValue(name).trim() || fallback;

  const primary = read("--chart-1", fallbackTheme.primary);
  const secondary = read("--chart-2", fallbackTheme.secondary);
  const tertiary = read("--chart-3", fallbackTheme.tertiary);
  const quaternary = read("--chart-4", fallbackTheme.quaternary);
  const mutedForeground = read("--muted-foreground", fallbackTheme.mutedForeground);
  const border = read("--border", fallbackTheme.border);
  const success = read("--chart-5", fallbackTheme.success);

  return {
    primary: isEChartsParsableColor(primary) ? primary : fallbackTheme.primary,
    secondary: isEChartsParsableColor(secondary) ? secondary : fallbackTheme.secondary,
    tertiary: isEChartsParsableColor(tertiary) ? tertiary : fallbackTheme.tertiary,
    quaternary: isEChartsParsableColor(quaternary) ? quaternary : fallbackTheme.quaternary,
    mutedForeground: isEChartsParsableColor(mutedForeground) ? mutedForeground : fallbackTheme.mutedForeground,
    border: isEChartsParsableColor(border) ? border : fallbackTheme.border,
    success: isEChartsParsableColor(success) ? success : fallbackTheme.success,
    warning: fallbackTheme.warning,
    danger: fallbackTheme.danger,
  };
}
