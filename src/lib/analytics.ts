export type RawOrder = {
  id?: number | string;
  payload?: { data?: any };
  data?: any;
};

export type NormalizedProduct = {
  title: string;
  code: string | null;
  quantity: number;
  totalPrice: number;
  manufacturingStatuses: string[];
};

export type NormalizedOrder = {
  id: number | string;
  code: string | null;
  createdAt: Date | null;
  totalPrice: number;
  customerId: number | string | null;
  customerName: string;
  products: NormalizedProduct[];
  deliveryDate: Date | null;
  actualDeliveryDate: Date | null;
  manufacturingStatuses: string[];
  currency: string | null;
};

export type PeriodPoint = { key: string; revenue: number };
export type ProductAggregate = {
  name: string;
  code: string | null;
  revenue: number;
  quantity: number;
  frequency: number;
};
export type CustomerAggregate = {
  customerId: number | string | null;
  customerName: string;
  revenue: number;
  orders: number;
};

export type AnalyticsApiData = {
  revenue: {
    totals: { revenue: number; orders: number; currency: string };
    over_time: {
      day: { day: string; revenue: number; orders: number }[];
      week: { week: string; revenue: number; orders: number }[];
      month: { month: string; revenue: number; orders: number }[];
    };
    growth: {
      day: { previous: number; current: number; pct: number };
      week: { previous: number; current: number; pct: number };
      month: { previous: number; current: number; pct: number };
    };
    top_selling_products: {
      by_revenue: { item_title: string; revenue: number; quantity: number; orders: number }[];
      by_quantity: { item_title: string; revenue: number; quantity: number; orders: number }[];
    };
    revenue_by_customer: {
      customers: {
        customer_id: number;
        customer_name: string;
        revenue: number;
        orders: number;
        share_pct: number;
      }[];
      pareto: {
        customers_for_80_pct: number;
        total_customers: number;
        top_20_pct_customers_share_pct: number;
      };
    };
  };
  operations: {
    order_fulfillment_time: {
      average_days: number | null;
      samples: { order_code: string; fulfillment_days: number }[];
      note: string | null;
    };
    delayed_orders: {
      delayed: number;
      delivered_with_planned_date: number;
      note: string | null;
    };
    on_time_delivery_pct: number | null;
    production_cycle_time: {
      manufacturing_orders_seen: number;
      manufacturing_line_sources_seen: number;
      by_status: Record<string, number>;
      note: string | null;
    };
  };
  inventory: {
    fast_moving_skus: { sku: string; frequency: number; quantity: number; revenue: number }[];
    dead_stock: { available: boolean; note: string };
  };
  customers: {
    repeat_customers: { customer_id: number; customer_name: string; orders: number; revenue: number }[];
    clv_top_customers: { customer_id: number; customer_name: string; clv: number; orders: number }[];
    average_order_value: number;
  };
  meta: {
    orders_total_in_db: number;
    orders_considered: number;
    from: string | null;
    to: string | null;
    topN: number;
  };
};

const MILLISECONDS_IN_DAY = 1000 * 60 * 60 * 24;

function safeNumber(value: any): number {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function parseEpochToDate(value: any): Date | null {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value;

  const raw = String(value).trim();
  if (!raw) return null;

  if (/^\d+$/.test(raw)) {
    const asNumber = Number(raw);
    if (raw.length >= 13) return new Date(asNumber);
    return new Date(asNumber * 1000);
  }

  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toDayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function toMonthKey(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function toWeekKey(date: Date): string {
  const utc = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = utc.getUTCDay() === 0 ? 7 : utc.getUTCDay();
  utc.setUTCDate(utc.getUTCDate() - day + 1);
  return toDayKey(utc);
}

function addToMap(map: Map<string, number>, key: string, value: number) {
  map.set(key, (map.get(key) ?? 0) + value);
}

function mapToSortedPoints(map: Map<string, number>): PeriodPoint[] {
  return Array.from(map.entries())
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([key, revenue]) => ({ key, revenue }));
}

export function median(values: number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

function diffDays(later: Date, earlier: Date): number {
  return (later.getTime() - earlier.getTime()) / MILLISECONDS_IN_DAY;
}

export function normalizeOrders(orders: RawOrder[]): NormalizedOrder[] {
  return orders.map((order) => {
    const raw = order?.payload?.data ?? order?.data ?? order ?? {};
    const createdAt = parseEpochToDate(raw.created);

    const products: NormalizedProduct[] = (raw.products ?? []).map((product: any) => {
      const statuses = Array.isArray(product.source)
        ? product.source.map((s: any) => s.manufacturing_order_status_txt).filter(Boolean)
        : [];

      return {
        title: product.item_title || product.item_code || "Unknown",
        code: product.item_code ?? null,
        quantity: safeNumber(product.quantity),
        totalPrice: safeNumber(product.total_price ?? product.total_price_cur),
        manufacturingStatuses: statuses,
      };
    });

    const manufacturingStatuses = products.flatMap((p) => p.manufacturingStatuses);

    return {
      id: order?.id ?? raw.code ?? Math.random(),
      code: raw.code ?? null,
      createdAt,
      totalPrice: safeNumber(raw.total_price ?? raw.total_price_cur),
      customerId: raw.customer_id ?? raw.customer_code ?? null,
      customerName: raw.customer_name ?? "Unknown",
      products,
      deliveryDate: parseEpochToDate(raw.delivery_date),
      actualDeliveryDate: parseEpochToDate(raw.actual_delivery_date),
      manufacturingStatuses,
      currency: raw.currency ?? null,
    };
  });
}

export function formatCurrency(value: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency}`;
  }
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-AU").format(value);
}

export function formatPercent(value: number | null): string {
  if (value === null) return "Not enough data";
  return `${(value * 100).toFixed(1)}%`;
}

export function formatDays(value: number | null): string {
  if (value === null || Number.isNaN(value)) return "Not enough data";
  return `${value.toFixed(1)} days`;
}
