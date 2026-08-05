const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4001/api';

export const mrpApi = {
  getDashboardData: async () => {
    const res = await fetch(`${API_BASE}/mrp/dashboard`);
    if (!res.ok) throw new Error("Failed to fetch dashboard data");
    return res.json();
  },
  
  getItems: async (page = 1, limit = 50, filters = {}) => {
    const searchParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters
    });
    const res = await fetch(`${API_BASE}/mrp/stock/items?${searchParams.toString()}`);
    if (!res.ok) throw new Error("Failed to fetch items");
    return res.json();
  },

  getItemById: async (id: string) => {
    const res = await fetch(`${API_BASE}/mrp/stock/items/${id}`);
    if (!res.ok) throw new Error("Failed to fetch item");
    return res.json();
  },

  createItem: async (data: any) => {
    const res = await fetch(`${API_BASE}/mrp/stock/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error("Failed to create item");
    return res.json();
  },

  updateItem: async (id: string, data: any) => {
    const res = await fetch(`${API_BASE}/mrp/stock/items/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error("Failed to update item");
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

  getInvoices: async (page = 1, limit = 50, filters = {}) => {
    const searchParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters
    });
    const res = await fetch(`${API_BASE}/mrp/crm/invoices?${searchParams.toString()}`);
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

  getRequirements: async (page = 1, limit = 50, filters = {}) => {
    const searchParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters
    });
    const res = await fetch(`${API_BASE}/mrp/procurement/requirements?${searchParams.toString()}`);
    if (!res.ok) throw new Error("Failed to fetch requirements");
    return res.json();
  },

  getPurchaseOrder: async (poNumber: string) => {
    try {
      const response = await fetch(`${API_BASE}/mrp/procurement/purchase-orders/${poNumber}`);
      if (!response.ok) throw new Error("Failed to fetch purchase order");
      const data = await response.json();
      return { order: data.data, items: data.data.items || [] };
    } catch (error) {
      console.error("Error fetching purchase order:", error);
      throw error;
    }
  },

  getPurchaseOrderItems: async (page = 1, limit = 50, filters = {}) => {
    const searchParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters
    });
    const res = await fetch(`${API_BASE}/mrp/procurement/purchase-orders/items?${searchParams.toString()}`);
    if (!res.ok) throw new Error("Failed to fetch purchase order items");
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

  exportInvoices: async (filters = {}) => {
    const searchParams = new URLSearchParams({
      ...filters
    });
    const res = await fetch(`${API_BASE}/mrp/crm/invoices/export?${searchParams.toString()}`);
    if (!res.ok) throw new Error("Failed to export invoices");
    return res.json();
  },

  getVendors: async () => {
    const res = await fetch(`${API_BASE}/mrp/procurement/vendors`);
    if (!res.ok) throw new Error("Failed to fetch vendors");
    return res.json();
  },

  addVendor: async (data: any) => {
    const res = await fetch(`${API_BASE}/mrp/procurement/vendors`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to add vendor");
    return res.json();
  },

  getVendor: async (vendorNumber: string) => {
    const res = await fetch(`${API_BASE}/mrp/procurement/vendors/${vendorNumber}`);
    if (!res.ok) throw new Error("Failed to fetch vendor");
    return res.json();
  },

  updateVendor: async ({ vendorNumber, data }: { vendorNumber: string, data: any }) => {
    const res = await fetch(`${API_BASE}/mrp/procurement/vendors/${vendorNumber}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to update vendor");
    return res.json();
  },

  getVendorContacts: async (vendorNumber: string) => {
    const res = await fetch(`${API_BASE}/mrp/procurement/vendors/${vendorNumber}/contacts`);
    if (!res.ok) throw new Error("Failed to fetch vendor contacts");
    return res.json();
  },

  addVendorContact: async ({ vendorNumber, data }: { vendorNumber: string, data: any }) => {
    const res = await fetch(`${API_BASE}/mrp/procurement/vendors/${vendorNumber}/contacts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to add vendor contact");
    return res.json();
  },

  getVendorNotes: async (vendorNumber: string) => {
    const res = await fetch(`${API_BASE}/mrp/procurement/vendors/${vendorNumber}/notes`);
    if (!res.ok) throw new Error("Failed to fetch vendor notes");
    return res.json();
  },

  addVendorNote: async ({ vendorNumber, data }: { vendorNumber: string, data: any }) => {
    const res = await fetch(`${API_BASE}/mrp/procurement/vendors/${vendorNumber}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to add vendor note");
    return res.json();
  },

  createPurchaseOrder: async (data: any) => {
    const res = await fetch(`${API_BASE}/mrp/procurement/purchase-orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create purchase order");
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
  createProductGroup: async (data: any) => {
    const res = await fetch(`${API_BASE}/mrp/stock/groups`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create product group");
    return res.json();
  },
  updateProductGroup: async (id: string | number, data: any) => {
    const res = await fetch(`${API_BASE}/mrp/stock/groups/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to update product group");
    return res.json();
  },
  deleteProductGroup: async (id: string | number) => {
    const res = await fetch(`${API_BASE}/mrp/stock/groups/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete product group");
    return res.json();
  },

  getUoms: async () => {
    const res = await fetch(`${API_BASE}/mrp/stock/uoms`);
    if (!res.ok) throw new Error("Failed to fetch UOMs");
    return res.json();
  },
  createUom: async (data: any) => {
    const res = await fetch(`${API_BASE}/mrp/stock/uoms`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create UOM");
    return res.json();
  },
  updateUom: async (id: string | number, data: any) => {
    const res = await fetch(`${API_BASE}/mrp/stock/uoms/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to update UOM");
    return res.json();
  },
  deleteUom: async (id: string | number) => {
    const res = await fetch(`${API_BASE}/mrp/stock/uoms/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete UOM");
    return res.json();
  },

  getStorageLocations: async () => {
    const res = await fetch(`${API_BASE}/mrp/stock/locations`);
    if (!res.ok) throw new Error("Failed to fetch storage locations");
    return res.json();
  },
  createStorageLocation: async (data: any) => {
    const res = await fetch(`${API_BASE}/mrp/stock/locations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create storage location");
    return res.json();
  },
  updateStorageLocation: async (id: string | number, data: any) => {
    const res = await fetch(`${API_BASE}/mrp/stock/locations/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to update storage location");
    return res.json();
  },
  deleteStorageLocation: async (id: string | number) => {
    const res = await fetch(`${API_BASE}/mrp/stock/locations/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete storage location");
    return res.json();
  },

  getInventorySnapshot: async (params?: { 
    location?: string;
    page?: number;
    limit?: number;
    qtyMin?: string;
    qtyMax?: string;
    costMin?: string;
    costMax?: string;
    partNo?: string;
    groupNo?: string;
    groupName?: string;
    partDesc?: string;
  }) => {
    let url = `${API_BASE}/mrp/stock/inventory?`;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          searchParams.append(key, String(value));
        }
      });
      url += searchParams.toString();
    }
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch inventory snapshot");
    return res.json();
  },

  getLots: async (page = 1, limit = 50, search = "") => {
    let url = `${API_BASE}/mrp/stock/lots?page=${page}&limit=${limit}`;
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch stock lots");
    return res.json();
  },

  deleteLot: async (id: string | number) => {
    const res = await fetch(`${API_BASE}/mrp/stock/lots/${id}`, {
      method: "DELETE"
    });
    if (!res.ok) throw new Error("Failed to delete stock lot");
    return res.json();
  },
  
  updatePhysicalQuantity: async (data: { part_no: string, new_quantity: number, location?: string }) => {
    const res = await fetch(`${API_BASE}/mrp/stock/inventory/adjust`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to update physical quantity");
    return res.json();
  },

  getWriteoffs: async (page = 1, limit = 50, search = "") => {
    const searchParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      search: search
    });
    const res = await fetch(`${API_BASE}/mrp/stock/writeoffs?${searchParams.toString()}`);
    if (!res.ok) throw new Error("Failed to fetch write-offs");
    return res.json();
  },

  getWriteoffDetails: async (writeoff_number: string) => {
    const res = await fetch(`${API_BASE}/mrp/stock/writeoffs/${writeoff_number}`);
    if (!res.ok) throw new Error("Failed to fetch write-off details");
    return res.json();
  },

  deleteWriteoff: async (writeoff_number: string) => {
    const res = await fetch(`${API_BASE}/mrp/stock/writeoffs/${writeoff_number}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete write-off");
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
  },

  getForecasts: async (filters: any = {}) => {
    // Filter out empty strings from filters
    const validFilters = Object.fromEntries(
      Object.entries(filters).filter(([_, v]) => v !== "")
    );
    const searchParams = new URLSearchParams(validFilters as any);
    const res = await fetch(`${API_BASE}/mrp/procurement/forecasting?${searchParams.toString()}`);
    if (!res.ok) throw new Error("Failed to fetch forecasts");
    return res.json();
  },

  createForecast: async (data: any) => {
    console.log("Mocking create forecast with data:", data);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return { success: true, data: { ...data, id: Date.now().toString() } };
  }
};
