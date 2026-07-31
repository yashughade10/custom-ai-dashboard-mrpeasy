"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { mrpApi } from "@/services/mrpApi";
import { Edit2, BarChart2, CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

type WorkstationGroupsTableProps = {
  onEdit?: (id: string) => void;
};

export default function WorkstationGroupsTable({ onEdit }: WorkstationGroupsTableProps) {
  const [filters, setFilters] = useState({
    search: "",
    minInstances: "",
    maxInstances: ""
  });

  const { data, isLoading } = useQuery({
    queryKey: ["mrp-workstation-groups", filters],
    queryFn: () => mrpApi.getWorkstationGroups(1, 100, filters),
  });

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleClear = () => {
    setFilters({ search: "", minInstances: "", maxInstances: "" });
  };

  const workstationGroups = data?.data || [];

  return (
    <div className="flex flex-col min-w-[800px]">
      <table className="w-full text-left border-collapse text-[12px] text-gray-700">
        <thead>
          {/* Header Row */}
          <tr className="bg-[#f4f5f8] border-b border-white">
            <th className="font-medium p-2 border-r border-white w-10 text-center">+</th>
            <th className="font-medium p-2 border-r border-white w-32 cursor-pointer hover:bg-gray-200">
              <div className="flex items-center">
                Number <span className="ml-1 text-xs">↑</span>
              </div>
            </th>
            <th className="font-medium p-2 border-r border-white min-w-[200px]">Name</th>
            <th className="font-medium p-2 border-r border-white w-48">Type</th>
            <th className="font-medium p-2 border-r border-white w-24">Number of<br/>instances</th>
            <th className="font-medium p-2 w-16 text-center">+</th>
          </tr>

          {/* Filter Row */}
          <tr className="bg-[#f4f5f8] border-b border-gray-200">
            <td className="p-1 border-r border-white text-center">
              <div className="flex justify-center">
                <CheckSquare className="w-4 h-4 text-gray-400" />
              </div>
            </td>
            <td className="p-1 border-r border-white">
              <input
                type="text"
                className="w-full h-[26px] border border-gray-300 rounded-sm px-2 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
              />
            </td>
            <td className="p-1 border-r border-white">
              <input
                type="text"
                className="w-full h-[26px] border border-gray-300 rounded-sm px-2 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
              />
            </td>
            <td className="p-1 border-r border-white flex gap-1">
              <select className="flex-1 h-[26px] border border-gray-300 rounded-sm px-1 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-[11px]">
                <option value=""></option>
                <option value="Active processing">Active processing</option>
              </select>
            </td>
            <td className="p-1 border-r border-white">
              <div className="flex flex-col gap-1">
                <input
                  type="text"
                  placeholder="min"
                  className="w-full h-[20px] border border-gray-300 rounded-sm px-1 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-[10px]"
                  value={filters.minInstances}
                  onChange={(e) => handleFilterChange("minInstances", e.target.value)}
                />
                <input
                  type="text"
                  placeholder="max"
                  className="w-full h-[20px] border border-gray-300 rounded-sm px-1 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-[10px]"
                  value={filters.maxInstances}
                  onChange={(e) => handleFilterChange("maxInstances", e.target.value)}
                />
              </div>
            </td>
            <td className="p-1">
              <div className="flex flex-col gap-1 h-full items-center justify-center">
                <Button variant="ghost" className="h-5 text-[10px] text-blue-600 font-medium px-2 hover:bg-blue-50" onClick={() => {}}>Search</Button>
                <Button variant="ghost" className="h-5 text-[10px] text-blue-600 font-medium px-2 hover:bg-blue-50" onClick={handleClear}>Clear</Button>
              </div>
            </td>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr>
              <td colSpan={6} className="p-4 text-center text-gray-500">Loading...</td>
            </tr>
          ) : workstationGroups.length === 0 ? (
            <tr>
              <td colSpan={6} className="p-4 text-center text-gray-500">No workstation groups found</td>
            </tr>
          ) : (
            workstationGroups.map((group: any, index: number) => (
              <tr 
                key={group.id || index} 
                className={`border-b border-gray-100 hover:bg-blue-50 ${index % 2 === 0 ? "bg-white" : "bg-[#f9fafb]"}`}
              >
                <td className="p-1.5 text-center text-gray-400">{index + 1}</td>
                <td className="p-1.5">{group.number}</td>
                <td className="p-1.5">{group.name}</td>
                <td className="p-1.5">{group.type}</td>
                <td className="p-1.5 text-center">{group.instances}</td>
                <td className="p-1.5 text-right w-16">
                  <div className="flex items-center justify-end gap-3 pr-2">
                    <Edit2 
                      className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600 cursor-pointer" 
                      onClick={() => onEdit && group.id && onEdit(group.id)}
                    />
                    <BarChart2 className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600 cursor-pointer transform -rotate-90" />
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
