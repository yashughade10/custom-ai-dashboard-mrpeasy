"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { mrpApi } from "@/services/mrpApi";
import { MrpTabBar } from "@/components/mrp/MrpTabBar";
import { Button } from "@/components/ui/button";
import { Download, FileText, Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";

const stockTabs = [
  { name: "Items", href: "/dashboard/mrp/inventory" },
  { name: "Stock settings", href: "/dashboard/mrp/inventory/settings" },
  { name: "Stock lots", href: "/dashboard/mrp/inventory/lots" },
  { name: "Shipments", href: "/dashboard/mrp/inventory/shipments" },
  { name: "Inventory", href: "/dashboard/mrp/inventory/snapshot" },
  { name: "Critical on-hand", href: "/dashboard/mrp/inventory/critical" },
  { name: "Write-offs", href: "/dashboard/mrp/inventory/writeoffs" },
  { name: "Stock movement", href: "/dashboard/mrp/inventory/movement" },
  { name: "Statistics", href: "/dashboard/mrp/inventory/statistics" },
];

export default function StockMovementPage() {
  // Default to this year up to today
  const [startDate, setStartDate] = useState(format(new Date(new Date().getFullYear(), 0, 1), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));

  const [appliedStartDate, setAppliedStartDate] = useState(startDate);
  const [appliedEndDate, setAppliedEndDate] = useState(endDate);

  const { data: response, isLoading, isError } = useQuery({
    queryKey: ["mrpStockMovement", appliedStartDate, appliedEndDate],
    queryFn: () => mrpApi.getStockMovement(appliedStartDate, appliedEndDate),
  });

  const handleSearch = () => {
    setAppliedStartDate(startDate);
    setAppliedEndDate(endDate);
  };

  const formatCurrency = (val: number | string | undefined) => {
    const num = Number(val || 0);
    return `$ ${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const report = response?.data;

  return (
    <div className="flex flex-col h-full bg-[#f4f7fb] min-h-[calc(100vh-4rem)] p-4 -m-4 sm:-m-6 lg:-m-8">
      <div className="bg-white rounded-md shadow-sm overflow-hidden flex flex-col min-h-[80vh]">
        <MrpTabBar tabs={stockTabs} />
        
        <div className="flex-1 p-4 flex flex-col">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <h1 className="text-xl font-medium text-gray-800">Stock movement</h1>
            
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="h-8 border-gray-300 text-gray-700">
                  <FileText className="w-4 h-4 mr-2" /> PDF
                </Button>
                <Button variant="outline" size="sm" className="h-8 border-gray-300 text-gray-700">
                  <Download className="w-4 h-4 mr-2" /> CSV
                </Button>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-md p-4 mb-6">
            <div className="flex flex-col md:flex-row items-end gap-4 max-w-2xl">
              <div className="flex-1 w-full">
                <label className="block text-xs font-medium text-gray-700 mb-1">Period Start</label>
                <Input 
                  type="date" 
                  value={startDate} 
                  onChange={(e) => setStartDate(e.target.value)} 
                  className="h-9"
                />
              </div>
              <div className="flex-1 w-full">
                <label className="block text-xs font-medium text-gray-700 mb-1">Period End</label>
                <Input 
                  type="date" 
                  value={endDate} 
                  onChange={(e) => setEndDate(e.target.value)} 
                  className="h-9"
                />
              </div>
              <Button onClick={handleSearch} className="h-9 bg-[#1a73e8] hover:bg-[#1557b0] text-white">
                <Search className="w-4 h-4 mr-2" />
                Search
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex-1 flex justify-center items-center">
              <Loader2 className="w-8 h-8 animate-spin text-[#1a73e8]" />
            </div>
          ) : isError || !report ? (
            <div className="flex-1 flex justify-center items-center text-red-500">
              Failed to load stock movement report.
            </div>
          ) : (
            <div className="flex-1 bg-white border border-gray-200 rounded-md overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-700 font-medium text-xs">
                  <tr>
                    <th className="px-4 py-3 w-1/2">Category</th>
                    <th className="px-4 py-3 w-1/2">In stock value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  
                  {/* Beginning */}
                  <tr className="bg-blue-50/30">
                    <td className="px-4 py-2.5 font-medium text-gray-900">Beginning {format(new Date(appliedStartDate), "dd/MM/yyyy")}</td>
                    <td className="px-4 py-2.5 font-medium text-gray-900">{formatCurrency(report.beginningValue)}</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 pl-8 text-gray-600">WIP (materials)</td>
                    <td className="px-4 py-2.5 text-gray-600">{formatCurrency(report.wipBeginning)}</td>
                  </tr>

                  {/* Inward */}
                  <tr className="bg-gray-50">
                    <td colSpan={2} className="px-4 py-2 font-medium text-gray-900">Inward</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 pl-8 text-gray-600">Purchases</td>
                    <td className="px-4 py-2.5 text-gray-600">{formatCurrency(report.inward.purchases)}</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 pl-8 text-gray-600">Adjustments</td>
                    <td className="px-4 py-2.5 text-gray-600">{formatCurrency(report.inward.adjustments)}</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 pl-8 text-gray-600">Manufactured</td>
                    <td className="px-4 py-2.5 text-gray-600">{formatCurrency(report.inward.manufactured)}</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 pl-12 text-gray-500 text-xs">Cost of materials</td>
                    <td className="px-4 py-2.5 text-gray-500 text-xs">{formatCurrency(report.inward.costOfMaterials)}</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 pl-12 text-gray-500 text-xs">Applied overhead cost</td>
                    <td className="px-4 py-2.5 text-gray-500 text-xs">{formatCurrency(report.inward.appliedOverhead)}</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 pl-12 text-gray-500 text-xs">Labor cost</td>
                    <td className="px-4 py-2.5 text-gray-500 text-xs">{formatCurrency(report.inward.laborCost)}</td>
                  </tr>
                  <tr className="bg-green-50/30">
                    <td className="px-4 py-2.5 pl-8 font-medium text-gray-800">Total in</td>
                    <td className="px-4 py-2.5 font-medium text-green-700">{formatCurrency(report.inward.totalIn)}</td>
                  </tr>

                  {/* Outward */}
                  <tr className="bg-gray-50">
                    <td colSpan={2} className="px-4 py-2 font-medium text-gray-900">Outward</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 pl-8 text-gray-600">Sales</td>
                    <td className="px-4 py-2.5 text-gray-600">{formatCurrency(report.outward.sales)}</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 pl-8 text-gray-600">Write-offs</td>
                    <td className="px-4 py-2.5 text-gray-600">{formatCurrency(report.outward.writeoffs)}</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 pl-8 text-gray-600">Used in manufacturing</td>
                    <td className="px-4 py-2.5 text-gray-600">{formatCurrency(report.outward.usedInManufacturing)}</td>
                  </tr>
                  <tr className="bg-red-50/30">
                    <td className="px-4 py-2.5 pl-8 font-medium text-gray-800">Total out</td>
                    <td className="px-4 py-2.5 font-medium text-red-700">{formatCurrency(report.outward.totalOut)}</td>
                  </tr>

                  {/* Totals */}
                  <tr className="border-t-2 border-gray-200">
                    <td className="px-4 py-3 font-medium text-gray-900">Total movements</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{formatCurrency(report.totalMovements)}</td>
                  </tr>

                  {/* Ending */}
                  <tr className="bg-blue-50/30">
                    <td className="px-4 py-3 font-bold text-gray-900">Ending {format(new Date(appliedEndDate), "dd/MM/yyyy")}</td>
                    <td className="px-4 py-3 font-bold text-gray-900">{formatCurrency(report.endingValue)}</td>
                  </tr>
                  <tr className="border-b-0">
                    <td className="px-4 py-2.5 pl-8 text-gray-600">WIP (materials)</td>
                    <td className="px-4 py-2.5 text-gray-600">{formatCurrency(report.wipEnding)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
