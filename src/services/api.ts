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

export { fetchOrders, fetchAnalytics, fetchAIReport, askAnalyticsQuestion, loginDashboard };
