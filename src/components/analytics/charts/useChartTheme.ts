type ChartTheme = {
  primary: string;
  secondary: string;
  mutedForeground: string;
  border: string;
};

const fallbackTheme: ChartTheme = {
  primary: "#3b82f6",
  secondary: "#6366f1",
  mutedForeground: "#6b7280",
  border: "rgba(0,0,0,0.12)",
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
  const mutedForeground = read("--muted-foreground", fallbackTheme.mutedForeground);
  const border = read("--border", fallbackTheme.border);

  return {
    primary: isEChartsParsableColor(primary) ? primary : fallbackTheme.primary,
    secondary: isEChartsParsableColor(secondary) ? secondary : fallbackTheme.secondary,
    mutedForeground: isEChartsParsableColor(mutedForeground) ? mutedForeground : fallbackTheme.mutedForeground,
    border: isEChartsParsableColor(border) ? border : fallbackTheme.border,
  };
}
