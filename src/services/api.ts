const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://apimrpeasy-vaclift-backend.vercel.app/api";

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

export { fetchOrders, fetchAnalytics };
