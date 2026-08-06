"use client";

import { useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { mrpApi } from "@/services/mrpApi";
import { Edit2, BarChart2, CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

type BomsTableProps = {
  onEdit?: (id: string) => void;
};

export default function BomsTable({ onEdit }: BomsTableProps) {
  const [filters, setFilters] = useState({
    search: "",
    minCost: "",
    maxCost: ""
  });

  const { 
    data, 
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage
  } = useInfiniteQuery({
    queryKey: ["mrp-boms", filters],
    queryFn: ({ pageParam = 1 }) => mrpApi.getBoms(pageParam, 20, filters),
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination && lastPage.pagination.page < lastPage.pagination.totalPages) {
        return lastPage.pagination.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
  });

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleClear = () => {
    setFilters({ search: "", minCost: "", maxCost: "" });
  };

  const boms = data?.pages.flatMap(page => page.data || []) || [];

  return (
    <div className="flex flex-col min-w-[1200px]">
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
            <th className="font-medium p-2 border-r border-white w-32">Part No.</th>
            <th className="font-medium p-2 border-r border-white min-w-[200px]">Part description</th>
            <th className="font-medium p-2 border-r border-white w-32">Group number</th>
            <th className="font-medium p-2 border-r border-white min-w-[150px]">Group name</th>
            <th className="font-medium p-2 border-r border-white w-32">Approximate cost</th>
            <th className="font-medium p-2 w-20 text-center">+</th>
          </tr>

          {/* Filter Row */}
          <tr className="bg-[#f4f5f8] border-b border-gray-200">
            <td className="p-1 border-r border-white text-center">
              <div className="flex justify-center">
                <CheckSquare className="w-4 h-4 text-gray-400" />
              </div>
            </td>
            <td className="p-1 border-r border-white" colSpan={6}>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="w-full h-[26px] border border-gray-300 rounded-sm px-2 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  placeholder="Search by Number, Name, Part, Group..."
                />
              </div>
            </td>
            <td className="p-1 border-r border-white">
              <div className="flex flex-col gap-1">
                <input
                  type="text"
                  placeholder="min"
                  className="w-full h-[20px] border border-gray-300 rounded-sm px-1 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-[10px]"
                  value={filters.minCost}
                  onChange={(e) => handleFilterChange("minCost", e.target.value)}
                />
                <input
                  type="text"
                  placeholder="max"
                  className="w-full h-[20px] border border-gray-300 rounded-sm px-1 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-[10px]"
                  value={filters.maxCost}
                  onChange={(e) => handleFilterChange("maxCost", e.target.value)}
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
              <td colSpan={9} className="p-4 text-center text-gray-500">Loading...</td>
            </tr>
          ) : boms.length === 0 ? (
            <tr>
              <td colSpan={9} className="p-4 text-center text-gray-500">No BOMs found</td>
            </tr>
          ) : (
            boms.map((bom: any, index: number) => (
              <tr 
                key={bom.id || bom.bom_id || index} 
                className={`border-b border-gray-100 hover:bg-blue-50 ${index % 2 === 0 ? "bg-white" : "bg-[#f9fafb]"}`}
              >
                <td className="p-1.5 text-center text-gray-400">{index + 1}</td>
                <td className="p-1.5 font-medium">{bom.number || bom.code}</td>
                <td className="p-1.5">{bom.name || bom.title}</td>
                <td className="p-1.5">{bom.part_number || bom.product_code}</td>
                <td className="p-1.5">{bom.part_description || bom.product_title}</td>
                <td className="p-1.5">{bom.group_number || bom.article_group_code}</td>
                <td className="p-1.5">{bom.group_name || bom.article_group_title}</td>
                <td className="p-1.5">{bom.cost ? bom.cost.replace(/&nbsp;/g, ' ') : `$${parseFloat(bom.approximate_cost || 0).toFixed(2)}`}</td>
                <td className="p-1.5 text-right w-20">
                  <div className="flex items-center justify-end gap-3 pr-2">
                    <Edit2 
                      className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600 cursor-pointer" 
                      onClick={() => onEdit && (bom.id || bom.bom_id) && onEdit(bom.id || bom.bom_id)}
                    />
                    <BarChart2 className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600 cursor-pointer transform -rotate-90" />
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      
      {hasNextPage && (
        <div className="flex justify-center py-4 bg-white border-t border-gray-200">
          <Button 
            variant="ghost" 
            className="text-blue-600 text-xs font-medium hover:bg-blue-50"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? "Loading more..." : "Load more"}
          </Button>
        </div>
      )}
    </div>
  );
}
