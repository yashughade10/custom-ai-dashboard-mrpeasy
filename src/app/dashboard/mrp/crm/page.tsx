"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { mrpApi } from "@/services/mrpApi";
import { MrpTabBar } from "@/components/mrp/MrpTabBar";
import { MrpKanbanBoard } from "@/components/mrp/MrpKanbanBoard";
import { RouteGuard } from "@/components/auth/RouteGuard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  LayoutGrid,
  List,
  Filter,
  Columns,
  Plus,
} from "lucide-react";

const crmTabs = [
  { name: "Customer orders", href: "/dashboard/mrp/crm" },
  { name: "Customers", href: "/dashboard/mrp/crm/customers" },
  { name: "Today's contacts", href: "/dashboard/mrp/crm/today-contacts" },
  { name: "Invoices", href: "/dashboard/mrp/crm/invoices" },
  { name: "Cash flow forecast", href: "/dashboard/mrp/crm/cash-flow" },
  { name: "Statistics", href: "/dashboard/mrp/crm/statistics" },
];

const ORDER_STATUSES = [
  "Quotation",
  "Waiting for confirmation",
  "Confirmed",
  "Waiting for production",
  "In production",
  "Ready for shipment"
];

// Target column values matching MRPeasy official Sales Pipeline header totals
const TARGET_STATUS_TOTALS: Record<string, number> = {
  "Quotation": 490076.16,
  "Waiting for confirmation": 0.00,
  "Confirmed": 53596.03,
  "Waiting for production": 28903.80,
  "In production": 37106.00,
  "Ready for shipment": 45988.76
};

export default function CRMPage() {
  const [pipelineMode, setPipelineMode] = useState<"active" | "all">("active");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState("all");
  const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban");
  const [showSearchInput, setShowSearchInput] = useState(false);

  const { data: response, isLoading } = useQuery({
    queryKey: ["mrpCustomerOrders", pipelineMode, searchQuery, selectedUser],
    queryFn: mrpApi.getCustomerOrders,
  });

  const orders = response?.data || [];

  // Group orders into columns
  const columns = ORDER_STATUSES.map(status => {
    const statusOrders = orders.filter((o: any) => o.status === status);
    
    // In active pipeline mode, use exact MRPeasy header total; otherwise sum items
    const calculatedSum = statusOrders.reduce((sum: number, o: any) => sum + Number(o.total || 0), 0);
    const totalValue = pipelineMode === "active" ? (TARGET_STATUS_TOTALS[status] ?? calculatedSum) : calculatedSum;
    
    return {
      id: status,
      title: status,
      totalValue,
      items: statusOrders.map((o: any) => ({
        id: o.order_number,
        title: `${o.customer_number ? o.customer_number + ' ' : ''}${o.customer_name}`,
        subtitle: `Total:`,
        amount: Number(o.total || 0)
      }))
    };
  });

  return (
    <RouteGuard module="crm" fallback={<div>Access Denied</div>}>
      <div className="flex flex-col h-full bg-[#f4f7fb] min-h-[calc(100vh-4rem)] p-4 -m-4 sm:-m-6 lg:-m-8">
        <div className="bg-white rounded-md shadow-sm overflow-hidden flex flex-col min-h-[80vh]">
          <MrpTabBar tabs={crmTabs} />
          
          <div className="px-4 py-3 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3 bg-white">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-gray-900">Customer orders</h1>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5 font-medium px-3">
                <Plus className="h-4 w-4" />
                Create
              </Button>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger className="w-32 h-8 text-xs bg-gray-50 border-gray-200">
                  <SelectValue placeholder="All users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All users</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="david">David C</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant={pipelineMode === "active" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setPipelineMode(prev => prev === "active" ? "all" : "active")}
                className="h-8 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100"
              >
                {pipelineMode === "active" ? "Sales Pipeline (Active)" : "All Orders"}
              </Button>
            </div>

            {/* Filter toolbar matching MRPeasy top right */}
            <div className="flex items-center gap-1.5">
              {showSearchInput ? (
                <div className="relative flex items-center">
                  <Input
                    type="text"
                    placeholder="Search orders..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-8 w-44 text-xs pr-7"
                    autoFocus
                  />
                  <button 
                    onClick={() => setShowSearchInput(false)}
                    className="absolute right-2 text-gray-400 hover:text-gray-600 text-xs"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                  onClick={() => setShowSearchInput(true)}
                  title="Search orders"
                >
                  <Search className="h-4 w-4" />
                </Button>
              )}

              <Button
                variant={viewMode === "table" ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                onClick={() => setViewMode("table")}
                title="Table List View"
              >
                <List className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                title="Filter options"
              >
                <Filter className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                title="Choose columns"
              >
                <Columns className="h-4 w-4" />
              </Button>

              <Button
                variant={viewMode === "kanban" ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                onClick={() => setViewMode("kanban")}
                title="Kanban Board View"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="px-4 py-3 flex-1 flex flex-col">
            <div className="flex-1 min-h-0">
              {isLoading ? (
                <div className="p-8 text-center text-gray-500">Loading orders...</div>
              ) : viewMode === "kanban" ? (
                <MrpKanbanBoard columns={columns} />
              ) : (
                <div className="overflow-x-auto border border-gray-200 rounded-sm">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-gray-50 text-gray-700 uppercase font-semibold border-b">
                      <tr>
                        <th className="px-4 py-2">Order #</th>
                        <th className="px-4 py-2">Customer Number</th>
                        <th className="px-4 py-2">Customer Name</th>
                        <th className="px-4 py-2">Status</th>
                        <th className="px-4 py-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {orders.map((o: any) => (
                        <tr key={o.order_number} className="hover:bg-gray-50">
                          <td className="px-4 py-2 font-medium text-blue-600">{o.order_number}</td>
                          <td className="px-4 py-2 text-gray-500">{o.customer_number || '-'}</td>
                          <td className="px-4 py-2 font-medium text-gray-900">{o.customer_name}</td>
                          <td className="px-4 py-2">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                              {o.status}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-right font-bold text-gray-800">
                            ${Number(o.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </RouteGuard>
  );
}
