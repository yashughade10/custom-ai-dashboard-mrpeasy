"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { mrpApi } from "@/services/mrpApi";
import { Download, Search } from "lucide-react";
import { RouteGuard } from "@/components/auth/RouteGuard";
import { MrpTabBar } from "@/components/mrp/MrpTabBar";
import { Button } from "@/components/ui/button";

const productionTabs = [
  { name: "Manufacturing orders", href: "/dashboard/mrp/production" },
  { name: "Production schedule", href: "/dashboard/mrp/production/schedule" },
  { name: "Workstations", href: "/dashboard/mrp/production/workstations" },
  { name: "Workstation groups", href: "/dashboard/mrp/production/workstation-groups" },
  { name: "BOM", href: "/dashboard/mrp/production/bom" },
  { name: "Routings", href: "/dashboard/mrp/production/routings" },
  { name: "Statistics", href: "/dashboard/mrp/production/statistics" },
];

const reportOptions = [
  { value: "costs", label: "Costs by manufacturing orders" },
  { value: "costs-by-product", label: "Costs by products" },
  { value: "efficiency", label: "Manufacturing efficiency" },
  { value: "shortages", label: "Shortages" },
  { value: "revenue", label: "Revenue and profit by manufacturing orders" }
];

function StatisticsPage() {
  const [selectedReport, setSelectedReport] = useState("costs");
  const [fromDate, setFromDate] = useState("2026-08-01");
  const [toDate, setToDate] = useState("2026-08-06");
  const [filters, setFilters] = useState({ fromDate: "2026-08-01", toDate: "2026-08-06" });

  const { data: costsData, isLoading: costsLoading } = useQuery({
    queryKey: ["manufacturing-costs", filters],
    queryFn: () => mrpApi.getManufacturingCosts(1, 1000, filters),
    enabled: selectedReport === "costs"
  });

  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ["costs-by-product", filters],
    queryFn: () => mrpApi.getCostsByProduct(1, 1000, filters),
    enabled: selectedReport === "costs-by-product"
  });

  const { data: effData, isLoading: effLoading } = useQuery({
    queryKey: ["manufacturing-efficiency", filters],
    queryFn: () => mrpApi.getManufacturingEfficiency(1, 1000, filters),
    enabled: selectedReport === "efficiency"
  });

  const { data: shortagesData, isLoading: shortagesLoading } = useQuery({
    queryKey: ["manufacturing-shortages", filters],
    queryFn: () => mrpApi.getShortages(1, 1000, filters),
    enabled: selectedReport === "shortages"
  });

  const { data: revData, isLoading: revLoading } = useQuery({
    queryKey: ["revenue-profit", filters],
    queryFn: () => mrpApi.getRevenueAndProfit(1, 1000, filters),
    enabled: selectedReport === "revenue"
  });

  const handleSearch = () => {
    setFilters({ fromDate, toDate });
  };

  const formatCurrency = (val: number) => `$${(val || 0).toFixed(2)}`;
  const formatNum = (val: number) => (val || 0).toFixed(2);
  const formatDate = (dateStr: string) => dateStr ? new Date(dateStr).toLocaleDateString() : '';

  // Render logic for different tables
  const renderCostsTable = () => {
    const costs = costsData?.data || [];
    const totals = costs.reduce((acc: any, curr: any) => {
      acc.quantity += parseFloat(curr.quantity) || 0;
      acc.totalCost += parseFloat(curr.total_cost) || 0;
      acc.costOfMaterials += parseFloat(curr.cost_of_materials) || 0;
      acc.appliedOverhead += parseFloat(curr.applied_overhead_cost) || 0;
      acc.laborCost += parseFloat(curr.labor_cost) || 0;
      acc.costOverrun += parseFloat(curr.cost_overrun) || 0;
      return acc;
    }, { quantity: 0, totalCost: 0, costOfMaterials: 0, appliedOverhead: 0, laborCost: 0, costOverrun: 0 });

    return (
      <table className="w-full text-left border-collapse text-[12px] text-gray-700 min-w-[1200px]">
        <thead className="bg-[#f0f2f5] border-b border-gray-200">
          <tr>
            <th className="font-medium p-2.5 whitespace-nowrap">Manufacturing order ↑</th>
            <th className="font-medium p-2.5 whitespace-nowrap">Part No.</th>
            <th className="font-medium p-2.5 w-[300px]">Part description</th>
            <th className="font-medium p-2.5 whitespace-nowrap">Status</th>
            <th className="font-medium p-2.5 whitespace-nowrap text-right">Quantity</th>
            <th className="font-medium p-2.5 whitespace-nowrap text-right">Total cost</th>
            <th className="font-medium p-2.5 whitespace-nowrap text-right">Cost of materials</th>
            <th className="font-medium p-2.5 whitespace-nowrap text-right">Applied overhead cost</th>
            <th className="font-medium p-2.5 whitespace-nowrap text-right">Labor cost</th>
            <th className="font-medium p-2.5 whitespace-nowrap text-right">Cost overrun</th>
            <th className="font-medium p-2.5 whitespace-nowrap text-right">Cost overrun per item</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-gray-200 font-bold bg-white">
            <td className="p-2.5" colSpan={4}>Total:</td>
            <td className="p-2.5 text-right">{totals.quantity} pcs</td>
            <td className="p-2.5 text-right">{formatCurrency(totals.totalCost)}</td>
            <td className="p-2.5 text-right">{formatCurrency(totals.costOfMaterials)}</td>
            <td className="p-2.5 text-right">{formatCurrency(totals.appliedOverhead)}</td>
            <td className="p-2.5 text-right">{formatCurrency(totals.laborCost)}</td>
            <td className="p-2.5 text-right">{formatCurrency(totals.costOverrun)}</td>
            <td className="p-2.5 text-right"></td>
          </tr>
          {costsLoading ? <tr><td colSpan={11} className="p-8 text-center text-gray-500">Loading...</td></tr> : costs.map((item: any) => (
            <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="p-2.5 text-blue-600 hover:underline cursor-pointer">{item.mo_number}</td>
              <td className="p-2.5 text-blue-600 hover:underline cursor-pointer">{item.part_no}</td>
              <td className="p-2.5 truncate max-w-[300px]" title={item.part_description}>{item.part_description}</td>
              <td className="p-2.5">{item.status}</td>
              <td className="p-2.5 text-right">{parseFloat(item.quantity)} {item.part_no === '28325' ? '' : 'pcs'}</td>
              <td className="p-2.5 text-right">{formatCurrency(parseFloat(item.total_cost))}</td>
              <td className="p-2.5 text-right">{formatCurrency(parseFloat(item.cost_of_materials))}</td>
              <td className="p-2.5 text-right">{formatCurrency(parseFloat(item.applied_overhead_cost))}</td>
              <td className="p-2.5 text-right">{formatCurrency(parseFloat(item.labor_cost))}</td>
              <td className="p-2.5 text-right">{formatCurrency(parseFloat(item.cost_overrun))}</td>
              <td className="p-2.5 text-right">{formatCurrency(parseFloat(item.cost_overrun_per_item))}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const renderProductsTable = () => {
    const products = productsData?.data || [];
    const totals = products.reduce((acc: any, curr: any) => {
      acc.quantity += parseFloat(curr.quantity) || 0;
      acc.totalCost += parseFloat(curr.total_cost) || 0;
      acc.costOfMaterials += parseFloat(curr.cost_of_materials) || 0;
      acc.appliedOverhead += parseFloat(curr.applied_overhead_cost) || 0;
      acc.laborCost += parseFloat(curr.labor_cost) || 0;
      return acc;
    }, { quantity: 0, totalCost: 0, costOfMaterials: 0, appliedOverhead: 0, laborCost: 0 });

    return (
      <table className="w-full text-left border-collapse text-[12px] text-gray-700 min-w-[1200px]">
        <thead className="bg-[#f0f2f5] border-b border-gray-200">
          <tr>
            <th className="font-medium p-2.5 whitespace-nowrap">Part No. ↑</th>
            <th className="font-medium p-2.5 w-[300px]">Part description</th>
            <th className="font-medium p-2.5 whitespace-nowrap text-right">Quantity</th>
            <th className="font-medium p-2.5 whitespace-nowrap text-right">Total cost</th>
            <th className="font-medium p-2.5 whitespace-nowrap text-right">Unit cost</th>
            <th className="font-medium p-2.5 whitespace-nowrap text-right">Cost of materials</th>
            <th className="font-medium p-2.5 whitespace-nowrap text-right">Applied overhead cost</th>
            <th className="font-medium p-2.5 whitespace-nowrap text-right">Labor cost</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-gray-200 font-bold bg-white">
            <td className="p-2.5" colSpan={2}>Total:</td>
            <td className="p-2.5 text-right">{totals.quantity} pcs</td>
            <td className="p-2.5 text-right">{formatCurrency(totals.totalCost)}</td>
            <td className="p-2.5 text-right"></td>
            <td className="p-2.5 text-right">{formatCurrency(totals.costOfMaterials)}</td>
            <td className="p-2.5 text-right">{formatCurrency(totals.appliedOverhead)}</td>
            <td className="p-2.5 text-right">{formatCurrency(totals.laborCost)}</td>
          </tr>
          {productsLoading ? <tr><td colSpan={8} className="p-8 text-center text-gray-500">Loading...</td></tr> : products.map((item: any) => (
            <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="p-2.5 text-blue-600 hover:underline cursor-pointer">{item.part_no}</td>
              <td className="p-2.5 truncate max-w-[300px]" title={item.part_description}>{item.part_description}</td>
              <td className="p-2.5 text-right">{parseFloat(item.quantity)}</td>
              <td className="p-2.5 text-right">{formatCurrency(parseFloat(item.total_cost))}</td>
              <td className="p-2.5 text-right">{formatCurrency(parseFloat(item.unit_cost))}</td>
              <td className="p-2.5 text-right">{formatCurrency(parseFloat(item.cost_of_materials))}</td>
              <td className="p-2.5 text-right">{formatCurrency(parseFloat(item.applied_overhead_cost))}</td>
              <td className="p-2.5 text-right">{formatCurrency(parseFloat(item.labor_cost))}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const renderEfficiencyTable = () => {
    const data = effData?.data || [];
    const totals = data.reduce((acc: any, curr: any) => {
      acc.quantity += parseFloat(curr.quantity) || 0;
      acc.actualDuration += parseFloat(curr.actual_duration_h) || 0;
      acc.plannedDuration += parseFloat(curr.planned_duration_h) || 0;
      acc.actualCost += parseFloat(curr.actual_cost) || 0;
      acc.plannedCost += parseFloat(curr.planned_cost) || 0;
      return acc;
    }, { quantity: 0, actualDuration: 0, plannedDuration: 0, actualCost: 0, plannedCost: 0 });

    return (
      <table className="w-full text-left border-collapse text-[12px] text-gray-700 min-w-[1400px]">
        <thead className="bg-[#f0f2f5] border-b border-gray-200">
          <tr>
            <th className="font-medium p-2.5 whitespace-nowrap">Manufacturing order ↑</th>
            <th className="font-medium p-2.5 whitespace-nowrap">Part No.</th>
            <th className="font-medium p-2.5 w-[200px]">Part description</th>
            <th className="font-medium p-2.5 whitespace-nowrap">Status</th>
            <th className="font-medium p-2.5 whitespace-nowrap text-right">Quantity</th>
            <th className="font-medium p-2.5 whitespace-nowrap text-right">Actual duration, h</th>
            <th className="font-medium p-2.5 whitespace-nowrap text-right">Planned duration, h</th>
            <th className="font-medium p-2.5 whitespace-nowrap text-right">Time efficiency</th>
            <th className="font-medium p-2.5 whitespace-nowrap text-right">Actual cost</th>
            <th className="font-medium p-2.5 whitespace-nowrap text-right">Planned cost</th>
            <th className="font-medium p-2.5 whitespace-nowrap text-right">Actual cost/unit</th>
            <th className="font-medium p-2.5 whitespace-nowrap text-right">Planned cost/unit</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-gray-200 font-bold bg-white">
            <td className="p-2.5" colSpan={4}>Total:</td>
            <td className="p-2.5 text-right">{totals.quantity} pcs</td>
            <td className="p-2.5 text-right">{formatNum(totals.actualDuration)}</td>
            <td className="p-2.5 text-right">{formatNum(totals.plannedDuration)}</td>
            <td className="p-2.5 text-right">{totals.actualDuration ? (totals.plannedDuration / totals.actualDuration * 100).toFixed(2) + '%' : ''}</td>
            <td className="p-2.5 text-right">{formatCurrency(totals.actualCost)}</td>
            <td className="p-2.5 text-right">{formatCurrency(totals.plannedCost)}</td>
            <td colSpan={2}></td>
          </tr>
          {effLoading ? <tr><td colSpan={12} className="p-8 text-center text-gray-500">Loading...</td></tr> : data.map((item: any) => (
            <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="p-2.5 text-blue-600 hover:underline cursor-pointer">{item.mo_number}</td>
              <td className="p-2.5 text-blue-600 hover:underline cursor-pointer">{item.part_no}</td>
              <td className="p-2.5 truncate max-w-[200px]" title={item.part_description}>{item.part_description}</td>
              <td className="p-2.5">{item.status}</td>
              <td className="p-2.5 text-right">{parseFloat(item.quantity)}</td>
              <td className="p-2.5 text-right">{formatNum(parseFloat(item.actual_duration_h))}</td>
              <td className="p-2.5 text-right">{formatNum(parseFloat(item.planned_duration_h))}</td>
              <td className="p-2.5 text-right">{formatNum(parseFloat(item.time_efficiency))}%</td>
              <td className="p-2.5 text-right">{formatCurrency(parseFloat(item.actual_cost))}</td>
              <td className="p-2.5 text-right">{formatCurrency(parseFloat(item.planned_cost))}</td>
              <td className="p-2.5 text-right">{formatCurrency(parseFloat(item.actual_cost_per_unit))}</td>
              <td className="p-2.5 text-right">{formatCurrency(parseFloat(item.planned_cost_per_unit))}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const renderShortagesTable = () => {
    const data = shortagesData?.data || [];
    return (
      <table className="w-full text-left border-collapse text-[12px] text-gray-700 min-w-[1200px]">
        <thead className="bg-[#f0f2f5] border-b border-gray-200">
          <tr>
            <th className="font-medium p-2.5 whitespace-nowrap">MO number ↑</th>
            <th className="font-medium p-2.5 whitespace-nowrap">Start</th>
            <th className="font-medium p-2.5 whitespace-nowrap">Due date</th>
            <th className="font-medium p-2.5 whitespace-nowrap">Part No.</th>
            <th className="font-medium p-2.5 w-[300px]">Part description</th>
            <th className="font-medium p-2.5 whitespace-nowrap text-right">Quantity</th>
            <th className="font-medium p-2.5 whitespace-nowrap text-center">Unit</th>
            <th className="font-medium p-2.5 whitespace-nowrap">Parts status</th>
            <th className="font-medium p-2.5 whitespace-nowrap">Source</th>
            <th className="font-medium p-2.5 whitespace-nowrap">Available from</th>
            <th className="font-medium p-2.5 whitespace-nowrap">Lot</th>
          </tr>
        </thead>
        <tbody>
          {shortagesLoading ? <tr><td colSpan={11} className="p-8 text-center text-gray-500">Loading...</td></tr> : data.length === 0 ? <tr><td colSpan={11} className="p-8 text-center text-gray-500">No shortages found</td></tr> : data.map((item: any) => (
            <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="p-2.5 text-blue-600 hover:underline cursor-pointer">{item.mo_number}</td>
              <td className="p-2.5">{formatDate(item.start_datetime)}</td>
              <td className="p-2.5">{formatDate(item.due_date)}</td>
              <td className="p-2.5 text-blue-600 hover:underline cursor-pointer">{item.part_no}</td>
              <td className="p-2.5 truncate max-w-[300px]" title={item.part_description}>{item.part_description}</td>
              <td className="p-2.5 text-right">{parseFloat(item.quantity)}</td>
              <td className="p-2.5 text-center">{item.unit}</td>
              <td className="p-2.5">{item.parts_status}</td>
              <td className="p-2.5">{item.source}</td>
              <td className="p-2.5">{formatDate(item.available_from)}</td>
              <td className="p-2.5">{item.lot}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const renderRevenueTable = () => {
    const data = revData?.data || [];
    const totals = data.reduce((acc: any, curr: any) => {
      acc.quantity += parseFloat(curr.quantity) || 0;
      acc.soldQuantity += parseFloat(curr.sold_quantity) || 0;
      acc.totalCost += parseFloat(curr.total_cost) || 0;
      acc.revenue += parseFloat(curr.revenue) || 0;
      acc.profit += parseFloat(curr.profit) || 0;
      return acc;
    }, { quantity: 0, soldQuantity: 0, totalCost: 0, revenue: 0, profit: 0 });

    return (
      <table className="w-full text-left border-collapse text-[12px] text-gray-700 min-w-[1200px]">
        <thead className="bg-[#f0f2f5] border-b border-gray-200">
          <tr>
            <th className="font-medium p-2.5 whitespace-nowrap">MO number ↑</th>
            <th className="font-medium p-2.5 whitespace-nowrap">Part No.</th>
            <th className="font-medium p-2.5 w-[250px]">Part description</th>
            <th className="font-medium p-2.5 whitespace-nowrap">Status</th>
            <th className="font-medium p-2.5 whitespace-nowrap text-right">Quantity</th>
            <th className="font-medium p-2.5 whitespace-nowrap text-right">Total cost</th>
            <th className="font-medium p-2.5 whitespace-nowrap text-right">Unit cost</th>
            <th className="font-medium p-2.5 whitespace-nowrap text-right">Sold quantity</th>
            <th className="font-medium p-2.5 whitespace-nowrap text-right">Revenue</th>
            <th className="font-medium p-2.5 whitespace-nowrap text-right">Avg unit revenue</th>
            <th className="font-medium p-2.5 whitespace-nowrap text-right">Profit</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-gray-200 font-bold bg-white">
            <td className="p-2.5" colSpan={4}>Total:</td>
            <td className="p-2.5 text-right">{totals.quantity} pcs</td>
            <td className="p-2.5 text-right">{formatCurrency(totals.totalCost)}</td>
            <td className="p-2.5 text-right"></td>
            <td className="p-2.5 text-right">{totals.soldQuantity} pcs</td>
            <td className="p-2.5 text-right">{formatCurrency(totals.revenue)}</td>
            <td className="p-2.5 text-right"></td>
            <td className="p-2.5 text-right">{formatCurrency(totals.profit)}</td>
          </tr>
          {revLoading ? <tr><td colSpan={11} className="p-8 text-center text-gray-500">Loading...</td></tr> : data.map((item: any) => (
            <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="p-2.5 text-blue-600 hover:underline cursor-pointer">{item.mo_number}</td>
              <td className="p-2.5 text-blue-600 hover:underline cursor-pointer">{item.part_no}</td>
              <td className="p-2.5 truncate max-w-[250px]" title={item.part_description}>{item.part_description}</td>
              <td className="p-2.5">{item.status}</td>
              <td className="p-2.5 text-right">{parseFloat(item.quantity)} {item.unit}</td>
              <td className="p-2.5 text-right">{formatCurrency(parseFloat(item.total_cost))}</td>
              <td className="p-2.5 text-right">{formatCurrency(parseFloat(item.unit_cost))}</td>
              <td className="p-2.5 text-right">{parseFloat(item.sold_quantity)} {item.unit}</td>
              <td className="p-2.5 text-right">{formatCurrency(parseFloat(item.revenue))}</td>
              <td className="p-2.5 text-right">{formatCurrency(parseFloat(item.average_unit_revenue))}</td>
              <td className="p-2.5 text-right">{formatCurrency(parseFloat(item.profit))}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const getReportTitle = () => reportOptions.find(o => o.value === selectedReport)?.label || "Statistics";

  return (
    <div className="flex flex-col bg-[#f4f7fb] min-h-[calc(100vh-4rem)] p-4 -m-4 sm:-m-6 lg:-m-8">
      <div className="bg-white rounded-md shadow-sm flex flex-col min-h-[80vh]">
        <MrpTabBar tabs={productionTabs} />
        
        <div className="p-6">
          <h1 className="text-xl font-bold text-gray-900 mb-6">Statistics</h1>
          
          <div className="flex items-center gap-4 mb-8">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Report</span>
              <select 
                className="h-9 px-3 border border-gray-200 rounded text-sm bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500 w-80"
                value={selectedReport}
                onChange={(e) => setSelectedReport(e.target.value)}
              >
                {reportOptions.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center bg-gray-50 rounded border border-gray-200 overflow-hidden">
              <div className="px-3 py-1.5 text-sm text-gray-600 border-r border-gray-200 bg-gray-100 flex items-center gap-1">
                Period <span className="text-[10px]">▼</span>
              </div>
              <input 
                type="date" 
                className="h-9 px-3 text-sm bg-transparent outline-none w-36"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
              <span className="text-gray-400 px-2">-</span>
              <input 
                type="date" 
                className="h-9 px-3 text-sm bg-transparent outline-none w-36"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
              <button 
                className="h-9 w-9 bg-blue-600 hover:bg-blue-700 flex items-center justify-center text-white"
                onClick={handleSearch}
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg text-gray-800">{getReportTitle()}</h2>
            <div className="flex items-center gap-2">
              <Button variant="outline" className="h-8 px-3 text-xs font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 flex gap-2">
                <Download className="w-3.5 h-3.5" /> PDF
              </Button>
              <Button variant="outline" className="h-8 px-3 text-xs font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 flex gap-2">
                <Download className="w-3.5 h-3.5" /> CSV
              </Button>
            </div>
          </div>

          <div className="border border-gray-200 rounded-sm shadow-sm overflow-x-auto">
            {selectedReport === "costs" && renderCostsTable()}
            {selectedReport === "costs-by-product" && renderProductsTable()}
            {selectedReport === "efficiency" && renderEfficiencyTable()}
            {selectedReport === "shortages" && renderShortagesTable()}
            {selectedReport === "revenue" && renderRevenueTable()}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StatisticsPageGuarded() {
  return (
    <RouteGuard module="production">
      <StatisticsPage />
    </RouteGuard>
  );
}
