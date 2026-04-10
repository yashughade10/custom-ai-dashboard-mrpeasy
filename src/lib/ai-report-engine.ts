import {
  formatCurrency,
  normalizeOrders,
  type AnalyticsApiData,
  type RawOrder,
} from "@/lib/analytics";
import {
  type AIActionItem,
  type AIAnalyticsReport,
  type AIChatResponse,
  type AIInsight,
  type AISection,
  type AnalyticsDataContext,
  type ChannelPerformance,
  type InventoryForecast,
  type ProductionForecast,
  type RevenueHeatPoint,
  type SalesForecast,
  type SalesForecastPoint,
} from "@/lib/ai-report-types";
import { callOpenRouter, tryParseJson } from "@/lib/openrouter";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://apimrpeasy-vaclift-backend.vercel.app/api";
const REPORT_CACHE_TTL_MS = 5 * 60 * 1000;

type ReportCache = {
  expiresAt: number;
  value: AIAnalyticsReport;
};

let reportCache: ReportCache | null = null;

function safeNumber(value: unknown): number {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function safePct(value: unknown): number | null {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function round(value: number, digits = 2): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function average(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function standardDeviation(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = average(values);
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function parseDay(day: string): Date | null {
  const parsed = new Date(`${day}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function daysBetweenInclusive(from: string | null, to: string | null): number {
  if (!from || !to) return 30;
  const fromDate = parseDay(from);
  const toDate = parseDay(to);
  if (!fromDate || !toDate) return 30;
  const diff = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(diff + 1, 1);
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Request failed for ${url}: ${response.status}`);
  }
  return (await response.json()) as T;
}

async function fetchAnalyticsContext(): Promise<AnalyticsDataContext> {
  const [ordersResponse, analyticsResponse] = await Promise.all([
    fetchJson<{ data: RawOrder[] }>(`${API_BASE_URL}/orders`),
    fetchJson<{ data: AnalyticsApiData }>(`${API_BASE_URL}/analytics`),
  ]);

  const rawOrders = Array.isArray(ordersResponse.data) ? ordersResponse.data : [];
  const analytics = analyticsResponse.data;

  return {
    rawOrders,
    normalizedOrders: normalizeOrders(rawOrders),
    analytics,
  };
}

function linearRegression(values: number[]) {
  const n = values.length;
  if (!n) return { slope: 0, intercept: 0 };
  if (n === 1) return { slope: 0, intercept: values[0] };

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  for (let i = 0; i < n; i += 1) {
    const x = i;
    const y = values[i];
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumXX += x * x;
  }

  const denominator = n * sumXX - sumX * sumX;
  const slope = denominator === 0 ? 0 : (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;

  return { slope, intercept };
}

function buildSalesForecast(dayPoints: AnalyticsApiData["revenue"]["over_time"]["day"]): SalesForecast {
  const sorted = [...dayPoints]
    .filter((point) => point.day)
    .sort((a, b) => a.day.localeCompare(b.day));

  if (!sorted.length) {
    return {
      method: "Hybrid moving average + linear regression",
      next7DaysTotal: 0,
      next30DaysTotal: 0,
      nextQuarterTotal: 0,
      points: [],
    };
  }

  const historyValues = sorted.map((point) => safeNumber(point.revenue));
  const rollingValues = [...historyValues];
  const { slope, intercept } = linearRegression(historyValues);
  const volatility = standardDeviation(historyValues.slice(-14));

  const dayOfWeekBuckets = new Map<number, number[]>();
  sorted.forEach((point) => {
    const date = parseDay(point.day);
    if (!date) return;
    const dow = date.getUTCDay();
    const arr = dayOfWeekBuckets.get(dow) ?? [];
    arr.push(safeNumber(point.revenue));
    dayOfWeekBuckets.set(dow, arr);
  });

  const lastDate = parseDay(sorted[sorted.length - 1].day) ?? new Date();
  const predictions: SalesForecastPoint[] = [];
  const horizon = 90;

  for (let i = 1; i <= horizon; i += 1) {
    const projectedDate = new Date(lastDate);
    projectedDate.setUTCDate(projectedDate.getUTCDate() + i);

    const regTrend = intercept + slope * (historyValues.length - 1 + i);
    const movingAvg = average(rollingValues.slice(-14));
    const dow = projectedDate.getUTCDay();
    const dowAvg = average(dayOfWeekBuckets.get(dow) ?? []);

    const expected = Math.max(0, regTrend * 0.45 + movingAvg * 0.35 + dowAvg * 0.2);
    const uncertainty = Math.max(volatility * (0.25 + i * 0.012), expected * (0.06 + i * 0.001));

    predictions.push({
      date: toDateKey(projectedDate),
      expected: round(expected),
      lower: round(Math.max(0, expected - uncertainty)),
      upper: round(expected + uncertainty),
    });

    rollingValues.push(expected);
  }

  const sumFor = (days: number) => round(predictions.slice(0, days).reduce((sum, point) => sum + point.expected, 0));

  return {
    method: "Hybrid moving average + linear regression",
    next7DaysTotal: sumFor(7),
    next30DaysTotal: sumFor(30),
    nextQuarterTotal: sumFor(90),
    points: predictions,
  };
}

function buildInventoryForecast(
  analytics: AnalyticsApiData,
  salesForecast: SalesForecast,
): InventoryForecast[] {
  const analysisDays = daysBetweenInclusive(analytics.meta.from, analytics.meta.to);
  const referenceDate = new Date();

  return analytics.inventory.fast_moving_skus.slice(0, 10).map((sku) => {
    const avgDailySales = safeNumber(sku.quantity) / Math.max(analysisDays, 1);
    const demandPressure = clamp(avgDailySales / 6, 0.4, 2.6);

    // We do not receive explicit stock levels from APIs, so we derive a conservative estimate.
    const estimatedCurrentStock = Math.max(
      20,
      Math.round(avgDailySales * (8 + (1 / demandPressure) * 6)),
    );

    const predictedStockoutDays = avgDailySales > 0 ? Math.max(1, Math.round(estimatedCurrentStock / avgDailySales)) : null;
    const predictedStockoutDate =
      predictedStockoutDays !== null
        ? (() => {
            const d = new Date(referenceDate);
            d.setUTCDate(d.getUTCDate() + predictedStockoutDays);
            return toDateKey(d);
          })()
        : null;

    const projected30DayDemand = Math.max(0, round((salesForecast.next30DaysTotal / Math.max(analytics.inventory.fast_moving_skus.length, 1)) / 50));
    const safetyStock = Math.ceil(avgDailySales * 10);
    const suggestedReorderUnits = Math.max(
      0,
      Math.ceil(avgDailySales * 30 + projected30DayDemand + safetyStock - estimatedCurrentStock),
    );

    const riskLevel: InventoryForecast["riskLevel"] =
      predictedStockoutDays === null
        ? "low"
        : predictedStockoutDays <= 5
          ? "critical"
          : predictedStockoutDays <= 10
            ? "high"
            : predictedStockoutDays <= 20
              ? "medium"
              : "low";

    return {
      sku: sku.sku,
      estimatedCurrentStock,
      avgDailySales: round(avgDailySales),
      predictedStockoutDays,
      predictedStockoutDate,
      suggestedReorderUnits,
      riskLevel,
      revenue: safeNumber(sku.revenue),
      frequency: safeNumber(sku.frequency),
    };
  });
}

function buildProductionForecast(analytics: AnalyticsApiData): ProductionForecast {
  const byStatusEntries = Object.entries(analytics.operations.production_cycle_time.by_status ?? {}).map(
    ([status, count]) => ({ status, count: safeNumber(count) }),
  );

  const workloadWeighted = byStatusEntries.reduce((sum, entry) => {
    const status = entry.status.toLowerCase();
    const weight = status.includes("wait")
      ? 1.4
      : status.includes("process")
        ? 1.2
        : status.includes("ready") || status.includes("completed")
          ? 0.8
          : 1;
    return sum + entry.count * weight;
  }, 0);

  const baselineCount = byStatusEntries.reduce((sum, entry) => sum + entry.count, 0);
  const predictedWorkloadIndex = baselineCount ? round((workloadWeighted / baselineCount) * 100, 1) : 0;

  const currentFulfillmentDays = safePct(analytics.operations.order_fulfillment_time.average_days);
  const capacityUtilizationPct =
    baselineCount > 0
      ? round(
          clamp(
            50 + safeNumber(analytics.operations.delayed_orders.delayed) * 2 + (currentFulfillmentDays ?? 0) * 4,
            35,
            98,
          ),
          1,
        )
      : null;

  const projectedFulfillmentDays =
    currentFulfillmentDays !== null && capacityUtilizationPct !== null
      ? round(currentFulfillmentDays * (1 + (capacityUtilizationPct - 70) / 220), 2)
      : null;

  const bottleneckStatus =
    byStatusEntries
      .slice()
      .sort((a, b) => b.count - a.count)
      .find((entry) => entry.count > 0)?.status ?? "No active bottleneck";

  return {
    predictedWorkloadIndex,
    currentFulfillmentDays,
    projectedFulfillmentDays,
    capacityUtilizationPct,
    bottleneckStatus,
    byStatus: byStatusEntries,
  };
}

function buildChannelPerformance(rawOrders: unknown[]): ChannelPerformance[] {
  const channels = new Map<
    string,
    {
      orders: number;
      revenue: number;
      delayedOrders: number;
      onTimeDeliveries: number;
      onTimeKnown: number;
    }
  >();

  for (const order of rawOrders as Array<{ payload?: { data?: Record<string, unknown> } }>) {
    const data = order?.payload?.data ?? {};
    const channel =
      String(data.part_status_txt ?? data.status_txt ?? data.payment_status_txt ?? "Unknown").trim() ||
      "Unknown";
    const totalPrice = safeNumber(data.total_price ?? data.total_price_cur);
    const partStatus = String(data.part_status_txt ?? "");

    const aggregate = channels.get(channel) ?? {
      orders: 0,
      revenue: 0,
      delayedOrders: 0,
      onTimeDeliveries: 0,
      onTimeKnown: 0,
    };

    aggregate.orders += 1;
    aggregate.revenue += totalPrice;

    if (/delayed/i.test(partStatus)) aggregate.delayedOrders += 1;
    if (/delivered|expected on time|ready for shipment/i.test(partStatus)) {
      aggregate.onTimeDeliveries += 1;
      aggregate.onTimeKnown += 1;
    } else if (/delayed|not booked/i.test(partStatus)) {
      aggregate.onTimeKnown += 1;
    }

    channels.set(channel, aggregate);
  }

  return Array.from(channels.entries())
    .map(([channel, values]) => ({
      channel,
      orders: values.orders,
      revenue: round(values.revenue),
      delayedOrders: values.delayedOrders,
      onTimePct: values.onTimeKnown > 0 ? round((values.onTimeDeliveries / values.onTimeKnown) * 100, 1) : null,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8);
}

function buildRevenueHeatmap(
  dayPoints: AnalyticsApiData["revenue"]["over_time"]["day"],
): RevenueHeatPoint[] {
  const sorted = [...dayPoints].sort((a, b) => a.day.localeCompare(b.day));
  if (!sorted.length) return [];

  const firstDate = parseDay(sorted[0].day) ?? new Date();

  return sorted
    .map((point) => {
      const date = parseDay(point.day);
      if (!date) return null;
      const dayDiff = Math.floor((date.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24));
      return {
        weekday: date.getUTCDay(),
        weekIndex: Math.floor(dayDiff / 7),
        value: safeNumber(point.revenue),
      };
    })
    .filter((point): point is RevenueHeatPoint => Boolean(point));
}

function fallbackInsights(report: Omit<AIAnalyticsReport, "ai">): AISection {
  const currency = report.currency;
  const topProduct = report.revenue.topByRevenue[0];
  const highestRisk = report.inventory.stockoutForecasts[0];

  const revenueWeekGrowth = report.kpis.revenueGrowthWeekPct;
  const revenueMonthGrowth = report.kpis.revenueGrowthMonthPct;

  const growthSentence =
    revenueWeekGrowth === null
      ? "Week-over-week growth is unavailable due to limited samples."
      : `Week-over-week revenue movement is ${round(revenueWeekGrowth, 2)}%.`;

  const insights: AIInsight[] = [
    {
      id: "revenue-momentum",
      title: "Revenue momentum",
      detail:
        revenueMonthGrowth !== null
          ? `Revenue is ${round(revenueMonthGrowth, 2)}% month-over-month, with ${report.kpis.totalOrders} orders in the analysis window.`
          : "Month-over-month revenue growth is currently unavailable.",
      evidence: growthSentence,
      impact: revenueMonthGrowth !== null && revenueMonthGrowth >= 0 ? "positive" : "negative",
      priority: "high",
      recommendation: "Double down on top-performing SKUs and monitor conversion for weaker channels.",
    },
    {
      id: "product-driver",
      title: "Top product driver",
      detail: topProduct
        ? `${topProduct.item_title} generated ${formatCurrency(topProduct.revenue, currency)} across ${topProduct.orders} orders.`
        : "No top product could be identified for the selected period.",
      evidence: topProduct
        ? `${topProduct.quantity} units sold with average order contribution ${formatCurrency(
            topProduct.revenue / Math.max(topProduct.orders, 1),
            currency,
          )}.`
        : "No product evidence available",
      impact: "positive",
      priority: "medium",
      recommendation: "Review pricing and availability for the top SKU to sustain volume.",
    },
    {
      id: "fulfillment-risk",
      title: "Fulfillment risk",
      detail:
        report.operations.averageFulfillmentDays !== null
          ? `Average order fulfillment is ${round(report.operations.averageFulfillmentDays, 2)} days.`
          : "Fulfillment lead time cannot be estimated yet.",
      evidence: `${report.operations.delayedOrders} delayed orders with on-time delivery at ${report.operations.onTimeDeliveryPct ?? 0}%.`,
      impact: report.operations.delayedOrders > 0 ? "negative" : "neutral",
      priority: report.operations.delayedOrders > 0 ? "high" : "low",
      recommendation: "Prioritize delayed work orders and rebalance capacity around bottleneck stages.",
    },
    {
      id: "inventory-watch",
      title: "Inventory watchlist",
      detail: highestRisk
        ? `${highestRisk.sku} is projected to stock out in ${highestRisk.predictedStockoutDays ?? "N/A"} days.`
        : "No inventory risk SKU identified.",
      evidence: highestRisk
        ? `Estimated stock ${highestRisk.estimatedCurrentStock} units, avg daily sales ${highestRisk.avgDailySales}.`
        : "No inventory evidence available",
      impact: highestRisk?.riskLevel === "critical" || highestRisk?.riskLevel === "high" ? "negative" : "neutral",
      priority: highestRisk?.riskLevel === "critical" ? "high" : "medium",
      recommendation: "Trigger purchase planning for at-risk SKUs with a 30-day coverage target.",
    },
  ];

  const risks = [
    report.operations.delayedOrders > 0
      ? `${report.operations.delayedOrders} orders are currently delayed.`
      : "Delayed-order risk is currently low.",
    highestRisk?.predictedStockoutDays !== null && (highestRisk?.predictedStockoutDays ?? 999) <= 10
      ? `${highestRisk?.sku} may stock out within ${highestRisk?.predictedStockoutDays} days.`
      : "No immediate stockout expected in top movers.",
  ];

  const opportunities = [
    `Projected sales for next 30 days: ${formatCurrency(report.forecasting.sales.next30DaysTotal, currency)}.`,
    `Top customer concentration is ${round(report.kpis.topCustomerSharePct, 2)}% of revenue, enabling focused account expansion.`,
  ];

  const actions: AIActionItem[] = [
    {
      owner: "Sales",
      action: "Create a 2-week push for top 3 revenue SKUs and monitor daily conversion.",
      priority: "high",
    },
    {
      owner: "Operations",
      action: "Reduce delayed orders by prioritizing bottleneck manufacturing statuses this week.",
      priority: "high",
    },
    {
      owner: "Inventory",
      action: "Issue reorder recommendations for high-risk SKUs using forecasted 30-day demand.",
      priority: "medium",
    },
  ];

  return {
    executiveSummary:
      `Revenue stands at ${formatCurrency(report.kpis.totalRevenue, currency)} across ${report.kpis.totalOrders} orders. ` +
      `Forecast indicates ${formatCurrency(report.forecasting.sales.next30DaysTotal, currency)} for the next 30 days.`,
    keyInsights: insights,
    risks,
    opportunities,
    actions,
  };
}

type AISectionPayload = {
  executiveSummary?: unknown;
  keyInsights?: Array<{
    title?: unknown;
    detail?: unknown;
    evidence?: unknown;
    impact?: unknown;
    priority?: unknown;
    recommendation?: unknown;
  }>;
  risks?: unknown[];
  opportunities?: unknown[];
  actions?: Array<{ owner?: unknown; action?: unknown; priority?: unknown }>;
};

function sanitizeImpact(value: unknown): AIInsight["impact"] {
  return value === "positive" || value === "negative" || value === "neutral" ? value : "neutral";
}

function sanitizePriority(value: unknown): AIInsight["priority"] {
  return value === "high" || value === "medium" || value === "low" ? value : "medium";
}

function sanitizeOwner(value: unknown): AIActionItem["owner"] {
  return value === "Finance" || value === "Sales" || value === "Operations" || value === "Inventory" || value === "Leadership"
    ? value
    : "Leadership";
}

function sanitizeAISection(payload: AISectionPayload | null, fallback: AISection): AISection {
  if (!payload) return fallback;

  const keyInsights = Array.isArray(payload.keyInsights)
    ? payload.keyInsights
        .slice(0, 6)
        .map((item, index) => ({
          id: `ai-${index + 1}`,
          title: typeof item.title === "string" && item.title.trim() ? item.title.trim() : fallback.keyInsights[index]?.title ?? "Insight",
          detail: typeof item.detail === "string" && item.detail.trim() ? item.detail.trim() : fallback.keyInsights[index]?.detail ?? "",
          evidence:
            typeof item.evidence === "string" && item.evidence.trim()
              ? item.evidence.trim()
              : fallback.keyInsights[index]?.evidence ?? "",
          impact: sanitizeImpact(item.impact),
          priority: sanitizePriority(item.priority),
          recommendation:
            typeof item.recommendation === "string" && item.recommendation.trim()
              ? item.recommendation.trim()
              : fallback.keyInsights[index]?.recommendation ?? "",
        }))
    : fallback.keyInsights;

  const actions = Array.isArray(payload.actions)
    ? payload.actions.slice(0, 5).map((item, index) => ({
        owner: sanitizeOwner(item.owner),
        action:
          typeof item.action === "string" && item.action.trim()
            ? item.action.trim()
            : fallback.actions[index]?.action ?? "Review dashboard trends and take corrective action.",
        priority: sanitizePriority(item.priority),
      }))
    : fallback.actions;

  const risks = Array.isArray(payload.risks)
    ? payload.risks
        .map((risk) => (typeof risk === "string" ? risk.trim() : ""))
        .filter(Boolean)
        .slice(0, 6)
    : fallback.risks;

  const opportunities = Array.isArray(payload.opportunities)
    ? payload.opportunities
        .map((item) => (typeof item === "string" ? item.trim() : ""))
        .filter(Boolean)
        .slice(0, 6)
    : fallback.opportunities;

  return {
    executiveSummary:
      typeof payload.executiveSummary === "string" && payload.executiveSummary.trim()
        ? payload.executiveSummary.trim()
        : fallback.executiveSummary,
    keyInsights: keyInsights.length ? keyInsights : fallback.keyInsights,
    risks: risks.length ? risks : fallback.risks,
    opportunities: opportunities.length ? opportunities : fallback.opportunities,
    actions: actions.length ? actions : fallback.actions,
  };
}

async function generateAISection(report: Omit<AIAnalyticsReport, "ai">): Promise<AISection> {
  const fallback = fallbackInsights(report);

  const aiInput = {
    period: report.period,
    currency: report.currency,
    kpis: report.kpis,
    topProducts: report.revenue.topByRevenue.slice(0, 5),
    channelPerformance: report.revenue.channelPerformance,
    delayedOrders: report.operations.delayedOrders,
    onTimeDeliveryPct: report.operations.onTimeDeliveryPct,
    stockoutForecasts: report.inventory.stockoutForecasts.slice(0, 5),
    salesForecast: {
      next7DaysTotal: report.forecasting.sales.next7DaysTotal,
      next30DaysTotal: report.forecasting.sales.next30DaysTotal,
      nextQuarterTotal: report.forecasting.sales.nextQuarterTotal,
    },
    productionForecast: report.forecasting.production,
  };

  const systemPrompt = [
    "You are a business intelligence analyst for an ERP dashboard.",
    "Return ONLY valid JSON and no markdown.",
    "Keep every point data-grounded using the provided metrics.",
    "Use concise, executive language.",
  ].join(" ");

  const userPrompt = JSON.stringify({
    task: "Generate AI insights for dashboard.",
    output_schema: {
      executiveSummary: "string",
      keyInsights: [
        {
          title: "string",
          detail: "string",
          evidence: "string",
          impact: "positive|negative|neutral",
          priority: "high|medium|low",
          recommendation: "string",
        },
      ],
      risks: ["string"],
      opportunities: ["string"],
      actions: [
        {
          owner: "Finance|Sales|Operations|Inventory|Leadership",
          action: "string",
          priority: "high|medium|low",
        },
      ],
    },
    constraints: {
      keyInsightsCount: "4-6",
      risksCount: "2-5",
      opportunitiesCount: "2-5",
      actionsCount: "3-5",
      noHallucinations: true,
    },
    data: aiInput,
  });

  try {
    const text = await callOpenRouter(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      900,
    );

    const parsed = tryParseJson<AISectionPayload>(text);
    return sanitizeAISection(parsed, fallback);
  } catch {
    return fallback;
  }
}

function buildBaseReport(context: AnalyticsDataContext): Omit<AIAnalyticsReport, "ai"> {
  const { analytics, rawOrders } = context;
  const currency = analytics.revenue.totals.currency || "AUD";

  const salesForecast = buildSalesForecast(analytics.revenue.over_time.day);
  const stockoutForecasts = buildInventoryForecast(analytics, salesForecast);
  const productionForecast = buildProductionForecast(analytics);
  const channelPerformance = buildChannelPerformance(rawOrders);
  const heatmap = buildRevenueHeatmap(analytics.revenue.over_time.day);

  return {
    generatedAt: new Date().toISOString(),
    currency,
    period: {
      from: analytics.meta.from,
      to: analytics.meta.to,
      ordersTotalInDb: safeNumber(analytics.meta.orders_total_in_db),
      ordersConsidered: safeNumber(analytics.meta.orders_considered),
    },
    kpis: {
      totalRevenue: round(safeNumber(analytics.revenue.totals.revenue)),
      totalOrders: safeNumber(analytics.revenue.totals.orders),
      averageOrderValue: round(safeNumber(analytics.customers.average_order_value)),
      revenueGrowthWeekPct: safePct(analytics.revenue.growth.week?.pct),
      revenueGrowthMonthPct: safePct(analytics.revenue.growth.month?.pct),
      delayedOrders: safeNumber(analytics.operations.delayed_orders.delayed),
      onTimeDeliveryPct: safePct(analytics.operations.on_time_delivery_pct),
      repeatCustomers: analytics.customers.repeat_customers.length,
      topCustomerSharePct: safeNumber(analytics.revenue.revenue_by_customer.pareto.top_20_pct_customers_share_pct),
    },
    revenue: {
      day: analytics.revenue.over_time.day,
      week: analytics.revenue.over_time.week,
      month: analytics.revenue.over_time.month,
      growth: analytics.revenue.growth,
      topByRevenue: analytics.revenue.top_selling_products.by_revenue,
      topByQuantity: analytics.revenue.top_selling_products.by_quantity,
      byCustomer: analytics.revenue.revenue_by_customer.customers,
      channelPerformance,
      heatmap,
    },
    operations: {
      averageFulfillmentDays: safePct(analytics.operations.order_fulfillment_time.average_days),
      fulfillmentSamples: analytics.operations.order_fulfillment_time.samples,
      delayedOrders: safeNumber(analytics.operations.delayed_orders.delayed),
      onTimeDeliveryPct: safePct(analytics.operations.on_time_delivery_pct),
      productionStatuses: Object.entries(analytics.operations.production_cycle_time.by_status).map(([status, count]) => ({
        status,
        count: safeNumber(count),
      })),
    },
    inventory: {
      fastMovingSkus: analytics.inventory.fast_moving_skus,
      deadStockNote: analytics.inventory.dead_stock.note,
      stockoutForecasts,
    },
    customers: {
      repeatCustomers: analytics.customers.repeat_customers,
      topClvCustomers: analytics.customers.clv_top_customers,
      averageOrderValue: round(safeNumber(analytics.customers.average_order_value)),
    },
    forecasting: {
      sales: salesForecast,
      inventory: stockoutForecasts,
      production: productionForecast,
    },
  };
}

export async function getAIAnalyticsReport(options?: {
  forceRefresh?: boolean;
  includeAI?: boolean;
}): Promise<AIAnalyticsReport> {
  const forceRefresh = Boolean(options?.forceRefresh);
  const includeAI = options?.includeAI ?? true;

  if (!forceRefresh && reportCache && reportCache.expiresAt > Date.now()) {
    if (includeAI) return reportCache.value;

    return {
      ...reportCache.value,
      ai: reportCache.value.ai,
    };
  }

  const context = await fetchAnalyticsContext();
  const baseReport = buildBaseReport(context);
  const ai = includeAI ? await generateAISection(baseReport) : fallbackInsights(baseReport);
  const fullReport: AIAnalyticsReport = { ...baseReport, ai };

  reportCache = {
    value: fullReport,
    expiresAt: Date.now() + REPORT_CACHE_TTL_MS,
  };

  return fullReport;
}

type AIChatPayload = {
  answer?: unknown;
  highlights?: unknown[];
  suggestedCharts?: unknown[];
  suggestedDrilldowns?: unknown[];
};

function sanitizeChatResponse(payload: AIChatPayload | null, fallback: AIChatResponse): AIChatResponse {
  if (!payload) return fallback;

  const answer = typeof payload.answer === "string" && payload.answer.trim() ? payload.answer.trim() : fallback.answer;

  const highlights = Array.isArray(payload.highlights)
    ? payload.highlights
        .map((item) => (typeof item === "string" ? item.trim() : ""))
        .filter(Boolean)
        .slice(0, 5)
    : fallback.highlights;

  const suggestedCharts = Array.isArray(payload.suggestedCharts)
    ? payload.suggestedCharts
        .map((item) => (typeof item === "string" ? item.trim() : ""))
        .filter(Boolean)
        .slice(0, 4)
    : fallback.suggestedCharts;

  const suggestedDrilldowns = Array.isArray(payload.suggestedDrilldowns)
    ? payload.suggestedDrilldowns
        .map((item) => (typeof item === "string" ? item.trim() : ""))
        .filter(Boolean)
        .slice(0, 4)
    : fallback.suggestedDrilldowns;

  return {
    answer,
    highlights: highlights.length ? highlights : fallback.highlights,
    suggestedCharts: suggestedCharts.length ? suggestedCharts : fallback.suggestedCharts,
    suggestedDrilldowns: suggestedDrilldowns.length ? suggestedDrilldowns : fallback.suggestedDrilldowns,
  };
}

function fallbackChat(question: string, report: AIAnalyticsReport): AIChatResponse {
  const q = question.toLowerCase();
  const currency = report.currency;

  if (q.includes("revenue") && q.includes("last week")) {
    const currentWeek = report.revenue.week[report.revenue.week.length - 1];
    const previousWeek = report.revenue.week[report.revenue.week.length - 2];
    const currentRevenue = safeNumber(currentWeek?.revenue);
    const previousRevenue = safeNumber(previousWeek?.revenue);
    const deltaPct = previousRevenue > 0 ? round(((currentRevenue - previousRevenue) / previousRevenue) * 100, 2) : 0;

    return {
      answer: `Revenue for the latest available week was ${formatCurrency(currentRevenue, currency)}, which is ${deltaPct >= 0 ? "up" : "down"} ${Math.abs(deltaPct)}% versus the previous week.`,
      highlights: [
        `Latest week: ${currentWeek?.week ?? "N/A"}`,
        `Orders in latest week: ${safeNumber(currentWeek?.orders)}`,
        `Previous week revenue: ${formatCurrency(previousRevenue, currency)}`,
      ],
      suggestedCharts: ["Revenue Trend", "Sales Forecast"],
      suggestedDrilldowns: ["Top products for latest week", "Channel performance by status"],
    };
  }

  if (q.includes("fastest") || q.includes("fast moving") || q.includes("selling fastest")) {
    const top = report.inventory.fastMovingSkus.slice(0, 3);
    const topText =
      top.length > 0
        ? top.map((item) => `${item.sku} (${item.quantity} units)`).join(", ")
        : "No fast-moving SKU data available";

    return {
      answer: `Fastest-moving SKUs are ${topText}.`,
      highlights: top.map((item) => `${item.sku}: qty ${item.quantity}, revenue ${formatCurrency(item.revenue, currency)}`),
      suggestedCharts: ["Inventory Risk", "Top Products by Quantity"],
      suggestedDrilldowns: ["SKU-level sales velocity", "Projected stockout dates"],
    };
  }

  if (q.includes("delayed") && (q.includes("today") || q.includes("orders"))) {
    return {
      answer: `Delayed orders currently stand at ${report.operations.delayedOrders}. On-time delivery is ${report.operations.onTimeDeliveryPct ?? 0}%.`,
      highlights: [
        `Delayed orders: ${report.operations.delayedOrders}`,
        `On-time delivery: ${report.operations.onTimeDeliveryPct ?? 0}%`,
        `Avg fulfillment days: ${report.operations.averageFulfillmentDays ?? 0}`,
      ],
      suggestedCharts: ["Operations Health", "Channel Performance"],
      suggestedDrilldowns: ["Delayed orders by status", "Fulfillment time samples"],
    };
  }

  if (q.includes("stock") || q.includes("stock level")) {
    const sku = report.forecasting.inventory[0];
    if (sku) {
      return {
        answer: `Estimated stock level for ${sku.sku} is ${sku.estimatedCurrentStock} units. Based on current velocity (${sku.avgDailySales}/day), predicted stockout is in ${sku.predictedStockoutDays ?? "N/A"} days with a suggested reorder of ${sku.suggestedReorderUnits} units.`,
        highlights: [
          `SKU: ${sku.sku}`,
          `Estimated stock: ${sku.estimatedCurrentStock}`,
          `Predicted stockout date: ${sku.predictedStockoutDate ?? "N/A"}`,
        ],
        suggestedCharts: ["Inventory Risk", "Sales Forecast"],
        suggestedDrilldowns: ["Stockout watchlist", "SKU demand history"],
      };
    }
  }

  return {
    answer:
      `Current revenue is ${formatCurrency(report.kpis.totalRevenue, currency)} across ${report.kpis.totalOrders} orders. ` +
      `Projected next-30-day sales are ${formatCurrency(report.forecasting.sales.next30DaysTotal, currency)}. ` +
      `Ask me about revenue, delayed orders, fast-moving products, or stockout predictions.`,
    highlights: [
      `On-time delivery: ${report.kpis.onTimeDeliveryPct ?? 0}%`,
      `Repeat customers: ${report.kpis.repeatCustomers}`,
      `Delayed orders: ${report.kpis.delayedOrders}`,
    ],
    suggestedCharts: ["Revenue Trend", "Sales Forecast", "Inventory Risk"],
    suggestedDrilldowns: ["Top customers", "Channel performance", "Production status"],
  };
}

export async function answerAnalyticsQuestion(question: string): Promise<AIChatResponse> {
  const report = await getAIAnalyticsReport({ includeAI: false });
  const fallback = fallbackChat(question, report);

  const promptData = {
    question,
    currency: report.currency,
    kpis: report.kpis,
    topProducts: report.revenue.topByRevenue.slice(0, 6),
    weeklyRevenue: report.revenue.week.slice(-8),
    inventoryForecast: report.forecasting.inventory.slice(0, 6),
    operations: report.operations,
    customerTop: report.customers.topClvCustomers.slice(0, 6),
  };

  const systemPrompt =
    "You are an internal BI assistant. Return only strict JSON. Do not mention unavailable data as factual. If asked about top products, fast moving SKUs, or items, explicitly list their specific names (e.g. from topProducts or inventoryForecast). If the question is nonsensical or out of domain (e.g., 'Will it rain?'), refuse politely and clarify that you only answer business data questions.";

  const userPrompt = JSON.stringify({
    task: "Answer business question using provided dashboard data. Be extremely direct and use names/numbers from the data. Do NOT give vague answers like 'Consult the charts'.",
    output_schema: {
      answer: "string",
      highlights: ["string"],
      suggestedCharts: ["string"],
      suggestedDrilldowns: ["string"],
    },
    constraints: {
      answerLength: "max 110 words",
      highlightsCount: "2-5",
      noMarkdown: true,
      noHallucinations: true,
    },
    data: promptData,
  });

  try {
    const text = await callOpenRouter(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      550,
    );

    const parsed = tryParseJson<AIChatPayload>(text);
    return sanitizeChatResponse(parsed, fallback);
  } catch {
    return fallback;
  }
}
