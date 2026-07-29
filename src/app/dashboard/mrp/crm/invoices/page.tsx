"use client";

import { MrpTabBar } from "@/components/mrp/MrpTabBar";
import { RouteGuard } from "@/components/auth/RouteGuard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, FileText, Pencil, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const crmTabs = [
  { name: "Customer orders", href: "/dashboard/mrp/crm" },
  { name: "Customers", href: "/dashboard/mrp/crm/customers" },
  { name: "Today's contacts", href: "/dashboard/mrp/crm/today-contacts" },
  { name: "Invoices", href: "/dashboard/mrp/crm/invoices" },
  { name: "Cash flow forecast", href: "/dashboard/mrp/crm/cash-flow" },
  { name: "Statistics", href: "/dashboard/mrp/crm/statistics" },
];

export default function InvoicesPage() {
  const router = useRouter();

  const allMockData = [
    { num: "1", inv: "I00005", part: "A0000144", desc: "STAINLESS TRIM, MIRROR FINISH", qty: "6 pcs", custNum: "CU00320-def1751329056", custName: "SHINE STAINLESS MARINE", date: "01/07/2025" },
    { num: "2", inv: "I00005", part: "A0000147", desc: "DOOR WITH 32 OD HOLE", qty: "2 pcs", custNum: "CU00320-def1751329056", custName: "SHINE STAINLESS MARINE", date: "01/07/2025" },
    { num: "3", inv: "I00005", part: "A0000146", desc: "DOOR WITH 40 OD HOLE", qty: "2 pcs", custNum: "CU00320-def1751329056", custName: "SHINE STAINLESS MARINE", date: "01/07/2025" },
    { num: "4", inv: "I00010", part: "", desc: "", qty: "12", custNum: "CU00793-def1751577646", custName: "ALL TRADES TRAILERS", date: "01/07/2025", strike: true },
    { num: "5", inv: "I00010", part: "", desc: "", qty: "1", custNum: "CU00793-def1751577646", custName: "ALL TRADES TRAILERS", date: "01/07/2025", strike: true },
    { num: "6", inv: "I00011", part: "A0000537", desc: "12G BLACK PLASTIC ADAPTORS", qty: "100", custNum: "CU04713", custName: "NOY INDUSTRIES", date: "04/08/2025" },
    { num: "7", inv: "I00012", part: "P0000301", desc: "ALUMINIUM EXTRUSION 5M", qty: "45 pcs", custNum: "CU01140", custName: "APEX MANUFACTURING", date: "06/08/2025" },
    { num: "8", inv: "I00012", part: "P0000302", desc: "ALUMINIUM END CAPS", qty: "90 pcs", custNum: "CU01140", custName: "APEX MANUFACTURING", date: "06/08/2025" },
    { num: "9", inv: "I00013", part: "W0000992", desc: "WELDING WIRE 0.8MM 5KG", qty: "10 rolls", custNum: "CU01288", custName: "RIVERFRONT FABRICATION", date: "07/08/2025" },
    { num: "10", inv: "I00014", part: "B0000455", desc: "M8x25 STAINLESS BOLTS", qty: "500", custNum: "CU00911", custName: "PRECISION STEELWORKS", date: "08/08/2025" },
    { num: "11", inv: "I00014", part: "B0000456", desc: "M8 STAINLESS NUTS", qty: "500", custNum: "CU00911", custName: "PRECISION STEELWORKS", date: "08/08/2025" },
    { num: "12", inv: "I00014", part: "B0000457", desc: "M8 WASHERS", qty: "1000", custNum: "CU00911", custName: "PRECISION STEELWORKS", date: "08/08/2025" },
    { num: "13", inv: "I00015", part: "C0000210", desc: "CUSTOM FABRICATED BRACKET", qty: "25", custNum: "CU00842", custName: "BUILDMAX PTY LTD", date: "09/08/2025" },
    { num: "14", inv: "I00016", part: "T0000881", desc: "TITANIUM TUBING 25MM", qty: "12 m", custNum: "CU01399", custName: "ECLIPSE METALS", date: "10/08/2025" }
  ];

  const [visibleCount, setVisibleCount] = useState(6);

  const handleLoadMore = () => {
    setVisibleCount(prev => Math.min(prev + 6, allMockData.length));
  };

  return (
    <RouteGuard module="crm" fallback={<div>Access Denied</div>}>
      <div className="flex flex-col bg-[#f4f7fb] min-h-[calc(100vh-4rem)] p-4 -m-4 sm:-m-6 lg:-m-8">
        <div className="bg-white rounded-md shadow-sm flex flex-col min-h-[80vh]">
          <MrpTabBar tabs={crmTabs} />
          
          <div className="p-4 sm:p-6 lg:p-8 flex-1">
            {/* Header and Toolbar */}
            <div className="flex justify-between items-end border-b border-gray-200 pb-2 mb-4">
              <div>
                <div className="flex items-center gap-4 mb-4">
                  <h1 className="text-2xl font-bold text-slate-900">Invoices</h1>
                  <Button size="sm" onClick={() => router.push('/dashboard/mrp/crm/invoices/new')} className="h-7 px-4 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1 rounded-sm">
                    <Plus className="w-3.5 h-3.5" />
                    Create
                  </Button>
                </div>
                <div className="flex gap-6">
                  <span className="text-sm font-medium text-gray-500 cursor-pointer">Invoices</span>
                  <span className="text-sm font-medium text-blue-600 border-b-2 border-blue-600 pb-2 -mb-[9px] cursor-pointer">Items</span>
                </div>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <Button variant="outline" size="sm" className="h-7 px-3 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 border-gray-200 flex items-center gap-1 rounded-sm">
                  <Download className="w-3.5 h-3.5" />
                  PDF
                </Button>
                <Button variant="outline" size="sm" className="h-7 px-3 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 border-gray-200 flex items-center gap-1 rounded-sm">
                  <Download className="w-3.5 h-3.5" />
                  CSV
                </Button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-[11px] text-left whitespace-nowrap">
                <thead className="bg-[#f0f4f8] text-gray-700 border-y border-gray-200">
                  <tr>
                    <th className="px-2 py-2 font-medium w-8 text-center">+</th>
                    <th className="px-2 py-2 font-medium">Number</th>
                    <th className="px-2 py-2 font-medium">Part No.</th>
                    <th className="px-2 py-2 font-medium">Part description</th>
                    <th className="px-2 py-2 font-medium w-24">Quantity</th>
                    <th className="px-2 py-2 font-medium">Customer number</th>
                    <th className="px-2 py-2 font-medium">Customer name</th>
                    <th className="px-2 py-2 font-medium">Type</th>
                    <th className="px-2 py-2 font-medium w-24">Created</th>
                    <th className="px-2 py-2 font-medium w-8 text-center"><FileText className="w-3.5 h-3.5 mx-auto text-gray-400" /></th>
                    <th className="px-2 py-2 font-medium w-8 text-center">+</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {/* Filter Row */}
                  <tr className="bg-[#f9fafb]">
                    <td className="px-2 py-2 text-center align-top pt-3">
                      <FileText className="w-3.5 h-3.5 mx-auto text-gray-400" />
                    </td>
                    <td className="px-2 py-2 align-top"><Input className="h-7 text-[10px] bg-gray-50" /></td>
                    <td className="px-2 py-2 align-top"><Input className="h-7 text-[10px] bg-gray-50" /></td>
                    <td className="px-2 py-2 align-top"><Input className="h-7 text-[10px] bg-gray-50" /></td>
                    <td className="px-2 py-2 align-top">
                      <div className="space-y-1">
                        <Input type="text" placeholder="min" className="h-7 text-[10px] bg-gray-50" />
                        <Input type="text" placeholder="max" className="h-7 text-[10px] bg-gray-50" />
                      </div>
                    </td>
                    <td className="px-2 py-2 align-top"><Input className="h-7 text-[10px] bg-gray-50" /></td>
                    <td className="px-2 py-2 align-top"><Input className="h-7 text-[10px] bg-gray-50" /></td>
                    <td className="px-2 py-2 align-top">
                      <Select>
                        <SelectTrigger className="h-7 text-[10px] bg-gray-50"><SelectValue /></SelectTrigger>
                        <SelectContent></SelectContent>
                      </Select>
                    </td>
                    <td className="px-2 py-2 align-top">
                      <div className="space-y-1">
                        <Input type="text" placeholder="min" className="h-7 text-[10px] bg-gray-50" />
                        <Input type="text" placeholder="max" className="h-7 text-[10px] bg-gray-50" />
                      </div>
                    </td>
                    <td className="px-2 py-2 align-top text-center">
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-[11px] font-medium text-blue-600 hover:text-blue-800 hover:bg-transparent">Search</Button>
                    </td>
                    <td className="px-2 py-2 align-top text-center">
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-[11px] font-medium text-blue-600 hover:text-blue-800 hover:bg-transparent">Clear</Button>
                    </td>
                  </tr>

                  {/* Total Row */}
                  <tr className="bg-white border-b border-gray-200">
                    <td colSpan={4} className="px-4 py-3 font-bold text-gray-900 text-right">Total:</td>
                    <td className="px-2 py-3 font-bold text-gray-900">33,165.18</td>
                    <td colSpan={6}></td>
                  </tr>

                  {/* Data Rows */}
                  {allMockData.slice(0, visibleCount).map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50 border-b border-gray-100">
                      <td className="px-2 py-2 text-center text-gray-500">{row.num}</td>
                      <td className="px-2 py-2">
                        <span onClick={() => router.push(`/dashboard/mrp/crm/invoices/${row.inv}`)} className="text-blue-600 cursor-pointer hover:underline">{row.inv}</span>
                      </td>
                      <td className="px-2 py-2 text-gray-700">{row.part}</td>
                      <td className="px-2 py-2 text-gray-700">{row.desc}</td>
                      <td className="px-2 py-2 text-gray-700">{row.qty}</td>
                      <td className={`px-2 py-2 text-gray-700 ${row.strike ? 'line-through text-gray-400' : ''}`}>{row.custNum}</td>
                      <td className={`px-2 py-2 text-gray-700 ${row.strike ? 'line-through text-gray-400' : ''}`}>{row.custName}</td>
                      <td className="px-2 py-2 text-gray-700">Invoice</td>
                      <td className="px-2 py-2 text-gray-700">{row.date}</td>
                      <td className="px-2 py-2 text-center"></td>
                      <td className="px-2 py-2 text-center">
                        <button onClick={() => router.push(`/dashboard/mrp/crm/invoices/${row.inv}`)} className="p-1 hover:bg-gray-200 rounded text-blue-600 bg-white border border-gray-200 shadow-sm transition-colors">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  
                </tbody>
              </table>
              {visibleCount < allMockData.length && (
                <div className="text-center py-4">
                  <Button variant="link" onClick={handleLoadMore} className="text-blue-600 text-[11px]">Load more</Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </RouteGuard>
  );
}
