"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, GripVertical, Link2, Download, Cloud } from "lucide-react";

export default function InvoiceDetailsPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col h-full bg-[#f4f7fb] min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8">
      <div className="max-w-[1200px] w-full mx-auto">
        {/* Header & Right Toolbar */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Invoice I00005 details</h1>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-8 px-4 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 border-gray-200">Send e-mail</Button>
            <Button variant="outline" size="sm" className="h-8 px-4 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 border-gray-200 flex items-center gap-1">
              <Download className="w-3.5 h-3.5" /> PDF
            </Button>
            <Button variant="outline" size="sm" className="h-8 px-4 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 border-gray-200 flex items-center gap-1">
              <Download className="w-3.5 h-3.5" /> Excel
            </Button>
            <Button size="sm" className="h-8 w-8 p-0 bg-blue-500 hover:bg-blue-600 text-white rounded flex items-center justify-center">
              <Cloud className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Top Toolbar */}
        <div className="flex gap-2 mb-8">
          <Button variant="outline" size="sm" onClick={() => router.back()} className="h-8 px-6 text-sm font-medium text-blue-600 border-blue-100 bg-blue-50/50 hover:bg-blue-100">Back</Button>
          <Button size="sm" className="h-8 px-6 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white">Save</Button>
          <Button variant="outline" size="sm" className="h-8 px-6 text-sm font-medium text-blue-600 border-blue-100 bg-blue-50/50 hover:bg-blue-100">Delete</Button>
          <Button size="sm" className="h-8 px-6 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white">Copy</Button>
        </div>

        {/* Form Grid */}
        <div className="grid grid-cols-2 gap-x-16 gap-y-4 mb-8">
          {/* Left Column */}
          <div className="space-y-3">
            <div className="grid grid-cols-[140px_1fr] items-center gap-4">
              <label className="text-[11px] text-right text-gray-500 font-medium uppercase">Number *</label>
              <Input defaultValue="I00005" className="h-7 text-xs bg-gray-100/50 border-gray-200" />
            </div>
            <div className="grid grid-cols-[140px_1fr] items-center gap-4">
              <label className="text-[11px] text-right text-gray-500 font-medium uppercase">Customer order</label>
              <Select>
                <SelectTrigger className="h-7 text-xs bg-gray-100/50 border-gray-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent></SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-[140px_1fr] items-center gap-4">
              <label className="text-[11px] text-right text-gray-500 font-medium uppercase">or customer *</label>
              <div className="flex items-center gap-2">
                <Select defaultValue="CU00320">
                  <SelectTrigger className="h-7 text-xs bg-blue-50/50 border-blue-200 flex-1 text-gray-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CU00320">CU00320-def1751329056 SHINE STAINLESS MARINE</SelectItem>
                  </SelectContent>
                </Select>
                <Link2 className="w-3.5 h-3.5 text-gray-400 cursor-pointer" />
              </div>
            </div>

            <div className="grid grid-cols-[140px_1fr] items-center gap-4">
              <label className="text-[11px] text-right text-gray-500 font-medium uppercase">Type *</label>
              <Select defaultValue="Invoice">
                <SelectTrigger className="h-7 text-xs bg-gray-100/50 border-gray-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Invoice">Invoice</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-[140px_1fr] items-center gap-4">
              <label className="text-[11px] text-right text-gray-500 font-medium uppercase">Status *</label>
              <Select defaultValue="Paid">
                <SelectTrigger className="h-7 text-xs bg-gray-100/50 border-gray-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-[140px_1fr] items-center gap-4">
              <label className="text-[11px] text-right text-gray-500 font-medium uppercase">P.O. *</label>
              <Input className="h-7 text-xs bg-gray-100/50 border-gray-200" />
            </div>

            <div className="grid grid-cols-[140px_1fr] items-center gap-4">
              <label className="text-[11px] text-right text-gray-500 font-medium uppercase">Payment Terms *</label>
              <Select>
                <SelectTrigger className="h-7 text-xs bg-gray-100/50 border-gray-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent></SelectContent>
              </Select>
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
              <Input type="date" defaultValue="2025-07-01" className="h-7 text-xs bg-blue-50/50 border-blue-200" />
            </div>

            <div className="grid grid-cols-[120px_1fr] items-center gap-4">
              <label className="text-[11px] text-right text-gray-500 font-medium uppercase">Due date</label>
              <Input type="date" defaultValue="2025-07-01" className="h-7 text-xs bg-blue-50/50 border-blue-200" />
            </div>

            <div className="grid grid-cols-[120px_1fr] items-center gap-4">
              <label className="text-[11px] text-right text-gray-500 font-medium uppercase">Billing address</label>
              <Select defaultValue="address1">
                <SelectTrigger className="h-7 text-xs bg-gray-200 border-gray-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="address1">U3 7 MCPHAIL ROAD, COOMERA QLD 4209</SelectItem>
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
                <th className="px-2 py-2 font-medium w-24">Quantity</th>
                <th className="px-2 py-2 font-medium w-32">Price per UoM</th>
                <th className="px-2 py-2 font-medium w-16">Discount</th>
                <th className="px-2 py-2 font-medium w-32">Subtotal</th>
                <th className="px-2 py-2 font-medium w-32">Delivery date</th>
                <th className="px-2 py-2 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {/* Row 1 */}
              <tr>
                <td className="px-2 py-3 text-center text-gray-400">1</td>
                <td className="px-2 py-3 align-top"></td>
                <td className="px-2 py-3 align-top">
                  <Select defaultValue="group1">
                    <SelectTrigger className="h-7 text-[10px] bg-gray-50/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent><SelectItem value="group1">AG00004 Blue Water Engineering</SelectItem></SelectContent>
                  </Select>
                </td>
                <td className="px-2 py-3">
                  <div className="space-y-1">
                    <Select defaultValue="prod1">
                      <SelectTrigger className="h-7 text-[10px] bg-gray-50/50 text-gray-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent><SelectItem value="prod1">A0000144 STAINLESS TRIM, MIRROR FINISH</SelectItem></SelectContent>
                    </Select>
                    <Input placeholder="Free text" className="h-6 text-[10px] bg-gray-50/50" />
                  </div>
                </td>
                <td className="px-2 py-3 align-top">
                  <div className="flex gap-1 items-center">
                    <Input defaultValue="6" className="h-7 text-[10px] text-right bg-gray-50/50 flex-1" />
                    <span className="text-[10px] text-gray-400">pcs</span>
                  </div>
                </td>
                <td className="px-2 py-3 align-top">
                  <div className="flex gap-1 items-center">
                    <Input defaultValue="140.10" className="h-7 text-[10px] text-right bg-gray-50/50 flex-1" />
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
                    <Input defaultValue="840.60" className="h-7 text-[10px] text-right font-bold w-16 border-transparent bg-transparent p-0" readOnly />
                    <span className="text-[10px] text-gray-400">$</span>
                  </div>
                </td>
                <td className="px-2 py-3 align-top">
                  <Input type="date" className="h-7 text-[10px] bg-gray-50/50 w-full" />
                </td>
                <td className="px-2 py-3 align-top text-right">
                  <div className="flex gap-1 items-center justify-end text-gray-400 pt-1">
                    <Trash2 className="w-3.5 h-3.5 cursor-pointer hover:text-red-500" />
                    <GripVertical className="w-3.5 h-3.5 cursor-move" />
                  </div>
                </td>
              </tr>
              {/* Row 2 */}
              <tr>
                <td className="px-2 py-3 text-center text-gray-400">2</td>
                <td className="px-2 py-3 align-top"></td>
                <td className="px-2 py-3 align-top">
                  <Select defaultValue="group1">
                    <SelectTrigger className="h-7 text-[10px] bg-gray-50/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent><SelectItem value="group1">AG00004 Blue Water Engineering</SelectItem></SelectContent>
                  </Select>
                </td>
                <td className="px-2 py-3">
                  <div className="space-y-1">
                    <Select defaultValue="prod1">
                      <SelectTrigger className="h-7 text-[10px] bg-gray-50/50 text-gray-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent><SelectItem value="prod1">A0000146 DOOR WITH 40 OD HOLE</SelectItem></SelectContent>
                    </Select>
                    <Input placeholder="Free text" className="h-6 text-[10px] bg-gray-50/50" />
                  </div>
                </td>
                <td className="px-2 py-3 align-top">
                  <div className="flex gap-1 items-center">
                    <Input defaultValue="2" className="h-7 text-[10px] text-right bg-gray-50/50 flex-1" />
                    <span className="text-[10px] text-gray-400">pcs</span>
                  </div>
                </td>
                <td className="px-2 py-3 align-top">
                  <div className="flex gap-1 items-center">
                    <Input defaultValue="90.25" className="h-7 text-[10px] text-right bg-gray-50/50 flex-1" />
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
                    <Input defaultValue="180.50" className="h-7 text-[10px] text-right font-bold w-16 border-transparent bg-transparent p-0" readOnly />
                    <span className="text-[10px] text-gray-400">$</span>
                  </div>
                </td>
                <td className="px-2 py-3 align-top">
                  <Input type="date" className="h-7 text-[10px] bg-gray-50/50 w-full" />
                </td>
                <td className="px-2 py-3 align-top text-right">
                  <div className="flex gap-1 items-center justify-end text-gray-400 pt-1">
                    <Trash2 className="w-3.5 h-3.5 cursor-pointer hover:text-red-500" />
                    <GripVertical className="w-3.5 h-3.5 cursor-move" />
                  </div>
                </td>
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
                <td className="px-2 py-2"></td>
                <td colSpan={2}></td>
              </tr>
              <tr>
                <td colSpan={4} className="px-2 py-2 font-bold text-gray-900">Total:</td>
                <td className="px-2 py-2 text-right font-bold">10</td>
                <td colSpan={2}></td>
                <td className="px-2 py-2 font-bold whitespace-nowrap">$ 1,201.60</td>
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
                <td className="px-2 py-2 font-medium whitespace-nowrap">120.16 <span className="text-gray-400 font-normal">$</span></td>
                <td colSpan={2}></td>
              </tr>
              <tr className="bg-gray-50">
                <td colSpan={7} className="px-2 py-3 font-bold text-gray-900">Total including tax:</td>
                <td className="px-2 py-3 font-bold text-blue-600 whitespace-nowrap text-sm">$ 1,321.76</td>
                <td colSpan={2}></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Bottom Toolbar */}
        <div className="flex gap-2 mb-8">
          <Button variant="outline" size="sm" onClick={() => router.back()} className="h-8 px-6 text-sm font-medium text-blue-600 border-blue-100 bg-blue-50/50 hover:bg-blue-100">Back</Button>
          <Button size="sm" className="h-8 px-6 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white">Save</Button>
          <Button variant="outline" size="sm" className="h-8 px-6 text-sm font-medium text-blue-600 border-blue-100 bg-blue-50/50 hover:bg-blue-100">Delete</Button>
          <Button size="sm" className="h-8 px-6 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white">Copy</Button>
        </div>

        {/* Payments Table */}
        <div className="bg-white p-6 rounded shadow-sm border border-gray-200">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Payments</h2>
          <table className="w-full text-xs text-left">
            <thead className="bg-[#f0f4f8] text-gray-700 border-b border-gray-200">
              <tr>
                <th className="px-3 py-2 font-medium">Created</th>
                <th className="px-3 py-2 font-medium w-48">Sum</th>
                <th className="px-3 py-2 font-medium">Notes</th>
                <th className="px-3 py-2 font-medium w-8 text-center">+</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr className="hover:bg-gray-50">
                <td className="px-3 py-3">08/07/2025</td>
                <td className="px-3 py-3">$ 1,321.76</td>
                <td className="px-3 py-3 uppercase">PAID BY CREDIT CARD</td>
                <td className="px-3 py-3 text-right">
                  <button className="text-gray-400 hover:text-gray-700">✎</button>
                </td>
              </tr>
              <tr className="bg-gray-50 border-t border-gray-200">
                <td className="px-3 py-3 font-bold text-gray-900">Total:</td>
                <td className="px-3 py-3 font-bold text-gray-900">$ 1,321.76</td>
                <td colSpan={2}></td>
              </tr>
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
