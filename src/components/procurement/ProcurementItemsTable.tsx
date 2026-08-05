"use client";

import { useState, useEffect } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { mrpApi } from "@/services/mrpApi";
import { CalendarDays, Plus, Settings2, Flag, Edit2, ChevronDown, Loader2, Save, X, BarChart2 } from "lucide-react";
import { MrpExportBar } from "@/components/mrp/MrpExportBar";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const baseCurrencyCols = ['total', 'tax', 'total_including_tax', 'unit_cost', 'buy_price', 's1_buy_price', 's2_buy_price', 'sell_price', 'bwe_added_value_cost'];
const inCurrencyCols = ['total_in_currency', 'tax_in_currency', 'total_including_tax_in_currency', 'unit_cost_in_currency'];

const ALL_COLUMNS = [
  { id: 'po_number', label: 'Number', filter: 'text' },
  { id: 'part_no', label: 'Part No.', filter: 'text' },
  { id: 'part_description', label: 'Part description', filter: 'text' },
  { id: 'group_number', label: 'Group number', filter: 'text' },
  { id: 'group_name', label: 'Group name', filter: 'text' },
  { id: 'status', label: 'Status', filter: 'select', options: ['New PO', 'RFQ', 'Ordered', 'Shipped', 'Received', 'Archived', 'Canceled'] },
  { id: 'quantity', label: 'Quantity', filter: 'range', minKey: 'min_quantity', maxKey: 'max_quantity', showTotal: true },
  { id: 'created_date', label: 'Created', filter: 'range', minKey: 'min_created_date', maxKey: 'max_created_date' },
  { id: 'expected_date', label: 'Expected date', filter: 'range', minKey: 'min_expected_date', maxKey: 'max_expected_date' },
  { id: 'vendor_number', label: 'Vendor number', filter: 'text' },
  { id: 'vendor_name', label: 'Vendor name', filter: 'text' },
  { id: 'free_text', label: 'Free text', filter: 'text' },
  { id: 'vendor_part_no', label: 'Vendor part no.', filter: 'text' },
  { id: 'lot', label: 'Lot', filter: 'text' },
  { id: 'total', label: 'Total', filter: 'range', minKey: 'min_total', maxKey: 'max_total', showTotal: true },
  { id: 'tax', label: 'Tax', filter: 'range', minKey: 'min_tax', maxKey: 'max_tax', showTotal: true },
  { id: 'total_including_tax', label: 'Total including tax', filter: 'range', minKey: 'min_total_including_tax', maxKey: 'max_total_including_tax', showTotal: true },
  { id: 'unit_cost', label: 'Unit price', filter: 'range', minKey: 'min_unit_cost', maxKey: 'max_unit_cost' },
  { id: 'currency', label: 'Currency', filter: 'text' },
  { id: 'total_in_currency', label: 'Total in summary', filter: 'range', minKey: 'min_total_in_currency', maxKey: 'max_total_in_currency' },
  { id: 'tax_in_currency', label: 'Tax in summary', filter: 'range', minKey: 'min_tax_in_currency', maxKey: 'max_tax_in_currency' },
  { id: 'total_including_tax_in_currency', label: 'Total including tax in summary', filter: 'range', minKey: 'min_total_including_tax_in_currency', maxKey: 'max_total_including_tax_in_currency' },
  { id: 'unit_cost_in_currency', label: 'Unit cost (in currency)', filter: 'range', minKey: 'min_unit_cost_in_currency', maxKey: 'max_unit_cost_in_currency' },
  { id: 'invoice_status', label: 'Invoice status', filter: 'text' },
  { id: 'product_status', label: 'Product status', filter: 'select', options: ['Requested', 'Planned', 'On hold', 'Received', 'Rejected', 'Canceled', 'RMA waiting for inspection', 'RMA waiting for repair', 'RMA ready for shipment', 'RMA returned'] },
  { id: 'created_by', label: 'Created by', filter: 'select', options: ['Admin', 'David C', 'John McCafferty', 'Kemal', 'Machinist 1', 'Machinist 2', 'Shikha Yadav'] },
  { id: 'arrival_date', label: 'Arrival date', filter: 'range', minKey: 'min_arrival_date', maxKey: 'max_arrival_date' },
  { id: 'order_id', label: 'Order ID', filter: 'text' },
  { id: 'order_date', label: 'Order date', filter: 'range', minKey: 'min_order_date', maxKey: 'max_order_date' },
  { id: 'invoice_id', label: 'Invoice ID', filter: 'text' },
  { id: 'invoice_date', label: 'Invoice date', filter: 'range', minKey: 'min_invoice_date', maxKey: 'max_invoice_date' },
  { id: 'due_date', label: 'Due date', filter: 'range', minKey: 'min_due_date', maxKey: 'max_due_date' },
  { id: 'shipped_on', label: 'Shipped on', filter: 'range', minKey: 'min_shipped_on', maxKey: 'max_shipped_on' },
  { id: 'delay', label: 'Delay', filter: 'text' },
  { id: 'po_notes', label: 'PO Notes', filter: 'text' },
  { id: 'po_free_text', label: 'PO free text', filter: 'text' },
  { id: 'bwe_job_id', label: 'BWE Job ID', filter: 'text' },
  { id: 'po_emailed', label: 'PO Emailed', filter: 'select', options: ['Y', 'N'] },
  { id: 'attention', label: 'Attention', filter: 'select', options: ['DAVID C', 'DERRYN F', 'STEPHEN P', 'JOHN Mc'] },
  { id: 'notes', label: 'Notes', filter: 'text' },
  { id: 'notes_upper', label: 'NOTES', filter: 'text' },
  { id: 'account', label: 'ACCOUNT', filter: 'text' },
  { id: 'bwe_added_value_cost', label: 'BWE added value cost', filter: 'range', minKey: 'min_bwe_added_value_cost', maxKey: 'max_bwe_added_value_cost' },
  { id: 'buy_price', label: 'Buy Price', filter: 'range', minKey: 'min_buy_price', maxKey: 'max_buy_price' },
  { id: 'supplier_1', label: 'Supplier 1', filter: 'text' },
  { id: 's1_buy_price', label: 'S1 Buy price', filter: 'range', minKey: 'min_s1_buy_price', maxKey: 'max_s1_buy_price' },
  { id: 'vender_part_number', label: 'Vender Part Number', filter: 'text' },
  { id: 'supplier_2', label: 'Supplier 2', filter: 'text' },
  { id: 's2_buy_price', label: 'S2 Buy Price', filter: 'range', minKey: 'min_s2_buy_price', maxKey: 'max_s2_buy_price' },
  { id: 'vender_2_part_number', label: 'Vender 2 Part Number', filter: 'text' },
  { id: 'sell_price', label: 'Sell Price', filter: 'range', minKey: 'min_sell_price', maxKey: 'max_sell_price' }
];

const emptyFilters = {
  po_number: "", part_no: "", part_description: "", group_number: "", group_name: "", status: "", vendor_number: "", vendor_name: "", free_text: "", vendor_part_no: "", lot: "", currency: "", invoice_status: "", product_status: "", created_by: "", order_id: "", invoice_id: "", po_notes: "", delay: "", po_free_text: "", bwe_job_id: "", po_emailed: "", attention: "", notes: "", notes_upper: "", account: "", supplier_1: "", vender_part_number: "", supplier_2: "", vender_2_part_number: "",
  min_quantity: "", max_quantity: "",
  min_created_date: "", max_created_date: "",
  min_expected_date: "", max_expected_date: "",
  min_total: "", max_total: "",
  min_tax: "", max_tax: "",
  min_total_including_tax: "", max_total_including_tax: "",
  min_unit_cost: "", max_unit_cost: "",
  min_total_in_currency: "", max_total_in_currency: "",
  min_tax_in_currency: "", max_tax_in_currency: "",
  min_total_including_tax_in_currency: "", max_total_including_tax_in_currency: "",
  min_unit_cost_in_currency: "", max_unit_cost_in_currency: "",
  min_arrival_date: "", max_arrival_date: "",
  min_order_date: "", max_order_date: "",
  min_invoice_date: "", max_invoice_date: "",
  min_due_date: "", max_due_date: "",
  min_shipped_on: "", max_shipped_on: "",
  min_bwe_added_value_cost: "", max_bwe_added_value_cost: "",
  min_buy_price: "", max_buy_price: "",
  min_s1_buy_price: "", max_s1_buy_price: "",
  min_s2_buy_price: "", max_s2_buy_price: "",
  min_sell_price: "", max_sell_price: ""
};

export default function ProcurementItemsTable() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  
  const [filters, setFilters] = useState(emptyFilters);
  
  const [activeFilters, setActiveFilters] = useState({});
  const [showSettings, setShowSettings] = useState(false);
  const [visibleCols, setVisibleCols] = useState<Record<string, boolean>>({
    po_number: true,
    part_no: true,
    part_description: true,
    group_number: true,
    group_name: true,
    status: true,
    quantity: true,
    created_date: true,
    expected_date: true,
    vendor_number: true,
    vendor_name: true,
    free_text: true,
  });
  const [showColDropdown, setShowColDropdown] = useState(false);

  const [savedSearches, setSavedSearches] = useState<{name: string, filters: Record<string, string>}[]>([]);
  const [showSaveMenu, setShowSaveMenu] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [newSearchName, setNewSearchName] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem('mrp_items_saved_searches');
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
    localStorage.setItem('mrp_items_saved_searches', JSON.stringify(newSearches));
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
    localStorage.setItem('mrp_items_saved_searches', JSON.stringify(newSearches));
  };


  const toggleCol = (id: string) => {
    setVisibleCols(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const { data: response, isLoading, isFetching } = useQuery({
    queryKey: ["mrpPurchaseOrderItems", limit, activeFilters],
    queryFn: () => {
      // Filter out empty strings from activeFilters and strip commas from numeric filters
      const validFilters = Object.fromEntries(
        Object.entries(activeFilters)
          .filter(([_, v]) => v !== "")
          .map(([k, v]) => {
            // If it's a min/max numeric filter with a comma, strip it
            if (typeof v === 'string' && (k.startsWith('min_') || k.startsWith('max_')) && !k.endsWith('_date') && k !== 'max_shipped_on' && k !== 'min_shipped_on') {
              return [k, v.replace(/,/g, '')];
            }
            return [k, v];
          })
      );
      console.log("Fetching with validFilters:", validFilters);
      return mrpApi.getPurchaseOrderItems(1, limit, validFilters);
    },
    placeholderData: keepPreviousData,
  });

  
  
  const fetchAllData = async () => {
    try {
      toast.loading("Fetching all data...", { id: "export" });
      const response = await mrpApi.getPurchaseOrderItems(1, 99999, activeFilters);
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
    
    allData.forEach((order: any) => {
      const row = ALL_COLUMNS.filter(c => visibleCols[c.id]).map(c => {
        let val = order[c.id];
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
    a.setAttribute("download", "purchase_orders.csv");
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
    doc.text("Procurement Items", 14, 15);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    doc.text(today, doc.internal.pageSize.width - 14, 15, { align: "right" });

    // Exact columns from user request (only important available columns)
    const pdfCols = ALL_COLUMNS.filter(c => visibleCols[c.id]);

    const head = [pdfCols.map(c => c.label)];
    
    // Calculate total quantity safely
    const totalQty = allData.reduce((sum: number, row: any) => {
      let q = Number(row.item_quantity);
      if (isNaN(q) || q === 0 || row.item_quantity == null) q = Number(row.total_quantity);
      if (isNaN(q) || row.total_quantity == null) q = 0;
      return sum + q;
    }, 0);

    const body: any[] = [];
    
    // Add Total row
    const totalRow = pdfCols.map(c => {
      if (c.id === 'po_number') return 'Total:';
      if (c.id === 'quantity') return totalQty.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' pcs';
      if (c.id === 'total') {
         const sumTotal = allData.reduce((sum: number, r: any) => sum + (Number(r.total) || 0), 0);
         return '$' + sumTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      }
      return '';
    });
    body.push(totalRow);

    let isTooBig = false;
    let displayData = allData;
    if (allData.length > 100) {
       displayData = allData.slice(0, 100);
       isTooBig = true;
    }

    // Add data rows
    displayData.forEach((row: any) => {
      body.push(pdfCols.map(c => {
        let val = row[c.id];
        
        if (c.id === 'quantity') {
           let qty = Number(row.item_quantity);
           if (isNaN(qty) || qty === 0 || row.item_quantity == null) qty = Number(row.total_quantity);
           if (isNaN(qty) || row.total_quantity == null) qty = 0;
           return qty + ' pcs';
        }
        
        if (val === null || val === undefined) return "";
        
        // format dates
        if (['created_date', 'expected_date'].includes(c.id)) {
           return new Date(val).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
        }
        if (c.id === 'total') {
           return '$' + Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }
        
        return String(val);
      }));
    });

    if (isTooBig) {
       // Push a single row object that autoTable recognizes for colSpan
       const msg = 'This list is too big for PDF creation. Please export the data in CSV format.';
       body.push([{ content: msg, colSpan: pdfCols.length, styles: { halign: 'center', textColor: [200, 0, 0], fontStyle: 'bold' } }]);
    }

    autoTable(doc, {
      head: head,
      body: body,
      startY: 20,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2, textColor: [0, 0, 0], lineColor: [220, 220, 220], overflow: 'linebreak' },
      headStyles: { fillColor: [240, 244, 248], textColor: [0, 0, 0], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [250, 250, 250] },
      margin: { top: 20, left: 14, right: 14 },
    });
    
    doc.save('purchase_orders.pdf');
  };

  const handleSearch = () => {
    if (filters.min_total && filters.max_total && Number(filters.min_total) > Number(filters.max_total)) {
      toast.error("Min total cannot be greater than Max total");
      return;
    }
    if (filters.min_created_date && filters.max_created_date && new Date(filters.min_created_date) > new Date(filters.max_created_date)) {
      toast.error("Min created date cannot be greater than Max created date");
      return;
    }
    if (filters.min_expected_date && filters.max_expected_date && new Date(filters.min_expected_date) > new Date(filters.max_expected_date)) {
      toast.error("Min expected date cannot be greater than Max expected date");
      return;
    }

    setActiveFilters(filters);
    setLimit(50); // Reset limit on search
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

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setActiveFilters(prev => ({ ...prev, [name]: value }));
    setLimit(50);
  };

  const handleNumericChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (value === "" || /^[\d,]*\.?\d*$/.test(value)) {
      setFilters(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (!value) return;
    const numericValue = Number(value.replace(/,/g, ''));
    if (!isNaN(numericValue)) {
      setFilters(prev => ({ ...prev, [name]: formatCurrency(numericValue) }));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const orders = response?.data || [];
  const pagination = response?.pagination;
  const hasMore = pagination ? pagination.total > orders.length : false;

  const formatShortDate = (d: string) => {
    if (!d) return "";
    const date = new Date(d);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

    const formatCurrency = (val: any) => Number(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const getStatusBadge = (status: string) => {
    if (!status) return null;
    const s = status.toLowerCase();
    let bg = "bg-red-100 text-red-600";
    if (s === 'invoiced' || s === 'paid') {
      bg = "bg-slate-200 text-blue-600";
    }
    return <span className={`px-2 py-0.5 rounded-sm text-[11px] font-medium ${bg}`}>{status}</span>;
  };

  return (
    <div className="w-full bg-white text-[12px] text-gray-800 flex flex-col flex-1 min-h-0 relative print:p-0 print:m-0 print:block">
      
      {/* Print Header */}
      <div className="hidden print:flex justify-between items-end mb-6 w-full text-black">
        <h1 className="text-2xl font-bold m-0 p-0">Purchase orders</h1>
        <div className="text-sm font-medium">
          {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
        </div>
      </div>
      
      <div className="print:hidden">
        <MrpExportBar 
          createLabel="Create PO"
          onCreate={() => router.push("/dashboard/mrp/procurement/create")} 
          onDownloadPDF={handleDownloadPDF} 
          onDownloadCSV={handleDownloadCSV} 
        />
      </div>

      <div className="overflow-auto print:overflow-visible w-full flex-1 border border-gray-200 shadow-sm rounded-sm relative print:border-none print:shadow-none">
        <table className="w-full text-left table-auto print:text-[10px]">
          <thead className="bg-[#f0f4f8] text-gray-700 font-semibold border-b border-gray-300">
              <tr>
                <th className="print:hidden font-medium p-2 w-8 text-center text-gray-400 font-bold border-r border-gray-300 border-b border-gray-300">
                  +
                </th>
                {ALL_COLUMNS.map(col => visibleCols[col.id] && (
                  <th key={col.id} className="font-medium p-2 leading-tight border-r border-gray-300 border-b border-gray-300 whitespace-nowrap">
                    {col.label}
                  </th>
                ))}
                <th className="print:hidden font-medium p-2 w-16 text-center border-r border-gray-300 border-b border-gray-300 relative">
                  <div 
                    className="flex items-center justify-center cursor-pointer hover:bg-gray-200 p-1 rounded"
                    onClick={() => setShowColDropdown(!showColDropdown)}
                  >
                    <Settings2 className="w-3.5 h-3.5" />
                  </div>
                  {showColDropdown && (
                    <div 
                      className="absolute right-0 top-full mt-1 bg-white border border-gray-200 shadow-lg rounded-sm w-56 max-h-[400px] overflow-y-auto z-50 text-left font-normal"
                      onMouseLeave={() => setShowColDropdown(false)}
                    >
                      {ALL_COLUMNS.map(col => {
                        const isDisabled = col.id === 'po_number';
                        return (
                          <label key={col.id} className={`flex items-center gap-2 px-3 py-1.5 select-none text-gray-700 ${isDisabled ? 'opacity-60 cursor-not-allowed bg-gray-50' : 'hover:bg-[#eef2f9] cursor-pointer'}`}>
                            <input 
                              type="checkbox" 
                              checked={!!visibleCols[col.id]} 
                              onChange={() => !isDisabled && toggleCol(col.id)}
                              disabled={isDisabled}
                              className={`w-3.5 h-3.5 rounded-sm border-gray-300 text-blue-600 focus:ring-blue-500 ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                            />
                            <span className="text-[12px] whitespace-nowrap">{col.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </th>
                <th className="print:hidden font-medium p-2 w-8 text-center text-gray-400 font-bold border-b border-gray-300 relative">
                  <button 
                    onClick={() => router.push('/dashboard/mrp/procurement/create')}
                    title="Create new PO"
                    className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-blue-600 rounded mx-auto border-none cursor-pointer bg-transparent"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </th>
              </tr>
              <tr className="bg-white print:hidden border-b border-gray-300">
                <th className="print:hidden p-1.5 border-r border-gray-300 bg-[#f9fafb] text-center align-top relative">
                  <div 
                    className="inline-flex items-center justify-center cursor-pointer p-1 rounded hover:bg-gray-200 mt-2 text-gray-600 border border-gray-400 bg-white shadow-sm"
                    onClick={() => setShowSaveMenu(!showSaveMenu)}
                  >
                    <Save className="w-3.5 h-3.5" />
                  </div>
                  {showSaveMenu && (
                    <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 shadow-lg rounded-sm w-48 z-50 text-left font-normal flex flex-col p-2 gap-1">
                      <button 
                        onClick={() => { setShowSaveModal(true); setShowSaveMenu(false); }}
                        className="w-full text-center bg-[#1d5ab0] text-white py-1.5 rounded-sm hover:bg-[#15468d] text-[12px] font-medium border-none cursor-pointer"
                      >
                        Save this search
                      </button>
                      {savedSearches.length > 0 && <div className="border-b border-gray-100 my-1"></div>}
                      {savedSearches.map(s => (
                        <div 
                          key={s.name} 
                          className="flex items-center justify-between px-2 py-1.5 hover:bg-gray-50 cursor-pointer rounded-sm group text-[11px] text-blue-600"
                          onClick={() => loadSavedSearch(s.filters)}
                        >
                          <span className="truncate flex-1" title={s.name}>{s.name}</span>
                          <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <input type="checkbox" className="mr-2 w-3 h-3 cursor-pointer" readOnly />
                            <button onClick={(e) => deleteSavedSearch(s.name, e)} className="text-gray-400 hover:text-red-500 bg-transparent border-none cursor-pointer">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {showSaveModal && (
                    <>
                      <div className="fixed inset-0 bg-black/20 z-[60]" onClick={() => setShowSaveModal(false)}></div>
                      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-md shadow-xl border border-gray-200 z-[70] w-[300px] flex flex-col p-4 text-left">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-[14px] font-medium text-gray-800 m-0 p-0 leading-none">Save this search</h3>
                          <button onClick={() => setShowSaveModal(false)} className="text-gray-400 hover:text-gray-600 p-0 bg-transparent border-none cursor-pointer">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <input 
                          type="text" 
                          value={newSearchName}
                          onChange={e => setNewSearchName(e.target.value)}
                          placeholder="Description"
                          className="w-full bg-[#f0f4fc] border border-blue-400 focus:border-blue-500 rounded-sm px-2 py-1.5 mb-4 outline-none text-[12px]"
                          autoFocus
                          onKeyDown={e => { if (e.key === 'Enter') saveCurrentSearch(); }}
                        />
                        <div className="flex justify-end gap-2">
                          <button onClick={() => setShowSaveModal(false)} className="px-4 py-1.5 bg-[#f0f4fc] text-[#1e5aa0] hover:bg-[#e4ebf7] rounded-sm font-medium text-[12px] border-none cursor-pointer">Cancel</button>
                          <button onClick={saveCurrentSearch} className="px-4 py-1.5 bg-[#1d5ab0] text-white hover:bg-[#15468d] rounded-sm font-medium text-[12px] border-none cursor-pointer">Save</button>
                        </div>
                      </div>
                    </>
                  )}
                </th>
                {ALL_COLUMNS.map((col) => visibleCols[col.id] && (
                  <td key={col.id} className="p-1.5 border-r border-gray-300 border-b border-gray-300 relative align-top font-normal">
                    {col.filter === 'range' ? (
                      <div className="space-y-1">
                        <input 
                          type={col.id.endsWith('_date') || col.id === 'shipped_on' ? 'date' : 'text'}
                          name={col.minKey}
                          value={filters[col.minKey as keyof typeof filters] || ""}
                          onChange={col.id.endsWith('_date') || col.id === 'shipped_on' ? handleChange : handleNumericChange}
                          onBlur={col.id.endsWith('_date') || col.id === 'shipped_on' ? undefined : handleBlur}
                          onKeyDown={handleKeyDown}
                          className={`w-full h-7 bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px] ${col.id.endsWith('_date') || col.id === 'shipped_on' ? 'text-gray-500' : 'placeholder-gray-400'}`}
                          placeholder="min" 
                        />
                        <input 
                          type={col.id.endsWith('_date') || col.id === 'shipped_on' ? 'date' : 'text'}
                          name={col.maxKey}
                          value={filters[col.maxKey as keyof typeof filters] || ""}
                          onChange={col.id.endsWith('_date') || col.id === 'shipped_on' ? handleChange : handleNumericChange}
                          onBlur={col.id.endsWith('_date') || col.id === 'shipped_on' ? undefined : handleBlur}
                          onKeyDown={handleKeyDown}
                          className={`w-full h-7 bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px] ${col.id.endsWith('_date') || col.id === 'shipped_on' ? 'text-gray-500' : 'placeholder-gray-400'}`}
                          placeholder="max" 
                        />
                      </div>
                    ) : col.filter === 'select' ? (
                      <div className="relative">
                        <select 
                          name={col.id}
                          value={filters[col.id as keyof typeof filters] || ""}
                          onChange={handleSelectChange}
                          className="w-full h-7 bg-[#F3F4F6] border-none rounded-sm px-2 pr-6 focus:ring-1 focus:ring-blue-500 outline-none text-[11px] appearance-none text-gray-500"
                        >
                          <option value=""></option>
                          {col.options?.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 absolute right-1.5 top-1.5 text-gray-400 pointer-events-none" />
                      </div>
                    ) : (
                      <input 
                        type="text" 
                        name={col.id}
                        value={filters[col.id as keyof typeof filters] || ""}
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
                        className="w-full h-7 bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px]" 
                      />
                    )}
                  </td>
                ))}
                <th className="p-1.5 align-top bg-[#f9fafb] border-b border-gray-300 min-w-[140px]">
                  <div className="flex items-center justify-center gap-2 pr-2 pt-1 ml-1">
                    <button onClick={handleSearch} className="px-3 py-1 bg-[#f0f4fc] text-[#1e5aa0] hover:bg-[#e4ebf7] rounded font-medium text-[12px] transition-colors cursor-pointer border-none mr-2">Search</button>
                    <button onClick={handleClear} className="text-[#1e5aa0] hover:underline text-[12px] font-medium bg-transparent border-none cursor-pointer">Clear</button>
                  </div>
                </th>
              </tr>
              {orders.length > 0 && (
                <tr className="bg-[#f9fafb] font-bold border-b border-gray-300">
                  <td className="p-2 text-right pr-6 border-r border-gray-300 text-[11px] text-gray-800">Total:</td>
                  {ALL_COLUMNS.map(col => {
                    if (!visibleCols[col.id]) return null;
                    
                    if (col.showTotal) {
                      let total = 0;
                      if (col.id === 'quantity') {
                        total = response?.summary?.total_quantity || 0;
                      } else {
                        total = response?.summary?.[col.id] || 0;
                      }
                      
                      const prefix = baseCurrencyCols.includes(col.id) ? '$ ' : '';
                      const formatter = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                      
                      return (
                        <td key={col.id} className="p-2 border-r border-gray-300 whitespace-nowrap text-right text-[11px] text-gray-800">
                          {prefix}{formatter.format(total)}
                        </td>
                      );
                    }
                    
                    return <td key={col.id} className="p-2 border-r border-gray-300"></td>;
                  })}
                  <td className="p-2 border-r border-gray-300"></td>
                </tr>
              )}
            </thead>
            <tbody>
              {isLoading && limit === 50 && orders.length === 0 ? (
                <tr>
                  <td colSpan={ALL_COLUMNS.filter(c => visibleCols[c.id]).length + 2} className="text-center py-12 text-gray-500">Loading items...</td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={ALL_COLUMNS.filter(c => visibleCols[c.id]).length + 2} className="px-4 py-8 text-center text-gray-500">No data available</td>
                </tr>
              ) : (
                orders.map((item: any, i: number) => (
                  <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="p-2 text-center text-gray-400 text-xs border-r border-gray-200">
                      {i + 1}
                    </td>
                      {ALL_COLUMNS.map(col => {
                        if (!visibleCols[col.id]) return null;
                        
                        const formatValue = (val: any, colId: string, itemData: any) => {
                          if (val === null || val === undefined) return "";
                          
                          // Format dates to DD/MM/YYYY
                          if (colId.endsWith('_date') || colId === 'shipped_on') {
                            try {
                              const d = new Date(val);
                              if (!isNaN(d.getTime())) {
                                const day = String(d.getDate()).padStart(2, '0');
                                const month = String(d.getMonth() + 1).padStart(2, '0');
                                const year = d.getFullYear();
                                return `${day}/${month}/${year}`;
                              }
                            } catch(e) {}
                          }
                          
                          const baseCurrencyCols = ['total', 'tax', 'total_including_tax', 'unit_cost', 'buy_price', 's1_buy_price', 's2_buy_price', 'sell_price', 'bwe_added_value_cost'];
                          const inCurrencyCols = ['total_in_currency', 'tax_in_currency', 'total_including_tax_in_currency', 'unit_cost_in_currency'];
                          
                          if (baseCurrencyCols.includes(colId)) {
                            const formatter = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                            return `$ ${formatter.format(val)}`;
                          }
                          
                          if (inCurrencyCols.includes(colId)) {
                            const formatter = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                            return `${itemData.currency || '$'} ${formatter.format(val)}`;
                          }
                          
                          return String(val);
                        };
                        let displayVal = formatValue(item[col.id], col.id, item);
                        if (col.id === 'quantity' && item.unit) {
                          displayVal = `${displayVal} ${item.unit}`;
                        }
                        
                        return (
                          <td key={col.id} className={`p-2 border-r border-gray-200 whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px] ${(baseCurrencyCols.includes(col.id) || inCurrencyCols.includes(col.id)) ? 'text-right' : ''}`} title={displayVal}>
                            {displayVal}
                          </td>
                        );
                      })}
                      <td className="p-2 border-r border-gray-200 text-center">
                        <button 
                          onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/mrp/procurement/${item.po_number}`); }}
                          className="bg-transparent border-none p-0 cursor-pointer flex items-center justify-center mx-auto"
                          title="Edit PO"
                        >
                          <Edit2 className="h-3.5 w-3.5 text-gray-400 hover:text-[#1e5aa0]" />
                        </button>
                      </td>
                      <td className="p-2 text-center">
                        <button 
                          onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/mrp/procurement/${item.po_number}/reports`); }}
                          className="bg-transparent border-none p-0 cursor-pointer flex items-center justify-center mx-auto"
                          title="Reports"
                        >
                          <BarChart2 className="h-3.5 w-3.5 text-gray-400 hover:text-[#1e5aa0]" />
                        </button>
                      </td>
                    </tr>
                ))
              )}
              </tbody>
        </table>
        
        {isFetching && orders.length > 0 && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] flex items-center justify-center z-10 transition-opacity">
            <div className="bg-white p-3 rounded-full shadow-lg border border-gray-200">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          </div>
        )}
      </div>

      {orders.length > 0 && (
        <div className="flex justify-center mt-4 pb-2 shrink-0 h-8">
          {hasMore ? (
            <button
              onClick={() => setLimit((prev) => prev + 50)}
              disabled={isFetching}
              className="text-blue-600 cursor-pointer font-medium text-[13px] hover:underline bg-transparent border-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isFetching && limit > 50 ? "Loading..." : "Load more"}
            </button>
          ) : (
            <span className="text-gray-400 text-[13px]">No more items</span>
          )}
        </div>
      )}
    </div>
  );
}
