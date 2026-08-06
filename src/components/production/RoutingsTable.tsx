"use client";

import { useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { mrpApi } from "@/services/mrpApi";
import { Edit2, BarChart2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type RoutingsTableProps = {
  onEdit?: (id: string) => void;
};

export default function RoutingsTable({ onEdit }: RoutingsTableProps) {
  const [filters, setFilters] = useState({
    search: ""
  });

  const { 
    data, 
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage
  } = useInfiniteQuery({
    queryKey: ["mrp-routings", filters],
    queryFn: ({ pageParam = 1 }) => mrpApi.getRoutings(pageParam, 20, filters),
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
    setFilters({ search: "" });
  };

  const routings = data?.pages.flatMap(page => page.data || []) || [];

  return (
    <div className="flex flex-col min-w-[1200px]">
      <table className="w-full text-left border-collapse text-[12px] text-gray-700">
        <thead>
          <tr className="bg-[#f4f5f8] border-b border-white">
            <th className="font-medium p-2 border-r border-white w-10 text-center">+</th>
            <th className="font-medium p-2 border-r border-white w-32 cursor-pointer hover:bg-gray-200">
              <div className="flex items-center">
                Number <span className="ml-1 text-xs">↑</span>
              </div>
            </th>
            <th className="font-medium p-2 border-r border-white w-64 cursor-pointer hover:bg-gray-200">
              Product
            </th>
            <th className="font-medium p-2 border-r border-white flex-1 cursor-pointer hover:bg-gray-200">
              Name
            </th>
          </tr>
          <tr className="bg-[#f4f5f8] border-b border-gray-200">
            <td className="p-1 border-r border-white text-center">
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-blue-600" onClick={handleClear}>
                ✗
              </Button>
            </td>
            <td className="p-1 border-r border-white">
              <input 
                type="text" 
                className="w-full border border-gray-300 rounded px-2 py-1 outline-none focus:border-blue-500" 
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
              />
            </td>
            <td className="p-1 border-r border-white"></td>
            <td className="p-1 border-r border-white"></td>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr>
              <td colSpan={4} className="p-8 text-center text-gray-500">Loading...</td>
            </tr>
          ) : routings.length === 0 ? (
            <tr>
              <td colSpan={4} className="p-8 text-center text-gray-500">No routings found</td>
            </tr>
          ) : (
            routings.map((routing: any) => (
              <tr key={routing.id} className="border-b border-gray-100 hover:bg-blue-50/50 group">
                <td className="p-2 border-r border-white text-center relative">
                  <span className="group-hover:hidden text-gray-400">
                    <BarChart2 className="w-4 h-4 mx-auto" />
                  </span>
                  <div className="hidden group-hover:flex items-center justify-center gap-1">
                    <button 
                      className="p-1 hover:bg-white rounded text-gray-600 hover:text-blue-600 transition-colors"
                      title="Edit Routing"
                      onClick={() => onEdit && onEdit(routing.id)}
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                  </div>
                </td>
                <td className="p-2 border-r border-white font-medium text-blue-600 hover:underline cursor-pointer" onClick={() => onEdit && onEdit(routing.id)}>
                  {routing.routing_number}
                </td>
                <td className="p-2 border-r border-white">{routing.product_number} {routing.product_name}</td>
                <td className="p-2 border-r border-white">{routing.routing_name}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      
      {hasNextPage && (
        <div className="p-4 flex justify-center">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => fetchNextPage()} 
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? "Loading more..." : "Load More"}
          </Button>
        </div>
      )}
      
      <div className="p-2 text-xs text-gray-500">
        Total Routings: {data?.pages[0]?.pagination?.total || 0}
      </div>
    </div>
  );
}
