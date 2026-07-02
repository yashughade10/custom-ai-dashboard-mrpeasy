import type { AIAnalyticsReport, AIChatResponse } from "@/lib/ai-report-types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://apimrpeasy-vaclift-backend.vercel.app/api";

async function fetchOrders() {
  const response = await fetch(`${API_BASE_URL}/orders`);

  if (!response.ok) {
    throw new Error("Failed to fetch orders");
  }

  const result = await response.json();

  return result.data;
}

async function fetchAnalytics() {
  const response = await fetch(`${API_BASE_URL}/analytics`);

  if (!response.ok) {
    throw new Error("Failed to fetch analytics");
  }

  const result = await response.json();

  return result.data;
}

async function fetchAIReport(refresh = false): Promise<AIAnalyticsReport> {
  const response = await fetch(`${API_BASE_URL}/ai-report${refresh ? "?refresh=1" : ""}`);

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
  const response = await fetch(`${API_BASE_URL}/ai-chat`, {
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
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
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
  const response = await fetch(`${API_BASE_URL}/crm/stats`);
  if (!response.ok) throw new Error("Failed to fetch CRM stats");
  return (await response.json()).data;
}

async function fetchContacts(params?: { page?: number; search?: string; lifecycle?: string }) {
  const q = new URLSearchParams(params as any).toString();
  const response = await fetch(`${API_BASE_URL}/crm/contacts?${q}`);
  if (!response.ok) throw new Error("Failed to fetch contacts");
  return await response.json(); // { data, pagination }
}

async function fetchContact(id: string) {
  const response = await fetch(`${API_BASE_URL}/crm/contacts/${id}`);
  if (!response.ok) throw new Error("Failed to fetch contact");
  return (await response.json()).data;
}

async function fetchCompanies(params?: { page?: number; search?: string; industry?: string }) {
  const q = new URLSearchParams(params as any).toString();
  const response = await fetch(`${API_BASE_URL}/crm/companies?${q}`);
  if (!response.ok) throw new Error("Failed to fetch companies");
  return await response.json(); // { data, pagination }
}

async function fetchCompany(id: string) {
  const response = await fetch(`${API_BASE_URL}/crm/companies/${id}`);
  if (!response.ok) throw new Error("Failed to fetch company");
  return (await response.json()).data;
}

async function fetchDeals(params?: { page?: number; search?: string; stage?: string; owner?: string }) {
  const q = new URLSearchParams(params as any).toString();
  const response = await fetch(`${API_BASE_URL}/crm/deals?${q}`);
  if (!response.ok) throw new Error("Failed to fetch deals");
  return await response.json(); // { data, pagination }
}

async function fetchDeal(id: string) {
  const response = await fetch(`${API_BASE_URL}/crm/deals/${id}`);
  if (!response.ok) throw new Error("Failed to fetch deal");
  return (await response.json()).data;
}

async function fetchDealsPipeline() {
  const response = await fetch(`${API_BASE_URL}/crm/deals/pipeline`);
  if (!response.ok) throw new Error("Failed to fetch deals pipeline");
  return (await response.json()).data;
}

async function fetchIndustries() {
  const response = await fetch(`${API_BASE_URL}/crm/companies/by-industry`);
  if (!response.ok) throw new Error("Failed to fetch industries");
  return (await response.json()).data;
}

async function fetchLifecycles() {
  const response = await fetch(`${API_BASE_URL}/crm/contacts/by-lifecycle`);
  if (!response.ok) throw new Error("Failed to fetch lifecycles");
  return (await response.json()).data;
}

async function fetchOwners() {
  const response = await fetch(`${API_BASE_URL}/crm/owners`);
  if (!response.ok) throw new Error("Failed to fetch owners");
  return (await response.json()).data;
}

// Global Search
async function fetchSearchResults(query: string) {
  if (!query) return [];
  const response = await fetch(`${API_BASE_URL}/search?q=${encodeURIComponent(query)}`);
  if (!response.ok) throw new Error("Failed to fetch search results");
  return (await response.json()).data;
}

// Leads
async function fetchLeads(params?: { page?: number; search?: string; status?: string; assigned_to?: string }) {
  const q = new URLSearchParams(params as any).toString();
  const response = await fetch(`${API_BASE_URL}/crm/leads?${q}`);
  if (!response.ok) throw new Error("Failed to fetch leads");
  return await response.json();
}

async function fetchLead(id: string) {
  const response = await fetch(`${API_BASE_URL}/crm/leads/${id}`);
  if (!response.ok) throw new Error("Failed to fetch lead");
  return (await response.json()).data;
}

async function updateLeadStatus(id: string, status: string) {
  const response = await fetch(`${API_BASE_URL}/crm/leads/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status })
  });
  if (!response.ok) throw new Error("Failed to update lead status");
  return (await response.json()).data;
}

// Opportunities
async function fetchOpportunities(params?: { page?: number; search?: string; stage?: string; assigned_to?: string }) {
  const q = new URLSearchParams(params as any).toString();
  const response = await fetch(`${API_BASE_URL}/crm/opportunities?${q}`);
  if (!response.ok) throw new Error("Failed to fetch opportunities");
  return await response.json();
}

async function fetchOpportunity(id: string) {
  const response = await fetch(`${API_BASE_URL}/crm/opportunities/${id}`);
  if (!response.ok) throw new Error("Failed to fetch opportunity");
  return (await response.json()).data;
}

async function createOpportunity(data: Record<string, any>) {
  const response = await fetch(`${API_BASE_URL}/crm/opportunities`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to create opportunity");
  return (await response.json()).data;
}

async function updateOpportunity(id: string, data: Record<string, any>) {
  const response = await fetch(`${API_BASE_URL}/crm/opportunities/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to update opportunity");
  return (await response.json()).data;
}

async function deleteOpportunity(id: string) {
  const response = await fetch(`${API_BASE_URL}/crm/opportunities/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Failed to delete opportunity");
  return await response.json();
}

async function updateOpportunityStage(id: string, stage: string) {
  const response = await fetch(`${API_BASE_URL}/crm/opportunities/${id}`, {
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
  const response = await fetch(`${API_BASE_URL}/crm/activities?${q}`);
  if (!response.ok) throw new Error("Failed to fetch activities");
  return await response.json();
}

async function fetchActivity(id: string) {
  const response = await fetch(`${API_BASE_URL}/crm/activities/${id}`);
  if (!response.ok) throw new Error("Failed to fetch activity");
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
  fetchSearchResults,
  API_BASE_URL
};
