"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { mrpApi } from "@/services/mrpApi";
import { Search, Download } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function VendorReports({ vendorNumber }: { vendorNumber: string }) {
  const router = useRouter();
  const [reportType, setReportType] = useState("Purchases");
  const [period, setPeriod] = useState("Period");
  const [startDate, setStartDate] = useState("01/01/2026");
  const [endDate, setEndDate] = useState("05/08/2026");

  // Format date as DD/MM/YYYY
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-GB", {
      day: "2-digit", month: "2-digit", year: "numeric"
    });
  };

  React.useEffect(() => {
    if (period === "Period") return;

    const now = new Date();
    let start = new Date(now);
    let end = new Date(now);

    switch (period) {
      case "Today":
        // start and end are already now
        break;
      case "Yesterday":
        start.setDate(start.getDate() - 1);
        end.setDate(end.getDate() - 1);
        break;
      case "Tomorrow":
        start.setDate(start.getDate() + 1);
        end.setDate(end.getDate() + 1);
        break;
      case "This week":
        start.setDate(start.getDate() - start.getDay() + (start.getDay() === 0 ? -6 : 1)); // Monday
        end.setDate(start.getDate() + 6); // Sunday
        break;
      case "Last week":
        start.setDate(start.getDate() - start.getDay() - 6);
        end.setDate(start.getDate() + 6);
        break;
      case "Next week":
        start.setDate(start.getDate() - start.getDay() + 8);
        end.setDate(start.getDate() + 6);
        break;
      case "This month":
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case "Last month":
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case "Next month":
        start = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        end = new Date(now.getFullYear(), now.getMonth() + 2, 0);
        break;
      case "This quarter":
        const currentQuarter = Math.floor(now.getMonth() / 3);
        start = new Date(now.getFullYear(), currentQuarter * 3, 1);
        end = new Date(now.getFullYear(), start.getMonth() + 3, 0);
        break;
      case "Last quarter":
        const lastQuarter = Math.floor(now.getMonth() / 3) - 1;
        start = new Date(now.getFullYear(), lastQuarter * 3, 1);
        end = new Date(now.getFullYear(), start.getMonth() + 3, 0);
        break;
      case "Next quarter":
        const nextQuarter = Math.floor(now.getMonth() / 3) + 1;
        start = new Date(now.getFullYear(), nextQuarter * 3, 1);
        end = new Date(now.getFullYear(), start.getMonth() + 3, 0);
        break;
      case "This year":
        start = new Date(now.getFullYear(), 0, 1);
        end = new Date(now.getFullYear(), 11, 31);
        break;
      case "Last year":
        start = new Date(now.getFullYear() - 1, 0, 1);
        end = new Date(now.getFullYear() - 1, 11, 31);
        break;
      case "Last 12 months":
        start = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        break;
    }

    setStartDate(formatDate(start));
    setEndDate(formatDate(end));
  }, [period]);

  // Fetch items for this vendor
  const { data, isLoading } = useQuery({
    queryKey: ["vendorReport", vendorNumber, startDate, endDate],
    queryFn: () => mrpApi.getPurchaseOrderItems(1, 1000, { 
      vendor_number: vendorNumber,
      // Assume the backend can handle min_order_date etc. We'll pass it simply for now.
    }),
    enabled: !!vendorNumber,
  });

  const items = data?.data || [];
  const totalAmount = items.reduce((sum: number, item: any) => sum + (Number(item.total) || 0), 0);

  const handleExportCSV = () => {
    if (!items.length) return;
    const headers = ["Group number", "Group name", "Part No.", "Part description", "Quantity", "Price"];
    const csvContent = [
      headers.join(","),
      ...items.map((item: any) => 
        [
          `"${item.group_number || ""}"`,
          `"${item.group_name || ""}"`,
          `"${item.part_no || ""}"`,
          `"${item.part_description || ""}"`,
          item.quantity || 0,
          item.total || 0
        ].join(",")
      ),
      `"Total","","","",,"${totalAmount.toFixed(2)}"`
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `vendor_${vendorNumber}_purchases.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    if (!items.length) return;
    const doc = new jsPDF();
    doc.text(`Purchases for Vendor ${vendorNumber}`, 14, 15);
    
    const tableColumn = ["Group number", "Group name", "Part No.", "Part description", "Quantity", "Price"];
    const tableRows = items.map((item: any) => [
      item.group_number || "-",
      item.group_name || "-",
      item.part_no || "-",
      item.part_description || "-",
      parseFloat(item.quantity || 0).toFixed(2),
      `${item.currency || "$"} ${parseFloat(item.total || 0).toFixed(2)}`
    ]);

    // Add total row
    tableRows.push([
      "Total:",
      "",
      "",
      "",
      "",
      `$ ${totalAmount.toFixed(2)}`
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
    });

    doc.save(`vendor_${vendorNumber}_purchases.pdf`);
  };

  return (
    <div className="flex-1 bg-white flex flex-col min-h-0 text-[13px] text-gray-700 font-sans">
      <div className="px-8 py-6 w-full max-w-[1400px]">
        <h1 className="text-[22px] text-[#1e293b] font-normal mb-6">
          Vendor {vendorNumber} - reports
        </h1>

        {/* Filters */}
        <div className="flex items-center gap-2 mb-6 bg-[#f8fafc] p-3 rounded-sm border border-[#e5e7eb] w-fit">
          <div className="flex items-center gap-2">
            <label className="text-gray-500 whitespace-nowrap text-xs">Report</label>
            <select 
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="bg-white border border-[#e5e7eb] rounded-sm h-7 px-2 outline-none text-xs w-32"
            >
              <option value="Purchases">Purchases</option>
              <option value="Purchase terms">Purchase terms</option>
            </select>
          </div>

          <div className="flex items-center gap-2 ml-4">
            <select 
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="bg-white border border-[#e5e7eb] rounded-sm h-7 px-2 outline-none text-xs w-28"
            >
              <option value="Period">Period</option>
              <option value="Today">Today</option>
              <option value="Yesterday">Yesterday</option>
              <option value="Tomorrow">Tomorrow</option>
              <option value="This week">This week</option>
              <option value="Last week">Last week</option>
              <option value="Next week">Next week</option>
              <option value="This month">This month</option>
              <option value="Last month">Last month</option>
              <option value="Next month">Next month</option>
              <option value="This quarter">This quarter</option>
              <option value="Last quarter">Last quarter</option>
              <option value="Next quarter">Next quarter</option>
              <option value="This year">This year</option>
              <option value="Last year">Last year</option>
              <option value="Last 12 months">Last 12 months</option>
            </select>
            <input 
              type="text" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-white border border-[#e5e7eb] rounded-sm h-7 px-2 outline-none text-xs w-28 text-center" 
            />
            <span className="text-gray-400">-</span>
            <input 
              type="text" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-white border border-[#e5e7eb] rounded-sm h-7 px-2 outline-none text-xs w-28 text-center" 
            />
          </div>

          <button className="bg-[#1e5aa0] hover:bg-[#164785] text-white h-7 w-7 rounded-sm flex items-center justify-center ml-2 cursor-pointer border-none">
            <Search size={14} />
          </button>
        </div>

        {/* Table Header and Actions */}
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-[16px] text-[#1e293b] font-medium">Purchases</h2>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleExportPDF}
              className="flex items-center gap-1.5 px-3 py-1 bg-[#eef2f9] text-[#1e5aa0] hover:bg-[#e4ebf7] rounded-sm border border-[#d5dce6] text-xs font-medium cursor-pointer"
            >
              <Download size={13} /> PDF
            </button>
            <button 
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1 bg-[#eef2f9] text-[#1e5aa0] hover:bg-[#e4ebf7] rounded-sm border border-[#d5dce6] text-xs font-medium cursor-pointer"
            >
              <Download size={13} /> CSV
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="border border-[#e5e7eb] rounded-sm overflow-hidden bg-white">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead className="bg-[#f0f3f8] text-[#4b5563] border-b border-[#e5e7eb]">
              <tr>
                <th className="py-2.5 px-4 font-normal text-xs text-[#1e5aa0] cursor-pointer hover:underline w-[15%]">Group number ↑</th>
                <th className="py-2.5 px-4 font-normal text-xs w-[20%]">Group name</th>
                <th className="py-2.5 px-4 font-normal text-xs w-[15%]">Part No.</th>
                <th className="py-2.5 px-4 font-normal text-xs w-[30%]">Part description</th>
                <th className="py-2.5 px-4 font-normal text-xs w-[10%] text-right">Quantity</th>
                <th className="py-2.5 px-4 font-normal text-xs w-[10%] text-right">Price</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-400">Loading...</td>
                </tr>
              ) : items.length > 0 ? (
                items.map((item: any) => (
                  <tr key={item.id} className="border-b border-[#e5e7eb] hover:bg-[#f8fafc]">
                    <td className="py-2.5 px-4 text-[#1e5aa0] hover:underline cursor-pointer">{item.group_number || "-"}</td>
                    <td className="py-2.5 px-4">{item.group_name || "-"}</td>
                    <td 
                      className="py-2.5 px-4 text-[#1e5aa0] hover:underline cursor-pointer"
                      onClick={() => item.item_id ? router.push(`/dashboard/mrp/inventory/${item.item_id}`) : null}
                    >
                      {item.part_no || "-"}
                    </td>
                    <td className="py-2.5 px-4">{item.part_description || "-"}</td>
                    <td className="py-2.5 px-4 text-right">{parseFloat(item.quantity || 0).toFixed(2)}</td>
                    <td className="py-2.5 px-4 text-right">
                      {item.currency || "$"} {parseFloat(item.total || 0).toFixed(2)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-400">No purchases found for this period.</td>
                </tr>
              )}
            </tbody>
            {/* Footer Total */}
            <tfoot>
              <tr className="bg-[#f8fafc] font-medium border-t border-[#e5e7eb]">
                <td colSpan={5} className="py-2.5 px-4 text-[#1e293b]">Total:</td>
                <td className="py-2.5 px-4 text-right text-[#1e293b]">$ {totalAmount.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

      </div>
    </div>
  );
}
