"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { useQuery } from "@tanstack/react-query";
import { mrpApi } from "@/services/mrpApi";
import { Trash2, Loader2 } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "/api";

function toInputDate(d: string | null | undefined) {
  if (!d) return "";
  return new Date(d).toISOString().split("T")[0];
}

export default function CreateInvoicePage() {
  const router = useRouter();

  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const [form, setForm] = useState<any>({
    customer_number: "",
    customer_name: "",
    order_number: "",
    type: "Invoice",
    status: "Unpaid",
    po: "",
    payment_terms: "",
    notes: "",
    invoice_free_text: "",
    created_date: toInputDate(new Date().toISOString()),
    due_date: toInputDate(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()),
    currency: "AUD",
    tax_rate: 10,
    total: 0,
    tax: 0,
    total_including_tax: 0,
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

  const { data: ordersResponse, isLoading: isLoadingOrders } = useQuery({
    queryKey: ["mrpCustomerOrders", "all", "", "all", 2000],
    queryFn: () => mrpApi.getCustomerOrders(1, 2000),
  });
  const orders = ordersResponse?.data || [];
  const orderOptions = orders.map((o: any) => ({
    label: `${o.order_number}; ${o.customer_name || ""} (${o.status || ""}, ${o.currency || "AUD"} ${o.total || "0.00"})`,
    value: o.order_number
  }));

  const handleOrderSelect = async (orderNumber: string) => {
    if (!orderNumber) return;
    setForm((prev: any) => ({ ...prev, order_number: orderNumber }));
    try {
      const res = await mrpApi.getCustomerOrderById(orderNumber);
      if (res.success && res.data) {
        const o = res.data;
        setForm((prev: any) => ({
          ...prev,
          order_number: o.order_number || "",
          customer_number: o.customer_number || "",
          customer_name: o.customer_name || "",
          currency: o.currency || "AUD",
          po: o.po || o.po_number || "",
          type: "Invoice",
          status: "Unpaid"
        }));

        if (o.items && Array.isArray(o.items)) {
          const newItems = o.items.map((i: any) => {
            const price = parseFloat(i.price || i.cost || 0);
            const qty = parseFloat(i.quantity || 1);
            const discount = parseFloat(i.discount || 0);
            return {
              order_number: o.order_number || "",
              product_group: i.product_group || "",
              part_no: i.product || i.part_no || "",
              description: i.description || i.part_description || "",
              free_text: i.free_text || "",
              quantity: qty.toString(),
              price: price.toString(),
              discount: discount.toString(),
              delivery_date: i.delivery_date ? toInputDate(i.delivery_date) : "",
              subtotal: (qty * price * (1 - discount / 100))
            };
          });
          setItems(newItems);
          recalculateTotals(newItems, form.tax_rate);
        }
      }
    } catch (e) {
      console.error("Failed to fetch customer order details:", e);
    }
  };

  const recalculateTotals = (currentItems: any[], taxRate: number) => {
    let total = 0;
    currentItems.forEach(item => {
      const qty = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.price) || 0;
      const discount = parseFloat(item.discount) || 0;
      const subtotal = (qty * price) * (1 - discount / 100);
      item.subtotal = subtotal;
      total += subtotal;
    });
    const tax = total * ((parseFloat(taxRate as any) || 10) / 100);
    const total_including_tax = total + tax;
    setForm((prev: any) => ({ ...prev, total, tax, total_including_tax }));
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    if (index >= newItems.length) {
      newItems.push({});
    }
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
    recalculateTotals(newItems, form.tax_rate);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/mrp/crm/invoices`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, items }),
      });
      const data = await res.json();
      if (data.success) {
        setToast({ message: "Invoice created successfully", type: "success" });
        setTimeout(() => router.push("/dashboard/mrp/crm/invoices"), 1500);
      } else {
        setToast({ message: data.error || "Save failed", type: "error" });
      }
    } catch (e: any) {
      setToast({ message: e.message, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#f4f7fb] min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-md shadow-lg flex items-center gap-2 ${
          toast.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
        }`}>
          {toast.message}
        </div>
      )}
      <div className="max-w-[1200px] w-full mx-auto">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">Create a new document</h1>

        <div className="flex gap-2 mb-8">
          <Button variant="outline" size="sm" onClick={() => router.back()} className="h-8 px-6 text-sm font-medium text-blue-600 border-blue-100 bg-blue-50/50 hover:bg-blue-100">Back</Button>
          <Button size="sm" onClick={handleSave} disabled={saving} className="h-8 px-6 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white">
            {saving ? <Loader2 className="w-3 h-3 animate-spin mr-1"/> : null} Save
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-12 w-full mb-8">
          <div className="space-y-3">
            <div className="grid grid-cols-[120px_1fr] items-center gap-2">
              <label className="text-xs text-right text-gray-600 font-medium">Customer order</label>
              <SearchableSelect
                options={orderOptions}
                value={form.order_number}
                onChange={handleOrderSelect}
                placeholder="Select customer order"
                isLoading={isLoadingOrders}
              />
            </div>

            <div className="grid grid-cols-[120px_1fr] items-center gap-2">
              <label className="text-xs text-right text-gray-600 font-medium">or customer *</label>
              <SearchableSelect
                options={customerOptions}
                value={form.customer_number}
                onChange={(val) => {
                  const selected = customers.find((c: any) => c.customer_number === val);
                  setForm((prev: any) => ({
                    ...prev,
                    customer_number: val,
                    customer_name: selected ? selected.name : ""
                  }));
                }}
                placeholder="Select customer..."
                isLoading={isLoadingCustomers}
              />
            </div>

            <div className="grid grid-cols-[120px_1fr] items-center gap-2">
              <label className="text-xs text-right text-gray-600 font-medium">Type *</label>
              <Select value={form.type} onValueChange={v => setForm((prev: any) => ({...prev, type: v}))}>
                <SelectTrigger className="h-7 text-xs bg-gray-50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Invoice">Invoice</SelectItem>
                  <SelectItem value="Prepayment invoice">Prepayment invoice</SelectItem>
                  <SelectItem value="Credit note">Credit note</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-[120px_1fr] items-center gap-2">
              <label className="text-xs text-right text-gray-600 font-medium">Status *</label>
              <Select value={form.status} onValueChange={v => setForm((prev: any) => ({...prev, status: v}))}>
                <SelectTrigger className="h-7 text-xs bg-gray-50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Unpaid">Unpaid</SelectItem>
                  <SelectItem value="Paid">Paid</SelectItem>
                  <SelectItem value="Partially paid">Partially paid</SelectItem>
                  <SelectItem value="Voided">Voided</SelectItem>
                  <SelectItem value="Overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-[120px_1fr] items-center gap-2">
              <label className="text-xs text-right text-gray-600 font-medium">P.O. *</label>
              <Input value={form.po} onChange={e => setForm((prev: any) => ({...prev, po: e.target.value}))} className="h-7 text-xs bg-gray-50" />
            </div>

            <div className="grid grid-cols-[120px_1fr] items-center gap-2">
              <label className="text-xs text-right text-gray-600 font-medium">Payment Terms *</label>
              <Input value={form.payment_terms} onChange={e => setForm((prev: any) => ({...prev, payment_terms: e.target.value}))} className="h-7 text-xs bg-gray-50" />
            </div>

            <div className="grid grid-cols-[120px_1fr] items-start gap-2">
              <label className="text-xs text-right text-gray-600 font-medium pt-1.5">Notes</label>
              <Textarea value={form.notes} onChange={e => setForm((prev: any) => ({...prev, notes: e.target.value}))} className="h-16 bg-gray-50 text-xs resize-none" />
            </div>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-[120px_1fr] items-center gap-2">
              <label className="text-xs text-right text-gray-600 font-medium">Created *</label>
              <Input type="date" value={form.created_date} onChange={e => setForm((prev: any) => ({...prev, created_date: e.target.value}))} className="h-7 text-xs bg-gray-50" />
            </div>

            <div className="grid grid-cols-[120px_1fr] items-center gap-2">
              <label className="text-xs text-right text-gray-600 font-medium">Due date</label>
              <Input type="date" value={form.due_date} onChange={e => setForm((prev: any) => ({...prev, due_date: e.target.value}))} className="h-7 text-xs bg-gray-50" />
            </div>

            <div className="grid grid-cols-[120px_1fr] items-center gap-2">
              <label className="text-xs text-right text-gray-600 font-medium">Currency</label>
              <Select value={form.currency} onValueChange={v => setForm((prev: any) => ({...prev, currency: v}))}>
                <SelectTrigger className="h-7 text-xs bg-gray-50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AUD">AUD — Australian Dollar</SelectItem>
                  <SelectItem value="NZD">NZD — New Zealand Dollar</SelectItem>
                  <SelectItem value="EUR">EUR — Euro</SelectItem>
                  <SelectItem value="GBP">GBP — British Pound</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-[120px_1fr] items-start gap-2">
              <label className="text-xs text-right text-gray-600 font-medium pt-1.5">Free text</label>
              <Textarea value={form.invoice_free_text} onChange={e => setForm((prev: any) => ({...prev, invoice_free_text: e.target.value}))} className="h-20 bg-gray-50 text-xs resize-none" />
            </div>
          </div>
        </div>

        <div className="mb-8 w-full overflow-x-auto border border-gray-200 rounded-sm shadow-sm">
          <table className="w-full text-[11px] text-left border-collapse min-w-[1200px]">
            <thead className="bg-[#f1f5f9] text-gray-600 border-b border-gray-200">
              <tr>
                <th className="px-2 py-2 font-medium w-8 text-center">#</th>
                <th className="px-2 py-2 font-medium w-40">Order</th>
                <th className="px-2 py-2 font-medium w-40">Product group</th>
                <th className="px-2 py-2 font-medium w-64">Product</th>
                <th className="px-2 py-2 font-medium w-24">Quantity</th>
                <th className="px-2 py-2 font-medium w-32">Price per UoM</th>
                <th className="px-2 py-2 font-medium w-24">Discount</th>
                <th className="px-2 py-2 font-medium w-32">Subtotal</th>
                <th className="px-2 py-2 font-medium w-32">Delivery date</th>
                <th className="px-2 py-2 font-medium w-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {items.map((line: any, idx: number) => (
                <tr key={idx} className="hover:bg-[#f0f7ff]">
                  <td className="px-2 py-3 text-center text-gray-400 align-top">{idx + 1}</td>
                  <td className="px-2 py-3 align-top">
                    <SearchableSelect 
                      options={orderOptions}
                      value={line.order_number || ""}
                      onChange={v => updateItem(idx, "order_number", v)}
                      placeholder="Select order..."
                      isLoading={isLoadingOrders}
                    />
                  </td>
                  <td className="px-2 py-3 align-top">
                    <Input 
                      className="h-7 text-[10px] bg-transparent border-gray-200" 
                      value={line.product_group || ""} 
                      onChange={e => updateItem(idx, "product_group", e.target.value)} 
                      placeholder="Product group"
                    />
                  </td>
                  <td className="px-2 py-3 align-top">
                    <div className="space-y-1">
                      <SearchableSelect 
                        options={partOptions}
                        value={line.part_no || line.product || ""}
                        onChange={(val) => {
                          const matchedItem = (itemsResponse?.data || []).find((i: any) => i.part_number === val || i.part_no === val || i.id?.toString() === val);
                          const price = matchedItem?.selling_price || matchedItem?.sell_price || matchedItem?.cost || "0";
                          updateItem(idx, "part_no", val);
                          updateItem(idx, "description", matchedItem?.part_description || matchedItem?.name || "");
                          if (!line.quantity) updateItem(idx, "quantity", "1");
                          if (!line.price) updateItem(idx, "price", price);
                          if (!line.discount) updateItem(idx, "discount", "0");
                        }}
                        placeholder="Select part..."
                        isLoading={isLoadingItems}
                      />
                      <Input 
                        placeholder="Free text" 
                        className="h-7 text-[10px] bg-transparent border-gray-200 mt-1" 
                        value={line.free_text || line.description || ""} 
                        onChange={e => updateItem(idx, "description", e.target.value)} 
                      />
                    </div>
                  </td>
                  <td className="px-2 py-3 align-top">
                    <Input 
                      className="h-7 text-[10px] bg-transparent border-gray-200 text-right" 
                      value={line.quantity || ""} 
                      onChange={e => updateItem(idx, "quantity", e.target.value)} 
                    />
                  </td>
                  <td className="px-2 py-3 align-top">
                    <div className="flex items-center gap-1">
                      <Input 
                        className="h-7 text-[10px] bg-transparent border-gray-200 text-right w-full" 
                        value={line.price || ""} 
                        onChange={e => updateItem(idx, "price", e.target.value)} 
                      />
                      <span className="text-[10px] text-gray-500">{form.currency}</span>
                    </div>
                  </td>
                  <td className="px-2 py-3 align-top text-right">
                    <div className="flex items-center gap-1">
                      <Input 
                        className="h-7 text-[10px] bg-transparent border-gray-200 text-right w-full" 
                        value={line.discount || ""} 
                        onChange={e => updateItem(idx, "discount", e.target.value)} 
                      />
                      <span className="text-[10px] text-gray-500">%</span>
                    </div>
                  </td>
                  <td className="px-2 py-3 align-top text-right">
                    <div className="flex items-center gap-1 justify-end">
                      <span className="text-[10px] text-gray-500 font-medium">{form.currency}</span>
                      <span className="text-[11px] font-medium">{Number(line.subtotal || 0).toFixed(2)}</span>
                    </div>
                  </td>
                  <td className="px-2 py-3 align-top">
                    <Input 
                      type="date"
                      className="h-7 text-[10px] bg-transparent border-gray-200" 
                      value={line.delivery_date || ""} 
                      onChange={e => updateItem(idx, "delivery_date", e.target.value)} 
                    />
                  </td>
                  <td className="px-2 py-3 align-top text-center">
                    <button onClick={() => {
                      const newItems = items.filter((_, i) => i !== idx);
                      setItems(newItems);
                      recalculateTotals(newItems, form.tax_rate);
                    }} className="text-red-500 hover:text-red-700 mt-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              
              {/* Empty Row for adding new */}
              <tr className="hover:bg-gray-50 border-t-2 border-dashed border-gray-200">
                <td className="px-2 py-3 align-top text-center text-gray-400">{items.length + 1}</td>
                <td className="px-2 py-3 align-top">
                  <SearchableSelect 
                    options={orderOptions}
                    value=""
                    onChange={v => {
                      updateItem(items.length, "order_number", v);
                      // If it's the first manual item, fetch the order details and populate it?
                    }}
                    placeholder="Select order..."
                    isLoading={isLoadingOrders}
                  />
                </td>
                <td className="px-2 py-3 align-top">
                  <Input 
                    className="h-7 text-[10px] bg-transparent border-gray-200" 
                    onChange={e => updateItem(items.length, "product_group", e.target.value)} 
                    placeholder="Product group"
                  />
                </td>
                <td className="px-2 py-3 align-top">
                  <div className="space-y-1">
                    <SearchableSelect 
                      options={partOptions}
                      value=""
                      onChange={(val) => {
                        const matchedItem = (itemsResponse?.data || []).find((i: any) => i.part_number === val || i.part_no === val || i.id?.toString() === val);
                        const price = matchedItem?.selling_price || matchedItem?.sell_price || matchedItem?.cost || "0";
                        updateItem(items.length, "part_no", val);
                        updateItem(items.length, "description", matchedItem?.part_description || matchedItem?.name || "");
                        updateItem(items.length, "quantity", "1");
                        updateItem(items.length, "price", price);
                        updateItem(items.length, "discount", "0");
                      }}
                      placeholder="Start typing to select an item..."
                      isLoading={isLoadingItems}
                    />
                    <Input 
                      placeholder="Free text" 
                      className="h-7 text-[10px] bg-transparent border-gray-200 mt-1" 
                      onChange={e => updateItem(items.length, "description", e.target.value)} 
                    />
                  </div>
                </td>
                <td className="px-2 py-3 align-top">
                  <Input 
                    className="h-7 text-[10px] bg-transparent border-gray-200 text-right" 
                    onChange={e => updateItem(items.length, "quantity", e.target.value)} 
                  />
                </td>
                <td className="px-2 py-3 align-top">
                  <div className="flex items-center gap-1">
                    <Input 
                      className="h-7 text-[10px] bg-transparent border-gray-200 text-right w-full" 
                      onChange={e => updateItem(items.length, "price", e.target.value)} 
                    />
                    <span className="text-[10px] text-gray-500">{form.currency}</span>
                  </div>
                </td>
                <td className="px-2 py-3 align-top text-right">
                  <div className="flex items-center gap-1">
                    <Input 
                      className="h-7 text-[10px] bg-transparent border-gray-200 text-right w-full" 
                      onChange={e => updateItem(items.length, "discount", e.target.value)} 
                    />
                    <span className="text-[10px] text-gray-500">%</span>
                  </div>
                </td>
                <td className="px-2 py-3 align-top text-right">
                  <div className="flex items-center gap-1 justify-end">
                    <span className="text-[10px] text-gray-500 font-medium">{form.currency}</span>
                    <span className="text-[11px] font-medium">0.00</span>
                  </div>
                </td>
                <td className="px-2 py-3 align-top">
                  <Input 
                    type="date"
                    className="h-7 text-[10px] bg-transparent border-gray-200" 
                    onChange={e => updateItem(items.length, "delivery_date", e.target.value)} 
                  />
                </td>
                <td className="px-2 py-3 align-top text-center">
                </td>
              </tr>
            </tbody>
            
            <tbody className="bg-white border-t border-gray-200">
              <tr>
                <td colSpan={7} className="px-4 py-2 text-right font-bold text-gray-900">Total:</td>
                <td className="px-2 py-2 font-bold text-gray-900 whitespace-nowrap text-right">{form.currency} {Number(form.total || 0).toFixed(2)}</td>
                <td colSpan={2}></td>
              </tr>
              <tr>
                <td colSpan={6} className="px-4 py-2 text-right font-semibold text-gray-600">Tax:</td>
                <td className="px-2 py-2">
                  <div className="flex gap-1 items-center justify-end">
                    <Input value={form.tax_rate} onChange={e => {
                      setForm((prev: any) => ({...prev, tax_rate: e.target.value}));
                      recalculateTotals(items, parseFloat(e.target.value));
                    }} className="h-7 text-[10px] bg-gray-50/50 w-16 text-right" />
                    <span className="text-[10px] text-gray-400">%</span>
                  </div>
                </td>
                <td className="px-2 py-2 font-medium text-gray-900 whitespace-nowrap text-right">{form.currency} {Number(form.tax || 0).toFixed(2)}</td>
                <td colSpan={2}></td>
              </tr>
              <tr className="bg-gray-50 border-t border-gray-200">
                <td colSpan={7} className="px-4 py-3 font-bold text-gray-900 text-right">Total including tax:</td>
                <td className="px-2 py-3 font-bold text-gray-900 whitespace-nowrap text-right text-[13px]">{form.currency} {Number(form.total_including_tax || 0).toFixed(2)}</td>
                <td colSpan={2}></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => router.back()} className="h-8 px-6 text-sm font-medium text-blue-600 border-blue-100 bg-blue-50/50 hover:bg-blue-100">Back</Button>
          <Button size="sm" onClick={handleSave} disabled={saving} className="h-8 px-6 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white">
            {saving ? <Loader2 className="w-3 h-3 animate-spin mr-1"/> : null} Save
          </Button>
        </div>
      </div>
    </div>
  );
}
