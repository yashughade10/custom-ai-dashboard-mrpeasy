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

  getPurchaseOrders: async (page = 1, limit = 50, filters = {}) => {
    const searchParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters
    });
    const res = await fetch(`${API_BASE}/mrp/procurement/purchase-orders?${searchParams.toString()}`);
    if (!res.ok) throw new Error("Failed to fetch purchase orders");
    return res.json();
  },

  exportPurchaseOrders: async (filters = {}) => {
    const searchParams = new URLSearchParams({
      ...filters
    });
    const res = await fetch(`${API_BASE}/mrp/procurement/purchase-orders/export?${searchParams.toString()}`);
    if (!res.ok) throw new Error("Failed to export purchase orders");
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



  getProductGroups: async () => {
    const res = await fetch(`${API_BASE}/mrp/stock/groups`);
    if (!res.ok) throw new Error("Failed to fetch product groups");
    return res.json();
  },

  getAssignees: async () => {
    const res = await fetch(`${API_BASE}/mrp/production/assignees`);
    if (!res.ok) throw new Error("Failed to fetch assignees");
    return res.json();
  },

  getWorkstations: async (page = 1, limit = 50, filters = {}) => {
    const searchParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters
    });
    const res = await fetch(`${API_BASE}/mrp/production/workstations?${searchParams.toString()}`);
    if (!res.ok) throw new Error("Failed to fetch workstations");
    return res.json();
  },

  getWorkstationById: async (id: string) => {
    const res = await fetch(`${API_BASE}/mrp/production/workstations/${id}`);
    if (!res.ok) throw new Error("Failed to fetch workstation");
    return res.json();
  },

  createWorkstation: async (data: any) => {
    const res = await fetch(`${API_BASE}/mrp/production/workstations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error("Failed to create workstation");
    return res.json();
  },

  updateWorkstation: async (id: string, data: any) => {
    const res = await fetch(`${API_BASE}/mrp/production/workstations/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error("Failed to update workstation");
    return res.json();
  },

  deleteWorkstation: async (id: string) => {
    const res = await fetch(`${API_BASE}/mrp/production/workstations/${id}`, {
      method: "DELETE"
    });
    if (!res.ok) throw new Error("Failed to delete workstation");
    return res.json();
  },

  getWorkstationGroups: async (page = 1, limit = 50, filters = {}) => {
    const searchParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters
    });
    const res = await fetch(`${API_BASE}/mrp/production/workstation-groups?${searchParams.toString()}`);
    if (!res.ok) throw new Error("Failed to fetch workstation groups");
    return res.json();
  },

  getWorkstationGroupById: async (id: string) => {
    const res = await fetch(`${API_BASE}/mrp/production/workstation-groups/${id}`);
    if (!res.ok) throw new Error("Failed to fetch workstation group");
    return res.json();
  },

  createWorkstationGroup: async (data: any) => {
    const res = await fetch(`${API_BASE}/mrp/production/workstation-groups`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error("Failed to create workstation group");
    return res.json();
  },

  updateWorkstationGroup: async (id: string, data: any) => {
    const res = await fetch(`${API_BASE}/mrp/production/workstation-groups/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error("Failed to update workstation group");
    return res.json();
  },

  deleteWorkstationGroup: async (id: string) => {
    const res = await fetch(`${API_BASE}/mrp/production/workstation-groups/${id}`, {
      method: "DELETE"
    });
    if (!res.ok) throw new Error("Failed to delete workstation group");
    return res.json();
  },

  getProductionCounts: async () => {
    const res = await fetch(`${API_BASE}/mrp/production/counts`);
    if (!res.ok) throw new Error("Failed to fetch production counts");
    return res.json();
  },

  getBoms: async (page = 1, limit = 50, filters = {}) => {
    const searchParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters
    });
    const res = await fetch(`${API_BASE}/mrp/production/boms?${searchParams.toString()}`);
    if (!res.ok) throw new Error("Failed to fetch BOMs");
    return res.json();
  },

  getBomById: async (id: string) => {
    const res = await fetch(`${API_BASE}/mrp/production/boms/${id}`);
    if (!res.ok) throw new Error("Failed to fetch BOM");
    return res.json();
  },

  createBom: async (data: any) => {
    const res = await fetch(`${API_BASE}/mrp/production/boms`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error("Failed to create BOM");
    return res.json();
  },

  updateBom: async (id: string, data: any) => {
    const res = await fetch(`${API_BASE}/mrp/production/boms/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error("Failed to update BOM");
    return res.json();
  },

  deleteBom: async (id: string) => {
    const res = await fetch(`${API_BASE}/mrp/production/boms/${id}`, {
      method: "DELETE"
    });
    if (!res.ok) throw new Error("Failed to delete BOM");
    return res.json();
  }
};
