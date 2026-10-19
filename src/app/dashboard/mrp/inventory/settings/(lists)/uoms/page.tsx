"use client";

import { useState, useEffect } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { mrpApi } from "@/services/mrpApi";
import { MrpDataTable, Column } from "@/components/mrp/MrpDataTable";
import { useRouter } from "next/navigation";

export default function UomsList() {
  const router = useRouter();
  const [limit, setLimit] = useState(10);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [debouncedFilters, setDebouncedFilters] = useState<Record<string, string>>({});

  // Debounce filters to avoid excessive requests while typing
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedFilters(filters);
      setLimit(10); // Reset limit to 10 when search filters change
    }, 300);
    return () => clearTimeout(handler);
  }, [filters]);

  const { data: uomsData, isLoading, isFetching } = useQuery({
    queryKey: ["mrpUoms", limit, debouncedFilters],
    queryFn: () => mrpApi.getUoms(1, limit, "", debouncedFilters),
    placeholderData: keepPreviousData,
  });

  const columns: Column<any>[] = [
    { header: "Unit of measurement", accessorKey: "name", sortable: true, searchable: true }
  ];

  const uoms = uomsData?.data || [];
  const pagination = uomsData?.pagination;
  const total = pagination?.total ?? 0;
  const hasMore = pagination ? total > uoms.length : uoms.length >= limit;

  const handleLoadMore = () => {
    setLimit((prev) => prev + 10);
  };

  return (
    <div className="flex flex-col w-full pb-6">
      {isLoading ? (
        <div className="p-8 text-center text-gray-500">Loading units of measurement...</div>
      ) : (
        <div className="flex flex-col relative w-full">
          {isFetching && (
            <div className="absolute top-2 right-2 z-20 flex items-center gap-1.5 bg-white/90 border border-blue-200 px-2 py-1 rounded shadow-xs text-xs text-blue-600">
              <span className="inline-block w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></span>
              <span>Searching...</span>
            </div>
          )}
          
          <MrpDataTable 
            columns={columns} 
            data={uoms} 
            onFilterChange={(f) => setFilters(f)}
            onRowClick={(row) => router.push(`/dashboard/mrp/inventory/settings/uoms/${row.id}`)}
            className="w-full"
          />

          {uoms.length > 0 && (
            <div className="mt-4 mb-2 flex flex-col sm:flex-row items-center justify-center gap-2 py-3">
              {hasMore && (
                <button
                  onClick={handleLoadMore}
                  disabled={isFetching}
                  className="text-blue-600 hover:text-blue-800 hover:underline text-sm font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-transparent border-none py-1.5 px-4 rounded transition-colors inline-flex items-center gap-2"
                >
                  {isFetching && limit > 10 ? (
                    <>
                      <span className="inline-block w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></span>
                      <span>Loading more...</span>
                    </>
                  ) : (
                    "Load more"
                  )}
                </button>
              )}
              {total > 0 && (
                <span className="text-gray-400 text-xs">
                  (Showing {uoms.length} of {total.toLocaleString()} units of measurement)
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
