"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, GripVertical, Link2 } from "lucide-react";

export default function CreateDocumentGlobalPage() {
  const router = useRouter();

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
            <div className="grid grid-cols-[140px_1fr] items-center gap-4 relative">
              <label className="text-[11px] text-right text-gray-500 font-medium uppercase">Customer order</label>
              <Select>
                <SelectTrigger className="h-7 text-xs bg-blue-50/50 border-blue-300 text-blue-900 w-full z-10 shadow-lg relative rounded-b-none">
                  <SelectValue placeholder="Select customer order" />
                </SelectTrigger>
                <SelectContent className="mt-[-2px] border-t-0 rounded-t-none border-blue-300 shadow-xl max-h-64">
                  <SelectItem value="new" className="font-bold border-b border-gray-100">Add a new customer order</SelectItem>
                  <SelectItem value="CO00689">CO00689; CU04702 LEDA SIGNS (Quotation, AUD 1,890.00)</SelectItem>
                  <SelectItem value="CO00688">CO00688; CU02430 VULCAN PLATE PROCESSING (Quotation, AUD 405.00)</SelectItem>
                  <SelectItem value="CO00687">CO00687; CU05867 GEOFF BENNETT STAINLESS STEEL (Ready for shipment, AUD 450.00)</SelectItem>
                  <SelectItem value="CO00686">CO00686; CU02916 ENDLESS METAL WORKS (Ready for shipment, AUD 945.00)</SelectItem>
                  <SelectItem value="CO00685">CO00685; CU06083 ABSOLUTE LASER (Quotation, AUD 10,439.49)</SelectItem>
                  <SelectItem value="CO00684">CO00684; CU00322 SIGNMAKERS GOLD COAST (Quotation, AUD 2,310.00)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-[140px_1fr] items-center gap-4">
              <label className="text-[11px] text-right text-gray-500 font-medium uppercase">or customer *</label>
              <Select>
                <SelectTrigger className="h-7 text-xs bg-gray-100/50 border-gray-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent></SelectContent>
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
              <Input type="date" defaultValue="2026-07-29" className="h-7 text-xs bg-blue-50/50 border-blue-200" />
            </div>

            <div className="grid grid-cols-[120px_1fr] items-center gap-4">
              <label className="text-[11px] text-right text-gray-500 font-medium uppercase">Due date</label>
              <Input type="date" className="h-7 text-xs bg-gray-100/50 border-gray-200" />
            </div>

            <div className="grid grid-cols-[120px_1fr] items-center gap-4">
              <label className="text-[11px] text-right text-gray-500 font-medium uppercase">Currency</label>
              <Input defaultValue="" className="h-7 text-xs bg-gray-100/50 border-gray-200" readOnly />
            </div>

            <div className="grid grid-cols-[120px_1fr] items-center gap-4">
              <label className="text-[11px] text-right text-gray-500 font-medium uppercase">Billing address</label>
              <Select>
                <SelectTrigger className="h-7 text-xs bg-gray-100/50 border-gray-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent></SelectContent>
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
              {/* Row 1 (Empty) */}
              <tr>
                <td className="px-2 py-3 text-center text-gray-400">1</td>
                <td className="px-2 py-3 align-top">
                  <Select>
                    <SelectTrigger className="h-7 text-[10px] bg-gray-50/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent></SelectContent>
                  </Select>
                </td>
                <td className="px-2 py-3 align-top">
                  <Select>
                    <SelectTrigger className="h-7 text-[10px] bg-gray-50/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent></SelectContent>
                  </Select>
                </td>
                <td className="px-2 py-3">
                  <div className="space-y-1">
                    <Select>
                      <SelectTrigger className="h-7 text-[10px] bg-gray-50/50 text-gray-400">
                        <SelectValue placeholder="Start typing to select an item" />
                      </SelectTrigger>
                      <SelectContent></SelectContent>
                    </Select>
                    <Input placeholder="Free text" className="h-7 text-[10px] bg-gray-50/50" />
                  </div>
                </td>
                <td className="px-2 py-3 align-top">
                  <Input className="h-7 text-[10px] text-right bg-gray-50/50" />
                </td>
                <td className="px-2 py-3 align-top">
                  <div className="flex gap-1 items-center">
                    <Input className="h-7 text-[10px] text-right bg-gray-50/50 flex-1" />
                    <span className="text-[10px] text-gray-400">$</span>
                  </div>
                </td>
                <td className="px-2 py-3 align-top">
                  <div className="flex gap-1 items-center">
                    <Input className="h-7 text-[10px] bg-gray-50/50 w-full" />
                    <span className="text-[10px] text-gray-400">%</span>
                  </div>
                </td>
                <td className="px-2 py-3 align-top">
                  <div className="flex gap-1 items-center font-medium">
                    <span className="text-[10px] w-16 text-right">$</span>
                  </div>
                </td>
                <td className="px-2 py-3 align-top">
                  <Input type="date" className="h-7 text-[10px] bg-gray-50/50 w-full" />
                </td>
                <td className="px-2 py-3 align-top text-right"></td>
              </tr>
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
                <td className="px-2 py-2 text-gray-400 text-right">$</td>
                <td colSpan={2}></td>
              </tr>
              <tr>
                <td colSpan={4} className="px-2 py-2 font-bold text-gray-900">Total:</td>
                <td className="px-2 py-2 text-right font-bold">0</td>
                <td colSpan={2}></td>
                <td className="px-2 py-2 font-bold text-gray-900 whitespace-nowrap text-right">$ 0.00</td>
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
                <td className="px-2 py-2 font-medium text-gray-900 whitespace-nowrap text-right">0.00 <span className="text-gray-400 font-normal">$</span></td>
                <td colSpan={2}></td>
              </tr>
              <tr className="bg-gray-50">
                <td colSpan={7} className="px-2 py-3 font-bold text-gray-900">Total including tax:</td>
                <td className="px-2 py-3 font-bold text-gray-900 whitespace-nowrap text-right">$ 0.00</td>
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
