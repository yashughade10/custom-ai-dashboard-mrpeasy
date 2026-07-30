"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { mrpApi } from "@/services/mrpApi";
import { Plus, Download, Flag, Edit2, Search, Settings2, CalendarDays } from "lucide-react";
import { toast } from "sonner";

export default function ProductionOrdersTable({ onOpenCreate }: { onOpenCreate?: (fn: (defaults?: any) => void) => void }) {
  const [search, setSearch] = useState("");
  
  // Data fetching using the correct MRP backend endpoint
  const { data: ordersData, isLoading } = useQuery({
    queryKey: ["mrp-manufacturing-orders"],
    queryFn: () => mrpApi.getManufacturingOrders(1, 100),
  });

  const allOrders = ordersData?.data || [];

  const filteredOrders = allOrders.filter((o: any) => {
    return !search || 
           o.mo_number?.toLowerCase().includes(search.toLowerCase()) || 
           o.part_no?.toLowerCase().includes(search.toLowerCase());
  });

  // Pull global totals natively from the real DB summary
  const summary = ordersData?.summary || {};
  const totalQuantity = parseFloat(summary.total_quantity) || 0;
  const totalCost = parseFloat(summary.total_cost) || 0;
  const totalPlanned = parseFloat(summary.total_planned) || 0;
  const totalActual = parseFloat(summary.total_actual) || 0;

  const formatDate = (d: string) => {
    if (!d) return "";
    const date = new Date(d);
    return date.toLocaleString('en-GB', {day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit'});
  };

  const formatShortDate = (d: string) => {
    if (!d) return "";
    const date = new Date(d);
    return date.toLocaleDateString('en-GB', {day:'2-digit', month:'2-digit', year:'numeric'});
  };

  return (
    <div className="w-full bg-white text-[12px] text-gray-800">
      <div className="overflow-hidden w-full">
        <table className="w-full border-collapse table-auto">
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
              <th className="font-medium p-1 leading-tight">Supplier 1</th>
              <th className="font-medium p-1 leading-tight">Supplier 2</th>
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
              <td className="p-1.5 align-top border-b border-gray-100"><input type="text" className="w-full h-[26px] bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px]" /></td>
              <td className="p-1.5 align-top border-b border-gray-100"><input type="text" className="w-full h-[26px] bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px]" value={search} onChange={(e) => setSearch(e.target.value)} /></td>
              <td className="p-1.5 align-top border-b border-gray-100"><input type="text" className="w-full h-[26px] bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px]" /></td>
              <td className="p-1.5 align-top border-b border-gray-100"><input type="text" className="w-full h-[26px] bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px]" /></td>
              <td className="p-1.5 align-top border-b border-gray-100"><input type="text" className="w-full h-[26px] bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px]" /></td>
              <td className="p-1.5 align-top border-b border-gray-100 space-y-1 w-20">
                <input type="text" placeholder="min" className="w-full h-[26px] bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px] placeholder-gray-400" />
                <input type="text" placeholder="max" className="w-full h-[26px] bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px] placeholder-gray-400" />
              </td>
              <td className="p-1.5 align-top border-b border-gray-100 w-24">
                <select className="w-full h-[26px] bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px] appearance-none text-gray-500">
                  <option></option>
                </select>
              </td>
              <td className="p-1.5 align-top border-b border-gray-100 w-28">
                <select className="w-full h-[26px] bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px] appearance-none text-gray-500">
                  <option></option>
                </select>
              </td>
              <td className="p-1.5 align-top border-b border-gray-100 space-y-1 w-[120px]">
                <div className="relative"><input type="text" placeholder="min" className="w-full h-[26px] bg-[#F3F4F6] border-none rounded-sm pl-2 pr-6 focus:ring-1 focus:ring-blue-500 outline-none text-[11px] placeholder-gray-400" /><CalendarDays className="w-3.5 h-3.5 absolute right-1.5 top-1.5 text-gray-400 pointer-events-none" /></div>
                <div className="relative"><input type="text" placeholder="max" className="w-full h-[26px] bg-[#F3F4F6] border-none rounded-sm pl-2 pr-6 focus:ring-1 focus:ring-blue-500 outline-none text-[11px] placeholder-gray-400" /><CalendarDays className="w-3.5 h-3.5 absolute right-1.5 top-1.5 text-gray-400 pointer-events-none" /></div>
              </td>
              <td className="p-1.5 align-top border-b border-gray-100 space-y-1 w-[120px]">
                <div className="relative"><input type="text" placeholder="min" className="w-full h-[26px] bg-[#F3F4F6] border-none rounded-sm pl-2 pr-6 focus:ring-1 focus:ring-blue-500 outline-none text-[11px] placeholder-gray-400" /><CalendarDays className="w-3.5 h-3.5 absolute right-1.5 top-1.5 text-gray-400 pointer-events-none" /></div>
                <div className="relative"><input type="text" placeholder="max" className="w-full h-[26px] bg-[#F3F4F6] border-none rounded-sm pl-2 pr-6 focus:ring-1 focus:ring-blue-500 outline-none text-[11px] placeholder-gray-400" /><CalendarDays className="w-3.5 h-3.5 absolute right-1.5 top-1.5 text-gray-400 pointer-events-none" /></div>
              </td>
              <td className="p-1.5 align-top border-b border-gray-100 space-y-1 w-[120px]">
                <div className="relative"><input type="text" placeholder="min" className="w-full h-[26px] bg-[#F3F4F6] border-none rounded-sm pl-2 pr-6 focus:ring-1 focus:ring-blue-500 outline-none text-[11px] placeholder-gray-400" /><CalendarDays className="w-3.5 h-3.5 absolute right-1.5 top-1.5 text-gray-400 pointer-events-none" /></div>
                <div className="relative"><input type="text" placeholder="max" className="w-full h-[26px] bg-[#F3F4F6] border-none rounded-sm pl-2 pr-6 focus:ring-1 focus:ring-blue-500 outline-none text-[11px] placeholder-gray-400" /><CalendarDays className="w-3.5 h-3.5 absolute right-1.5 top-1.5 text-gray-400 pointer-events-none" /></div>
              </td>
              <td className="p-1.5 align-top border-b border-gray-100 w-24">
                <select className="w-full h-[26px] bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px] appearance-none text-gray-500">
                  <option></option>
                </select>
              </td>
              <td className="p-1.5 align-top border-b border-gray-100"><input type="text" className="w-full h-[26px] bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px]" /></td>
              <td className="p-1.5 align-top border-b border-gray-100 space-y-1 w-[120px]">
                <div className="relative"><input type="text" placeholder="min" className="w-full h-[26px] bg-[#F3F4F6] border-none rounded-sm pl-2 pr-6 focus:ring-1 focus:ring-blue-500 outline-none text-[11px] placeholder-gray-400" /><CalendarDays className="w-3.5 h-3.5 absolute right-1.5 top-1.5 text-gray-400 pointer-events-none" /></div>
                <div className="relative"><input type="text" placeholder="max" className="w-full h-[26px] bg-[#F3F4F6] border-none rounded-sm pl-2 pr-6 focus:ring-1 focus:ring-blue-500 outline-none text-[11px] placeholder-gray-400" /><CalendarDays className="w-3.5 h-3.5 absolute right-1.5 top-1.5 text-gray-400 pointer-events-none" /></div>
              </td>
              <td className="p-1.5 align-top border-b border-gray-100 space-y-1 w-24">
                <input type="text" placeholder="min" className="w-full h-[26px] bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px] placeholder-gray-400 text-right" />
                <input type="text" placeholder="max" className="w-full h-[26px] bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px] placeholder-gray-400 text-right" />
              </td>
              <td className="p-1.5 align-top border-b border-gray-100 space-y-1 w-20">
                <input type="text" placeholder="min" className="w-full h-[26px] bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px] placeholder-gray-400 text-right" />
                <input type="text" placeholder="max" className="w-full h-[26px] bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px] placeholder-gray-400 text-right" />
              </td>
              <td className="p-1.5 align-top border-b border-gray-100 space-y-1 w-20">
                <input type="text" placeholder="min" className="w-full h-[26px] bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px] placeholder-gray-400 text-right" />
                <input type="text" placeholder="max" className="w-full h-[26px] bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px] placeholder-gray-400 text-right" />
              </td>
              <td className="p-1.5 align-top border-b border-gray-100 space-y-1 w-20">
                <input type="text" placeholder="min" className="w-full h-[26px] bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px] placeholder-gray-400 text-right" />
                <input type="text" placeholder="max" className="w-full h-[26px] bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px] placeholder-gray-400 text-right" />
              </td>
              <td className="p-1.5 align-top border-b border-gray-100"><input type="text" className="w-full h-[26px] bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px]" /></td>
              <td className="p-1.5 align-top border-b border-gray-100"><input type="text" className="w-full h-[26px] bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px]" /></td>
              <td className="p-1.5 align-top border-b border-gray-100 text-center">
                <div className="flex items-center justify-end gap-2 pr-2 text-blue-600 font-medium pt-1">
                  <button className="hover:underline">Search</button>
                  <button className="text-gray-400 hover:underline">Clear</button>
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
                <td colSpan={22} className="text-center py-12 text-gray-500">Loading...</td>
              </tr>
            ) : filteredOrders.map((order: any, i: number) => {
              const isRed = order.parts_status === "Not booked";
              const isOrange = order.parts_status === "Requested";
              const rowTextColor = isRed ? "text-red-500" : (isOrange ? "text-orange-500" : "text-gray-800");

              return (
                <tr key={order.id || i} className={`hover:bg-gray-50 border-b border-gray-100 ${rowTextColor}`}>
                  <td className="p-1 text-center text-gray-400">{i + 1}</td>
                  <td className="p-1">{order.group_number}</td>
                  <td className="p-1">{order.mo_number}</td>
                  <td className="p-1">{order.group_name}</td>
                  <td className="p-1">{order.part_no}</td>
                  <td className="p-1">{order.part_description}</td>
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
                  <td className="p-1"></td>
                  <td className="p-1"></td>
                  <td className="p-1 text-right">
                    <div className="flex items-center justify-end gap-3 pr-2">
                      <Edit2 className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600 cursor-pointer" />
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
      
      <div className="flex justify-center mt-6 pb-6">
        <button className="text-blue-600 font-medium text-[13px] hover:underline bg-transparent border-none">
          Load more
        </button>
      </div>
    </div>
  );
}
