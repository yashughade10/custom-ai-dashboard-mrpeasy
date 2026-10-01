"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { mrpApi } from "@/services/mrpApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, GripVertical, Link2 } from "lucide-react";

export default function CreateDocumentPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = typeof params?.id === 'string' ? params.id : '';

  const { data: orderResponse } = useQuery({
    queryKey: ["mrpCustomerOrder", orderId],
    queryFn: () => mrpApi.getCustomerOrderById(orderId),
    enabled: !!orderId,
  });
  const order = orderResponse?.data || {};

  return (
    <div className="flex flex-col h-full bg-[#f4f7fb] min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8">
      <div className="max-w-[1200px] w-full mx-auto">
        {/* Header */}
        <h1 className="text-2xl font-bold text-slate-900 mb-6">Create a new document</h1>

        {/* Top Toolbar */}
        <div className="flex gap-2 mb-8">
          <Button variant="outline" size="sm" onClick={() => router.back()} className="h-8 px-6 text-sm font-medium text-blue-600 border-blue-100 bg-blue-50/50 hover:bg-blue-100">Back</Button>
          <Button size="sm" className="h-8 px-6 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white">Save</Button>
        </div>

        {/* Form Grid */}
        <div className="grid grid-cols-2 gap-x-16 gap-y-4 mb-8">
          {/* Left Column */}
          <div className="space-y-3">
            <div className="grid grid-cols-[140px_1fr] items-center gap-4">
              <label className="text-[11px] text-right text-gray-500 font-medium uppercase">Customer order</label>
              <div className="flex items-center gap-2">
                <Select value={order.order_number || "new"}>
                  <SelectTrigger className="h-7 text-xs bg-blue-50 border-blue-200 text-blue-900 flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">Add a new customer order</SelectItem>
                    {order.order_number && (
                      <SelectItem value={order.order_number}>
                        {order.order_number} {order.customer_name} ({order.status}, {order.currency} {order.total})
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <Link2 className="w-3.5 h-3.5 text-gray-400 cursor-pointer" />
                <Trash2 className="w-3.5 h-3.5 text-gray-400 cursor-pointer" />
              </div>
            </div>

            <div className="grid grid-cols-[140px_1fr] items-center gap-4">
              <label className="text-[11px] text-right text-gray-500 font-medium uppercase">or customer *</label>
              <Select value={order.customer_number || "none"}>
                <SelectTrigger className="h-7 text-xs bg-blue-50/50 border-blue-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {order.customer_number ? (
                    <SelectItem value={order.customer_number}>{order.customer_number} {order.customer_name}</SelectItem>
                  ) : (
                    <SelectItem value="none">No customer selected</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-[140px_1fr] items-center gap-4">
              <label className="text-[11px] text-right text-gray-500 font-medium uppercase">Type *</label>
              <Select defaultValue="Quotation">
                <SelectTrigger className="h-7 text-xs bg-gray-100/50 border-gray-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Quotation">Quotation</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-[140px_1fr] items-center gap-4">
              <label className="text-[11px] text-right text-gray-500 font-medium uppercase">Status *</label>
              <Select defaultValue="Dummy">
                <SelectTrigger className="h-7 text-xs bg-gray-100/50 border-gray-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Dummy">Dummy</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-[140px_1fr] items-center gap-4">
              <label className="text-[11px] text-right text-gray-500 font-medium uppercase">P.O. *</label>
              <Input className="h-7 text-xs bg-gray-100/50 border-gray-200" />
            </div>

            <div className="grid grid-cols-[140px_1fr] items-center gap-4">
              <label className="text-[11px] text-right text-gray-500 font-medium uppercase">Payment Terms *</label>
              <Input className="h-7 text-xs bg-gray-100/50 border-gray-200" />
            </div>

            <div className="grid grid-cols-[140px_1fr] items-start gap-4">
              <label className="text-[11px] text-right text-gray-500 font-medium uppercase leading-tight pt-1">NOTE CHANGED<br/>BANKING DETAILS</label>
              <Textarea className="h-16 bg-gray-100/50 border-gray-200 text-xs resize-none" />
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-3">
            <div className="grid grid-cols-[120px_1fr] items-center gap-4">
              <label className="text-[11px] text-right text-gray-500 font-medium uppercase">Created *</label>
              <Input type="date" value={order.created_date ? new Date(order.created_date).toISOString().split('T')[0] : ""} className="h-7 text-xs bg-blue-50/50 border-blue-200" readOnly />
            </div>

            <div className="grid grid-cols-[120px_1fr] items-center gap-4">
              <label className="text-[11px] text-right text-gray-500 font-medium uppercase">Due date</label>
              <Input type="date" className="h-7 text-xs bg-blue-50/50 border-blue-200" />
            </div>

            <div className="grid grid-cols-[120px_1fr] items-center gap-4">
              <label className="text-[11px] text-right text-gray-500 font-medium uppercase">Currency</label>
              <Input value={order.currency || "AUD"} className="h-7 text-xs bg-gray-100/50 border-gray-200" readOnly />
            </div>

            <div className="grid grid-cols-[120px_1fr] items-center gap-4">
              <label className="text-[11px] text-right text-gray-500 font-medium uppercase">Billing address</label>
              <Select defaultValue="address1">
                <SelectTrigger className="h-7 text-xs bg-gray-200 border-gray-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="address1">163 Crockford St, NORTHGATE QLD 4013, Australia</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-[120px_1fr] items-start gap-4">
              <label className="text-[11px] text-right text-gray-500 font-medium uppercase pt-1">Free text</label>
              <Textarea className="h-20 bg-gray-100/50 border-gray-200 text-xs resize-none" />
            </div>
          </div>
        </div>

        {/* Big Line Items Table */}
        <div className="mb-8 w-full overflow-x-auto border border-gray-200 rounded-sm">
          <table className="w-full text-[11px] text-left border-collapse min-w-[1000px]">
            <thead className="bg-[#f1f5f9] text-gray-600 border-b border-gray-200">
              <tr>
                <th className="px-2 py-2 font-medium w-6 text-center"></th>
                <th className="px-2 py-2 font-medium w-32">Order</th>
                <th className="px-2 py-2 font-medium w-48">Product group</th>
                <th className="px-2 py-2 font-medium w-80">Product</th>
                <th className="px-2 py-2 font-medium w-16">Quantity</th>
                <th className="px-2 py-2 font-medium w-32">Price per UoM</th>
                <th className="px-2 py-2 font-medium w-16">Discount</th>
                <th className="px-2 py-2 font-medium w-32">Subtotal</th>
                <th className="px-2 py-2 font-medium w-32">Delivery date</th>
                <th className="px-2 py-2 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {order.items?.length ? order.items.map((item: any, i: number) => (
                <tr key={i}>
                  <td className="px-2 py-3 text-center text-gray-400">{i + 1}</td>
                  <td className="px-2 py-3 align-top">
                    <Select value={order.order_number}>
                      <SelectTrigger className="h-7 text-[10px] bg-gray-50/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent><SelectItem value={order.order_number}>{order.order_number}</SelectItem></SelectContent>
                    </Select>
                  </td>
                  <td className="px-2 py-3 align-top">
                    <Select value={item.product_group || "none"}>
                      <SelectTrigger className="h-7 text-[10px] bg-gray-50/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent><SelectItem value={item.product_group || "none"}>{item.product_group || "None"}</SelectItem></SelectContent>
                    </Select>
                  </td>
                  <td className="px-2 py-3">
                    <div className="space-y-1">
                      <Select value={item.product || "none"}>
                        <SelectTrigger className="h-7 text-[10px] bg-gray-50/50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent><SelectItem value={item.product || "none"}>{item.product || "None"}</SelectItem></SelectContent>
                      </Select>
                      <div className="text-[10px] text-gray-500 bg-gray-100/50 p-1 rounded-sm leading-tight">
                        {item.description}
                      </div>
                    </div>
                  </td>
                  <td className="px-2 py-3 align-top">
                    <Input defaultValue={item.quantity} className="h-7 text-[10px] text-right bg-gray-50/50" />
                  </td>
                  <td className="px-2 py-3 align-top">
                    <div className="flex gap-1 items-center">
                      <span className="text-[10px] text-gray-400">Rate</span>
                      <Input defaultValue={item.price} className="h-7 text-[10px] text-right bg-gray-50/50 flex-1" />
                      <span className="text-[10px] text-gray-400">{order.currency || "AUD"}</span>
                    </div>
                  </td>
                  <td className="px-2 py-3 align-top">
                    <div className="flex gap-1 items-center">
                      <Input defaultValue={item.discount} className="h-7 text-[10px] bg-gray-50/50 w-full" />
                      <span className="text-[10px] text-gray-400">%</span>
                    </div>
                  </td>
                  <td className="px-2 py-3 align-top">
                    <div className="flex gap-1 items-center font-medium">
                      <Input defaultValue={item.subtotal} className="h-7 text-[10px] text-right font-bold w-16 border-transparent bg-transparent p-0" readOnly />
                      <span className="text-[10px] text-gray-400">{order.currency || "AUD"}</span>
                    </div>
                  </td>
                  <td className="px-2 py-3 align-top">
                    <Input type="date" defaultValue={item.delivery_date} className="h-7 text-[10px] bg-gray-50/50 w-full" />
                  </td>
                  <td className="px-2 py-3 align-top text-right">
                    <div className="flex gap-1 items-center justify-end text-gray-400 pt-1">
                      <Trash2 className="w-3.5 h-3.5 cursor-pointer hover:text-red-500" />
                      <GripVertical className="w-3.5 h-3.5 cursor-move" />
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={10} className="px-2 py-8 text-center text-gray-500">No line items in this order.</td>
                </tr>
              )}
            </tbody>
            {/* Table Footer Totals */}
            <tbody className="bg-white border-t border-gray-200">
              <tr>
                <td colSpan={6} className="px-2 py-2 text-right font-semibold text-gray-600">Discount:</td>
                <td className="px-2 py-2">
                  <div className="flex gap-1 items-center">
                    <Input className="h-7 text-[10px] bg-gray-50/50 w-full" />
                    <span className="text-[10px] text-gray-400">%</span>
                  </div>
                </td>
                <td className="px-2 py-2"></td>
                <td colSpan={2}></td>
              </tr>
              <tr>
                <td colSpan={4} className="px-2 py-2 font-bold text-gray-900">Total:</td>
                <td className="px-2 py-2 text-right font-bold">{order.items?.length || 0}</td>
                <td colSpan={2}></td>
                <td className="px-2 py-2 font-bold whitespace-nowrap">{order.currency || "AUD"} {order.total?.toFixed(2) || "0.00"}</td>
                <td colSpan={2}></td>
              </tr>
              <tr>
                <td colSpan={6} className="px-2 py-2 text-right font-semibold text-gray-600">Tax:</td>
                <td className="px-2 py-2">
                  <div className="flex gap-1 items-center">
                    <Input defaultValue="10" className="h-7 text-[10px] bg-gray-50/50 w-full text-right" />
                    <span className="text-[10px] text-gray-400">%</span>
                  </div>
                </td>
                <td className="px-2 py-2 font-medium whitespace-nowrap">36.00 <span className="text-gray-400 font-normal">AUD</span></td>
                <td colSpan={2}></td>
              </tr>
              <tr className="bg-gray-50">
                <td colSpan={7} className="px-2 py-3 font-bold text-gray-900">Total including tax:</td>
                <td className="px-2 py-3 font-bold text-blue-600 whitespace-nowrap text-sm">AUD 396.00</td>
                <td colSpan={2}></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Bottom Toolbar */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => router.back()} className="h-8 px-6 text-sm font-medium text-blue-600 border-blue-100 bg-blue-50/50 hover:bg-blue-100">Back</Button>
          <Button size="sm" className="h-8 px-6 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white">Save</Button>
        </div>
      </div>
    </div>
  );
}
