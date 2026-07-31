"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { mrpApi } from "@/services/mrpApi";
import { Plus, Edit2, BarChart2, CheckSquare } from "lucide-react";
import { toast } from "sonner";

type WorkstationsTableProps = {
  onEdit?: (id: string) => void;
};

export default function WorkstationsTable({ onEdit }: WorkstationsTableProps) {
  const [filters, setFilters] = useState({
    search: "",
    minHourlyRate: "",
    maxHourlyRate: "",
    minProductivity: "",
    maxProductivity: ""
  });

  const { data: workstationsData, isLoading } = useQuery({
    queryKey: ["mrp-workstations", filters],
    queryFn: () => mrpApi.getWorkstations(1, 100, filters),
  });

  const allWorkstations = workstationsData?.data || [];

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      minHourlyRate: "",
      maxHourlyRate: "",
      minProductivity: "",
      maxProductivity: ""
    });
  };

  return (
    <div className="w-full bg-white text-[12px] text-gray-800">
      <div className="overflow-hidden w-full">
        <table className="w-full border-collapse table-auto">
          <thead>
            {/* Main Header */}
            <tr className="text-left font-medium text-gray-700 bg-white">
              <th className="font-medium p-1 w-8 text-center text-gray-400">+</th>
              <th className="font-medium p-1 leading-tight w-48">Number</th>
              <th className="font-medium p-1 leading-tight flex items-center gap-1">Name <span className="text-gray-400">↑</span></th>
              <th className="font-medium p-1 leading-tight w-64">Type</th>
              <th className="font-medium p-1 leading-tight w-32">Hourly rate</th>
              <th className="font-medium p-1 leading-tight w-32">Productivity</th>
              <th className="font-medium p-1 w-12 text-center text-gray-500 font-bold">+</th>
              <th className="font-medium p-1 w-8 text-center text-gray-500">
                <span className="cursor-pointer border-gray-400 border rounded-sm px-1 leading-none inline-flex items-center justify-center">?</span>
              </th>
            </tr>
            {/* Filter Row */}
            <tr className="bg-white border-t border-gray-100">
              <td className="p-1.5 text-center align-top border-b border-gray-100">
                <span className="text-gray-400 cursor-pointer border border-gray-300 px-1.5 py-0.5 rounded-sm">?</span>
              </td>
              <td className="p-1.5 align-top border-b border-gray-100">
                <input 
                  type="text" 
                  className="w-full h-[26px] bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px]" 
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                />
              </td>
              <td className="p-1.5 align-top border-b border-gray-100">
                <input 
                  type="text" 
                  className="w-full h-[26px] bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px]" 
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                />
              </td>
              <td className="p-1.5 align-top border-b border-gray-100">
                <select className="w-full h-[26px] bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px] text-gray-500">
                  <option value=""></option>
                </select>
              </td>
              <td className="p-1.5 align-top border-b border-gray-100 space-y-1">
                <input 
                  type="text" 
                  placeholder="min" 
                  className="w-full h-[26px] bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px] placeholder-gray-400" 
                  value={filters.minHourlyRate}
                  onChange={(e) => handleFilterChange("minHourlyRate", e.target.value)}
                />
                <input 
                  type="text" 
                  placeholder="max" 
                  className="w-full h-[26px] bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px] placeholder-gray-400" 
                  value={filters.maxHourlyRate}
                  onChange={(e) => handleFilterChange("maxHourlyRate", e.target.value)}
                />
              </td>
              <td className="p-1.5 align-top border-b border-gray-100 space-y-1">
                <input 
                  type="text" 
                  placeholder="min" 
                  className="w-full h-[26px] bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px] placeholder-gray-400" 
                  value={filters.minProductivity}
                  onChange={(e) => handleFilterChange("minProductivity", e.target.value)}
                />
                <input 
                  type="text" 
                  placeholder="max" 
                  className="w-full h-[26px] bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px] placeholder-gray-400" 
                  value={filters.maxProductivity}
                  onChange={(e) => handleFilterChange("maxProductivity", e.target.value)}
                />
              </td>
              <td colSpan={2} className="p-1.5 align-top border-b border-gray-100 text-center">
                <div className="flex flex-col items-center justify-start gap-2 text-blue-600 font-medium pt-1">
                  <button className="hover:underline text-[11px]">Search</button>
                  <button className="text-gray-400 hover:underline text-[11px]" onClick={clearFilters}>Clear</button>
                </div>
              </td>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-gray-500">Loading...</td>
              </tr>
            ) : allWorkstations.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-gray-500">No workstations found.</td>
              </tr>
            ) : allWorkstations.map((ws: any, i: number) => {
              return (
                <tr key={ws.id || i} className="hover:bg-gray-50 border-b border-gray-100 text-gray-800">
                  <td className="p-1.5 text-center text-gray-400 w-8">{i + 1}</td>
                  <td className="p-1.5">{ws.number}</td>
                  <td className="p-1.5">{ws.name}</td>
                  <td className="p-1.5">{ws.type_group}</td>
                  <td className="p-1.5">$ {parseFloat(ws.hourly_rate || 0).toFixed(2)}</td>
                  <td className="p-1.5">{parseFloat(ws.productivity || 1).toFixed(2)}</td>
                  <td colSpan={2} className="p-1.5 text-right w-16">
                    <div className="flex items-center justify-end gap-3 pr-2">
                      <Edit2 
                        className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600 cursor-pointer" 
                        onClick={() => onEdit && ws.id && onEdit(ws.id)}
                      />
                      <BarChart2 className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600 cursor-pointer transform -rotate-90" />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
