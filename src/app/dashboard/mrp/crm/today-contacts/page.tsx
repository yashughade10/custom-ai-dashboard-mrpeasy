"use client";

import { useState } from "react";
import { MrpTabBar } from "@/components/mrp/MrpTabBar";
import { RouteGuard } from "@/components/auth/RouteGuard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, FileText, Trash2, Pencil, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

const crmTabs = [
  { name: "Customer orders", href: "/dashboard/mrp/crm" },
  { name: "Customers", href: "/dashboard/mrp/crm/customers" },
  { name: "Today's contacts", href: "/dashboard/mrp/crm/today-contacts" },
  { name: "Invoices", href: "/dashboard/mrp/crm/invoices" },
  { name: "Cash flow forecast", href: "/dashboard/mrp/crm/cash-flow" },
  { name: "Statistics", href: "/dashboard/mrp/crm/statistics" },
];

export default function TodayContactsPage() {
  const router = useRouter();

  const today = new Date();
  const formattedToday = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;

  const allMockData = [
    { num: "CU00123", name: "PAUL TURNER", status: "Active", next: formattedToday, phone: "+61 123 456 789", email: "paul.turner@example.com" },
    { num: "CU00320", name: "SHINE STAINLESS MARINE", status: "Active", next: formattedToday, phone: "+61 456 789 012", email: "shine@marine.com" },
    { num: "CU00793", name: "ALL TRADES TRAILERS", status: "Follow Up", next: formattedToday, phone: "+61 987 654 321", email: "contact@alltrades.com" },
    { num: "CU04713", name: "NOY INDUSTRIES", status: "Active", next: formattedToday, phone: "+61 234 567 890", email: "info@noyindustries.com" },
    { num: "CU00842", name: "BUILDMAX PTY LTD", status: "Active", next: formattedToday, phone: "+61 345 678 901", email: "admin@buildmax.com.au" },
    { num: "CU00911", name: "PRECISION STEELWORKS", status: "Active", next: formattedToday, phone: "+61 456 789 123", email: "sales@precisionsteel.com" },
    { num: "CU01005", name: "HARBOUR ENGINEERING", status: "Follow Up", next: formattedToday, phone: "+61 567 890 234", email: "harbour@engineering.net" },
    { num: "CU01140", name: "APEX MANUFACTURING", status: "Active", next: formattedToday, phone: "+61 678 901 345", email: "contact@apex.com" },
    { num: "CU01288", name: "RIVERFRONT FABRICATION", status: "Active", next: formattedToday, phone: "+61 789 012 456", email: "info@riverfront.com.au" },
    { num: "CU01399", name: "ECLIPSE METALS", status: "Active", next: formattedToday, phone: "+61 890 123 567", email: "sales@eclipsemetals.com" }
  ];
  const [visibleCount, setVisibleCount] = useState(3);

  const handleLoadMore = () => {
    setVisibleCount(prev => Math.min(prev + 3, allMockData.length));
  };

  return (
    <RouteGuard module="crm" fallback={<div>Access Denied</div>}>
      <div className="flex flex-col bg-[#f4f7fb] min-h-[calc(100vh-4rem)] p-4 -m-4 sm:-m-6 lg:-m-8">
        <div className="bg-white rounded-md shadow-sm flex flex-col min-h-[80vh]">
          <MrpTabBar tabs={crmTabs} />
          
          <div className="p-4 sm:p-6 lg:p-8 flex-1">
            {/* Header and Toolbar */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-4">
                <h1 className="text-xl font-bold text-slate-900">Today's contacts</h1>
                <Button size="sm" onClick={() => router.push('/dashboard/mrp/crm/customers/1/contacts/new')} className="h-7 px-4 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1 rounded-sm">
                  <Plus className="w-3.5 h-3.5" />
                  Create
                </Button>
              </div>
              <div className="flex items-center gap-2">
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
            <div className="border border-gray-200 rounded-sm overflow-x-auto">
              <table className="w-full text-xs text-left whitespace-nowrap">
                <thead className="bg-[#f0f4f8] text-gray-700 border-b border-gray-200">
                  <tr>
                    <th className="px-3 py-2 font-medium w-8 text-center">+</th>
                    <th className="px-3 py-2 font-medium w-32">Number</th>
                    <th className="px-3 py-2 font-medium">Name</th>
                    <th className="px-3 py-2 font-medium w-48">Status</th>
                    <th className="px-3 py-2 font-medium w-32">Next contact</th>
                    <th className="px-3 py-2 font-medium w-48">Phone</th>
                    <th className="px-3 py-2 font-medium w-48">E-mail</th>
                    <th className="px-3 py-2 font-medium w-10 text-center"><FileText className="w-3.5 h-3.5 mx-auto text-gray-400" /></th>
                    <th className="px-3 py-2 font-medium w-8 text-center">+</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {/* Filter Row */}
                  <tr className="bg-[#f9fafb]">
                    <td className="px-3 py-2 text-center align-top pt-3">
                      <FileText className="w-4 h-4 mx-auto text-gray-400" />
                    </td>
                    <td className="px-2 py-2 align-top">
                      <Input className="h-7 text-[11px] bg-gray-50" />
                    </td>
                    <td className="px-2 py-2 align-top">
                      <Input className="h-7 text-[11px] bg-gray-50" />
                    </td>
                    <td className="px-2 py-2 align-top">
                      <Select>
                        <SelectTrigger className="h-7 text-[11px] bg-gray-50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent></SelectContent>
                      </Select>
                    </td>
                    <td className="px-2 py-2 align-top">
                      <div className="space-y-1">
                        <Input type="text" placeholder="min" className="h-7 text-[11px] bg-gray-50" />
                        <Input type="text" defaultValue="29/07/2026" className="h-7 text-[11px] bg-gray-50" />
                      </div>
                    </td>
                    <td className="px-2 py-2 align-top">
                      <Input className="h-7 text-[11px] bg-gray-50" />
                    </td>
                    <td className="px-2 py-2 align-top">
                      <Input className="h-7 text-[11px] bg-gray-50" />
                    </td>
                    <td className="px-2 py-2 align-top text-center">
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-xs font-medium text-blue-600 hover:text-blue-800 hover:bg-transparent">Search</Button>
                    </td>
                    <td className="px-2 py-2 align-top text-center">
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-xs font-medium text-blue-600 hover:text-blue-800 hover:bg-transparent">Clear</Button>
                    </td>
                  </tr>

                  {/* Mock Data Rows */}
                  {allMockData.slice(0, visibleCount).map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-3 py-3 text-center">
                        <input type="checkbox" className="rounded border-gray-300" />
                      </td>
                      <td className="px-3 py-3 text-blue-600 cursor-pointer hover:underline">{row.num}</td>
                      <td className="px-3 py-3">{row.name}</td>
                      <td className="px-3 py-3">{row.status}</td>
                      <td className="px-3 py-3">{row.next}</td>
                      <td className="px-3 py-3">{row.phone}</td>
                      <td className="px-3 py-3">{row.email}</td>
                      <td className="px-3 py-3 text-center">
                        <FileText className="w-3.5 h-3.5 mx-auto text-gray-400" />
                      </td>
                      <td className="px-3 py-3 text-right">
                        <div className="flex gap-1 justify-end">
                          <button onClick={() => router.push(`/dashboard/mrp/crm/customers/1/contacts/1`)} className="p-1 hover:bg-gray-200 rounded text-blue-600 bg-white border border-gray-200 shadow-sm transition-colors">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button className="p-1 hover:bg-gray-200 rounded text-red-600 bg-white border border-gray-200 shadow-sm transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  
                </tbody>
              </table>
              {visibleCount < allMockData.length && (
                <div className="text-center py-4 bg-white">
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
