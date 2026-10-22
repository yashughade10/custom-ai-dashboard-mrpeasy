"use client";

import { useState, useEffect } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { mrpApi } from "@/services/mrpApi";
import { Plus, Download, Flag, Edit2, Search, Settings2, CalendarDays, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ProductionOrdersTable({ 
  onEdit,
  onOpenCreate 
}: { 
  onEdit?: (order: any) => void;
  onOpenCreate?: (fn: (defaults?: any) => void) => void;
}) {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [activeSearch, setActiveSearch] = useState("");

  // Column filter inputs
  const [colFilters, setColFilters] = useState<Record<string, string>>({
    group_number: "",
    mo_number: "",
    group_name: "",
    part_no: "",
    part_description: "",
    status: "",
    parts_status: "",
    assigned_to: "",
    type: "",
    min_quantity: "",
    max_quantity: "",
    min_cost: "",
    max_cost: "",
    min_unit_cost: "",
    max_unit_cost: "",
    min_planned: "",
    max_planned: "",
    min_actual: "",
    max_actual: "",
  });

  const [appliedColFilters, setAppliedColFilters] = useState<Record<string, string>>({});

  // Debounce main search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setActiveSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(handler);
  }, [searchInput]);

  // Combined filters sent to backend
  const queryFilters: Record<string, string> = {
    ...(activeSearch ? { search: activeSearch } : {}),
    ...appliedColFilters,
  };

  // Data fetching using backend TiDB query
  const { data: ordersData, isLoading, isFetching } = useQuery({
    queryKey: ["mrp-manufacturing-orders", page, queryFilters],
    queryFn: () => mrpApi.getManufacturingOrders(page, 50, queryFilters),
    placeholderData: keepPreviousData,
  });

  const allOrders = ordersData?.data || [];
  const pagination = ordersData?.pagination || {};
  const totalPages = pagination.totalPages || 1;

  // Real DB summary calculated on filtered set
  const summary = ordersData?.summary || {};
  const totalQuantity = parseFloat(summary.total_quantity) || 0;
  const totalCost = parseFloat(summary.total_cost) || 0;
  const totalPlanned = parseFloat(summary.total_planned) || 0;
  const totalActual = parseFloat(summary.total_actual) || 0;

  const handleApplyColFilters = () => {
    const activeCols: Record<string, string> = {};
    Object.entries(colFilters).forEach(([k, v]) => {
      if (v.trim()) activeCols[k] = v.trim();
    });
    setAppliedColFilters(activeCols);
    setPage(1);
  };

  const handleClearAll = () => {
    setSearchInput("");
    setActiveSearch("");
    setColFilters({
      group_number: "",
      mo_number: "",
      group_name: "",
      part_no: "",
      part_description: "",
      status: "",
      parts_status: "",
      assigned_to: "",
      type: "",
      min_quantity: "",
      max_quantity: "",
      min_cost: "",
      max_cost: "",
      min_unit_cost: "",
      max_unit_cost: "",
      min_planned: "",
      max_planned: "",
      min_actual: "",
      max_actual: "",
    });
    setAppliedColFilters({});
    setPage(1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleApplyColFilters();
    }
  };

  const formatDate = (d: string) => {
    if (!d) return "";
    const date = new Date(d);
    return isNaN(date.getTime()) ? d : date.toLocaleString('en-GB', {day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit'});
  };

  const formatShortDate = (d: string) => {
    if (!d) return "";
    const date = new Date(d);
    return isNaN(date.getTime()) ? d : date.toLocaleDateString('en-GB', {day:'2-digit', month:'2-digit', year:'numeric'});
  };

  return (
    <div className="w-full bg-white text-[12px] text-gray-800">
      {/* Top Search and Filter Bar */}
      <div className="p-3 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3 bg-[#fafbfc]">
        <div className="flex items-center gap-2 max-w-md w-full">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-2.5 top-2 text-gray-400" />
            <Input
              placeholder="Search across all fields (MO#, part, description, status, customer)..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="h-8 pl-8 pr-8 text-xs bg-white"
            />
            {searchInput && (
              <button 
                onClick={() => setSearchInput("")} 
                className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          {(searchInput || Object.keys(appliedColFilters).length > 0) && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleClearAll}
              className="h-8 text-xs text-gray-600"
            >
              Reset Filters
            </Button>
          )}
        </div>

        <div className="flex items-center gap-3">
          {isFetching && (
            <div className="flex items-center gap-1.5 text-xs text-blue-600 font-medium">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Searching database...</span>
            </div>
          )}
          <span className="text-xs text-gray-500 font-medium">
            Total: <strong className="text-gray-800">{pagination.total || 0}</strong> orders
          </span>
        </div>
      </div>

      <div className="overflow-x-auto w-full relative">
        <table className="w-full border-collapse table-auto min-w-[2000px]">
          <thead>
            {/* Main Header */}
            <tr className="text-left font-medium text-gray-700 bg-white">
              <th className="font-medium p-1 w-6 text-center text-gray-400 font-bold">+</th>
              <th className="font-medium p-1 leading-tight">Group number</th>
              <th className="font-medium p-1 leading-tight flex items-center gap-1">Number <span className="text-gray-400">↓</span></th>
              <th className="font-medium p-1 leading-tight">Group name</th>
              <th className="font-medium p-1 leading-tight">Part No.</th>
              <th className="font-medium p-1 leading-tight">Part description</th>
              <th className="font-medium p-1 leading-tight">Quantity</th>
              <th className="font-medium p-1 leading-tight">Status</th>
              <th className="font-medium p-1 leading-tight">Parts status</th>
              <th className="font-medium p-1 leading-tight">Due date</th>
              <th className="font-medium p-1 leading-tight">Start</th>
              <th className="font-medium p-1 leading-tight">Finish</th>
              <th className="font-medium p-1 leading-tight">Assigned to</th>
              <th className="font-medium p-1 leading-tight">Type</th>
              <th className="font-medium p-1 leading-tight">Created</th>
              <th className="font-medium p-1 leading-tight text-right">Total cost</th>
              <th className="font-medium p-1 leading-tight text-right">Unit cost</th>
              <th className="font-medium p-1 leading-tight text-right">Planned time, h</th>
              <th className="font-medium p-1 leading-tight text-right">Actual time, h</th>
              <th className="font-medium p-1 leading-tight">Customer orders</th>
              <th className="font-medium p-1 leading-tight">Customer name</th>
              <th className="font-medium p-1 w-16 text-center">
                <div className="flex items-center justify-end gap-3 text-gray-500 pr-2">
                  <Settings2 className="w-3.5 h-3.5 cursor-pointer" />
                  <Plus className="w-3.5 h-3.5 cursor-pointer" />
                  <Flag className="w-3.5 h-3.5 cursor-pointer" />
                </div>
              </th>
            </tr>
            {/* Filter Row */}
            <tr className="bg-white border-t border-gray-100">
              <td className="p-1.5 text-center align-top border-b border-gray-100">
                <input type="checkbox" className="w-3.5 h-3.5 rounded-sm border-gray-300 accent-blue-600 mt-1" />
              </td>
              <td className="p-1.5 align-top border-b border-gray-100">
                <input 
                  type="text" 
                  value={colFilters.group_number}
                  onChange={(e) => setColFilters(prev => ({ ...prev, group_number: e.target.value }))}
                  onKeyDown={handleKeyDown}
                  placeholder="Filter..."
                  className="w-full h-[26px] bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px]" 
                />
              </td>
              <td className="p-1.5 align-top border-b border-gray-100">
                <input 
                  type="text" 
                  value={colFilters.mo_number} 
                  onChange={(e) => setColFilters(prev => ({ ...prev, mo_number: e.target.value }))}
                  onKeyDown={handleKeyDown}
                  placeholder="Filter MO#..."
                  className="w-full h-[26px] bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px]" 
                />
              </td>
              <td className="p-1.5 align-top border-b border-gray-100">
                <input 
                  type="text" 
                  value={colFilters.group_name}
                  onChange={(e) => setColFilters(prev => ({ ...prev, group_name: e.target.value }))}
                  onKeyDown={handleKeyDown}
                  placeholder="Filter..."
                  className="w-full h-[26px] bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px]" 
                />
              </td>
              <td className="p-1.5 align-top border-b border-gray-100">
                <input 
                  type="text" 
                  value={colFilters.part_no}
                  onChange={(e) => setColFilters(prev => ({ ...prev, part_no: e.target.value }))}
                  onKeyDown={handleKeyDown}
                  placeholder="Filter part..."
                  className="w-full h-[26px] bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px]" 
                />
              </td>
              <td className="p-1.5 align-top border-b border-gray-100">
                <input 
                  type="text" 
                  value={colFilters.part_description}
                  onChange={(e) => setColFilters(prev => ({ ...prev, part_description: e.target.value }))}
                  onKeyDown={handleKeyDown}
                  placeholder="Filter desc..."
                  className="w-full h-[26px] bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px]" 
                />
              </td>
              <td className="p-1.5 align-top border-b border-gray-100 space-y-1 w-20">
                <input 
                  type="text" 
                  placeholder="min" 
                  value={colFilters.min_quantity}
                  onChange={(e) => setColFilters(prev => ({ ...prev, min_quantity: e.target.value }))}
                  onKeyDown={handleKeyDown}
                  className="w-full h-[26px] bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px] placeholder-gray-400" 
                />
                <input 
                  type="text" 
                  placeholder="max" 
                  value={colFilters.max_quantity}
                  onChange={(e) => setColFilters(prev => ({ ...prev, max_quantity: e.target.value }))}
                  onKeyDown={handleKeyDown}
                  className="w-full h-[26px] bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px] placeholder-gray-400" 
                />
              </td>
              <td className="p-1.5 align-top border-b border-gray-100 w-24">
                <input 
                  type="text"
                  placeholder="Status..."
                  value={colFilters.status}
                  onChange={(e) => setColFilters(prev => ({ ...prev, status: e.target.value }))}
                  onKeyDown={handleKeyDown}
                  className="w-full h-[26px] bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px]"
                />
              </td>
              <td className="p-1.5 align-top border-b border-gray-100 w-28">
                <input 
                  type="text"
                  placeholder="Parts status..."
                  value={colFilters.parts_status}
                  onChange={(e) => setColFilters(prev => ({ ...prev, parts_status: e.target.value }))}
                  onKeyDown={handleKeyDown}
                  className="w-full h-[26px] bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px]"
                />
              </td>
              <td className="p-1.5 align-top border-b border-gray-100 space-y-1 w-[120px]">
                <div className="relative"><input type="text" placeholder="min date" onKeyDown={handleKeyDown} className="w-full h-[26px] bg-[#F3F4F6] border-none rounded-sm pl-2 pr-6 focus:ring-1 focus:ring-blue-500 outline-none text-[11px] placeholder-gray-400" /><CalendarDays className="w-3.5 h-3.5 absolute right-1.5 top-1.5 text-gray-400 pointer-events-none" /></div>
                <div className="relative"><input type="text" placeholder="max date" onKeyDown={handleKeyDown} className="w-full h-[26px] bg-[#F3F4F6] border-none rounded-sm pl-2 pr-6 focus:ring-1 focus:ring-blue-500 outline-none text-[11px] placeholder-gray-400" /><CalendarDays className="w-3.5 h-3.5 absolute right-1.5 top-1.5 text-gray-400 pointer-events-none" /></div>
              </td>
              <td className="p-1.5 align-top border-b border-gray-100 space-y-1 w-[120px]">
                <div className="relative"><input type="text" placeholder="min start" onKeyDown={handleKeyDown} className="w-full h-[26px] bg-[#F3F4F6] border-none rounded-sm pl-2 pr-6 focus:ring-1 focus:ring-blue-500 outline-none text-[11px] placeholder-gray-400" /><CalendarDays className="w-3.5 h-3.5 absolute right-1.5 top-1.5 text-gray-400 pointer-events-none" /></div>
                <div className="relative"><input type="text" placeholder="max start" onKeyDown={handleKeyDown} className="w-full h-[26px] bg-[#F3F4F6] border-none rounded-sm pl-2 pr-6 focus:ring-1 focus:ring-blue-500 outline-none text-[11px] placeholder-gray-400" /><CalendarDays className="w-3.5 h-3.5 absolute right-1.5 top-1.5 text-gray-400 pointer-events-none" /></div>
              </td>
              <td className="p-1.5 align-top border-b border-gray-100 space-y-1 w-[120px]">
                <div className="relative"><input type="text" placeholder="min finish" onKeyDown={handleKeyDown} className="w-full h-[26px] bg-[#F3F4F6] border-none rounded-sm pl-2 pr-6 focus:ring-1 focus:ring-blue-500 outline-none text-[11px] placeholder-gray-400" /><CalendarDays className="w-3.5 h-3.5 absolute right-1.5 top-1.5 text-gray-400 pointer-events-none" /></div>
                <div className="relative"><input type="text" placeholder="max finish" onKeyDown={handleKeyDown} className="w-full h-[26px] bg-[#F3F4F6] border-none rounded-sm pl-2 pr-6 focus:ring-1 focus:ring-blue-500 outline-none text-[11px] placeholder-gray-400" /><CalendarDays className="w-3.5 h-3.5 absolute right-1.5 top-1.5 text-gray-400 pointer-events-none" /></div>
              </td>
              <td className="p-1.5 align-top border-b border-gray-100 w-24">
                <input 
                  type="text"
                  placeholder="Assignee..."
                  value={colFilters.assigned_to}
                  onChange={(e) => setColFilters(prev => ({ ...prev, assigned_to: e.target.value }))}
                  onKeyDown={handleKeyDown}
                  className="w-full h-[26px] bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px]"
                />
              </td>
              <td className="p-1.5 align-top border-b border-gray-100">
                <input 
                  type="text" 
                  value={colFilters.type}
                  onChange={(e) => setColFilters(prev => ({ ...prev, type: e.target.value }))}
                  onKeyDown={handleKeyDown}
                  placeholder="Type..."
                  className="w-full h-[26px] bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px]" 
                />
              </td>
              <td className="p-1.5 align-top border-b border-gray-100 space-y-1 w-[120px]">
                <div className="relative"><input type="text" placeholder="min created" onKeyDown={handleKeyDown} className="w-full h-[26px] bg-[#F3F4F6] border-none rounded-sm pl-2 pr-6 focus:ring-1 focus:ring-blue-500 outline-none text-[11px] placeholder-gray-400" /><CalendarDays className="w-3.5 h-3.5 absolute right-1.5 top-1.5 text-gray-400 pointer-events-none" /></div>
                <div className="relative"><input type="text" placeholder="max created" onKeyDown={handleKeyDown} className="w-full h-[26px] bg-[#F3F4F6] border-none rounded-sm pl-2 pr-6 focus:ring-1 focus:ring-blue-500 outline-none text-[11px] placeholder-gray-400" /><CalendarDays className="w-3.5 h-3.5 absolute right-1.5 top-1.5 text-gray-400 pointer-events-none" /></div>
              </td>
              <td className="p-1.5 align-top border-b border-gray-100 space-y-1 w-24">
                <input 
                  type="text" 
                  placeholder="min" 
                  value={colFilters.min_cost}
                  onChange={(e) => setColFilters(prev => ({ ...prev, min_cost: e.target.value }))}
                  onKeyDown={handleKeyDown}
                  className="w-full h-[26px] bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px] placeholder-gray-400 text-right" 
                />
                <input 
                  type="text" 
                  placeholder="max" 
                  value={colFilters.max_cost}
                  onChange={(e) => setColFilters(prev => ({ ...prev, max_cost: e.target.value }))}
                  onKeyDown={handleKeyDown}
                  className="w-full h-[26px] bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px] placeholder-gray-400 text-right" 
                />
              </td>
              <td className="p-1.5 align-top border-b border-gray-100 space-y-1 w-20">
                <input 
                  type="text" 
                  placeholder="min" 
                  value={colFilters.min_unit_cost}
                  onChange={(e) => setColFilters(prev => ({ ...prev, min_unit_cost: e.target.value }))}
                  onKeyDown={handleKeyDown}
                  className="w-full h-[26px] bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px] placeholder-gray-400 text-right" 
                />
                <input 
                  type="text" 
                  placeholder="max" 
                  value={colFilters.max_unit_cost}
                  onChange={(e) => setColFilters(prev => ({ ...prev, max_unit_cost: e.target.value }))}
                  onKeyDown={handleKeyDown}
                  className="w-full h-[26px] bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px] placeholder-gray-400 text-right" 
                />
              </td>
              <td className="p-1.5 align-top border-b border-gray-100 space-y-1 w-20">
                <input 
                  type="text" 
                  placeholder="min" 
                  value={colFilters.min_planned}
                  onChange={(e) => setColFilters(prev => ({ ...prev, min_planned: e.target.value }))}
                  onKeyDown={handleKeyDown}
                  className="w-full h-[26px] bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px] placeholder-gray-400 text-right" 
                />
                <input 
                  type="text" 
                  placeholder="max" 
                  value={colFilters.max_planned}
                  onChange={(e) => setColFilters(prev => ({ ...prev, max_planned: e.target.value }))}
                  onKeyDown={handleKeyDown}
                  className="w-full h-[26px] bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px] placeholder-gray-400 text-right" 
                />
              </td>
              <td className="p-1.5 align-top border-b border-gray-100 space-y-1 w-20">
                <input 
                  type="text" 
                  placeholder="min" 
                  value={colFilters.min_actual}
                  onChange={(e) => setColFilters(prev => ({ ...prev, min_actual: e.target.value }))}
                  onKeyDown={handleKeyDown}
                  className="w-full h-[26px] bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px] placeholder-gray-400 text-right" 
                />
                <input 
                  type="text" 
                  placeholder="max" 
                  value={colFilters.max_actual}
                  onChange={(e) => setColFilters(prev => ({ ...prev, max_actual: e.target.value }))}
                  onKeyDown={handleKeyDown}
                  className="w-full h-[26px] bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px] placeholder-gray-400 text-right" 
                />
              </td>
              <td className="p-1.5 align-top border-b border-gray-100">
                <input type="text" placeholder="Orders..." onKeyDown={handleKeyDown} className="w-full h-[26px] bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px]" />
              </td>
              <td className="p-1.5 align-top border-b border-gray-100">
                <input type="text" placeholder="Customer..." onKeyDown={handleKeyDown} className="w-full h-[26px] bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px]" />
              </td>
              <td className="p-1.5 align-top border-b border-gray-100 text-center">
                <div className="flex items-center justify-end gap-2 pr-2 text-blue-600 font-medium pt-1">
                  <button onClick={handleApplyColFilters} className="hover:underline cursor-pointer">Search</button>
                  <button onClick={handleClearAll} className="text-gray-400 hover:underline cursor-pointer">Clear</button>
                </div>
              </td>
            </tr>
            {/* Totals Row */}
            <tr className="bg-white font-bold border-b border-gray-100">
              <td colSpan={6} className="p-2 text-right pr-6">Total:</td>
              <td className="p-2">{totalQuantity.toLocaleString()}</td>
              <td colSpan={8}></td>
              <td className="p-2 text-right">${totalCost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
              <td className="p-2 text-right"></td>
              <td className="p-2 text-right">{totalPlanned.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
              <td className="p-2 text-right">{totalActual.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
              <td colSpan={3}></td>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={22} className="text-center py-16 text-gray-500">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                    <span className="text-sm font-medium">Loading manufacturing orders from database...</span>
                  </div>
                </td>
              </tr>
            ) : allOrders.length === 0 ? (
              <tr>
                <td colSpan={22} className="text-center py-12 text-gray-400 text-sm">
                  No manufacturing orders found matching your search.
                </td>
              </tr>
            ) : allOrders.map((order: any, i: number) => {
              const isRed = order.parts_status === "Not booked";
              const isOrange = order.parts_status === "Requested";
              const rowTextColor = isRed ? "text-red-500" : (isOrange ? "text-orange-500" : "text-gray-800");

              return (
                <tr 
                  key={order.id || i} 
                  className={`hover:bg-gray-50 border-b border-gray-100 ${rowTextColor}`}
                  onDoubleClick={() => onEdit?.(order)}
                >
                  <td className="p-1 text-center text-gray-400">{(page - 1) * 50 + i + 1}</td>
                  <td className="p-1">{order.group_number}</td>
                  <td className="p-1">
                    <span 
                      onClick={() => onEdit?.(order)}
                      className="text-blue-600 font-semibold hover:underline cursor-pointer"
                      title="Click to edit manufacturing order"
                    >
                      {order.mo_number}
                    </span>
                  </td>
                  <td className="p-1">{order.group_name}</td>
                  <td className="p-1">{order.part_no}</td>
                  <td className="p-1 whitespace-pre-wrap max-w-[350px] leading-relaxed align-top">{order.part_description}</td>
                  <td className="p-1">{order.quantity} pcs</td>
                  <td className="p-1">
                    <span>{order.status}</span>
                  </td>
                  <td className="p-1">
                    {order.parts_status === "Not booked" ? (
                      <span className="bg-[#FFE5E5] text-red-600 px-1.5 py-0.5 rounded-sm font-medium text-[11px]">Not booked</span>
                    ) : order.parts_status === "Requested" ? (
                      <span className="bg-[#FFF0E0] text-orange-600 px-1.5 py-0.5 rounded-sm font-medium text-[11px]">Requested</span>
                    ) : (
                      <span>{order.parts_status || "Received"}</span>
                    )}
                  </td>
                  <td className="p-1">{formatDate(order.due_date)}</td>
                  <td className="p-1">{formatDate(order.start_datetime)}</td>
                  <td className="p-1">{formatDate(order.finish_datetime)}</td>
                  <td className="p-1">{order.assigned_to}</td>
                  <td className="p-1">{order.type}</td>
                  <td className="p-1">{formatShortDate(order.created_date)}</td>
                  <td className="p-1 text-right">${parseFloat(order.total_cost || 0).toFixed(2)}</td>
                  <td className="p-1 text-right">${parseFloat(order.unit_cost || 0).toFixed(2)}</td>
                  <td className="p-1 text-right">{parseFloat(order.planned_time_h || 0).toFixed(2)}</td>
                  <td className="p-1 text-right">{order.actual_time_h ? parseFloat(order.actual_time_h).toFixed(2) : ""}</td>
                  <td className="p-1">{order.customer_orders || ""}</td>
                  <td className="p-1">{order.customer_name || ""}</td>
                  <td className="p-1 text-right">
                    <div className="flex items-center justify-end gap-3 pr-2">
                      <button 
                        type="button"
                        onClick={() => onEdit?.(order)}
                        title="Edit manufacturing order"
                        className="p-0.5 hover:bg-gray-100 rounded text-gray-400 hover:text-blue-600 cursor-pointer transition-colors"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      {isRed && <Flag className="h-3.5 w-3.5 text-red-500 cursor-pointer" />}
                      {!isRed && <Flag className="h-3.5 w-3.5 text-gray-200 hover:text-gray-400 cursor-pointer" />}
                      <input type="checkbox" className="w-3.5 h-3.5 rounded-sm border-gray-300 accent-blue-600 cursor-pointer" />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 py-4 border-t border-gray-100">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1 || isFetching}
            className="h-7 text-xs"
          >
            ← Prev
          </Button>
          <span className="text-xs text-gray-500 font-medium">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || isFetching}
            className="h-7 text-xs"
          >
            Next →
          </Button>
        </div>
      )}
    </div>
  );
}
