"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { mrpApi } from "@/services/mrpApi";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function POBookingsReportsPage() {
  const params = useParams();
  const poNumber = params.poNumber as string;
  const router = useRouter();

  const [filterPartNo, setFilterPartNo] = useState("");
  const [filterPartDesc, setFilterPartDesc] = useState("");
  const [filterSource, setFilterSource] = useState("");
  const [filterLot, setFilterLot] = useState("");
  const [filterMinQty, setFilterMinQty] = useState("");
  const [filterMaxQty, setFilterMaxQty] = useState("");
  const [selectedLocations, setSelectedLocations] = useState<Record<string, string>>({});

  const { data: poData, isLoading, error } = useQuery({
    queryKey: ['purchaseOrder', poNumber],
    queryFn: () => mrpApi.getPurchaseOrder(poNumber),
  });

  const { data: storageLocationsRes, isLoading: isLoadingLocations } = useQuery({
    queryKey: ['storageLocations'],
    queryFn: mrpApi.getStorageLocations,
  });

  const storageLocations = Array.isArray(storageLocationsRes) ? storageLocationsRes : (storageLocationsRes?.data || []);

  if (isLoading) {
    return <div className="p-8 text-gray-500">Loading reports...</div>;
  }

  if (error || !poData) {
    return <div className="p-8 text-red-500">Error loading data.</div>;
  }

  const { items } = poData;

  const handleClear = () => {
    setFilterPartNo("");
    setFilterPartDesc("");
    setFilterSource("");
    setFilterLot("");
    setFilterMinQty("");
    setFilterMaxQty("");
  };

  const filteredItems = items.filter((item: any) => {
    if (filterPartNo && !item.part_no?.toLowerCase().includes(filterPartNo.toLowerCase())) return false;
    if (filterPartDesc && !item.part_description?.toLowerCase().includes(filterPartDesc.toLowerCase())) return false;
    if (filterLot && !item.lot?.toLowerCase().includes(filterLot.toLowerCase())) return false;
    // Source is currently not provided by the API in items, we will assume it's blank.
    if (filterSource) return false; 
    
    if (filterMinQty) {
      if (parseFloat(item.quantity) < parseFloat(filterMinQty)) return false;
    }
    if (filterMaxQty) {
      if (parseFloat(item.quantity) > parseFloat(filterMaxQty)) return false;
    }
    return true;
  });

  return (
    <div className="flex flex-col h-full bg-white text-[13px] text-gray-800 pb-20 p-6">
      <h1 className="text-[20px] font-normal text-gray-800 mb-6">Purchase order {poNumber} reports</h1>
      
      <h2 className="text-[16px] font-medium text-gray-800 mb-4">Bookings</h2>

      <div className="">
        <table className="w-full border-collapse">
          <thead>
            {/* Header Row */}
            <tr className="bg-[#f4f7fb] text-gray-600 font-medium text-[12px] text-left">
              <th className="px-4 py-3 border-r border-white w-12"></th>
              <th className="px-4 py-3 border-r border-white w-48">Part No.</th>
              <th className="px-4 py-3 border-r border-white min-w-[200px]">Part description</th>
              <th className="px-4 py-3 border-r border-white w-32">Source</th>
              <th className="px-4 py-3 border-r border-white w-40">Lot &darr;</th>
              <th className="px-4 py-3 border-r border-white w-32">Quantity</th>
              <th className="px-4 py-3 border-r border-white w-40">Storage location</th>
              <th className="px-4 py-3 w-24 text-center text-gray-400">Save all</th>
            </tr>
            
            {/* Filter Row */}
            <tr className="border-b border-gray-100">
              <td className="p-2 border-r border-white bg-[#f9fafb]">
                {/* empty icon slot */}
              </td>
              <td className="p-2 border-r border-white bg-[#f9fafb]">
                <input 
                  type="text" 
                  value={filterPartNo}
                  onChange={e => setFilterPartNo(e.target.value)}
                  className="w-full bg-[#eef2f9] px-2 py-1.5 focus:outline-none rounded-sm text-gray-700" 
                />
              </td>
              <td className="p-2 border-r border-white bg-[#f9fafb]">
                <input 
                  type="text" 
                  value={filterPartDesc}
                  onChange={e => setFilterPartDesc(e.target.value)}
                  className="w-full bg-[#eef2f9] px-2 py-1.5 focus:outline-none rounded-sm text-gray-700" 
                />
              </td>
              <td className="p-2 border-r border-white bg-[#f9fafb]">
                <input 
                  type="text" 
                  value={filterSource}
                  onChange={e => setFilterSource(e.target.value)}
                  className="w-full bg-[#eef2f9] px-2 py-1.5 focus:outline-none rounded-sm text-gray-700" 
                />
              </td>
              <td className="p-2 border-r border-white bg-[#f9fafb]">
                <input 
                  type="text" 
                  value={filterLot}
                  onChange={e => setFilterLot(e.target.value)}
                  className="w-full bg-[#eef2f9] px-2 py-1.5 focus:outline-none rounded-sm text-gray-700" 
                />
              </td>
              <td className="p-2 border-r border-white bg-[#f9fafb]">
                <div className="flex flex-col space-y-1">
                  <input 
                    type="number" 
                    placeholder="min"
                    value={filterMinQty}
                    onChange={e => setFilterMinQty(e.target.value)}
                    className="w-full bg-[#eef2f9] px-2 py-1 focus:outline-none rounded-sm text-gray-700 text-[11px]" 
                  />
                  <input 
                    type="number" 
                    placeholder="max"
                    value={filterMaxQty}
                    onChange={e => setFilterMaxQty(e.target.value)}
                    className="w-full bg-[#eef2f9] px-2 py-1 focus:outline-none rounded-sm text-gray-700 text-[11px]" 
                  />
                </div>
              </td>
              <td className="p-2 border-r border-white bg-[#f9fafb] text-center align-middle">
                <button className="bg-[#eef2f9] text-[#1e5aa0] hover:bg-[#dbe4f0] px-4 py-1.5 rounded-sm text-xs font-medium w-full">
                  Search
                </button>
              </td>
              <td className="p-2 bg-[#f9fafb] text-center align-middle">
                <button onClick={handleClear} className="text-[#1e5aa0] hover:underline px-4 py-1.5 text-xs font-medium w-full">
                  Clear
                </button>
              </td>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((item: any, i: number) => (
              <tr key={item.id} className="border-b border-gray-100 hover:bg-[#f9fafb] text-gray-700">
                <td className="px-4 py-4 text-gray-400 text-xs text-center border-r border-gray-100">{i + 1}</td>
                <td 
                  className="px-4 py-4 border-r border-gray-100 text-[12px] hover:underline cursor-pointer text-[#1e5aa0] font-medium"
                  onClick={() => {
                    if (item.item_id) {
                      router.push(`/dashboard/mrp/inventory/${item.item_id}`);
                    } else {
                      alert("Item not found in inventory.");
                    }
                  }}
                >
                  {item.part_no}
                </td>
                <td className="px-4 py-4 border-r border-gray-100 text-[12px]">
                  {item.part_description}
                </td>
                <td className="px-4 py-4 border-r border-gray-100 text-[12px]">
                  {/* Empty Source */}
                </td>
                <td className="px-4 py-4 border-r border-gray-100 text-[12px] hover:underline cursor-pointer text-gray-800">
                  {item.lot || ''}
                </td>
                <td className="px-4 py-4 border-r border-gray-100 text-[12px]">
                  {item.quantity} {item.unit}
                </td>
                <td className="px-4 py-4 border-r border-gray-100 text-[12px]">
                  <Select
                    value={selectedLocations[item.id] || "N/A"}
                    onValueChange={(val) => setSelectedLocations(prev => ({ ...prev, [item.id]: val }))}
                  >
                    <SelectTrigger className="w-full bg-[#f4f7fb] border border-gray-200 rounded-sm focus:ring-0 focus:ring-offset-0 focus:outline-none p-1.5 h-auto py-1.5 text-gray-600 text-[12px]">
                      <SelectValue placeholder="N/A" />
                    </SelectTrigger>
                    <SelectContent className="max-h-48 overflow-y-auto">
                      <SelectItem value="N/A">N/A</SelectItem>
                      {storageLocations
                        .filter((loc: any) => (loc.location_name || loc.name || loc.title) !== "N/A")
                        .map((loc: any) => (
                        <SelectItem key={loc.id || loc._id || loc.location_name} value={loc.location_name || loc.name || loc.title}>
                          {loc.location_name || loc.name || loc.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
                <td className="px-4 py-4 text-center border-r border-gray-100">
                  <button 
                    disabled={!selectedLocations[item.id] || selectedLocations[item.id] === "N/A"}
                    className="bg-[#1e5aa0] text-white hover:bg-[#164680] disabled:bg-gray-400 disabled:cursor-not-allowed px-4 py-1.5 rounded-sm text-xs font-medium shadow-sm transition-colors"
                  >
                    Save
                  </button>
                </td>
              </tr>
            ))}
            {filteredItems.length === 0 && (
              <tr>
                <td colSpan={8} className="p-8 text-center text-gray-500">No items found matching the filters.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
