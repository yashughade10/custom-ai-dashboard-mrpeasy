const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4001/api';

export const mrpApi = {
  getDashboardData: async () => {
    const res = await fetch(`${API_BASE}/mrp/dashboard`);
    if (!res.ok) throw new Error("Failed to fetch dashboard data");
    return res.json();
  },
  
  getItems: async (page = 1, limit = 50) => {
    const res = await fetch(`${API_BASE}/mrp/stock/items?page=${page}&limit=${limit}`);
    if (!res.ok) throw new Error("Failed to fetch items");
    return res.json();
  },

  getCustomers: async (page = 1, limit = 50) => {
    const res = await fetch(`${API_BASE}/mrp/crm/customers?page=${page}&limit=${limit}`);
    if (!res.ok) throw new Error("Failed to fetch customers");
    return res.json();
  },

  getCustomerById: async (id: string) => {
    const res = await fetch(`${API_BASE}/mrp/crm/customers/${id}`);
    if (!res.ok) throw new Error("Failed to fetch customer");
    return res.json();
  },

  getCustomerOrders: async (page = 1, limit = 100) => {
    const res = await fetch(`${API_BASE}/mrp/crm/customer-orders?page=${page}&limit=${limit}`);
    if (!res.ok) throw new Error("Failed to fetch customer orders");
    return res.json();
  },

  getCustomerOrderById: async (id: string) => {
    const res = await fetch(`${API_BASE}/mrp/crm/customer-orders/${id}`);
    if (!res.ok) throw new Error("Failed to fetch customer order");
    return res.json();
  },

  getInvoices: async (page = 1, limit = 50) => {
    const res = await fetch(`${API_BASE}/mrp/crm/invoices?page=${page}&limit=${limit}`);
    if (!res.ok) throw new Error("Failed to fetch invoices");
    return res.json();
  },

  getPurchaseOrders: async (page = 1, limit = 50) => {
    const res = await fetch(`${API_BASE}/mrp/procurement/purchase-orders?page=${page}&limit=${limit}`);
    if (!res.ok) throw new Error("Failed to fetch purchase orders");
    return res.json();
  },

  getVendors: async () => {
    const res = await fetch(`${API_BASE}/mrp/procurement/vendors`);
    if (!res.ok) throw new Error("Failed to fetch vendors");
    return res.json();
  },

  getManufacturingOrders: async (page = 1, limit = 50) => {
    const res = await fetch(`${API_BASE}/mrp/production/manufacturing-orders?page=${page}&limit=${limit}`);
    if (!res.ok) throw new Error("Failed to fetch manufacturing orders");
    return res.json();
  },

  getBoms: async () => {
    const res = await fetch(`${API_BASE}/mrp/production/bom`);
    if (!res.ok) throw new Error("Failed to fetch BOMs");
    return res.json();
  },

  getProductGroups: async () => {
    const res = await fetch(`${API_BASE}/mrp/stock/groups`);
    if (!res.ok) throw new Error("Failed to fetch product groups");
    return res.json();
  },

  getAssignees: async () => {
    const res = await fetch(`${API_BASE}/mrp/production/assignees`);
    if (!res.ok) throw new Error("Failed to fetch assignees");
    return res.json();
  }
};
