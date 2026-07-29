"use client";

import { useQuery } from "@tanstack/react-query";
import { mrpApi } from "@/services/mrpApi";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { RouteGuard } from "@/components/auth/RouteGuard";
import { MrpTabBar } from "@/components/mrp/MrpTabBar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Plus, Pencil } from "lucide-react";
import { format } from "date-fns";

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
  const orderId = params.id as string;

  const { data: response, isLoading } = useQuery({
    queryKey: ["mrpCustomerOrder", orderId],
    queryFn: () => mrpApi.getCustomerOrderById(orderId),
  });

  const order = response?.data;
  const items = order?.items || [];
  const invoices = order?.invoices || [];
  const shipments = order?.shipments || [];

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

  if (!order) {
    return <div className="p-8 text-center text-red-500">Order not found.</div>;
  }

  return (
    <RouteGuard module="crm" fallback={<div>Access Denied</div>}>
      <div className="flex flex-col h-full bg-[#f4f7fb] min-h-[calc(100vh-4rem)] p-4 -m-4 sm:-m-6 lg:-m-8">
        <div className="bg-white rounded-md shadow-sm overflow-hidden flex flex-col min-h-[80vh]">
          <MrpTabBar tabs={crmTabs} />
          
          <div className="px-6 py-4 flex-1 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-bold text-gray-900">Customer order {order.order_number} details</h1>
              <Button variant="outline" size="sm" className="h-8 bg-gray-50 text-gray-700 text-xs font-medium border-gray-300">
                <Download className="h-3 w-3 mr-1.5" />
                PDF
              </Button>
            </div>

            {/* Top Toolbar */}
            <div className="flex gap-2 mb-6">
              <Button variant="outline" size="sm" onClick={() => router.back()} className="h-7 px-4 text-xs font-medium text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100">Back</Button>
              <Button size="sm" className="h-7 px-4 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white">Save</Button>
              <Button variant="outline" size="sm" className="h-7 px-4 text-xs font-medium text-red-600 border-red-200 bg-red-50 hover:bg-red-100">Delete</Button>
              <Button variant="outline" size="sm" className="h-7 px-4 text-xs font-medium text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100">Reports</Button>
              <Button variant="outline" size="sm" className="h-7 px-4 text-xs font-medium text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100">Copy</Button>
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
                  <Select value={order.customer_number || "unknown"}>
                    <SelectTrigger className="h-7 text-xs bg-gray-50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={order.customer_number || "unknown"}>{order.customer_number} {order.customer_name}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-[120px_1fr] items-center gap-2">
                  <label className="text-xs text-right text-gray-600 font-medium">Status *</label>
                  <Select value={order.status}>
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
            <div className="border border-gray-200 rounded-sm overflow-hidden mb-6">
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
                          <Select defaultValue="system">
                            <SelectTrigger className="h-6 w-32 text-[11px] bg-white border-transparent">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="system">A000000 Z Air System</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </td>
                      <td className="px-2 py-3 align-top">
                        <div className="font-semibold">{item.product}</div>
                        <div className="text-gray-500 mt-1">{item.description}</div>
                      </td>
                      <td className="px-2 py-3 align-top">
                        <div className="flex items-center gap-1">
                          <Input className="h-6 w-12 text-[11px]" defaultValue={item.quantity} />
                          <span className="text-gray-500">{item.uom}</span>
                        </div>
                      </td>
                      <td className="px-2 py-3 align-top">
                        <div className="flex items-center gap-1">
                          <Input className="h-6 w-16 text-[11px]" defaultValue={item.price?.toFixed(2)} />
                          <span className="text-gray-500">{order.currency || 'AUD'}</span>
                        </div>
                      </td>
                      <td className="px-2 py-3 align-top">
                        <div className="flex items-center gap-1">
                          <Input className="h-6 w-12 text-[11px]" defaultValue={item.discount} />
                          <span className="text-gray-500">%</span>
                        </div>
                      </td>
                      <td className="px-2 py-3 align-top font-semibold">
                        {item.subtotal?.toFixed(2)} <span className="font-normal text-gray-500 ml-1">{order.currency || 'AUD'}</span>
                      </td>
                      <td className="px-2 py-3 align-top">
                        <Input type="date" className="h-6 w-24 text-[11px] text-gray-500" />
                      </td>
                      <td className="px-2 py-3 align-top">{item.cost?.toFixed(2) || ''}</td>
                      <td className="px-2 py-3 align-top">{item.profit?.toFixed(2) || ''}</td>
                      <td className="px-2 py-3 align-top text-red-600">{item.status}</td>
                      <td className="px-2 py-3 align-top">{item.source}</td>
                      <td className="px-2 py-3 align-top">{item.shipped}</td>
                    </tr>
                  ))}
                  {/* Empty Row for adding new */}
                  <tr className="hover:bg-gray-50 border-t-2 border-dashed border-gray-200">
                    <td className="px-2 py-3 align-top">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">{items.length + 1}</span>
                        <Select>
                          <SelectTrigger className="h-6 w-32 text-[11px] bg-white border-transparent">
                            <SelectValue placeholder="Select group" />
                          </SelectTrigger>
                          <SelectContent><SelectItem value="none">None</SelectItem></SelectContent>
                        </Select>
                      </div>
                    </td>
                    <td className="px-2 py-3 align-top">
                      <Input placeholder="Free text" className="h-6 w-full text-[11px]" />
                    </td>
                    <td className="px-2 py-3 align-top">
                      <Input className="h-6 w-12 text-[11px]" />
                    </td>
                    <td className="px-2 py-3 align-top">
                      <div className="flex items-center gap-1">
                        <Input className="h-6 w-16 text-[11px]" />
                        <span className="text-gray-500">{order.currency || 'AUD'}</span>
                      </div>
                    </td>
                    <td className="px-2 py-3 align-top">
                      <div className="flex items-center gap-1">
                        <Input className="h-6 w-12 text-[11px]" />
                        <span className="text-gray-500">%</span>
                      </div>
                    </td>
                    <td className="px-2 py-3 align-top font-semibold text-gray-400">
                      {order.currency || 'AUD'}
                    </td>
                    <td className="px-2 py-3 align-top">
                      <Input type="date" className="h-6 w-24 text-[11px] text-gray-500" />
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
                    <span className="text-gray-500 font-normal">{order.currency || 'AUD'}</span> {Number(order.total || 360).toFixed(2)}
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
                <Button size="sm" className="h-7 px-4 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white">Save</Button>
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
