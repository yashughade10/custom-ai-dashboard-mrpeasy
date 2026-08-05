"use client";

import { useState, useMemo } from "react";
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { mrpApi } from "@/services/mrpApi";
import { RouteGuard } from "@/components/auth/RouteGuard";
import { MrpTabBar } from "@/components/mrp/MrpTabBar";
import { toast } from "sonner";
import { Calendar, Download, Upload, Save } from "lucide-react";
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
  
  // Pending edits
  const [edits, setEdits] = useState<Record<string, string>>({});
  
  // Search Filters
  const [searchPartNo, setSearchPartNo] = useState("");
  const [searchGroupNo, setSearchGroupNo] = useState("");
  const [searchGroupName, setSearchGroupName] = useState("");
  const [searchPartDesc, setSearchPartDesc] = useState("");

  const limit = 50;

  const { data: locsRes } = useQuery({
    queryKey: ["mrpStorageLocations"],
    queryFn: () => mrpApi.getStorageLocations(),
  });
  
  const { 
    data: invRes, 
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteQuery({
    queryKey: [
      "mrpInventorySnapshot", 
      selectedLocation, 
      qtyMin, qtyMax, costMin, costMax, 
      searchPartNo, searchGroupNo, searchGroupName, searchPartDesc
    ],
    initialPageParam: 1,
    queryFn: ({ pageParam = 1 }) => mrpApi.getInventorySnapshot({
      location: selectedLocation === "All locations" ? "" : selectedLocation,
      page: pageParam,
      limit,
      qtyMin, qtyMax, costMin, costMax,
      partNo: searchPartNo,
      groupNo: searchGroupNo,
      groupName: searchGroupName,
      partDesc: searchPartDesc
    }),
    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.totalPages) {
        return lastPage.page + 1;
      }
      return undefined;
    }
  });
  
  const locations = locsRes?.data || [];
  const inventory = invRes?.pages.flatMap((page: any) => page.data) || [];
  
  const totalQty = invRes?.pages[0]?.totalQty || 0;
  const totalCost = invRes?.pages[0]?.totalCost || 0;
  
  const updateMutation = useMutation({
    mutationFn: (data: { part_no: string, new_quantity: number, location?: string }) => 
      mrpApi.updatePhysicalQuantity(data),
    onSuccess: (res) => {
      if (res.message === 'No adjustment needed') {
        toast.info(res.message);
      } else {
        toast.success(res.message);
      }
      queryClient.invalidateQueries({ queryKey: ["mrpInventorySnapshot"] });
    },
    onError: (err) => {
      toast.error("Failed to update physical quantity");
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
    
    // Clear the edit after save
    const newEdits = { ...edits };
    delete newEdits[partNo];
    setEdits(newEdits);
  };
  
  const handleSaveAll = async () => {
    const partNos = Object.keys(edits).filter(p => edits[p] !== "");
    if (partNos.length === 0) return;
    
    let successCount = 0;
    
    // Process sequentially to not overload
    for (const partNo of partNos) {
      try {
        await mrpApi.updatePhysicalQuantity({
          part_no: partNo,
          new_quantity: Number(edits[partNo]),
          location: selectedLocation === "All locations" ? undefined : selectedLocation
        });
        successCount++;
      } catch (err) {
        console.error(err);
      }
    }
    
    if (successCount > 0) {
      toast.success(`Successfully updated ${successCount} items`);
      setEdits({});
      queryClient.invalidateQueries({ queryKey: ["mrpInventorySnapshot"] });
    }
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
          
          <div className="px-6 py-4 flex-1">
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
                <button className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-medium rounded border border-gray-200 hover:bg-gray-200">
                  <Download className="w-4 h-4" /> PDF
                </button>
                <button className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-medium rounded border border-gray-200 hover:bg-gray-200">
                  <Download className="w-4 h-4" /> CSV
                </button>
                <button className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-medium rounded border border-gray-200 hover:bg-gray-200">
                  <Upload className="w-4 h-4" /> Import from CSV
                </button>
              </div>
            </div>
            
            {/* Table Area */}
            <div className="w-full overflow-auto bg-white border border-gray-200 shadow-sm">
              <table className="w-full text-sm text-left">
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
                    <th className="px-3 py-2 border-r border-gray-300 whitespace-nowrap w-32 text-center">
                      <button 
                        onClick={handleSaveAll}
                        disabled={Object.keys(edits).length === 0}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded disabled:opacity-50 font-medium text-xs w-full max-w-[80px]"
                      >
                        Save all
                      </button>
                    </th>
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
                        <td className="px-3 py-1.5 border-r border-gray-200 truncate max-w-[250px]" title={item.part_description}>{item.part_description}</td>
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
            {hasNextPage && (
              <div className="flex justify-center mt-6 mb-4">
                <button
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="px-6 py-2 bg-white border border-gray-300 shadow-sm text-gray-700 rounded-md font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
                >
                  {isFetchingNextPage ? 'Loading more...' : 'Load more items'}
                </button>
              </div>
            )}
            
          </div>
        </div>
      </div>
    </RouteGuard>
  );
}
