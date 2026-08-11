"use client";

import { useState } from "react";
import { MrpTabBar } from "@/components/mrp/MrpTabBar";
import { RouteGuard } from "@/components/auth/RouteGuard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Search, Calendar as CalendarIcon, ArrowUp } from "lucide-react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { mrpApi } from "@/services/mrpApi";

const crmTabs = [
  { name: "Customer orders", href: "/dashboard/mrp/crm" },
  { name: "Customers", href: "/dashboard/mrp/crm/customers" },
  { name: "Today's contacts", href: "/dashboard/mrp/crm/today-contacts" },
  { name: "Invoices", href: "/dashboard/mrp/crm/invoices" },
  { name: "Cash flow forecast", href: "/dashboard/mrp/crm/cash-flow" },
  { name: "Statistics", href: "/dashboard/mrp/crm/statistics" },
];

export default function StatisticsPage() {
  const [limit, setLimit] = useState(100);

  const { data: response, isLoading } = useQuery({
    queryKey: ["mrpCustomerStatistics", limit],
    queryFn: () => mrpApi.getCustomerStatistics(1, limit),
    placeholderData: keepPreviousData,
  });

  const customers = response?.data || [];

  const handleLoadMore = () => {
    setLimit(l => l + 50);
  };

  // Calculate actual totals from fetched data
  const totals = customers.reduce(
    (acc: any, c: any) => {
      acc.sellingPrice += Number(c.selling_price || 0);
      acc.cost += Number(c.cost || 0);
      acc.profit += Number(c.profit || 0);
      // For average delay and on-time %, we'll sum and then average below
      acc.delaySum += Number(c.average_delay || 0);
      acc.onTimeSum += Number(c.on_time || 0);
      acc.count += 1;
      return acc;
    },
    { sellingPrice: 0, cost: 0, profit: 0, delaySum: 0, onTimeSum: 0, count: 0 }
  );

  const totalProfitPercent = totals.sellingPrice > 0 ? (totals.profit / totals.sellingPrice) * 100 : 0;
  const avgDelay = totals.count > 0 ? totals.delaySum / totals.count : 0;
  const avgOnTime = totals.count > 0 ? totals.onTimeSum / totals.count : 0;

  const formatCurrency = (val: number) => `$ ${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const formatPercent = (val: number) => `${Math.round(val)}%`;
  const formatDelay = (val: number) => `${val.toFixed(1)} d`;

  return (
    <RouteGuard module="crm" fallback={<div>Access Denied</div>}>
      <div className="flex flex-col bg-[#f4f7fb] min-h-[calc(100vh-4rem)] p-4 -m-4 sm:-m-6 lg:-m-8">
        <div className="bg-white rounded-md shadow-sm flex flex-col min-h-[80vh]">
          <MrpTabBar tabs={crmTabs} />
          
          <div className="p-4 sm:p-6 lg:p-8 flex-1 flex flex-col">
            
            {/* Header Toolbar */}
            <div className="flex justify-between items-start mb-6">
              <div className="flex flex-col gap-4">
                <h1 className="text-2xl font-bold text-slate-900">Statistics</h1>
                
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-700 w-12">Report</span>
                    <Select defaultValue="customers">
                      <SelectTrigger className="h-7 w-[180px] text-xs bg-gray-50 border-gray-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="customers">Customers</SelectItem>
                        <SelectItem value="items">Items</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-700 w-12">Period</span>
                    <Select defaultValue="custom">
                      <SelectTrigger className="h-7 w-[100px] text-xs bg-gray-50 border-gray-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="custom">Custom</SelectItem>
                        <SelectItem value="ytd">YTD</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <div className="relative">
                      <CalendarIcon className="absolute left-2.5 top-1.5 w-3.5 h-3.5 text-gray-400" />
                      <Input className="h-7 w-[110px] text-[11px] pl-8 bg-gray-50 border-gray-200" defaultValue="01/01/2026" />
                    </div>
                    <span className="text-gray-400">-</span>
                    <div className="relative">
                      <CalendarIcon className="absolute left-2.5 top-1.5 w-3.5 h-3.5 text-gray-400" />
                      <Input className="h-7 w-[110px] text-[11px] pl-8 bg-gray-50 border-gray-200" defaultValue="29/07/2026" />
                    </div>

                    <Button size="icon" className="h-7 w-7 bg-blue-600 hover:bg-blue-700 text-white rounded-sm ml-1">
                      <Search className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-8">
                <Button variant="outline" size="sm" className="h-7 px-3 text-[11px] font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 border-gray-200 flex items-center gap-1 rounded-sm">
                  <Download className="w-3 h-3" />
                  PDF
                </Button>
                <Button variant="outline" size="sm" className="h-7 px-3 text-[11px] font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 border-gray-200 flex items-center gap-1 rounded-sm">
                  <Download className="w-3 h-3" />
                  CSV
                </Button>
              </div>
            </div>

            <h2 className="text-lg font-bold text-slate-800 mb-3">Customers</h2>

            {/* Table */}
            <div className="border border-gray-200 rounded-sm overflow-x-auto flex-1">
              <table className="w-full text-[11px] text-left whitespace-nowrap">
                <thead className="bg-[#f4f6f9] text-gray-600 border-b border-gray-200">
                  <tr>
                    <th className="px-3 py-2 font-medium flex items-center gap-1 cursor-pointer hover:bg-gray-200">
                      Customer
                      <ArrowUp className="w-3 h-3" />
                    </th>
                    <th className="px-3 py-2 font-medium">Selling price</th>
                    <th className="px-3 py-2 font-medium">Cost</th>
                    <th className="px-3 py-2 font-medium">Profit</th>
                    <th className="px-3 py-2 font-medium">Profit %</th>
                    <th className="px-3 py-2 font-medium">Average delay</th>
                    <th className="px-3 py-2 font-medium">On time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {/* Totals Row */}
                  <tr className="bg-white border-b-2 border-gray-200 font-bold text-black">
                    <td className="px-3 py-2">Total:</td>
                    <td className="px-3 py-2">{formatCurrency(totals.sellingPrice)}</td>
                    <td className="px-3 py-2">{formatCurrency(totals.cost)}</td>
                    <td className="px-3 py-2">{formatCurrency(totals.profit)}</td>
                    <td className="px-3 py-2">{formatPercent(totalProfitPercent)}</td>
                    <td className="px-3 py-2">{formatDelay(avgDelay)}</td>
                    <td className="px-3 py-2">{formatPercent(avgOnTime)}</td>
                  </tr>

                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="px-3 py-8 text-center text-gray-500">Loading data...</td>
                    </tr>
                  ) : (
                    customers.map((c: any, i: number) => {
                      const sp = Number(c.selling_price || 0);
                      const cost = Number(c.cost || 0);
                      const prof = Number(c.profit || 0);
                      const profPct = sp > 0 ? (prof / sp) * 100 : 0;
                      
                      return (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-3 py-2 uppercase text-gray-800 font-medium">
                            {c.customer_number ? `${c.customer_number} ` : ''}{c.name}
                          </td>
                          <td className="px-3 py-2">{formatCurrency(sp)}</td>
                          <td className="px-3 py-2">{formatCurrency(cost)}</td>
                          <td className="px-3 py-2">{formatCurrency(prof)}</td>
                          <td className="px-3 py-2">{formatPercent(profPct)}</td>
                          <td className="px-3 py-2">{formatDelay(Number(c.average_delay || 0))}</td>
                          <td className="px-3 py-2">{formatPercent(Number(c.on_time || 0))}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
              {customers.length >= limit && (
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
