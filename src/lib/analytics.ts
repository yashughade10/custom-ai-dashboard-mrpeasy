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

export type AnalyticsResult = {
  currency: string;
  totals: {
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
  };
  revenue: {
    perDay: PeriodPoint[];
    perWeek: PeriodPoint[];
    perMonth: PeriodPoint[];
    trend: {
      period: "month" | "week" | "day" | "none";
      changePct: number | null;
      direction: "up" | "down" | "flat" | "none";
    };
  };
  products: {
    topByRevenue: ProductAggregate[];
    topByQuantity: ProductAggregate[];
    fastMoving: ProductAggregate[];
  };
  customers: {
    topByRevenue: CustomerAggregate[];
    clvTop: CustomerAggregate[];
    repeatCount: number;
    repeatRate: number | null;
    pareto: {
      topCustomerCount: number;
      totalCustomers: number;
      shareOfCustomers: number | null;
      shareOfRevenue: number | null;
    };
  };
  operations: {
    fulfillment: {
      count: number;
      avgDays: number | null;
      medianDays: number | null;
    };
    delayedOrders: {
      code: string | null;
      customerName: string;
      daysLate: number;
    }[];
    onTimeRate: number | null;
    productionStatuses: { status: string; count: number }[];
  };
  inventory: {
    deadStockNote: string;
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

function median(values: number[]): number | null {
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

export function buildAnalytics(rawOrders: RawOrder[]): AnalyticsResult {
  const orders = normalizeOrders(rawOrders);
  const totalRevenue = orders.reduce((sum, order) => sum + order.totalPrice, 0);
  const totalOrders = orders.length;
  const averageOrderValue = totalOrders ? totalRevenue / totalOrders : 0;

  const perDayMap = new Map<string, number>();
  const perWeekMap = new Map<string, number>();
  const perMonthMap = new Map<string, number>();

  orders.forEach((order) => {
    if (!order.createdAt) return;
    addToMap(perDayMap, toDayKey(order.createdAt), order.totalPrice);
    addToMap(perWeekMap, toWeekKey(order.createdAt), order.totalPrice);
    addToMap(perMonthMap, toMonthKey(order.createdAt), order.totalPrice);
  });

  const perDay = mapToSortedPoints(perDayMap);
  const perWeek = mapToSortedPoints(perWeekMap);
  const perMonth = mapToSortedPoints(perMonthMap);

  const trendSource = perMonth.length >= 2 ? perMonth : perWeek.length >= 2 ? perWeek : perDay.length >= 2 ? perDay : [];
  let trendPeriod: AnalyticsResult["revenue"]["trend"]["period"] = "none";
  if (trendSource === perMonth) trendPeriod = "month";
  else if (trendSource === perWeek) trendPeriod = "week";
  else if (trendSource === perDay) trendPeriod = "day";

  let changePct: number | null = null;
  let direction: AnalyticsResult["revenue"]["trend"]["direction"] = "none";
  if (trendSource.length >= 2) {
    const last = trendSource[trendSource.length - 1].revenue;
    const prev = trendSource[trendSource.length - 2].revenue;
    if (prev !== 0) {
      changePct = ((last - prev) / prev) * 100;
      if (changePct > 1) direction = "up";
      else if (changePct < -1) direction = "down";
      else direction = "flat";
    } else if (last !== 0) {
      changePct = null;
      direction = "up";
    }
  }

  const productMap = new Map<string, ProductAggregate>();
  orders.forEach((order) => {
    order.products.forEach((product) => {
      const key = `${product.code ?? ""}::${product.title}`;
      const current = productMap.get(key) ?? {
        name: product.title,
        code: product.code ?? null,
        revenue: 0,
        quantity: 0,
        frequency: 0,
      };
      current.revenue += product.totalPrice;
      current.quantity += product.quantity;
      current.frequency += 1;
      productMap.set(key, current);
    });
  });

  const products = Array.from(productMap.values());
  const topByRevenue = [...products].sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  const topByQuantity = [...products].sort((a, b) => b.quantity - a.quantity).slice(0, 5);
  const fastMoving = [...products]
    .sort((a, b) => b.frequency - a.frequency || b.quantity - a.quantity)
    .slice(0, 5);

  const customerMap = new Map<string, CustomerAggregate>();
  orders.forEach((order) => {
    const key = String(order.customerId ?? order.customerName);
    const current = customerMap.get(key) ?? {
      customerId: order.customerId,
      customerName: order.customerName,
      revenue: 0,
      orders: 0,
    };
    current.revenue += order.totalPrice;
    current.orders += 1;
    customerMap.set(key, current);
  });

  const customers = Array.from(customerMap.values()).sort((a, b) => b.revenue - a.revenue);
  const clvTop = customers.slice(0, 5);
  const repeatCount = customers.filter((c) => c.orders > 1).length;
  const repeatRate = customers.length ? repeatCount / customers.length : null;

  let paretoCount = 0;
  let paretoRevenue = 0;
  if (totalRevenue > 0) {
    for (const customer of customers) {
      paretoRevenue += customer.revenue;
      paretoCount += 1;
      if (paretoRevenue / totalRevenue >= 0.8) break;
    }
  }

  const fulfillmentTimes = orders
    .filter((order) => order.createdAt && order.actualDeliveryDate)
    .map((order) => diffDays(order.actualDeliveryDate!, order.createdAt!));

  const fulfillmentAvg = fulfillmentTimes.length
    ? fulfillmentTimes.reduce((sum, value) => sum + value, 0) / fulfillmentTimes.length
    : null;

  const delayedOrders = orders
    .filter((order) => order.deliveryDate && order.actualDeliveryDate && order.actualDeliveryDate > order.deliveryDate)
    .map((order) => ({
      code: order.code,
      customerName: order.customerName,
      daysLate: diffDays(order.actualDeliveryDate!, order.deliveryDate!),
    }))
    .sort((a, b) => b.daysLate - a.daysLate);

  const deliveredOrders = orders.filter((order) => order.deliveryDate && order.actualDeliveryDate);
  const onTimeCount = deliveredOrders.filter(
    (order) => order.actualDeliveryDate && order.deliveryDate && order.actualDeliveryDate <= order.deliveryDate
  ).length;
  const onTimeRate = deliveredOrders.length ? onTimeCount / deliveredOrders.length : null;

  const statusMap = new Map<string, number>();
  orders.forEach((order) => {
    order.manufacturingStatuses.forEach((status) => {
      addToMap(statusMap, status, 1);
    });
  });

  const productionStatuses = Array.from(statusMap.entries())
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count);

  const currency = orders.find((order) => order.currency)?.currency ?? "AUD";

  return {
    currency,
    totals: {
      totalRevenue,
      totalOrders,
      averageOrderValue,
    },
    revenue: {
      perDay,
      perWeek,
      perMonth,
      trend: {
        period: trendPeriod,
        changePct,
        direction,
      },
    },
    products: {
      topByRevenue,
      topByQuantity,
      fastMoving,
    },
    customers: {
      topByRevenue: customers.slice(0, 5),
      clvTop,
      repeatCount,
      repeatRate,
      pareto: {
        topCustomerCount: paretoCount,
        totalCustomers: customers.length,
        shareOfCustomers: customers.length ? paretoCount / customers.length : null,
        shareOfRevenue: totalRevenue ? paretoRevenue / totalRevenue : null,
      },
    },
    operations: {
      fulfillment: {
        count: fulfillmentTimes.length,
        avgDays: fulfillmentAvg,
        medianDays: median(fulfillmentTimes),
      },
      delayedOrders,
      onTimeRate,
      productionStatuses,
    },
    inventory: {
      deadStockNote: "Full product catalog is required to identify dead stock.",
    },
  };
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
