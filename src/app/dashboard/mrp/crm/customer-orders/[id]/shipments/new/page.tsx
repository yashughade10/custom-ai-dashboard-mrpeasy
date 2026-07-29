"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Cloud, HardDrive, Link as LinkIcon, Share2, Trash2, Link2 } from "lucide-react";

export default function CreateShipmentPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col h-full bg-[#f4f7fb] min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl w-full mx-auto">
        {/* Header */}
        <h1 className="text-2xl font-bold text-slate-900 mb-6">Create a new shipment</h1>

        {/* Top Toolbar */}
        <div className="flex gap-2 mb-8">
          <Button variant="outline" size="sm" onClick={() => router.back()} className="h-8 px-6 text-sm font-medium text-blue-600 border-blue-100 bg-blue-50/50 hover:bg-blue-100">Cancel</Button>
          <Button size="sm" className="h-8 px-6 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white">Save</Button>
        </div>

        {/* Form Grid */}
        <div className="grid grid-cols-2 gap-x-12 gap-y-4 mb-8">
          {/* Left Column */}
          <div className="space-y-4">
            <div className="grid grid-cols-[140px_1fr] items-center gap-4">
              <label className="text-xs text-right text-gray-700 font-medium">Delivery date</label>
              <Input type="date" defaultValue="2025-12-19" className="h-8 text-xs bg-gray-100/50 border-gray-200" />
            </div>

            <div className="grid grid-cols-[140px_1fr] items-center gap-4">
              <label className="text-xs text-right text-gray-700 font-medium">Status *</label>
              <Select defaultValue="New">
                <SelectTrigger className="h-8 text-xs bg-gray-100/50 border-gray-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="New">New</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-[140px_1fr] items-start gap-4">
              <label className="text-xs text-right text-gray-700 font-medium pt-2">Customer order *</label>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Select defaultValue="CO00065">
                    <SelectTrigger className="h-8 text-xs bg-gray-100/50 border-gray-200 flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CO00065">CO00065; CU00304 RMD AUSTRALIA (Quotati...</SelectItem>
                    </SelectContent>
                  </Select>
                  <Link2 className="w-4 h-4 text-gray-400 cursor-pointer hover:text-gray-600" />
                  <Trash2 className="w-4 h-4 text-gray-400 cursor-pointer hover:text-red-500" />
                </div>
                <Select>
                  <SelectTrigger className="h-8 text-xs bg-gray-100/50 border-gray-200 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent></SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-[140px_1fr] items-center gap-4">
              <label className="text-xs text-right text-gray-700 font-medium">Files</label>
              <div className="flex gap-2">
                <div className="w-7 h-7 bg-blue-50 text-blue-600 rounded flex items-center justify-center cursor-pointer hover:bg-blue-100 transition-colors">
                  <HardDrive className="w-3.5 h-3.5" />
                </div>
                <div className="w-7 h-7 bg-blue-50 text-blue-600 rounded flex items-center justify-center cursor-pointer hover:bg-blue-100 transition-colors">
                  <Share2 className="w-3.5 h-3.5" />
                </div>
                <div className="w-7 h-7 bg-blue-50 text-blue-600 rounded flex items-center justify-center cursor-pointer hover:bg-blue-100 transition-colors">
                  <Cloud className="w-3.5 h-3.5" />
                </div>
                <div className="w-7 h-7 bg-blue-50 text-blue-600 rounded flex items-center justify-center cursor-pointer hover:bg-blue-100 transition-colors">
                  <LinkIcon className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-[140px_1fr] items-start gap-4">
              <label className="text-xs text-right text-gray-700 font-medium pt-2">Delivery Notes</label>
              <Textarea className="h-12 bg-gray-100/50 border-gray-200 text-xs resize-none" />
            </div>
            
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            <div className="grid grid-cols-[140px_1fr] items-center gap-4">
              <label className="text-xs text-right text-gray-700 font-medium">Shipping address</label>
              <Select defaultValue="address1">
                <SelectTrigger className="h-8 text-xs bg-gray-200 border-gray-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="address1">163 Crockford St, NORTHGATE QLD 4013, Australia</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-[140px_1fr] items-start gap-4">
              <label className="text-xs text-right text-gray-700 font-medium pt-2">Waybill notes</label>
              <Textarea className="h-12 bg-gray-100/50 border-gray-200 text-xs resize-none" />
            </div>

            <div className="grid grid-cols-[140px_1fr] items-start gap-4">
              <label className="text-xs text-right text-gray-700 font-medium pt-2">Picking list notes</label>
              <Textarea className="h-12 bg-gray-100/50 border-gray-200 text-xs resize-none" />
            </div>

            <div className="grid grid-cols-[140px_1fr] items-center gap-4">
              <label className="text-xs text-right text-gray-700 font-medium">Tracking number</label>
              <Input className="h-8 bg-gray-100/50 border-gray-200 text-xs" />
            </div>
          </div>
        </div>

        {/* Booked Goods Table */}
        <div className="grid grid-cols-[140px_1fr] items-start gap-4 mb-8">
          <label className="text-xs text-right text-gray-700 font-medium pt-2">Booked goods</label>
          <div className="w-full">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-[#f0f4f8] text-gray-700 border-b border-gray-200">
                <tr>
                  <th className="px-2 py-2 font-medium">Stock item</th>
                  <th className="px-2 py-2 font-medium">Booked quantity</th>
                  <th className="px-2 py-2 font-medium">Lot</th>
                  <th className="px-2 py-2 font-medium">Status</th>
                  <th className="px-2 py-2 font-medium">Storage location</th>
                  <th className="px-2 py-2 font-medium">Quantity to pick</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={6} className="px-2 py-4 text-red-500">
                    Please book items for the customer order
                  </td>
                </tr>
                <tr className="border-t border-gray-200">
                  <td colSpan={5} className="px-2 py-2 font-bold text-right">Total:</td>
                  <td className="px-2 py-2"></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom Toolbar */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => router.back()} className="h-8 px-6 text-sm font-medium text-blue-600 border-blue-100 bg-blue-50/50 hover:bg-blue-100">Cancel</Button>
          <Button size="sm" className="h-8 px-6 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white">Save</Button>
        </div>
      </div>
    </div>
  );
}
