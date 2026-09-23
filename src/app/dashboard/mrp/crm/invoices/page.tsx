"use client";

import { MrpTabBar } from "@/components/mrp/MrpTabBar";
import { RouteGuard } from "@/components/auth/RouteGuard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, FileText, Pencil, Plus, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { mrpApi } from "@/services/mrpApi";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "/api";

const crmTabs = [
  { name: "Customer orders", href: "/dashboard/mrp/crm" },
  { name: "Customers", href: "/dashboard/mrp/crm/customers" },
  { name: "Today's contacts", href: "/dashboard/mrp/crm/today-contacts" },
  { name: "Invoices", href: "/dashboard/mrp/crm/invoices" },
  { name: "Cash flow forecast", href: "/dashboard/mrp/crm/cash-flow" },
  { name: "Statistics", href: "/dashboard/mrp/crm/statistics" },
];

function formatDate(d: string | null | undefined) {
  if (!d) return "";
  const date = new Date(d);
  if (isNaN(date.getTime())) return String(d);
  return date.toLocaleDateString("en-AU", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function fmtMoney(n: any) {
  return Number(n || 0).toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function InvoicesPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const { data: response, isLoading } = useQuery({
    queryKey: ["mrpInvoices", page],
    queryFn: () => mrpApi.getInvoices(page, 50),
    placeholderData: keepPreviousData,
  });

  const invoices: any[] = response?.data || [];
  const pagination = response?.pagination || {};
  const currencySummary = response?.currency_summary || {};

  const filtered = search
    ? invoices.filter(inv =>
        (inv.invoice_number || "").toLowerCase().includes(search.toLowerCase()) ||
        (inv.customer_name || "").toLowerCase().includes(search.toLowerCase()) ||
        (inv.customer_number || "").toLowerCase().includes(search.toLowerCase()) ||
        (inv.status || "").toLowerCase().includes(search.toLowerCase())
      )
    : invoices;

  const handleExportCSV = () => {
    window.open(`${API_BASE}/mrp/crm/invoices/export/csv`, "_blank");
  };

  const handleExportPDF = () => {
    window.open(`${API_BASE}/mrp/crm/invoices/export/pdf`, "_blank");
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
                  <Button size="sm" className="h-7 px-4 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1 rounded-sm">
                    <Plus className="w-3.5 h-3.5" />
                    Create
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <Button
                  variant="outline" size="sm"
                  className="h-7 px-3 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 border-gray-200 flex items-center gap-1 rounded-sm"
                  onClick={handleExportPDF}
                >
                  <Download className="w-3.5 h-3.5" /> PDF
                </Button>
                <Button
                  variant="outline" size="sm"
                  className="h-7 px-3 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 border-gray-200 flex items-center gap-1 rounded-sm"
                  onClick={handleExportCSV}
                >
                  <Download className="w-3.5 h-3.5" /> CSV
                </Button>
              </div>
            </div>

            {/* Summary badges */}
            {Object.entries(currencySummary).length > 0 && (
              <div className="flex flex-wrap gap-3 mb-4">
                {Object.entries(currencySummary).map(([curr, s]: [string, any]) => (
                  <div key={curr} className="bg-blue-50 border border-blue-100 rounded-md px-3 py-1.5 text-xs">
                    <span className="font-semibold text-blue-700">{curr}</span>
                    <span className="text-gray-600 ml-2">Total: {curr === "AUD" ? "$" : curr + " "}{fmtMoney(s.total_including_tax)}</span>
                    <span className="text-green-600 ml-2">Paid: {fmtMoney(s.paid)}</span>
                    <span className="text-red-500 ml-2">Unpaid: {fmtMoney(s.unpaid)}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Search */}
            <div className="mb-3 flex gap-2">
              <Input
                placeholder="Search by invoice no., customer, or status..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="h-8 text-xs max-w-sm"
              />
              {search && (
                <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setSearch("")}>Clear</Button>
              )}
            </div>

            {/* Table */}
            {isLoading ? (
              <div className="flex items-center justify-center py-12 text-gray-500">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Loading invoices...
              </div>
            ) : (
              <div className="overflow-x-auto border border-gray-200 rounded-sm shadow-sm">
                <table className="w-full text-[11px] text-left whitespace-nowrap">
                  <thead className="bg-[#f0f4f8] text-gray-700 border-y border-gray-200">
                    <tr>
                      <th className="px-2 py-2 font-medium w-8 text-center">#</th>
                      <th className="px-2 py-2 font-medium">Invoice No.</th>
                      <th className="px-2 py-2 font-medium">Customer No.</th>
                      <th className="px-2 py-2 font-medium">Customer Name</th>
                      <th className="px-2 py-2 font-medium">Type</th>
                      <th className="px-2 py-2 font-medium">Status</th>
                      <th className="px-2 py-2 font-medium text-right">Total</th>
                      <th className="px-2 py-2 font-medium text-right">Tax</th>
                      <th className="px-2 py-2 font-medium text-right">Total incl. Tax</th>
                      <th className="px-2 py-2 font-medium text-right">Paid</th>
                      <th className="px-2 py-2 font-medium text-right">Unpaid</th>
                      <th className="px-2 py-2 font-medium">Currency</th>
                      <th className="px-2 py-2 font-medium">Created</th>
                      <th className="px-2 py-2 font-medium">Due Date</th>
                      <th className="px-2 py-2 font-medium">Xero</th>
                      <th className="px-2 py-2 font-medium w-10 text-center">
                        <FileText className="w-3.5 h-3.5 mx-auto text-gray-400" />
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {filtered.length === 0 ? (
                      <tr><td colSpan={16} className="px-4 py-8 text-center text-gray-400">No invoices found</td></tr>
                    ) : (
                      filtered.map((inv: any, i: number) => (
                        <tr key={inv.id} className="hover:bg-gray-50 border-b border-gray-100 cursor-pointer" onClick={() => router.push(`/dashboard/mrp/crm/invoices/${inv.invoice_number}`)}>
                          <td className="px-2 py-2 text-center text-gray-400">{(page - 1) * 50 + i + 1}</td>
                          <td className="px-2 py-2">
                            <span className="text-blue-600 hover:underline font-medium">{inv.invoice_number}</span>
                          </td>
                          <td className="px-2 py-2 text-gray-600">{inv.customer_number}</td>
                          <td className="px-2 py-2 text-gray-700 font-medium max-w-[180px] truncate">{inv.customer_name}</td>
                          <td className="px-2 py-2 text-gray-600">{inv.type}</td>
                          <td className="px-2 py-2">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                              inv.status === "Paid" ? "bg-green-100 text-green-700" :
                              inv.status === "Partially paid" ? "bg-yellow-100 text-yellow-700" :
                              inv.status === "Voided" ? "bg-gray-100 text-gray-500" :
                              "bg-red-100 text-red-600"
                            }`}>{inv.status || "Unpaid"}</span>
                          </td>
                          <td className="px-2 py-2 text-right">{fmtMoney(inv.total)}</td>
                          <td className="px-2 py-2 text-right">{fmtMoney(inv.tax)}</td>
                          <td className="px-2 py-2 text-right font-medium">{fmtMoney(inv.total_including_tax)}</td>
                          <td className="px-2 py-2 text-right text-green-700">{fmtMoney(inv.paid)}</td>
                          <td className="px-2 py-2 text-right text-red-600">{fmtMoney(inv.unpaid)}</td>
                          <td className="px-2 py-2 text-gray-500">{inv.currency || "AUD"}</td>
                          <td className="px-2 py-2 text-gray-500">{formatDate(inv.created_date)}</td>
                          <td className="px-2 py-2 text-gray-500">{formatDate(inv.due_date)}</td>
                          <td className="px-2 py-2">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${inv.xero === "Yes" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"}`}>
                              {inv.xero === "Yes" ? "Synced" : "No"}
                            </span>
                          </td>
                          <td className="px-2 py-2 text-center" onClick={e => { e.stopPropagation(); router.push(`/dashboard/mrp/crm/invoices/${inv.invoice_number}`); }}>
                            <button className="p-1 hover:bg-gray-200 rounded text-blue-600 bg-white border border-gray-200 shadow-sm transition-colors">
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-4">
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="h-7 text-xs">← Prev</Button>
                <span className="text-xs text-gray-500">Page {page} of {pagination.totalPages}</span>
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))} disabled={page >= pagination.totalPages} className="h-7 text-xs">Next →</Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </RouteGuard>
  );
}
