import type { AnalyticsApiData, NormalizedOrder } from "@/lib/analytics";

export type InsightImpact = "positive" | "negative" | "neutral";
export type InsightPriority = "high" | "medium" | "low";

export type AIInsight = {
  id: string;
  title: string;
  detail: string;
  evidence: string;
  impact: InsightImpact;
  priority: InsightPriority;
  recommendation: string;
};

export type AIActionItem = {
  owner: "Finance" | "Sales" | "Operations" | "Inventory" | "Leadership";
  action: string;
  priority: InsightPriority;
};

export type SalesForecastPoint = {
  date: string;
  expected: number;
  lower: number;
  upper: number;
};

export type SalesForecast = {
  method: string;
  next7DaysTotal: number;
  next30DaysTotal: number;
  nextQuarterTotal: number;
  points: SalesForecastPoint[];
};

export type InventoryForecast = {
  sku: string;
  estimatedCurrentStock: number;
  avgDailySales: number;
  predictedStockoutDays: number | null;
  predictedStockoutDate: string | null;
  suggestedReorderUnits: number;
  riskLevel: "critical" | "high" | "medium" | "low";
  revenue: number;
  frequency: number;
};

export type ProductionForecast = {
  predictedWorkloadIndex: number;
  currentFulfillmentDays: number | null;
  projectedFulfillmentDays: number | null;
  capacityUtilizationPct: number | null;
  bottleneckStatus: string;
  byStatus: { status: string; count: number }[];
};

export type ChannelPerformance = {
  channel: string;
  orders: number;
  revenue: number;
  delayedOrders: number;
  onTimePct: number | null;
};

export type RevenueHeatPoint = {
  weekday: number;
  weekIndex: number;
  value: number;
};

export type KPIBlock = {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  revenueGrowthWeekPct: number | null;
  revenueGrowthMonthPct: number | null;
  delayedOrders: number;
  onTimeDeliveryPct: number | null;
  repeatCustomers: number;
  topCustomerSharePct: number;
};

export type AISection = {
  executiveSummary: string;
  keyInsights: AIInsight[];
  risks: string[];
  opportunities: string[];
  actions: AIActionItem[];
};

export type AnalyticsDataContext = {
  rawOrders: unknown[];
  normalizedOrders: NormalizedOrder[];
  analytics: AnalyticsApiData;
};

export type AIAnalyticsReport = {
  generatedAt: string;
  currency: string;
  period: {
    from: string | null;
    to: string | null;
    ordersTotalInDb: number;
    ordersConsidered: number;
  };
  kpis: KPIBlock;
  revenue: {
    day: AnalyticsApiData["revenue"]["over_time"]["day"];
    week: AnalyticsApiData["revenue"]["over_time"]["week"];
    month: AnalyticsApiData["revenue"]["over_time"]["month"];
    growth: AnalyticsApiData["revenue"]["growth"];
    topByRevenue: AnalyticsApiData["revenue"]["top_selling_products"]["by_revenue"];
    topByQuantity: AnalyticsApiData["revenue"]["top_selling_products"]["by_quantity"];
    byCustomer: AnalyticsApiData["revenue"]["revenue_by_customer"]["customers"];
    channelPerformance: ChannelPerformance[];
    heatmap: RevenueHeatPoint[];
  };
  operations: {
    averageFulfillmentDays: number | null;
    fulfillmentSamples: AnalyticsApiData["operations"]["order_fulfillment_time"]["samples"];
    delayedOrders: number;
    onTimeDeliveryPct: number | null;
    productionStatuses: { status: string; count: number }[];
  };
  inventory: {
    fastMovingSkus: AnalyticsApiData["inventory"]["fast_moving_skus"];
    deadStockNote: string;
    stockoutForecasts: InventoryForecast[];
  };
  customers: {
    repeatCustomers: AnalyticsApiData["customers"]["repeat_customers"];
    topClvCustomers: AnalyticsApiData["customers"]["clv_top_customers"];
    averageOrderValue: number;
  };
  forecasting: {
    sales: SalesForecast;
    inventory: InventoryForecast[];
    production: ProductionForecast;
  };
  ai: AISection;
};

export type AIChatResponse = {
  answer: string;
  highlights: string[];
  suggestedCharts: string[];
  suggestedDrilldowns: string[];
};
