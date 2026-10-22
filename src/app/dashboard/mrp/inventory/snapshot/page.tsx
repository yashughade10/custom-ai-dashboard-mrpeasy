"use client";

import { useState, useMemo, useEffect } from "react";
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { mrpApi } from "@/services/mrpApi";
import { RouteGuard } from "@/components/auth/RouteGuard";
import { MrpTabBar } from "@/components/mrp/MrpTabBar";
import { toast } from "sonner";
import { Download } from "lucide-react";
import { format } from "date-fns";

const stockTabs = [
  { name: "Items", href: "/dashboard/mrp/inventory" },
  { name: "Stock settings", href: "/dashboard/mrp/inventory/settings" },
  { name: "Stock lots", href: "/dashboard/mrp/inventory/lots" },
  { name: "Shipments", href: "/dashboard/mrp/inventory/shipments" },
  { name: "Inventory", href: "/dashboard/mrp/inventory/snapshot" },
  { name: "Critical on-hand", href: "/dashboard/mrp/inventory/critical" },
  { name: "Write-offs", href: "/dashboard/mrp/inventory/writeoffs" },
  { name: "Stock movement", href: "/dashboard/mrp/inventory/movement" },
  { name: "Statistics", href: "/dashboard/mrp/inventory/statistics" },
];

export default function InventorySnapshotPage() {
  const queryClient = useQueryClient();
  const [selectedLocation, setSelectedLocation] = useState("All locations");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  
  // Filters
  const [qtyMin, setQtyMin] = useState("");
  const [qtyMax, setQtyMax] = useState("");
  const [costMin, setCostMin] = useState("");
  const [costMax, setCostMax] = useState("");
  
  // Search Filters
  const [searchPartNo, setSearchPartNo] = useState("");
  const [searchGroupNo, setSearchGroupNo] = useState("");
  const [searchGroupName, setSearchGroupName] = useState("");
  const [searchPartDesc, setSearchPartDesc] = useState("");

  // Debounced filters
  const [debouncedParams, setDebouncedParams] = useState({
    qtyMin: "", qtyMax: "", costMin: "", costMax: "",
    searchPartNo: "", searchGroupNo: "", searchGroupName: "", searchPartDesc: ""
  });

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedParams({
        qtyMin, qtyMax, costMin, costMax,
        searchPartNo, searchGroupNo, searchGroupName, searchPartDesc
      });
    }, 300);
    return () => clearTimeout(handler);
  }, [qtyMin, qtyMax, costMin, costMax, searchPartNo, searchGroupNo, searchGroupName, searchPartDesc]);

  // Pending edits
  const [edits, setEdits] = useState<Record<string, string>>({});
  const limit = 50;

  const { data: locsRes } = useQuery({
    queryKey: ["mrpStorageLocations"],
    queryFn: () => mrpApi.getStorageLocations(),
  });
  
  const { 
    data: invRes, 
    isLoading,
    isFetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteQuery({
    queryKey: [
      "mrpInventorySnapshot", 
      selectedLocation, 
      debouncedParams
    ],
    initialPageParam: 1,
    queryFn: ({ pageParam = 1 }) => mrpApi.getInventorySnapshot({
      location: selectedLocation === "All locations" ? "" : selectedLocation,
      page: pageParam,
      limit,
      qtyMin: debouncedParams.qtyMin,
      qtyMax: debouncedParams.qtyMax,
      costMin: debouncedParams.costMin,
      costMax: debouncedParams.costMax,
      partNo: debouncedParams.searchPartNo,
      groupNo: debouncedParams.searchGroupNo,
      groupName: debouncedParams.searchGroupName,
      partDesc: debouncedParams.searchPartDesc
    }),
    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.totalPages) {
        return lastPage.page + 1;
      }
      return undefined;
    }
  });

  const locations = locsRes?.data || [];

  const inventory = useMemo(() => {
    if (!invRes?.pages) return [];
    return invRes.pages.flatMap((page: any) => page.data || []);
  }, [invRes]);

  const totalQty = invRes?.pages?.[0]?.totalQty ?? 0;
  const totalCost = invRes?.pages?.[0]?.totalCost ?? 0;
  const totalCount = invRes?.pages?.[0]?.totalCount ?? 0;

  const updateMutation = useMutation({
    mutationFn: (data: { part_no: string; new_quantity: number; location?: string }) => 
      mrpApi.updatePhysicalQuantity(data),
    onSuccess: () => {
      toast.success("Physical quantity updated successfully");
      queryClient.invalidateQueries({ queryKey: ["mrpInventorySnapshot"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update quantity");
    }
  });

  const handleSave = (partNo: string) => {
    const val = edits[partNo];
    if (val === undefined || val === "") return;
    
    updateMutation.mutate({
      part_no: partNo,
      new_quantity: Number(val),
      location: selectedLocation === "All locations" ? undefined : selectedLocation
    });
    
    const newEdits = { ...edits };
    delete newEdits[partNo];
    setEdits(newEdits);
  };

  const handleClearFilters = () => {
    setQtyMin("");
    setQtyMax("");
    setCostMin("");
    setCostMax("");
    setSearchPartNo("");
    setSearchGroupNo("");
    setSearchGroupName("");
    setSearchPartDesc("");
  };

  return (
    <RouteGuard module="inventory" fallback={<div>Access Denied</div>}>
      <div className="flex flex-col h-full bg-[#f4f7fb] min-h-[calc(100vh-4rem)] p-4 -m-4 sm:-m-6 lg:-m-8">
        <div className="bg-white rounded-md shadow-sm flex flex-col min-h-[80vh]">
          <MrpTabBar tabs={stockTabs} />
          
          <div className="px-6 py-4 flex-1 flex flex-col w-full">
            {/* Header Area */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <h1 className="text-2xl text-[#1a2b49]">Inventory</h1>
                
                <div className="flex items-center gap-2 text-sm ml-4">
                  <span className="text-gray-600">Choose date:</span>
                  <div className="relative">
                    <input 
                      type="date" 
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="border border-gray-300 rounded px-3 py-1.5 text-sm bg-gray-50 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
                
                <div className="ml-2 flex items-center">
                  <select
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="border border-gray-300 rounded px-3 py-1.5 text-sm bg-gray-50 focus:outline-none focus:border-blue-500 w-48"
                  >
                    <option value="All locations">All locations</option>
                    {locations.map((loc: any) => (
                      <option key={loc.id} value={loc.name}>{loc.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button 
                  className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-medium rounded border border-gray-200 hover:bg-gray-200"
                  onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:4000/api"}/mrp/stock/inventory/export/pdf`, "_blank")}
                >
                  <Download className="w-4 h-4" /> PDF
                </button>
                <button 
                  className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-medium rounded border border-gray-200 hover:bg-gray-200"
                  onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:4000/api"}/mrp/stock/inventory/export/csv`, "_blank")}
                >
                  <Download className="w-4 h-4" /> CSV
                </button>
              </div>
            </div>
            
            {/* Table Area */}
            <div className="w-full relative">
              {isFetching && !isFetchingNextPage && (
                <div className="absolute top-2 right-2 z-20 flex items-center gap-1.5 bg-white/90 border border-blue-200 px-2 py-1 rounded shadow-xs text-xs text-blue-600">
                  <span className="inline-block w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></span>
                  <span>Searching...</span>
                </div>
              )}
              <table className="w-full text-sm text-left border border-gray-200">
                <thead className="bg-[#f0f4f8] text-gray-700 font-semibold border-b border-gray-300">
                  <tr>
                    <th className="px-3 py-2 w-10 border-r border-gray-300 text-center">#</th>
                    <th className="px-3 py-2 border-r border-gray-300 whitespace-nowrap">Part No.</th>
                    <th className="px-3 py-2 border-r border-gray-300 whitespace-nowrap">Group number</th>
                    <th className="px-3 py-2 border-r border-gray-300 whitespace-nowrap">Group name</th>
                    <th className="px-3 py-2 border-r border-gray-300 whitespace-nowrap w-32">Quantity</th>
                    <th className="px-3 py-2 border-r border-gray-300 whitespace-nowrap w-32">Cost</th>
                    <th className="px-3 py-2 border-r border-gray-300 whitespace-nowrap">Part description</th>
                    <th className="px-3 py-2 border-r border-gray-300 whitespace-nowrap w-40 text-center">Physical quantity</th>
                    <th className="px-3 py-2 border-r border-gray-300 whitespace-nowrap w-24 text-center">Actions</th>
                  </tr>
                  
                  {/* Search Row */}
                  <tr className="bg-white border-b border-gray-300">
                    <th className="px-2 py-1 border-r border-gray-300 bg-[#f9fafb]"></th>
                    <th className="px-1 py-1 border-r border-gray-300 font-normal">
                      <input type="text" placeholder="Search Part No..." value={searchPartNo} onChange={e => setSearchPartNo(e.target.value)} className="w-full h-7 px-2 text-xs border border-gray-300 rounded-sm focus:outline-none focus:border-blue-500" />
                    </th>
                    <th className="px-1 py-1 border-r border-gray-300 font-normal">
                      <input type="text" placeholder="Search Group No..." value={searchGroupNo} onChange={e => setSearchGroupNo(e.target.value)} className="w-full h-7 px-2 text-xs border border-gray-300 rounded-sm focus:outline-none focus:border-blue-500" />
                    </th>
                    <th className="px-1 py-1 border-r border-gray-300 font-normal">
                      <input type="text" placeholder="Search Group Name..." value={searchGroupName} onChange={e => setSearchGroupName(e.target.value)} className="w-full h-7 px-2 text-xs border border-gray-300 rounded-sm focus:outline-none focus:border-blue-500" />
                    </th>
                    <th className="px-1 py-1 border-r border-gray-300 font-normal">
                      <div className="flex flex-col gap-1">
                        <input type="number" placeholder="min" value={qtyMin} onChange={e => setQtyMin(e.target.value)} className="w-full h-7 px-2 text-xs border border-gray-300 rounded-sm focus:outline-none focus:border-blue-500" />
                        <input type="number" placeholder="max" value={qtyMax} onChange={e => setQtyMax(e.target.value)} className="w-full h-7 px-2 text-xs border border-gray-300 rounded-sm focus:outline-none focus:border-blue-500" />
                      </div>
                    </th>
                    <th className="px-1 py-1 border-r border-gray-300 font-normal">
                      <div className="flex flex-col gap-1">
                        <input type="number" placeholder="min" value={costMin} onChange={e => setCostMin(e.target.value)} className="w-full h-7 px-2 text-xs border border-gray-300 rounded-sm focus:outline-none focus:border-blue-500" />
                        <input type="number" placeholder="max" value={costMax} onChange={e => setCostMax(e.target.value)} className="w-full h-7 px-2 text-xs border border-gray-300 rounded-sm focus:outline-none focus:border-blue-500" />
                      </div>
                    </th>
                    <th className="px-1 py-1 border-r border-gray-300 font-normal">
                      <input type="text" placeholder="Search Description..." value={searchPartDesc} onChange={e => setSearchPartDesc(e.target.value)} className="w-full h-7 px-2 text-xs border border-gray-300 rounded-sm focus:outline-none focus:border-blue-500" />
                    </th>
                    <th className="px-1 py-1 border-r border-gray-300 font-normal text-center">
                      <div className="flex gap-2 justify-center">
                        <button onClick={handleClearFilters} className="text-blue-600 font-medium hover:underline text-xs">Clear</button>
                      </div>
                    </th>
                    <th className="px-1 py-1 border-r border-gray-300 font-normal"></th>
                  </tr>
                  
                  {/* Totals Row */}
                  <tr className="bg-white border-b-2 border-gray-300 font-bold text-[#1a2b49]">
                    <td className="px-3 py-2 border-r border-gray-300" colSpan={4}>Total:</td>
                    <td className="px-3 py-2 border-r border-gray-300">{totalQty.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</td>
                    <td className="px-3 py-2 border-r border-gray-300">${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td colSpan={3} className="px-3 py-2 border-r border-gray-300"></td>
                  </tr>
                </thead>
                
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-8 text-center text-gray-500">Loading inventory...</td>
                    </tr>
                  ) : inventory.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-8 text-center text-gray-500">No inventory found</td>
                    </tr>
                  ) : (
                    inventory.map((item: any, index: number) => (
                      <tr key={item.part_no} className="border-b border-gray-200 hover:bg-[#f0f7ff] transition-colors">
                        <td className="px-3 py-1.5 border-r border-gray-200 text-gray-500 w-10 text-center">{index + 1}</td>
                        <td className="px-3 py-1.5 border-r border-gray-200 truncate max-w-[150px]">{item.part_no}</td>
                        <td className="px-3 py-1.5 border-r border-gray-200 truncate max-w-[150px]">{item.group_number}</td>
                        <td className="px-3 py-1.5 border-r border-gray-200 truncate max-w-[200px]">{item.group_name}</td>
                        <td className="px-3 py-1.5 border-r border-gray-200">{Number(item.quantity).toLocaleString()} {item.uom}</td>
                        <td className="px-3 py-1.5 border-r border-gray-200">${Number(item.cost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td className="px-3 py-1.5 border-r border-gray-200 whitespace-pre-wrap max-w-[320px] leading-relaxed align-top" title={item.part_description}>{item.part_description}</td>
                        <td className="px-3 py-1.5 border-r border-gray-200">
                          <div className="flex items-center gap-2 justify-end">
                            <input
                              type="number"
                              className="w-20 px-2 py-1 h-7 border border-gray-300 rounded-sm focus:outline-none focus:border-blue-500 text-right"
                              value={edits[item.part_no] !== undefined ? edits[item.part_no] : ""}
                              onChange={(e) => setEdits({ ...edits, [item.part_no]: e.target.value })}
                            />
                            <span className="w-8 text-gray-500 text-xs">{item.uom}</span>
                          </div>
                        </td>
                        <td className="px-3 py-1.5 border-r border-gray-200 text-center">
                          <button
                            onClick={() => handleSave(item.part_no)}
                            disabled={edits[item.part_no] === undefined || edits[item.part_no] === ""}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded disabled:opacity-50 font-medium text-xs w-full max-w-[80px]"
                          >
                            Save
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Load More Control */}
            {inventory.length > 0 && (
              <div className="mt-4 mb-2 flex flex-col sm:flex-row items-center justify-center gap-2 py-3">
                {hasNextPage && (
                  <button
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                    className="text-blue-600 hover:text-blue-800 hover:underline text-sm font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-transparent border-none py-1.5 px-4 rounded transition-colors inline-flex items-center gap-2"
                  >
                    {isFetchingNextPage ? (
                      <>
                        <span className="inline-block w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></span>
                        <span>Loading more...</span>
                      </>
                    ) : (
                      "Load more"
                    )}
                  </button>
                )}
                {totalCount > 0 && (
                  <span className="text-gray-400 text-xs">
                    (Showing {inventory.length} of {totalCount.toLocaleString()} items)
                  </span>
                )}
              </div>
            )}
            
          </div>
        </div>
      </div>
    </RouteGuard>
  );
}
