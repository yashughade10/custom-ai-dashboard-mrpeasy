// types/quotation.ts

export type QuotationStatus =
  | "draft"
  | "sent"
  | "accepted"
  | "rejected"
  | "expired";

export interface QuotationItem {
  id?: number;
  product_id: number;
  description?: string;
  quantity: number;
  unit_price?: number; // returned by API, resolved from product on the backend
  discount_pct: number;
  tax_pct: number;
  line_total?: number; // returned by API
  sort_order: number;
}

export interface Quotation {
  id: number;
  quote_number: string;
  contact_id: number | null;
  company_id: number | null;
  deal_id: number | null;
  status: QuotationStatus;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total: number;
  currency: string;
  valid_until: string | null; // YYYY-MM-DD
  notes: string | null;
  terms: string | null;
  approved_by: number | null;
  approved_at: string | null;
  created_by: number;
  created_at: string;
  updated_at: string;
  items?: QuotationItem[];
  // convenience fields the backend may join in on list/detail responses
  company_name?: string | null;
  contact_name?: string | null;
}

// ----- Request payloads -----

export interface QuotationItemInput {
  id?: number; // include on update to keep an existing line
  product_id: number;
  quantity: number;
  discount_pct: number;
  tax_pct: number;
  sort_order: number;
}

export interface CreateQuotationInput {
  contact_id?: number | null;
  company_id?: number | null;
  deal_id?: number | null;
  currency: string;
  valid_until?: string | null;
  notes?: string | null;
  terms?: string | null;
  items: QuotationItemInput[];
}

export type UpdateQuotationInput = Partial<CreateQuotationInput>;

export interface SendQuotationInput {
  email: string;
}

// ----- List filters -----

export interface QuotationListFilters {
  status?: QuotationStatus;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
  search?: string;
}

// ----- Shared API envelope (matches existing LOT Trucks response shape) -----

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
  meta: PaginationMeta;
}

// ----- Lightweight lookups used by the create/edit form -----

export interface CompanyOption {
  id: number;
  name: string;
}

export interface ContactOption {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
  company_name?: string | null;
}

export interface DealOption {
  id: number;
  title: string;
}

export interface ProductOption {
  id: number;
  name: string;
  sku?: string;
  // Different backends name this differently — support the common variants
  // and resolve the actual value with `getProductUnitPrice()` below.
  unit_price?: number;
  price?: number;
  sale_price?: number;
  unitPrice?: number;
}

/** Resolves whichever price field the products API actually returns. */
export function getProductUnitPrice(product?: ProductOption | null): number {
  if (!product) return 0;
  const value =
    product.unit_price ?? product.price ?? product.sale_price ?? product.unitPrice;
  return typeof value === "number" ? value : Number(value) || 0;
}

export const CURRENCIES = ["AUD", "USD", "EUR", "GBP", "NZD"] as const;