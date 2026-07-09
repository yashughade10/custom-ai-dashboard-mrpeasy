import type { AIAnalyticsReport, AIChatResponse } from "@/lib/ai-report-types";
import { apiFetch } from "@/lib/api/http";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://apimrpeasy-vaclift-backend.vercel.app/api";

async function fetchOrders() {
  const response = await apiFetch(`/orders`);

  if (!response.ok) {
    throw new Error("Failed to fetch orders");
  }

  const result = await response.json();

  return result.data;
}

async function fetchAnalytics() {
  const response = await apiFetch(`/analytics`);

  if (!response.ok) {
    throw new Error("Failed to fetch analytics");
  }

  const result = await response.json();

  return result.data;
}

async function fetchAIReport(refresh = false): Promise<AIAnalyticsReport> {
  const response = await apiFetch(`/ai-report${refresh ? "?refresh=1" : ""}`);

  if (!response.ok) {
    throw new Error("Failed to fetch AI analytics report");
  }

  const result = (await response.json()) as { success: boolean; report?: AIAnalyticsReport };

  if (!result.success || !result.report) {
    throw new Error("AI analytics report is unavailable");
  }

  return result.report;
}

async function askAnalyticsQuestion(question: string): Promise<AIChatResponse> {
  const response = await apiFetch(`/ai-chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ question }),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch AI chat response");
  }

  const result = (await response.json()) as { success: boolean; response?: AIChatResponse };

  if (!result.success || !result.response) {
    throw new Error("AI chat response is unavailable");
  }

  return result.response;
}

const loginDashboard = async (email: string, password: string) => {
  const response = await apiFetch(`/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  })

  const data = await response.json()

  if (data?.success === false) {
    throw new Error(data?.error || data?.message || "Login failed")
  }

  if (!response.ok) {
    throw new Error(data?.message || data?.error || `Login failed with status ${response.status}`)
  }

  return data;
}

// CRM Endpoints
async function fetchCrmStats() {
  const response = await apiFetch(`/crm/stats`);
  if (!response.ok) throw new Error("Failed to fetch CRM stats");
  return (await response.json()).data;
}

async function fetchContacts(params?: { page?: number; search?: string; lifecycle?: string; limit?: number }) {
  const q = new URLSearchParams(params as any).toString();
  const response = await apiFetch(`/crm/contacts?${q}`);
  if (!response.ok) throw new Error("Failed to fetch contacts");
  return await response.json(); // { data, pagination }
}

async function fetchContact(id: string) {
  const response = await apiFetch(`/crm/contacts/${id}`);
  if (!response.ok) throw new Error("Failed to fetch contact");
  return (await response.json()).data;
}

async function fetchCompanies(params?: { page?: number; search?: string; industry?: string; limit?: number }) {
  const q = new URLSearchParams(params as any).toString();
  const response = await apiFetch(`/crm/companies?${q}`);
  if (!response.ok) throw new Error("Failed to fetch companies");
  return await response.json(); // { data, pagination }
}

async function fetchCompany(id: string) {
  const response = await apiFetch(`/crm/companies/${id}`);
  if (!response.ok) throw new Error("Failed to fetch company");
  return (await response.json()).data;
}

async function fetchDeals(params?: { page?: number; search?: string; stage?: string; owner?: string; limit?: number }) {
  const q = new URLSearchParams(params as any).toString();
  const response = await apiFetch(`/crm/deals?${q}`);
  if (!response.ok) throw new Error("Failed to fetch deals");
  return await response.json(); // { data, pagination }
}

async function fetchDeal(id: string) {
  const response = await apiFetch(`/crm/deals/${id}`);
  if (!response.ok) throw new Error("Failed to fetch deal");
  return (await response.json()).data;
}

async function fetchDealsPipeline() {
  const response = await apiFetch(`/crm/deals/pipeline`);
  if (!response.ok) throw new Error("Failed to fetch deals pipeline");
  return (await response.json()).data;
}

async function fetchIndustries() {
  const response = await apiFetch(`/crm/companies/by-industry`);
  if (!response.ok) throw new Error("Failed to fetch industries");
  return (await response.json()).data;
}

async function fetchLifecycles() {
  const response = await apiFetch(`/crm/contacts/by-lifecycle`);
  if (!response.ok) throw new Error("Failed to fetch lifecycles");
  return (await response.json()).data;
}

async function fetchOwners() {
  const response = await apiFetch(`/crm/owners`);
  if (!response.ok) throw new Error("Failed to fetch owners");
  return (await response.json()).data;
}

// Global Search
async function fetchSearchResults(query: string) {
  if (!query) return [];
  const response = await apiFetch(`/search?q=${encodeURIComponent(query)}`);
  if (!response.ok) throw new Error("Failed to fetch search results");
  return (await response.json()).data;
}

// Leads
async function fetchLeads(params?: { page?: number; search?: string; status?: string; assigned_to?: string }) {
  const q = new URLSearchParams(params as any).toString();
  const response = await apiFetch(`/crm/leads?${q}`);
  if (!response.ok) throw new Error("Failed to fetch leads");
  return await response.json();
}

async function fetchLead(id: string) {
  const response = await apiFetch(`/crm/leads/${id}`);
  if (!response.ok) throw new Error("Failed to fetch lead");
  return (await response.json()).data;
}

async function updateLeadStatus(id: string, status: string) {
  const response = await apiFetch(`/crm/leads/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status })
  });
  if (!response.ok) throw new Error("Failed to update lead status");
  return (await response.json()).data;
}

async function createLead(data: Record<string, any>) {
  const response = await apiFetch(`/crm/leads`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to create lead");
  return (await response.json()).data;
}

async function updateLead(id: string, data: Record<string, any>) {
  const response = await apiFetch(`/crm/leads/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to update lead");
  return (await response.json()).data;
}

async function deleteLead(id: string) {
  const response = await apiFetch(`/crm/leads/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Failed to delete lead");
  return await response.json();
}

async function convertLead(id: string) {
  const response = await apiFetch(`/crm/leads/${id}/convert`, {
    method: "POST",
  });
  if (!response.ok) throw new Error("Failed to convert lead");
  return await response.json();
}

// Opportunities
async function fetchOpportunities(params?: { page?: number; search?: string; stage?: string; assigned_to?: string }) {
  const q = new URLSearchParams(params as any).toString();
  const response = await apiFetch(`/crm/opportunities?${q}`);
  if (!response.ok) throw new Error("Failed to fetch opportunities");
  return await response.json();
}

async function fetchOpportunity(id: string) {
  const response = await apiFetch(`/crm/opportunities/${id}`);
  if (!response.ok) throw new Error("Failed to fetch opportunity");
  return (await response.json()).data;
}

async function createOpportunity(data: Record<string, any>) {
  const response = await apiFetch(`/crm/opportunities`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to create opportunity");
  return (await response.json()).data;
}

async function updateOpportunity(id: string, data: Record<string, any>) {
  const response = await apiFetch(`/crm/opportunities/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to update opportunity");
  return (await response.json()).data;
}

async function deleteOpportunity(id: string) {
  const response = await apiFetch(`/crm/opportunities/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Failed to delete opportunity");
  return await response.json();
}

async function updateOpportunityStage(id: string, stage: string) {
  const response = await apiFetch(`/crm/opportunities/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ stage })
  });
  if (!response.ok) throw new Error("Failed to update opportunity stage");
  return (await response.json()).data;
}

// Activities
async function fetchActivities(params?: { page?: number; type?: string; status?: string; assigned_to?: string }) {
  const q = new URLSearchParams(params as any).toString();
  const response = await apiFetch(`/crm/activities?${q}`);
  if (!response.ok) throw new Error("Failed to fetch activities");
  return await response.json();
}

async function fetchActivity(id: string) {
  const response = await apiFetch(`/crm/activities/${id}`);
  if (!response.ok) throw new Error("Failed to fetch activity");
  return (await response.json()).data;
}

async function createActivity(data: Record<string, any>) {
  const response = await apiFetch(`/crm/activities`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to create activity");
  return (await response.json()).data;
}

async function updateActivity(id: string, data: Record<string, any>) {
  const response = await apiFetch(`/crm/activities/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to update activity");
  return (await response.json()).data;
}

async function deleteActivity(id: string) {
  const response = await apiFetch(`/crm/activities/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Failed to delete activity");
  return await response.json();
}

// ==================== PRODUCTION MODULE ====================

// Products
async function fetchProducts(params?: { page?: number; search?: string; category?: string; is_raw_material?: string; is_finished_good?: string }) {
  const q = new URLSearchParams(params as any).toString();
  const response = await apiFetch(`/products?${q}`);
  if (!response.ok) throw new Error("Failed to fetch products");
  return await response.json();
}

async function createProduct(data: Record<string, any>) {
  const response = await apiFetch(`/products`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to create product");
  return (await response.json()).data;
}

async function updateProduct(id: string, data: Record<string, any>) {
  const response = await apiFetch(`/products/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to update product");
  return (await response.json()).data;
}

async function deleteProduct(id: string) {
  const response = await apiFetch(`/products/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Failed to delete product");
  return await response.json();
}

// Bill of Materials
async function fetchBoms() {
  const response = await apiFetch(`/bom`);
  if (!response.ok) throw new Error("Failed to fetch BOMs");
  return await response.json();
}

async function fetchBom(id: string) {
  const response = await apiFetch(`/bom/${id}`);
  if (!response.ok) throw new Error("Failed to fetch BOM");
  return (await response.json()).data;
}

async function fetchBomByProduct(productId: string) {
  const response = await apiFetch(`/bom/by-product/${productId}`);
  if (!response.ok) throw new Error("Failed to fetch BOM for product");
  return (await response.json()).data;
}

async function createBom(data: Record<string, any>) {
  const response = await apiFetch(`/bom`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to create BOM");
  return (await response.json()).data;
}

async function updateBom(id: string, data: Record<string, any>) {
  const response = await apiFetch(`/bom/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to update BOM");
  return (await response.json()).data;
}

async function deleteBom(id: string) {
  const response = await apiFetch(`/bom/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Failed to delete BOM");
  return await response.json();
}

// Production Orders
async function fetchProductionOrders() {
  const response = await apiFetch(`/production/orders`);
  if (!response.ok) throw new Error("Failed to fetch production orders");
  return await response.json();
}

async function fetchProductionOrder(id: string) {
  const response = await apiFetch(`/production/orders/${id}`);
  if (!response.ok) throw new Error("Failed to fetch production order");
  return (await response.json()).data;
}

async function createProductionOrder(data: Record<string, any>) {
  const response = await apiFetch(`/production/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to create production order");
  return (await response.json()).data;
}

async function updateProductionOrder(id: string, data: Record<string, any>) {
  const response = await apiFetch(`/production/orders/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to update production order");
  return (await response.json()).data;
}

async function startProductionOrder(id: string) {
  const response = await apiFetch(`/production/orders/${id}/start`, {
    method: "POST",
  });
  if (!response.ok) throw new Error("Failed to start production order");
  return (await response.json()).data;
}

async function completeProductionOrder(id: string) {
  const response = await apiFetch(`/production/orders/${id}/complete`, {
    method: "POST",
  });
  if (!response.ok) throw new Error("Failed to complete production order");
  return (await response.json()).data;
}

async function consumeMaterial(orderId: string, data: Record<string, any>) {
  const response = await apiFetch(`/production/orders/${orderId}/consume`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to log material consumption");
  return (await response.json()).data;
}

// Production Progress
async function fetchProductionProgress() {
  const response = await apiFetch(`/production/progress`);
  if (!response.ok) throw new Error("Failed to fetch production progress");
  return (await response.json()).data;
}

// Procurement - Suppliers
async function fetchSuppliers() {
  const response = await apiFetch(`/procurement/suppliers`);
  if (!response.ok) throw new Error("Failed to fetch suppliers");
  return (await response.json()).data;
}

async function createSupplier(data: Record<string, any>) {
  const response = await apiFetch(`/procurement/suppliers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to create supplier");
  return (await response.json()).data;
}

async function updateSupplier(id: string, data: Record<string, any>) {
  const response = await apiFetch(`/procurement/suppliers/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to update supplier");
  return (await response.json()).data;
}

async function deleteSupplier(id: string) {
  const response = await apiFetch(`/procurement/suppliers/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Failed to delete supplier");
  return await response.json();
}

// Procurement - Purchase Orders
async function fetchPurchaseOrders() {
  const response = await apiFetch(`/procurement/orders`);
  if (!response.ok) throw new Error("Failed to fetch purchase orders");
  return (await response.json()).data;
}

async function fetchPurchaseOrder(id: string) {
  const response = await apiFetch(`/procurement/orders/${id}`);
  if (!response.ok) throw new Error("Failed to fetch purchase order");
  return (await response.json()).data;
}

async function createPurchaseOrder(data: Record<string, any>) {
  const response = await apiFetch(`/procurement/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to create purchase order");
  return (await response.json()).data;
}

async function updatePurchaseOrder(id: string, data: Record<string, any>) {
  const response = await apiFetch(`/procurement/orders/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to update purchase order");
  return (await response.json()).data;
}

async function sendPurchaseOrder(id: string) {
  const response = await apiFetch(`/procurement/orders/${id}/send`, {
    method: "POST",
  });
  if (!response.ok) throw new Error("Failed to send purchase order");
  return (await response.json()).data;
}

// Procurement - Goods Receipts
async function receiveGoods(data: Record<string, any>) {
  const response = await apiFetch(`/procurement/goods-receipt`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to receive goods");
  return (await response.json()).data;
}

async function fetchGoodsReceipts(poId: string) {
  const response = await apiFetch(`/procurement/goods-receipt/${poId}`);
  if (!response.ok) throw new Error("Failed to fetch goods receipts");
  return (await response.json()).data;
}

export {
  fetchOrders,
  fetchAnalytics,
  fetchAIReport,
  askAnalyticsQuestion,
  loginDashboard,
  fetchCrmStats,
  fetchContacts,
  fetchContact,
  fetchCompanies,
  fetchCompany,
  fetchDeals,
  fetchDeal,
  fetchDealsPipeline,
  fetchIndustries,
  fetchLifecycles,
  fetchOwners,
  // Opportunities
  fetchOpportunities,
  fetchOpportunity,
  createOpportunity,
  updateOpportunity,
  deleteOpportunity,
  fetchLeads,
  fetchLead,
  updateLeadStatus,
  updateOpportunityStage,
  fetchActivities,
  fetchActivity,
  createLead,
  updateLead,
  deleteLead,
  convertLead,
  createActivity,
  updateActivity,
  deleteActivity,
  fetchSearchResults,
  API_BASE_URL,
  // Production Module
  fetchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  fetchBoms,
  fetchBom,
  fetchBomByProduct,
  createBom,
  updateBom,
  deleteBom,
  fetchProductionOrders,
  fetchProductionOrder,
  createProductionOrder,
  updateProductionOrder,
  startProductionOrder,
  completeProductionOrder,
  consumeMaterial,
  fetchProductionProgress,
  // Procurement
  fetchSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  fetchPurchaseOrders,
  fetchPurchaseOrder,
  createPurchaseOrder,
  updatePurchaseOrder,
  sendPurchaseOrder,
  receiveGoods,
  fetchGoodsReceipts,
};
