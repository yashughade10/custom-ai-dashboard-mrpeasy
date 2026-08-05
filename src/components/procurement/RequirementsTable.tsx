"use client";

import { useState, useEffect } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { mrpApi } from "@/services/mrpApi";
import { ShoppingCart, Settings2, ChevronDown, Save, X } from "lucide-react";
import { MrpExportBar } from "@/components/mrp/MrpExportBar";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const ALL_COLUMNS = [
  { id: 'part_no', label: 'Part No.', filter: 'text' },
  { id: 'source', label: 'Source', filter: 'text' },
  { id: 'quantity', label: 'Quantity', filter: 'text' },
  { id: 'requirement_date', label: 'Requirement date', filter: 'range', minKey: 'min_req_date', maxKey: 'max_req_date' },
  { id: 'action_date', label: 'Action date +', filter: 'range', minKey: 'min_action_date', maxKey: 'max_action_date' },
  { id: 'vendor_name', label: 'Vendor', filter: 'text' },
  { id: 'part_description', label: 'Part description', filter: 'text', sortable: true },
  { id: 'group_number', label: 'Group number', filter: 'text' },
  { id: 'group_name', label: 'Group name', filter: 'text' },
  { id: 'vendor_part_no', label: 'Vendor part no.', filter: 'text' },
  { id: 'price_per_uom', label: 'Price per UoM', filter: 'range', minKey: 'min_price', maxKey: 'max_price' },
  { id: 'subtotal', label: 'Subtotal', filter: 'range', minKey: 'min_subtotal', maxKey: 'max_subtotal' },
  { id: 'notes', label: 'Notes', filter: 'text' },
  { id: 'bwe_added_value_cost', label: 'BWE added value cost', filter: 'range', minKey: 'min_bwe', maxKey: 'max_bwe' },
  { id: 'buy_price', label: 'Buy Price', filter: 'text' },
  { id: 'supplier_1', label: 'Supplier 1', filter: 'text' },
  { id: 's1_buy_price', label: 'S1 Buy price', filter: 'text' },
  { id: 'vender_part_number', label: 'Vender Part Number', filter: 'text' },
  { id: 'supplier_2', label: 'Supplier 2', filter: 'text' },
  { id: 's2_buy_price', label: 'S2 Buy Price', filter: 'text' },
  { id: 'vender_2_part_number', label: 'Vender 2 Part Number', filter: 'text' },
  { id: 'sell_price', label: 'Sell Price', filter: 'text' }
];

const emptyFilters = {
  part_no: "", source: "", quantity: "", part_description: "", vendor_name: "", group_number: "", group_name: "", vendor_part_no: "", notes: "",
  buy_price: "", supplier_1: "", s1_buy_price: "", vender_part_number: "", supplier_2: "", s2_buy_price: "", vender_2_part_number: "", sell_price: "",
  min_req_date: "", max_req_date: "", min_action_date: "", max_action_date: "", min_price: "", max_price: "", min_subtotal: "", max_subtotal: "", min_bwe: "", max_bwe: ""
};

export default function RequirementsTable() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  
  const [filters, setFilters] = useState(emptyFilters);
  const [activeFilters, setActiveFilters] = useState({});
  const [visibleCols, setVisibleCols] = useState<Record<string, boolean>>(
    Object.fromEntries(ALL_COLUMNS.map(c => [c.id, true]))
  );
  const [showColDropdown, setShowColDropdown] = useState(false);
  const [savedSearches, setSavedSearches] = useState<{name: string, filters: Record<string, string>}[]>([]);
  const [showSaveMenu, setShowSaveMenu] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [newSearchName, setNewSearchName] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem('mrp_requirements_searches');
    if (saved) {
      try {
        setSavedSearches(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const saveCurrentSearch = () => {
    if (!newSearchName.trim()) return;
    const newSearches = [...savedSearches, { name: newSearchName, filters: filters }];
    setSavedSearches(newSearches);
    localStorage.setItem('mrp_critical_searches', JSON.stringify(newSearches));
    setNewSearchName("");
    setShowSaveModal(false);
    setShowSaveMenu(false);
  };

  const loadSavedSearch = (searchFilters: Record<string, string>) => {
    const newFilters = {...emptyFilters, ...searchFilters};
    setFilters(newFilters as any);
    setActiveFilters(searchFilters);
    setLimit(50);
    setShowSaveMenu(false);
  };

  const deleteSavedSearch = (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this saved search?")) return;
    const newSearches = savedSearches.filter(s => s.name !== name);
    setSavedSearches(newSearches);
    localStorage.setItem('mrp_critical_searches', JSON.stringify(newSearches));
  };

  const toggleCol = (id: string) => {
    setVisibleCols(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const { data: response, isLoading, isFetching } = useQuery({
    queryKey: ["mrpRequirementsItems", limit, activeFilters],
    queryFn: async () => {
      const validFilters = Object.fromEntries(
        Object.entries(activeFilters).filter(([_, v]) => v !== "")
      );
      return mrpApi.getRequirements(page, limit, validFilters);
    },
    placeholderData: keepPreviousData,
  });

  const fetchAllData = async () => {
    try {
      toast.loading("Fetching all data...", { id: "export" });
      
      const validFilters = Object.fromEntries(
        Object.entries(activeFilters).filter(([_, v]) => v !== "")
      );
      
      const response = await mrpApi.getRequirements(1, 99999, validFilters);
      
      if (!response.data || response.data.length === 0) {
        toast.dismiss("export");
        toast.error("No data to export");
        return null;
      }
      toast.dismiss("export");
      return response.data;
    } catch (error) {
      toast.dismiss("export");
      toast.error("Failed to fetch data for export");
      return null;
    }
  };

  const handleDownloadCSV = async () => {
    const allData = await fetchAllData();
    if (!allData) return;
    
    const headers = ALL_COLUMNS.filter(c => visibleCols[c.id]).map(c => c.label);
    const csvRows = [];
    csvRows.push(headers.join(","));
    
    allData.forEach((item: any) => {
      const row = ALL_COLUMNS.filter(c => visibleCols[c.id]).map(c => {
        let val = item[c.id];
        if (val === null || val === undefined) val = "";
        val = String(val).replace(/"/g, '""');
        return `"${val}"`;
      });
      csvRows.push(row.join(","));
    });
    
    const csvString = csvRows.join("\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.setAttribute("download", "requirements.csv");
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownloadPDF = async () => {
    const allData = await fetchAllData();
    if (!allData) return;

    const doc = new jsPDF('landscape');
    
    // Add header
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Requirements", 14, 15);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    doc.text(today, doc.internal.pageSize.width - 14, 15, { align: "right" });

    const visibleColumnKeys = ALL_COLUMNS.filter(c => visibleCols[c.id]);
    const headers = visibleColumnKeys.map(c => c.label);
    const data = allData.map((item: any) => 
      visibleColumnKeys.map(c => {
        let val = item[c.id];
        if (val === null || val === undefined) return "";
        return String(val);
      })
    );

    autoTable(doc, {
      head: [headers],
      body: data,
      startY: 25,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [240, 244, 248], textColor: [75, 85, 99], fontStyle: 'bold' },
      theme: 'grid'
    });

    doc.save("requirements.pdf");
  };

  const handleSearch = () => {
    setActiveFilters(filters);
    setLimit(50);
  };

  const handleClear = () => {
    setFilters(emptyFilters);
    setActiveFilters({});
    setLimit(50);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleNumericChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setFilters(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const items = response?.data || [];
  const pagination = response?.pagination;
  const hasMore = pagination ? pagination.total > items.length : false;

  const formatCurrency = (val: any) => {
    if (!val && val !== 0) return "";
    const strVal = String(val).trim();
    if (strVal.startsWith('$')) return strVal;
    const num = Number(strVal);
    if (isNaN(num)) return strVal;
    return `$${num.toFixed(2)}`;
  };
  const formatQty = (val: any) => {
    if (!val && val !== 0) return "0 pcs";
    if (String(val).includes('pcs') || String(val).includes('m²')) return val;
    return `${val} pcs`;
  };

  const handlePartClick = async (partNo: string) => {
    if (!partNo) return;
    toast.loading("Loading item details...", { id: "routing" });
    try {
      const res = await mrpApi.getItems(1, 1, { search: partNo });
      if (res.data && res.data.length > 0) {
        const exactMatch = res.data.find((i: any) => i.part_no === partNo || i.part_number === partNo);
        const itemToRoute = exactMatch || res.data[0];
        toast.dismiss("routing");
        router.push(`/dashboard/mrp/inventory/${itemToRoute.id}`);
      } else {
        toast.dismiss("routing");
        toast.error("Item not found in database");
      }
    } catch (err) {
      toast.dismiss("routing");
      toast.error("Failed to lookup item");
    }
  };

  return (
    <div className="w-full bg-white text-[12px] text-gray-800 flex flex-col flex-1 min-h-0 relative">
      <div className="print:hidden">
        <MrpExportBar 
          onDownloadPDF={handleDownloadPDF} 
          onDownloadCSV={handleDownloadCSV} 
        />
      </div>

      <div className="overflow-auto w-full flex-1 border border-gray-200 shadow-sm rounded-sm relative">
        <table className="w-full text-left table-auto">
          <thead className="bg-[#f0f4f8] text-gray-700 font-semibold border-b border-gray-300">
            <tr>
              <th className="font-medium p-2 w-8 text-center text-gray-400 border-r border-gray-300 border-b border-gray-300">
                <div 
                  className="inline-flex items-center justify-center cursor-pointer p-1 rounded hover:bg-gray-200 text-gray-600 bg-white border border-gray-400 shadow-sm"
                  onClick={() => setShowSaveMenu(!showSaveMenu)}
                >
                  <Save className="w-3.5 h-3.5" />
                </div>
              </th>
              {ALL_COLUMNS.map(col => visibleCols[col.id] && (
                <th key={col.id} className="font-medium p-2 leading-tight border-r border-gray-300 border-b border-gray-300 whitespace-nowrap">
                  {col.label} {col.sortable && <span className="text-gray-400">↑</span>}
                </th>
              ))}
              <th className="font-medium p-2 w-16 text-center border-b border-gray-300 relative">
                <div className="flex items-center justify-center gap-2">
                  <div 
                    className="flex items-center justify-center cursor-pointer hover:bg-gray-200 p-1 rounded"
                    onClick={() => setShowColDropdown(!showColDropdown)}
                  >
                    <Settings2 className="w-3.5 h-3.5" />
                  </div>
                  <ShoppingCart className="w-3.5 h-3.5 text-gray-500" />
                  <input type="checkbox" className="w-3 h-3 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 cursor-pointer" />
                </div>
                {showColDropdown && (
                  <div 
                    className="absolute right-0 top-full mt-1 bg-white border border-gray-200 shadow-lg rounded-sm w-56 max-h-[400px] overflow-y-auto z-50 text-left font-normal"
                    onMouseLeave={() => setShowColDropdown(false)}
                  >
                    {ALL_COLUMNS.map(col => {
                      const isDisabled = col.id === 'part_no';
                      return (
                        <label key={col.id} className={`flex items-center gap-2 px-3 py-1.5 select-none text-gray-700 ${isDisabled ? 'opacity-60 cursor-not-allowed bg-gray-50' : 'hover:bg-[#eef2f9] cursor-pointer'}`}>
                          <input 
                            type="checkbox" 
                            checked={!!visibleCols[col.id]} 
                            onChange={() => !isDisabled && toggleCol(col.id)}
                            disabled={isDisabled}
                            className="w-3.5 h-3.5 rounded-sm border-gray-300 text-blue-600"
                          />
                          <span className="text-[12px] whitespace-nowrap">{col.label}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </th>
            </tr>
            <tr className="bg-white border-b border-gray-300">
              <th className="p-1.5 border-r border-gray-300 bg-[#f9fafb] text-center align-top relative">
                {/* Save menu positioned here in previous table, moved to first col header for layout sync */}
              </th>
              {ALL_COLUMNS.map(col => visibleCols[col.id] && (
                <th key={`${col.id}-filter`} className="p-1.5 align-top border-r border-gray-300 font-normal w-24">
                  {col.filter === 'range' ? (
                    <div className="space-y-1">
                      <input name={col.minKey} value={(filters as any)[col.minKey as string]} onChange={handleNumericChange} onKeyDown={handleKeyDown} type="text" placeholder="min" className="w-full h-7 bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px] placeholder-gray-400" />
                      <input name={col.maxKey} value={(filters as any)[col.maxKey as string]} onChange={handleNumericChange} onKeyDown={handleKeyDown} type="text" placeholder="max" className="w-full h-7 bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px] placeholder-gray-400" />
                    </div>
                  ) : (
                    <input name={col.id} value={(filters as any)[col.id]} onChange={handleChange} onKeyDown={handleKeyDown} type="text" className="w-full h-7 bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px]" />
                  )}
                </th>
              ))}
              <th className="p-1.5 bg-[#f9fafb] text-center align-top min-w-[70px]">
                 <div className="flex flex-col gap-1">
                   <button onClick={handleSearch} className="text-blue-600 text-[11px] font-medium hover:underline bg-transparent border-none cursor-pointer">Search</button>
                   <button onClick={handleClear} className="text-blue-600 text-[11px] font-medium hover:underline bg-transparent border-none cursor-pointer">Clear</button>
                 </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={ALL_COLUMNS.length + 2} className="p-8 text-center text-gray-500">Loading...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={ALL_COLUMNS.length + 2} className="p-8 text-center text-gray-500">No items found</td></tr>
            ) : items.map((item: any, index: number) => {
              return (
                <tr key={item.id || index} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-2 border-r border-gray-200 text-center text-gray-400">{index + 1}</td>
                  {visibleCols.part_no && (
                    <td className="p-2 border-r border-gray-200">
                      <button 
                        onClick={() => handlePartClick(item.part_no || item.part_number)}
                        className="text-[#1e5aa0] hover:underline bg-transparent border-none cursor-pointer text-left p-0 text-[12px]"
                      >
                        {item.part_no || item.part_number}
                      </button>
                    </td>
                  )}
                  {visibleCols.source && <td className="p-2 border-r border-gray-200">{item.source || 'CO00000'}</td>}
                  {visibleCols.quantity && <td className="p-2 border-r border-gray-200">{formatQty(item.quantity || item.reorder_point)}</td>}
                  {visibleCols.requirement_date && <td className="p-2 border-r border-gray-200">{item.requirement_date || '01/01/2026'}</td>}
                  {visibleCols.action_date && <td className="p-2 border-r border-gray-200">{item.action_date || '01/01/2026'}</td>}
                  {visibleCols.vendor_name && <td className="p-2 border-r border-gray-200">{item.vendor_name || 'Vendor Name'}</td>}
                  {visibleCols.part_description && (
                    <td className="p-2 border-r border-gray-200">
                      <button 
                        onClick={() => handlePartClick(item.part_no || item.part_number)}
                        className="text-[#1e5aa0] hover:underline bg-transparent border-none cursor-pointer text-left p-0 text-[12px]"
                      >
                        {item.part_description || item.name}
                      </button>
                    </td>
                  )}
                  {visibleCols.group_number && <td className="p-2 border-r border-gray-200">{item.group_number}</td>}
                  {visibleCols.group_name && <td className="p-2 border-r border-gray-200">{item.group_name}</td>}
                  {visibleCols.vendor_part_no && <td className="p-2 border-r border-gray-200">{item.vender_part_number || item.vendor_part_no}</td>}
                  {visibleCols.price_per_uom && <td className="p-2 border-r border-gray-200">{formatCurrency(item.price_per_uom)}</td>}
                  {visibleCols.subtotal && <td className="p-2 border-r border-gray-200">{formatCurrency(item.subtotal)}</td>}
                  {visibleCols.notes && <td className="p-2 border-r border-gray-200">{item.notes}</td>}
                  {visibleCols.bwe_added_value_cost && <td className="p-2 border-r border-gray-200">{item.bwe_added_value_cost || ''}</td>}
                  {visibleCols.buy_price && <td className="p-2 border-r border-gray-200">{formatCurrency(item.buy_price)}</td>}
                  {visibleCols.supplier_1 && <td className="p-2 border-r border-gray-200">{item.supplier_1}</td>}
                  {visibleCols.s1_buy_price && <td className="p-2 border-r border-gray-200">{formatCurrency(item.s1_buy_price)}</td>}
                  {visibleCols.vender_part_number && <td className="p-2 border-r border-gray-200">{item.vender_part_number}</td>}
                  {visibleCols.supplier_2 && <td className="p-2 border-r border-gray-200">{item.supplier_2}</td>}
                  {visibleCols.s2_buy_price && <td className="p-2 border-r border-gray-200">{formatCurrency(item.s2_buy_price)}</td>}
                  {visibleCols.vender_2_part_number && <td className="p-2 border-r border-gray-200">{item.vender_2_part_number}</td>}
                  {visibleCols.sell_price && <td className="p-2 border-r border-gray-200">{formatCurrency(item.sell_price)}</td>}
                  <td className="p-2 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button 
                        onClick={() => {
                          let qty = String(item.quantity || '0').replace(/[^0-9.]/g, '');
                          if (!qty || qty === '0') qty = '1';
                          
                          let price = String(item.price_per_uom || '').replace(/[^0-9.]/g, '');
                          if (!price) price = String(item.buy_price || '').replace(/[^0-9.]/g, '');
                          if (!price) price = String(item.s1_buy_price || '').replace(/[^0-9.]/g, '');
                          
                          const searchParams = new URLSearchParams({
                            vendor: item.vendor_name || item.supplier_1 || '',
                            item: item.part_no || '',
                            qty: qty,
                            price: price
                          });
                          
                          router.push(`/dashboard/mrp/procurement/create?${searchParams.toString()}`);
                        }}
                        className="text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer"
                      >
                        <ShoppingCart className="w-4 h-4" />
                      </button>
                      <input type="checkbox" className="w-3 h-3 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 cursor-pointer" />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {hasMore && (
          <div className="flex justify-center py-4 bg-white border-t border-gray-200">
            <button 
              className="text-blue-600 text-xs font-medium hover:underline cursor-pointer border-none bg-transparent"
              onClick={() => setLimit(prev => prev + 50)}
              disabled={isFetching}
            >
              {isFetching ? "Loading..." : "Load more"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
