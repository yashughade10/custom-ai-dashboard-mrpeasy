"use client";

import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { mrpApi } from "@/services/mrpApi";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { RouteGuard } from "@/components/auth/RouteGuard";
import { MrpTabBar } from "@/components/mrp/MrpTabBar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Download, Plus, Pencil } from "lucide-react";
import { format } from "date-fns";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "/api";

const crmTabs = [
  { name: "Customer orders", href: "/dashboard/mrp/crm" },
  { name: "Customers", href: "/dashboard/mrp/crm/customers" },
  { name: "Today's contacts", href: "/dashboard/mrp/crm/today-contacts" },
  { name: "Invoices", href: "/dashboard/mrp/crm/invoices" },
  { name: "Cash flow forecast", href: "/dashboard/mrp/crm/cash-flow" },
  { name: "Statistics", href: "/dashboard/mrp/crm/statistics" },
];

export default function CustomerOrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const copyFromId = searchParams.get("copyFrom");
  const orderId = params.id as string;

  const isNew = orderId === "new";

  const { data: response, isLoading } = useQuery({
    queryKey: ["mrpCustomerOrder", orderId],
    queryFn: () => mrpApi.getCustomerOrderById(orderId),
    enabled: !isNew,
  });

  const { data: copyFromResponse, isLoading: isLoadingCopy } = useQuery({
    queryKey: ["mrpCustomerOrder", copyFromId],
    queryFn: () => mrpApi.getCustomerOrderById(copyFromId!),
    enabled: !!copyFromId,
  });

  const { data: customersResponse, isLoading: isLoadingCustomers } = useQuery({
    queryKey: ["mrpCustomers", 2000],
    queryFn: () => mrpApi.getCustomers(1, 2000),
  });
  
  const customers = customersResponse?.data || [];
  const customerOptions = customers.map((c: any) => ({
    label: `${c.customer_number} ${c.name}`,
    value: c.customer_number
  }));

  const { data: itemsResponse, isLoading: isLoadingItems } = useQuery({
    queryKey: ["mrpItems", 10000],
    queryFn: () => mrpApi.getItems(1, 10000),
  });

  const partOptions = (itemsResponse?.data || []).map((item: any) => ({
    label: item.part_description || item.name || item.part_number || "Unnamed Part",
    value: item.part_number || item.part_no || item.id?.toString() || Math.random().toString(),
  }));

  const queryClient = useQueryClient();

  const initialOrder = isNew 
    ? { order_number: "NEW", status: "Quotation", currency: "AUD", items: [], invoices: [], shipments: [] } 
    : response?.data;

  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    if (isNew && copyFromResponse?.data) {
      const copyData = { ...copyFromResponse.data };
      delete copyData.id;
      copyData.order_number = "NEW";
      copyData.status = "Quotation";
      setFormData(copyData);
    } else if (initialOrder) {
      setFormData(initialOrder);
    }
  }, [JSON.stringify(initialOrder), JSON.stringify(copyFromResponse?.data), isNew]);

  const { data: groupsResponse } = useQuery({
    queryKey: ["mrpProductGroups"],
    queryFn: () => mrpApi.getProductGroups(),
  });
  const productGroups = groupsResponse?.data || [];

  const order = formData.order_number ? formData : initialOrder;
  const items = order?.items || [];
  const invoices = order?.invoices || [];
  const shipments = order?.shipments || [];

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    if (index >= newItems.length) {
      newItems.push({});
    }
    newItems[index] = { ...newItems[index], [field]: value };
    
    if (["quantity", "price", "discount"].includes(field)) {
      const qty = parseFloat(newItems[index].quantity) || 0;
      const price = parseFloat(newItems[index].price) || 0;
      const discount = parseFloat(newItems[index].discount) || 0;
      newItems[index].subtotal = (qty * price) * (1 - discount / 100);
    }
    
    const newTotal = newItems.reduce((acc: number, item: any) => acc + (parseFloat(item.subtotal) || 0), 0);
    setFormData({ ...formData, items: newItems, total: newTotal });
  };

  const handleSave = async () => {
    try {
      if (isNew) {
        await mrpApi.createCustomerOrder(formData);
      } else {
        await mrpApi.updateCustomerOrder(orderId, formData);
      }
      queryClient.invalidateQueries({ queryKey: ["mrpCustomerOrders"] });
      queryClient.invalidateQueries({ queryKey: ["mrpCustomerOrder", orderId] });
      router.push("/dashboard/mrp/crm");
    } catch (error) {
      console.error("Failed to save order", error);
    }
  };

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this customer order?")) {
      try {
        await mrpApi.deleteCustomerOrder(orderId);
        queryClient.invalidateQueries({ queryKey: ["mrpCustomerOrders"] });
        router.push("/dashboard/mrp/crm");
      } catch (error) {
        console.error("Failed to delete order:", error);
        alert("Failed to delete order");
      }
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    try {
      return format(new Date(dateStr), "dd/MM/yyyy");
    } catch {
      return dateStr;
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Loading order details...</div>;
  }

  if (!order && !isNew) {
    return <div className="p-8 text-center text-red-500">Order not found.</div>;
  }

  return (
    <RouteGuard module="crm" fallback={<div>Access Denied</div>}>
      <div className="flex flex-col bg-[#f4f7fb] min-h-[calc(100vh-4rem)] p-4 -m-4 sm:-m-6 lg:-m-8">
        <div className="bg-white rounded-md shadow-sm flex flex-col min-h-[80vh]">
          <MrpTabBar tabs={crmTabs} />
          
          <div className="px-6 py-4 flex-1 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-bold text-gray-900">{isNew ? "Create Customer Order" : `Customer order ${order.order_number} details`}</h1>
              <Button 
                onClick={() => window.open(`${API_BASE}/mrp/crm/customer-orders/${orderId}/pdf`, "_blank")}
                variant="outline" size="sm" className="h-8 bg-gray-50 text-gray-700 text-xs font-medium border-gray-300">
                <Download className="h-3 w-3 mr-1.5" />
                PDF
              </Button>
            </div>

            {/* Top Toolbar */}
            <div className="flex gap-2 mb-6">
              <Button variant="outline" size="sm" onClick={() => router.back()} className="h-7 px-4 text-xs font-medium text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100">Back</Button>
              <Button variant="outline" size="sm" onClick={handleSave} className="h-7 px-4 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white">Save</Button>
              <Button 
                onClick={handleDelete}
                disabled={isNew}
                variant="outline" size="sm" className="h-7 px-4 text-xs font-medium text-red-600 border-red-200 bg-red-50 hover:bg-red-100 disabled:opacity-50">
                Delete
              </Button>
              <Button 
                onClick={() => router.push(`/dashboard/mrp/crm/customer-orders/new?copyFrom=${orderId}`)}
                disabled={isNew}
                variant="outline" size="sm" className="h-7 px-4 text-xs font-medium text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100 disabled:opacity-50">
                Copy
              </Button>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-2 gap-12 w-full mb-8">
              <div className="space-y-3">
                <div className="grid grid-cols-[120px_1fr] items-center gap-2">
                  <label className="text-xs text-right text-gray-600 font-medium">Number *</label>
                  <Input readOnly value={order.order_number} className="h-7 text-xs bg-gray-100" />
                </div>
                <div className="grid grid-cols-[120px_1fr] items-center gap-2">
                  <label className="text-xs text-right text-gray-600 font-medium">Customer *</label>
                  <SearchableSelect
                    options={customerOptions}
                    value={order?.customer_number || ""}
                    onChange={(val) => {
                      const selected = customers.find((c: any) => c.customer_number === val);
                      setFormData({
                        ...formData,
                        customer_number: val,
                        customer_name: selected ? selected.name : ""
                      });
                    }}
                    placeholder="Select customer..."
                    isLoading={isLoadingCustomers}
                  />
                </div>
                <div className="grid grid-cols-[120px_1fr] items-center gap-2">
                  <label className="text-xs text-right text-gray-600 font-medium">Status *</label>
                  <Select value={order.status} onValueChange={(val) => setFormData({ ...formData, status: val })}>
                    <SelectTrigger className="h-7 text-xs bg-gray-50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Quotation">Quotation</SelectItem>
                      <SelectItem value="Confirmed">Confirmed</SelectItem>
                      <SelectItem value="Waiting for production">Waiting for production</SelectItem>
                      <SelectItem value="In production">In production</SelectItem>
                      <SelectItem value="Ready for shipment">Ready for shipment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-[120px_1fr] items-center gap-2">
                  <label className="text-xs text-right text-gray-600 font-medium">Currency rate *</label>
                  <Input defaultValue="1.00" className="h-7 text-xs bg-gray-50" />
                </div>
                <div className="grid grid-cols-[120px_1fr] items-center gap-2">
                  <label className="text-xs text-right text-gray-600 font-medium">Delivery date</label>
                  <Input type="date" defaultValue={order.due_date ? new Date(order.due_date).toISOString().split('T')[0] : ""} className="h-7 text-xs bg-gray-50" />
                </div>
                <div className="grid grid-cols-[120px_1fr] items-center gap-2">
                  <label className="text-xs text-right text-gray-600 font-medium">Files</label>
                  <div className="flex gap-2">
                    {/* Placeholder icons */}
                    <div className="w-5 h-5 bg-blue-100 rounded flex items-center justify-center text-blue-600 text-[10px]">A</div>
                    <div className="w-5 h-5 bg-blue-100 rounded flex items-center justify-center text-blue-600 text-[10px]">B</div>
                  </div>
                </div>
                <div className="grid grid-cols-[120px_1fr] items-center gap-2">
                  <label className="text-xs text-right text-gray-600 font-medium uppercase">PO NUMBER</label>
                  <Input defaultValue="" className="h-7 text-xs bg-gray-50" />
                </div>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-[120px_1fr] items-center gap-2">
                  <label className="text-xs text-right text-gray-600 font-medium">Created</label>
                  <div className="text-xs text-gray-900">{formatDate(order.created_date)}</div>
                </div>
                <div className="grid grid-cols-[120px_1fr] items-center gap-2">
                  <label className="text-xs text-right text-gray-600 font-medium">Created by</label>
                  <div className="text-xs text-gray-900">Admin</div>
                </div>
                <div className="grid grid-cols-[120px_1fr] items-center gap-2">
                  <label className="text-xs text-right text-gray-600 font-medium">Reference</label>
                  <Input defaultValue="-" className="h-7 text-xs bg-gray-50" />
                </div>
                <div className="grid grid-cols-[120px_1fr] items-center gap-2">
                  <label className="text-xs text-right text-gray-600 font-medium">Delivery terms</label>
                  <Input placeholder="Incoterms, or free text" className="h-7 text-xs bg-gray-50" />
                </div>
                <div className="grid grid-cols-[120px_1fr] items-start gap-2">
                  <label className="text-xs text-right text-gray-600 font-medium pt-1.5">Shipping address</label>
                  <Textarea className="min-h-[40px] text-xs bg-gray-50" defaultValue="153 Crockford St, NORTHGATE QLD 4013, Australia" />
                </div>
                <div className="grid grid-cols-[120px_1fr] items-start gap-2">
                  <label className="text-xs text-right text-gray-600 font-medium pt-1.5">Internal notes</label>
                  <Textarea className="min-h-[40px] text-xs bg-gray-50" />
                </div>
                <div className="grid grid-cols-[120px_1fr] items-start gap-2">
                  <label className="text-xs text-right text-gray-600 font-medium pt-1.5">Customer notes</label>
                  <Textarea className="min-h-[40px] text-xs bg-gray-50" defaultValue="GEN PUR NOTE 67663" />
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="border border-gray-200 rounded-sm overflow-visible mb-6">
              <table className="w-full text-[11px] text-left">
                <thead className="bg-[#e2e8f0] text-gray-700">
                  <tr>
                    <th className="px-2 py-2 font-semibold">Product group</th>
                    <th className="px-2 py-2 font-semibold">Product</th>
                    <th className="px-2 py-2 font-semibold">Quantity</th>
                    <th className="px-2 py-2 font-semibold">Price per UoM</th>
                    <th className="px-2 py-2 font-semibold">Discount</th>
                    <th className="px-2 py-2 font-semibold">Subtotal</th>
                    <th className="px-2 py-2 font-semibold">Delivery date</th>
                    <th className="px-2 py-2 font-semibold">Cost</th>
                    <th className="px-2 py-2 font-semibold">Profit</th>
                    <th className="px-2 py-2 font-semibold">Status</th>
                    <th className="px-2 py-2 font-semibold">Source</th>
                    <th className="px-2 py-2 font-semibold">Shipped</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((item: any, i: number) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-2 py-3 align-top">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400">{i + 1}</span>
                          <Select value={item.product_group || "none"} onValueChange={(v) => updateItem(i, "product_group", v)}>
                            <SelectTrigger className="h-6 w-32 text-[11px] bg-white border-gray-200">
                              <SelectValue placeholder="Select group" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">None</SelectItem>
                              {productGroups.map((g: any) => (
                                <SelectItem key={g.group_number} value={g.group_number}>{g.group_name || g.group_number}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </td>
                      <td className="px-2 py-3 align-top">
                        <SearchableSelect 
                          options={partOptions}
                          value={item.product || ""}
                          onChange={(val) => {
                            const matchedItem = (itemsResponse?.data || []).find((i: any) => i.part_number === val || i.part_no === val || i.id?.toString() === val);
                            const newItems = [...items];
                            newItems[i] = {
                              ...newItems[i],
                              product: val,
                              description: matchedItem?.part_description || matchedItem?.name || "",
                              product_group: matchedItem?.group_number || matchedItem?.group_id?.toString() || "none",
                              price: matchedItem?.selling_price || matchedItem?.sell_price || matchedItem?.cost || "0",
                              cost: matchedItem?.cost || "0",
                              quantity: newItems[i].quantity || "1",
                              uom: newItems[i].uom || matchedItem?.uom || "pcs"
                            };
                            
                            const qty = parseFloat(newItems[i].quantity) || 1;
                            const price = parseFloat(newItems[i].price) || 0;
                            const discount = parseFloat(newItems[i].discount) || 0;
                            newItems[i].subtotal = (qty * price) * (1 - discount / 100);

                            const newTotal = newItems.reduce((acc: number, item: any) => acc + (parseFloat(item.subtotal) || 0), 0);
                            setFormData({ ...formData, items: newItems, total: newTotal });
                          }}
                          placeholder="Select part..."
                          isLoading={isLoadingItems}
                        />
                        <Input className="h-6 w-full text-[11px] mt-1" value={item.description || ""} onChange={e => updateItem(i, "description", e.target.value)} placeholder="Description" />
                      </td>
                      <td className="px-2 py-3 align-top">
                        <div className="flex items-center gap-1">
                          <Input className="h-6 w-12 text-[11px]" value={item.quantity || ""} onChange={e => updateItem(i, "quantity", e.target.value)} />
                          <span className="text-gray-500">{item.uom || 'pcs'}</span>
                        </div>
                      </td>
                      <td className="px-2 py-3 align-top">
                        <div className="flex items-center gap-1">
                          <Input className="h-6 w-16 text-[11px]" value={item.price || ""} onChange={e => updateItem(i, "price", e.target.value)} />
                          <span className="text-gray-500">{order.currency || 'AUD'}</span>
                        </div>
                      </td>
                      <td className="px-2 py-3 align-top">
                        <div className="flex items-center gap-1">
                          <Input className="h-6 w-12 text-[11px]" value={item.discount || ""} onChange={e => updateItem(i, "discount", e.target.value)} />
                          <span className="text-gray-500">%</span>
                        </div>
                      </td>
                      <td className="px-2 py-3 align-top font-semibold">
                        {item.subtotal ? Number(item.subtotal).toFixed(2) : ''} <span className="font-normal text-gray-500 ml-1">{order.currency || 'AUD'}</span>
                      </td>
                      <td className="px-2 py-3 align-top">
                        <Input type="date" className="h-6 w-24 text-[11px] text-gray-500" value={item.delivery_date || ""} onChange={e => updateItem(i, "delivery_date", e.target.value)} />
                      </td>
                      <td className="px-2 py-3 align-top">{item.cost ? Number(item.cost).toFixed(2) : ''}</td>
                      <td className="px-2 py-3 align-top">{item.profit ? Number(item.profit).toFixed(2) : ''}</td>
                      <td className="px-2 py-3 align-top text-red-600">{item.status}</td>
                      <td className="px-2 py-3 align-top">{item.source}</td>
                      <td className="px-2 py-3 align-top">{item.shipped || 0}</td>
                    </tr>
                  ))}
                  {/* Empty Row for adding new */}
                  <tr className="hover:bg-gray-50 border-t-2 border-dashed border-gray-200">
                    <td className="px-2 py-3 align-top">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">{items.length + 1}</span>
                        <Select onValueChange={(v) => updateItem(items.length, "product_group", v)}>
                          <SelectTrigger className="h-6 w-32 text-[11px] bg-white border-transparent">
                            <SelectValue placeholder="Select group" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {productGroups.map((g: any) => (
                              <SelectItem key={g.group_number} value={g.group_number}>{g.group_name || g.group_number}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </td>
                    <td className="px-2 py-3 align-top">
                      <SearchableSelect 
                        options={partOptions}
                        value=""
                        onChange={(val) => {
                          const matchedItem = (itemsResponse?.data || []).find((i: any) => i.part_number === val || i.part_no === val || i.id?.toString() === val);
                          const newItems = [...items];
                          const price = matchedItem?.selling_price || matchedItem?.sell_price || matchedItem?.cost || "0";
                          const newItem = { 
                            product: val, 
                            description: matchedItem?.part_description || matchedItem?.name || "",
                            product_group: matchedItem?.group_number || matchedItem?.group_id?.toString() || "none",
                            quantity: "1",
                            uom: matchedItem?.uom || "pcs",
                            price: price,
                            cost: matchedItem?.cost || "0",
                            subtotal: parseFloat(price)
                          };
                          newItems.push(newItem);
                          const newTotal = newItems.reduce((acc: number, item: any) => acc + (parseFloat(item.subtotal) || 0), 0);
                          setFormData({ ...formData, items: newItems, total: newTotal });
                        }}
                        placeholder="Select part..."
                        isLoading={isLoadingItems}
                      />
                    </td>
                    <td className="px-2 py-3 align-top">
                      <Input className="h-6 w-12 text-[11px]" onChange={(e) => updateItem(items.length, "quantity", e.target.value)} />
                    </td>
                    <td className="px-2 py-3 align-top">
                      <div className="flex items-center gap-1">
                        <Input className="h-6 w-16 text-[11px]" onChange={(e) => updateItem(items.length, "price", e.target.value)} />
                        <span className="text-gray-500">{order.currency || 'AUD'}</span>
                      </div>
                    </td>
                    <td className="px-2 py-3 align-top">
                      <div className="flex items-center gap-1">
                        <Input className="h-6 w-12 text-[11px]" onChange={(e) => updateItem(items.length, "discount", e.target.value)} />
                        <span className="text-gray-500">%</span>
                      </div>
                    </td>
                    <td className="px-2 py-3 align-top font-semibold text-gray-400">
                      {order.currency || 'AUD'}
                    </td>
                    <td className="px-2 py-3 align-top">
                      <Input type="date" className="h-6 w-24 text-[11px] text-gray-500" onChange={(e) => updateItem(items.length, "delivery_date", e.target.value)} />
                    </td>
                    <td className="px-2 py-3 align-top" colSpan={5}></td>
                  </tr>
                </tbody>
              </table>
              <div className="bg-gray-50 p-2 border-t border-gray-200 flex flex-col gap-1 text-[11px]">
                <div className="grid grid-cols-[200px_1fr] items-center">
                  <div className="font-semibold ml-6">Discount:</div>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-1 w-[260px] justify-end">
                      <Input className="h-6 w-12 text-[11px]" />
                      <span className="text-gray-500">%</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Input className="h-6 w-20 text-[11px]" />
                      <span className="text-gray-500">{order.currency || 'AUD'}</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-[200px_1fr_200px] items-center font-bold">
                  <div className="ml-6">Total:</div>
                  <div className="flex gap-1 items-center justify-center -ml-16">
                    <span className="text-gray-500 font-normal">{order.currency || 'AUD'}</span> {Number(order.total || 0).toFixed(2)}
                  </div>
                  <div className="text-right text-gray-500 font-normal mr-2 text-xs">
                    0 Hourly Rate
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Toolbar & Actions */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => router.back()} className="h-7 px-4 text-xs font-medium text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100">Back</Button>
                <Button size="sm" onClick={handleSave} className="h-7 px-4 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white">Save</Button>
                <Button variant="outline" size="sm" className="h-7 px-4 text-xs font-medium text-red-600 border-red-200 bg-red-50 hover:bg-red-100">Delete</Button>
                <Button variant="outline" size="sm" className="h-7 px-4 text-xs font-medium text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100">Reports</Button>
                <Button variant="outline" size="sm" className="h-7 px-4 text-xs font-medium text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100">Copy</Button>
              </div>
              <div className="flex gap-4">
                <button className="text-xs text-blue-600 hover:underline">Check stock and book items</button>
                <button className="text-xs text-blue-600 hover:underline">Estimate costs and dates</button>
              </div>
            </div>

            {/* Sub-tables */}
            <div className="space-y-6">
              {/* Invoices */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-2">Invoices / Quotations</h3>
                <div className="border border-gray-200 rounded-sm">
                  <table className="w-full text-[11px] text-left">
                    <thead className="bg-[#f1f5f9] text-gray-700 border-b border-gray-200">
                      <tr>
                        <th className="px-3 py-2 font-semibold">Number</th>
                        <th className="px-3 py-2 font-semibold">Type</th>
                        <th className="px-3 py-2 font-semibold">Created</th>
                        <th className="px-3 py-2 font-semibold">Status</th>
                        <th className="px-3 py-2 font-semibold">Total</th>
                        <th className="px-3 py-2 font-semibold">Paid</th>
                        <th className="px-3 py-2 font-semibold">Due date</th>
                        <th className="px-3 py-2 w-10 text-right">
                          <button onClick={() => router.push(`/dashboard/mrp/crm/customer-orders/${orderId}/invoices/new`)} className="p-1 hover:bg-gray-200 rounded text-blue-600 bg-white border border-gray-200 shadow-sm transition-colors">
                            <Plus className="w-4 h-4" />
                          </button>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {invoices.length > 0 ? invoices.map((inv: any, i: number) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-blue-600 cursor-pointer hover:underline">{inv.invoice_number || inv.Number}</td>
                          <td className="px-3 py-2">{inv.type || "Invoice"}</td>
                          <td className="px-3 py-2">{formatDate(inv.created_date)}</td>
                          <td className="px-3 py-2">{inv.status}</td>
                          <td className="px-3 py-2">{order.currency || 'AUD'} {Number(inv.total).toFixed(2)}</td>
                          <td className="px-3 py-2">{order.currency || 'AUD'} {Number(inv.paid || inv.total).toFixed(2)}</td>
                          <td className="px-3 py-2">{formatDate(inv.due_date)}</td>
                          <td className="px-3 py-2 text-right">
                            <button onClick={() => router.push(`/dashboard/mrp/crm/customer-orders/${orderId}/invoices/new`)} className="p-1 hover:bg-gray-200 rounded text-blue-600 bg-white border border-gray-200 shadow-sm transition-colors">
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      )) : (
                        <tr className="hover:bg-gray-50">
                          <td colSpan={8} className="px-3 py-2 text-gray-400 italic">No invoices found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Shipments */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-2">Shipments</h3>
                <div className="border border-gray-200 rounded-sm">
                  <table className="w-full text-[11px] text-left">
                    <thead className="bg-[#f1f5f9] text-gray-700 border-b border-gray-200">
                      <tr>
                        <th className="px-3 py-2 font-semibold w-12">#</th>
                        <th className="px-3 py-2 font-semibold">Number</th>
                        <th className="px-3 py-2 font-semibold">Delivery date</th>
                        <th className="px-3 py-2 font-semibold">Status</th>
                        <th className="px-3 py-2 w-10 text-right">
                          <button onClick={() => router.push(`/dashboard/mrp/crm/customer-orders/${orderId}/shipments/new`)} className="p-1 hover:bg-gray-200 rounded text-blue-600 bg-white border border-gray-200 shadow-sm transition-colors">
                            <Plus className="w-4 h-4" />
                          </button>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {shipments.length > 0 ? shipments.map((ship: any, i: number) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-blue-600 cursor-pointer hover:underline">{ship.mo_number || ship.Number}</td>
                          <td className="px-3 py-2">{formatDate(ship.created_date)}</td>
                          <td className="px-3 py-2">{ship.status}</td>
                          <td className="px-3 py-2">{formatDate(ship.due_date)}</td>
                          <td className="px-3 py-2 text-right">
                            <button onClick={() => router.push(`/dashboard/mrp/crm/customer-orders/${orderId}/shipments/new`)} className="p-1 hover:bg-gray-200 rounded text-blue-600 bg-white border border-gray-200 shadow-sm transition-colors">
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      )) : (
                        <tr className="hover:bg-gray-50">
                          <td colSpan={5} className="px-3 py-2 text-gray-400 italic">No shipments found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Notes */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-2">Notes</h3>
                <div className="border border-gray-200 rounded-sm">
                  <table className="w-full text-[11px] text-left">
                    <thead className="bg-[#f1f5f9] text-gray-700 border-b border-gray-200">
                      <tr>
                        <th className="px-3 py-2 font-semibold w-32 cursor-pointer">Created ↓</th>
                        <th className="px-3 py-2 font-semibold w-32">Modified</th>
                        <th className="px-3 py-2 font-semibold">Note</th>
                        <th className="px-3 py-2 w-10 text-right">
                          <button onClick={() => router.push(`/dashboard/mrp/crm/customer-orders/${orderId}/notes/new`)} className="p-1 hover:bg-gray-200 rounded text-blue-600 bg-white border border-gray-200 shadow-sm transition-colors">
                            <Plus className="w-4 h-4" />
                          </button>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      <tr className="hover:bg-gray-50">
                        <td colSpan={4} className="px-3 py-2 text-gray-400 italic">No notes found.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </RouteGuard>
  );
}
