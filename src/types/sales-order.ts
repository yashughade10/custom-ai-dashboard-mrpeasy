// types/sales-order.ts

export type SalesOrderStatus =
  | "draft"
  | "confirmed"
  | "in_production"
  | "shipped"
  | "delivered"
  | "cancelled";

// Ordered progression used by the workflow tracker. "cancelled" is a
// terminal state reachable from any step, not part of the linear flow.
export const SALES_ORDER_FLOW: SalesOrderStatus[] = [
  "draft",
  "confirmed",
  "in_production",
  "shipped",
  "delivered",
];

export interface SalesOrderItem {
  id?: number;
  product_id: number;
  description: string;
  quantity: number;
  unit_price: number;
  discount_pct: number;
  tax_pct: number;
  line_total?: number; // computed by the backend
  sort_order?: number;
}

export interface SalesOrder {
  id: number;
  order_number: string;
  quotation_id: number | null;
  contact_id: number | null;
  company_id: number | null;
  customer_po: string | null;
  status: SalesOrderStatus;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total: number;
  currency: string;
  delivery_date: string | null;
  shipping_address: string | null;
  notes: string | null;
  approved_by: number | null;
  approved_at: string | null;
  created_by: number;
  created_at: string;
  updated_at: string;
  items?: SalesOrderItem[];
  company_name?: string | null;
  contact_name?: string | null;
}

// ----- Request payloads -----

export interface SalesOrderItemInput {
  id?: number;
  product_id: number;
  description: string;
  quantity: number;
  unit_price: number;
  discount_pct: number;
  tax_pct: number;
}

export interface CreateSalesOrderInput {
  contact_id?: number | null;
  company_id?: number | null;
  customer_po?: string | null;
  delivery_date?: string | null;
  shipping_address?: string | null;
  notes?: string | null;
  items: SalesOrderItemInput[];
}

export type UpdateSalesOrderInput = Partial<CreateSalesOrderInput>;

// ----- List filters -----

export interface SalesOrderListFilters {
  status?: SalesOrderStatus;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
  search?: string;
}

// ----- Shared API envelope -----

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta?: PaginationMeta;
}