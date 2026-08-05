"use client";

import { useState, useEffect } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { mrpApi } from "@/services/mrpApi";
import { CalendarDays, Plus, Settings2, Flag, Edit2, ChevronDown, Loader2, Save, X, BarChart2 } from "lucide-react";
import { MrpExportBar } from "@/components/mrp/MrpExportBar";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";


const ALL_COLUMNS = [
  { id: 'total', label: 'Total' },
  { id: 'po_number', label: 'Number' },
  { id: 'status', label: 'Status' },
  { id: 'created_date', label: 'Created' },
  { id: 'expected_date', label: 'Expected date' },
  { id: 'vendor_number', label: 'Vendor number' },
  { id: 'vendor_name', label: 'Vendor name' },
  { id: 'tax', label: 'Tax' },
  { id: 'total_including_tax', label: 'Total including tax' },
  { id: 'paid', label: 'Paid' },
  { id: 'unpaid', label: 'Unpaid' },
  { id: 'currency', label: 'Currency' },
  { id: 'total_in_currency', label: 'Total (in currency)' },
  { id: 'tax_in_currency', label: 'Tax (in currency)' },
  { id: 'total_including_tax_in_currency', label: 'Total including tax (in currency)' },
  { id: 'paid_in_currency', label: 'Paid (in currency)' },
  { id: 'unpaid_in_currency', label: 'Unpaid (in currency)' },
  { id: 'invoice_status', label: 'Invoice status' },
  { id: 'payment_status', label: 'Payment status' },
  { id: 'created_by', label: 'Created by' },
  { id: 'arrival_date', label: 'Arrival date' },
  { id: 'order_id', label: 'Order ID' },
  { id: 'order_date', label: 'Order date' },
  { id: 'invoice_id', label: 'Invoice ID' },
  { id: 'invoice_date', label: 'Invoice date' },
  { id: 'due_date', label: 'Due date' },
  { id: 'shipped_on', label: 'Shipped on' },
  { id: 'delay', label: 'Delay' },
  { id: 'po_free_text', label: 'PO free text' },
  { id: 'total_quantity', label: 'Total quantity' },
  { id: 'bwe_job_id', label: 'B.W.E. Job ID' },
  { id: 'po_emailed', label: 'PO Emailed' },
  { id: 'attention', label: 'Attention' },
  { id: 'notes', label: 'NOTES' },
  { id: 'account', label: 'ACCOUNT' },
];

const emptyFilters = {
  min_total: "", max_total: "", po_number: "", status: "", 
  min_created: "", max_created: "", min_expected: "", max_expected: "", 
  vendor_number: "", vendor_name: "",
  min_tax: "", max_tax: "", min_total_including_tax: "", max_total_including_tax: "",
  min_paid: "", max_paid: "", min_unpaid: "", max_unpaid: "",
  currency: "",
  min_total_in_currency: "", max_total_in_currency: "",
  min_tax_in_currency: "", max_tax_in_currency: "",
  min_total_including_tax_in_currency: "", max_total_including_tax_in_currency: "",
  min_paid_in_currency: "", max_paid_in_currency: "",
  min_unpaid_in_currency: "", max_unpaid_in_currency: "",
  invoice_status: "", payment_status: "", created_by: "",
  min_arrival_date: "", max_arrival_date: "", order_id: "", min_order_date: "", max_order_date: "",
  invoice_id: "", min_invoice_date: "", max_invoice_date: "", min_due_date: "", max_due_date: "",
  min_shipped_on: "", max_shipped_on: "", min_delay: "", max_delay: "", po_free_text: "",
  min_total_quantity: "", max_total_quantity: "", bwe_job_id: "",
  po_emailed: "", attention: "", notes: "", account: "",
};

export default function PurchaseOrdersTable() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  
  const [filters, setFilters] = useState({
    min_total: "",
    max_total: "",
    po_number: "",
    status: "",
    min_created: "",
    max_created: "",
    min_expected: "",
    max_expected: "",
    vendor_number: "",
    vendor_name: "",
    min_tax: "",
    max_tax: "",
    min_total_including_tax: "",
    max_total_including_tax: "",
    min_paid: "",
    max_paid: "",
    min_unpaid: "",
    max_unpaid: "",
    currency: "",
    min_total_in_currency: "",
    max_total_in_currency: "",
    min_tax_in_currency: "",
    max_tax_in_currency: "",
    min_total_including_tax_in_currency: "",
    max_total_including_tax_in_currency: "",
    min_paid_in_currency: "",
    max_paid_in_currency: "",
    min_unpaid_in_currency: "",
    max_unpaid_in_currency: "",
    invoice_status: "",
    payment_status: "",
    created_by: "",
    min_arrival_date: "", max_arrival_date: "", order_id: "", min_order_date: "", max_order_date: "",
    invoice_id: "", min_invoice_date: "", max_invoice_date: "", min_due_date: "", max_due_date: "",
    min_shipped_on: "", max_shipped_on: "", min_delay: "", max_delay: "", po_free_text: "",
    min_total_quantity: "", max_total_quantity: "", bwe_job_id: "",
    po_emailed: "", attention: "", notes: "", account: "",
  });
  
  const [activeFilters, setActiveFilters] = useState({});
  const [visibleCols, setVisibleCols] = useState<Record<string, boolean>>({
    total: true,
    po_number: true,
    status: true,
    created_date: true,
    expected_date: true,
    vendor_number: true,
    vendor_name: true,
    tax: true,
    total_including_tax: true,
    paid: true,
    unpaid: true,
    currency: true,
    total_in_currency: true,
    tax_in_currency: true,
    total_including_tax_in_currency: true,
    paid_in_currency: true,
    unpaid_in_currency: true,
    invoice_status: true,
    payment_status: true,
    created_by: true,
    arrival_date: true,
    order_id: true,
    order_date: true,
    invoice_id: true,
    invoice_date: true,
    due_date: true,
    shipped_on: true,
    delay: true,
    po_free_text: true,
    total_quantity: true,
    bwe_job_id: true,
    po_emailed: true,
    attention: true,
    notes: true,
    account: true
  });
  const [showColDropdown, setShowColDropdown] = useState(false);

  const [savedSearches, setSavedSearches] = useState<{name: string, filters: Record<string, string>}[]>([]);
  const [showSaveMenu, setShowSaveMenu] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [newSearchName, setNewSearchName] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem('mrp_saved_searches');
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
    localStorage.setItem('mrp_saved_searches', JSON.stringify(newSearches));
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
    localStorage.setItem('mrp_saved_searches', JSON.stringify(newSearches));
  };


  const toggleCol = (id: string) => {
    setVisibleCols(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const { data: response, isLoading, isFetching } = useQuery({
    queryKey: ["mrpPurchaseOrders", limit, activeFilters],
    queryFn: () => {
      // Filter out empty strings from activeFilters
      const validFilters = Object.fromEntries(
        Object.entries(activeFilters).filter(([_, v]) => v !== "")
      );
      console.log("Fetching with validFilters:", validFilters);
      return mrpApi.getPurchaseOrders(1, limit, validFilters);
    },
    placeholderData: keepPreviousData,
  });

  
  
  const fetchAllData = async () => {
    try {
      toast.loading("Fetching all data...", { id: "export" });
      const response = await mrpApi.exportPurchaseOrders(activeFilters);
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
    doc.text("Purchase orders", 14, 15);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    doc.text(today, doc.internal.pageSize.width - 14, 15, { align: "right" });

    // Exact columns from user request (only important available columns)
    const pdfCols = [
      { id: 'po_number', label: 'Number' },
      { id: 'status', label: 'Status' },
      { id: 'quantity', label: 'Quantity' },
      { id: 'created_date', label: 'Created' },
      { id: 'expected_date', label: 'Expected date' },
      { id: 'vendor_number', label: 'Vendor number' },
      { id: 'vendor_name', label: 'Vendor name' },
      { id: 'total', label: 'Total' }
    ];

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
    if (filters.min_created && filters.max_created && new Date(filters.min_created) > new Date(filters.max_created)) {
      toast.error("Min created date cannot be greater than Max created date");
      return;
    }
    if (filters.min_expected && filters.max_expected && new Date(filters.min_expected) > new Date(filters.max_expected)) {
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

  const handleNumericChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setFilters(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (value && !isNaN(Number(value))) {
      setFilters(prev => ({ ...prev, [name]: formatCurrency(value) }));
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
  
  const currencyTotals = response?.currency_summary || {};

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
            
            
            {/* Main Header */}
            <tr>
              <th className="print:hidden font-medium p-2 w-8 text-center text-gray-400 font-bold border-r border-gray-300 border-b border-gray-300">+</th>
              {visibleCols.total && <th className="font-medium p-2 leading-tight border-r border-gray-300 border-b border-gray-300 whitespace-nowrap text-right">Total</th>}
              {visibleCols.po_number && (
                <th className="font-medium p-2 leading-tight flex items-center gap-1 border-r border-gray-300 border-b border-gray-300 whitespace-nowrap">
                  Number <span className="text-gray-400">↓</span>
                </th>
              )}
              {visibleCols.status && <th className="font-medium p-2 leading-tight border-r border-gray-300 border-b border-gray-300 whitespace-nowrap">Status</th>}
              {visibleCols.created_date && <th className="font-medium p-2 leading-tight border-r border-gray-300 border-b border-gray-300 whitespace-nowrap">Created</th>}
              {visibleCols.expected_date && <th className="font-medium p-2 leading-tight border-r border-gray-300 border-b border-gray-300 whitespace-nowrap">Expected date</th>}
              {visibleCols.vendor_number && <th className="font-medium p-2 leading-tight border-r border-gray-300 border-b border-gray-300 whitespace-nowrap">Vendor number</th>}
              {visibleCols.vendor_name && <th className="font-medium p-2 leading-tight border-r border-gray-300 border-b border-gray-300 whitespace-nowrap">Vendor name</th>}
              {visibleCols.tax && <th className="font-medium p-2 leading-tight border-r border-gray-300 border-b border-gray-300 whitespace-nowrap text-right">Tax</th>}
              {visibleCols.total_including_tax && <th className="font-medium p-2 leading-tight border-r border-gray-300 border-b border-gray-300 whitespace-nowrap text-right">Total including tax</th>}
              {visibleCols.paid && <th className="font-medium p-2 leading-tight border-r border-gray-300 border-b border-gray-300 whitespace-nowrap text-right">Paid</th>}
              {visibleCols.unpaid && <th className="font-medium p-2 leading-tight border-r border-gray-300 border-b border-gray-300 whitespace-nowrap text-right">Unpaid</th>}
              {visibleCols.currency && <th className="font-medium p-2 leading-tight border-r border-gray-300 border-b border-gray-300 whitespace-nowrap text-center">Currency</th>}
              {visibleCols.total_in_currency && <th className="font-medium p-2 leading-tight border-r border-gray-300 border-b border-gray-300 whitespace-nowrap text-right">Total (in currency)</th>}
              {visibleCols.tax_in_currency && <th className="font-medium p-2 leading-tight border-r border-gray-300 border-b border-gray-300 whitespace-nowrap text-right">Tax (in currency)</th>}
              {visibleCols.total_including_tax_in_currency && <th className="font-medium p-2 leading-tight border-r border-gray-300 border-b border-gray-300 whitespace-nowrap text-right">Total including tax (in currency)</th>}
              {visibleCols.paid_in_currency && <th className="font-medium p-2 leading-tight border-r border-gray-300 border-b border-gray-300 whitespace-nowrap text-right">Paid (in currency)</th>}
              {visibleCols.unpaid_in_currency && <th className="font-medium p-2 leading-tight border-r border-gray-300 border-b border-gray-300 whitespace-nowrap text-right">Unpaid (in currency)</th>}
              {visibleCols.invoice_status && <th className="font-medium p-2 leading-tight border-r border-gray-300 border-b border-gray-300 whitespace-nowrap">Invoice status</th>}
              {visibleCols.payment_status && <th className="font-medium p-2 leading-tight border-r border-gray-300 border-b border-gray-300 whitespace-nowrap">Payment status</th>}
              {visibleCols.created_by && <th className="font-medium p-2 leading-tight border-r border-gray-300 border-b border-gray-300 whitespace-nowrap">Created by</th>}
              {visibleCols.arrival_date && <th className="font-medium p-2 leading-tight border-r border-gray-300 border-b border-gray-300 whitespace-nowrap">Arrival date</th>}
              {visibleCols.order_id && <th className="font-medium p-2 leading-tight border-r border-gray-300 border-b border-gray-300 whitespace-nowrap">Order ID</th>}
              {visibleCols.order_date && <th className="font-medium p-2 leading-tight border-r border-gray-300 border-b border-gray-300 whitespace-nowrap">Order date</th>}
              {visibleCols.invoice_id && <th className="font-medium p-2 leading-tight border-r border-gray-300 border-b border-gray-300 whitespace-nowrap">Invoice ID</th>}
              {visibleCols.invoice_date && <th className="font-medium p-2 leading-tight border-r border-gray-300 border-b border-gray-300 whitespace-nowrap">Invoice date</th>}
              {visibleCols.due_date && <th className="font-medium p-2 leading-tight border-r border-gray-300 border-b border-gray-300 whitespace-nowrap">Due date</th>}
              {visibleCols.shipped_on && <th className="font-medium p-2 leading-tight border-r border-gray-300 border-b border-gray-300 whitespace-nowrap">Shipped on</th>}
              {visibleCols.delay && <th className="font-medium p-2 leading-tight border-r border-gray-300 border-b border-gray-300 whitespace-nowrap">Delay</th>}
              {visibleCols.po_free_text && <th className="font-medium p-2 leading-tight border-r border-gray-300 border-b border-gray-300 whitespace-nowrap">PO free text</th>}
              {visibleCols.total_quantity && <th className="font-medium p-2 leading-tight border-r border-gray-300 border-b border-gray-300 whitespace-nowrap">Total quantity</th>}
              {visibleCols.bwe_job_id && <th className="font-medium p-2 leading-tight border-r border-gray-300 border-b border-gray-300 whitespace-nowrap">B.W.E. Job ID</th>}
              {visibleCols.po_emailed && <th className="font-medium p-2 leading-tight border-r border-gray-300 border-b border-gray-300 whitespace-nowrap">PO Emailed</th>}
              {visibleCols.attention && <th className="font-medium p-2 leading-tight border-r border-gray-300 border-b border-gray-300 whitespace-nowrap">Attention</th>}
              {visibleCols.notes && <th className="font-medium p-2 leading-tight border-r border-gray-300 border-b border-gray-300 whitespace-nowrap">NOTES</th>}
              {visibleCols.account && <th className="font-medium p-2 leading-tight border-r border-gray-300 border-b border-gray-300 whitespace-nowrap">ACCOUNT</th>}
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
            {/* Filter Row */}
            <tr className="print:hidden bg-white border-b border-gray-300">
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
                {/* Modal for saving search */}
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
              {visibleCols.total && (
                <th className="p-1.5 align-top border-r border-gray-300 font-normal space-y-1 w-24">
                  <input name="min_total" value={filters.min_total} onChange={handleNumericChange} onBlur={handleBlur} onKeyDown={handleKeyDown} type="text" placeholder="min" className="w-full h-7 bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px] placeholder-gray-400" />
                  <input name="max_total" value={filters.max_total} onChange={handleNumericChange} onBlur={handleBlur} onKeyDown={handleKeyDown} type="text" placeholder="max" className="w-full h-7 bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px] placeholder-gray-400" />
                </th>
              )}
              {visibleCols.po_number && (
                <th className="p-1.5 align-top border-r border-gray-300 font-normal">
                  <input name="po_number" value={filters.po_number} onChange={handleChange} onKeyDown={handleKeyDown} type="text" className="w-full h-7 bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px]" />
                </th>
              )}
              {visibleCols.status && (
                <th className="p-1.5 align-top border-r border-gray-300 font-normal w-28">
                  <div className="relative">
                    <select 
                      name="status" 
                      value={filters.status} 
                      onChange={(e) => {
                        const val = e.target.value;
                        setFilters(prev => ({ ...prev, status: val }));
                        setActiveFilters(prev => ({ ...prev, status: val }));
                        setLimit(50);
                      }} 
                      className="w-full h-7 bg-[#F3F4F6] border-none rounded-sm px-2 pr-6 focus:ring-1 focus:ring-blue-500 outline-none text-[11px] appearance-none text-gray-500"
                    >
                      <option value=""></option>
                      <option value="New PO">New PO</option>
                      <option value="RFQ">RFQ</option>
                      <option value="Ordered">Ordered</option>
                      <option value="Shipped">Shipped</option>
                      <option value="Received">Received</option>
                      <option value="Archived">Archived</option>
                      <option value="Canceled">Canceled</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 absolute right-1.5 top-1.5 text-gray-400 pointer-events-none" />
                  </div>
                </th>
              )}
              {visibleCols.created_date && (
                <th className="p-1.5 align-top border-r border-gray-300 font-normal space-y-1 w-[130px]">
                  <input name="min_created" value={filters.min_created} onChange={handleChange} onKeyDown={handleKeyDown} type="date" className="w-full h-7 bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px] text-gray-500" />
                  <input name="max_created" value={filters.max_created} onChange={handleChange} onKeyDown={handleKeyDown} type="date" className="w-full h-7 bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px] text-gray-500" />
                </th>
              )}
              {visibleCols.expected_date && (
                <th className="p-1.5 align-top border-r border-gray-300 font-normal space-y-1 w-[130px]">
                  <input name="min_expected" value={filters.min_expected} onChange={handleChange} onKeyDown={handleKeyDown} type="date" className="w-full h-7 bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px] text-gray-500" />
                  <input name="max_expected" value={filters.max_expected} onChange={handleChange} onKeyDown={handleKeyDown} type="date" className="w-full h-7 bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px] text-gray-500" />
                </th>
              )}
              {visibleCols.vendor_number && (
                <th className="p-1.5 align-top border-r border-gray-300 font-normal">
                  <input name="vendor_number" value={filters.vendor_number} onChange={handleChange} onKeyDown={handleKeyDown} type="text" className="w-full h-7 bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px]" />
                </th>
              )}
              {visibleCols.vendor_name && (
                <th className="p-1.5 align-top border-r border-gray-300 font-normal">
                  <input name="vendor_name" value={filters.vendor_name} onChange={handleChange} onKeyDown={handleKeyDown} type="text" className="w-full h-7 bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px]" />
                </th>
              )}
              {visibleCols.tax && (
                <th className="p-1.5 align-top border-r border-gray-300 font-normal space-y-1 w-24">
                  <input name="min_tax" value={filters.min_tax} onChange={handleNumericChange} onBlur={handleBlur} onKeyDown={handleKeyDown} type="text" placeholder="min" className="w-full h-7 bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px] placeholder-gray-400" />
                  <input name="max_tax" value={filters.max_tax} onChange={handleNumericChange} onBlur={handleBlur} onKeyDown={handleKeyDown} type="text" placeholder="max" className="w-full h-7 bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px] placeholder-gray-400" />
                </th>
              )}
              {visibleCols.total_including_tax && (
                <th className="p-1.5 align-top border-r border-gray-300 font-normal space-y-1 w-24">
                  <input name="min_total_including_tax" value={filters.min_total_including_tax} onChange={handleNumericChange} onBlur={handleBlur} onKeyDown={handleKeyDown} type="text" placeholder="min" className="w-full h-7 bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px] placeholder-gray-400" />
                  <input name="max_total_including_tax" value={filters.max_total_including_tax} onChange={handleNumericChange} onBlur={handleBlur} onKeyDown={handleKeyDown} type="text" placeholder="max" className="w-full h-7 bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px] placeholder-gray-400" />
                </th>
              )}
              {visibleCols.paid && (
                <th className="p-1.5 align-top border-r border-gray-300 font-normal space-y-1 w-24">
                  <input name="min_paid" value={filters.min_paid} onChange={handleNumericChange} onBlur={handleBlur} onKeyDown={handleKeyDown} type="text" placeholder="min" className="w-full h-7 bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px] placeholder-gray-400" />
                  <input name="max_paid" value={filters.max_paid} onChange={handleNumericChange} onBlur={handleBlur} onKeyDown={handleKeyDown} type="text" placeholder="max" className="w-full h-7 bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px] placeholder-gray-400" />
                </th>
              )}
              {visibleCols.unpaid && (
                <th className="p-1.5 align-top border-r border-gray-300 font-normal space-y-1 w-24">
                  <input name="min_unpaid" value={filters.min_unpaid} onChange={handleNumericChange} onBlur={handleBlur} onKeyDown={handleKeyDown} type="text" placeholder="min" className="w-full h-7 bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px] placeholder-gray-400" />
                  <input name="max_unpaid" value={filters.max_unpaid} onChange={handleNumericChange} onBlur={handleBlur} onKeyDown={handleKeyDown} type="text" placeholder="max" className="w-full h-7 bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px] placeholder-gray-400" />
                </th>
              )}
              {visibleCols.currency && (
                <th className="p-1.5 align-top border-r border-gray-300 font-normal w-24">
                  <div className="relative mt-2">
                    <select 
                      name="currency" 
                      value={filters.currency} 
                      onChange={(e) => {
                        const val = e.target.value;
                        setFilters(prev => ({ ...prev, currency: val }));
                        setActiveFilters(prev => ({ ...prev, currency: val }));
                        setLimit(50);
                      }} 
                      className="w-full h-7 bg-[#F3F4F6] border-none rounded-sm px-2 pr-6 focus:ring-1 focus:ring-blue-500 outline-none text-[11px] appearance-none text-gray-500"
                    >
                      <option value=""></option>
                      <option value="$">$</option>
                      <option value="AUD">AUD</option>
                      <option value="USD">USD</option>
                      <option value="NZD">NZD</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 absolute right-1.5 top-1.5 text-gray-400 pointer-events-none" />
                  </div>
                </th>
              )}
              {visibleCols.total_in_currency && (
                <th className="p-1.5 align-top border-r border-gray-300 font-normal space-y-1 w-24">
                  <input name="min_total_in_currency" value={filters.min_total_in_currency} onChange={handleNumericChange} onBlur={handleBlur} onKeyDown={handleKeyDown} type="text" placeholder="min" className="w-full h-7 bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px] placeholder-gray-400" />
                  <input name="max_total_in_currency" value={filters.max_total_in_currency} onChange={handleNumericChange} onBlur={handleBlur} onKeyDown={handleKeyDown} type="text" placeholder="max" className="w-full h-7 bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px] placeholder-gray-400" />
                </th>
              )}
              {visibleCols.tax_in_currency && (
                <th className="p-1.5 align-top border-r border-gray-300 font-normal space-y-1 w-24">
                  <input name="min_tax_in_currency" value={filters.min_tax_in_currency} onChange={handleNumericChange} onBlur={handleBlur} onKeyDown={handleKeyDown} type="text" placeholder="min" className="w-full h-7 bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px] placeholder-gray-400" />
                  <input name="max_tax_in_currency" value={filters.max_tax_in_currency} onChange={handleNumericChange} onBlur={handleBlur} onKeyDown={handleKeyDown} type="text" placeholder="max" className="w-full h-7 bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px] placeholder-gray-400" />
                </th>
              )}
              {visibleCols.total_including_tax_in_currency && (
                <th className="p-1.5 align-top border-r border-gray-300 font-normal space-y-1 w-24">
                  <input name="min_total_including_tax_in_currency" value={filters.min_total_including_tax_in_currency} onChange={handleNumericChange} onBlur={handleBlur} onKeyDown={handleKeyDown} type="text" placeholder="min" className="w-full h-7 bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px] placeholder-gray-400" />
                  <input name="max_total_including_tax_in_currency" value={filters.max_total_including_tax_in_currency} onChange={handleNumericChange} onBlur={handleBlur} onKeyDown={handleKeyDown} type="text" placeholder="max" className="w-full h-7 bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px] placeholder-gray-400" />
                </th>
              )}
              {visibleCols.paid_in_currency && (
                <th className="p-1.5 align-top border-r border-gray-300 font-normal space-y-1 w-24">
                  <input name="min_paid_in_currency" value={filters.min_paid_in_currency} onChange={handleNumericChange} onBlur={handleBlur} onKeyDown={handleKeyDown} type="text" placeholder="min" className="w-full h-7 bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px] placeholder-gray-400" />
                  <input name="max_paid_in_currency" value={filters.max_paid_in_currency} onChange={handleNumericChange} onBlur={handleBlur} onKeyDown={handleKeyDown} type="text" placeholder="max" className="w-full h-7 bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px] placeholder-gray-400" />
                </th>
              )}
              {visibleCols.unpaid_in_currency && (
                <th className="p-1.5 align-top border-r border-gray-300 font-normal space-y-1 w-24">
                  <input name="min_unpaid_in_currency" value={filters.min_unpaid_in_currency} onChange={handleNumericChange} onBlur={handleBlur} onKeyDown={handleKeyDown} type="text" placeholder="min" className="w-full h-7 bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px] placeholder-gray-400" />
                  <input name="max_unpaid_in_currency" value={filters.max_unpaid_in_currency} onChange={handleNumericChange} onBlur={handleBlur} onKeyDown={handleKeyDown} type="text" placeholder="max" className="w-full h-7 bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px] placeholder-gray-400" />
                </th>
              )}
              {visibleCols.invoice_status && (
                <th className="p-1.5 align-top border-r border-gray-300 font-normal w-28">
                  <div className="relative mt-2">
                    <select 
                      name="invoice_status" 
                      value={filters.invoice_status} 
                      onChange={(e) => {
                        const val = e.target.value;
                        setFilters(prev => ({ ...prev, invoice_status: val }));
                        setActiveFilters(prev => ({ ...prev, invoice_status: val }));
                        setLimit(50);
                      }} 
                      className="w-full h-7 bg-[#F3F4F6] border-none rounded-sm px-2 pr-6 focus:ring-1 focus:ring-blue-500 outline-none text-[11px] appearance-none text-gray-500"
                    >
                      <option value=""></option>
                      <option value="Not invoiced">Not invoiced</option>
                      <option value="Part invoiced">Part invoiced</option>
                      <option value="Invoiced">Invoiced</option>
                      <option value="Over invoiced">Over invoiced</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 absolute right-1.5 top-1.5 text-gray-400 pointer-events-none" />
                  </div>
                </th>
              )}
              {visibleCols.payment_status && (
                <th className="p-1.5 align-top border-r border-gray-300 font-normal w-28">
                  <div className="relative mt-2">
                    <select 
                      name="payment_status" 
                      value={filters.payment_status} 
                      onChange={(e) => {
                        const val = e.target.value;
                        setFilters(prev => ({ ...prev, payment_status: val }));
                        setActiveFilters(prev => ({ ...prev, payment_status: val }));
                        setLimit(50);
                      }} 
                      className="w-full h-7 bg-[#F3F4F6] border-none rounded-sm px-2 pr-6 focus:ring-1 focus:ring-blue-500 outline-none text-[11px] appearance-none text-gray-500"
                    >
                      <option value=""></option>
                      <option value="Unpaid">Unpaid</option>
                      <option value="Paid partially">Paid partially</option>
                      <option value="Paid">Paid</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 absolute right-1.5 top-1.5 text-gray-400 pointer-events-none" />
                  </div>
                </th>
              )}
              {visibleCols.created_by && (
                <th className="p-1.5 align-top border-r border-gray-300 font-normal w-32">
                  <div className="relative mt-2">
                    <select 
                      name="created_by" 
                      value={filters.created_by} 
                      onChange={(e) => {
                        const val = e.target.value;
                        setFilters(prev => ({ ...prev, created_by: val }));
                        setActiveFilters(prev => ({ ...prev, created_by: val }));
                        setLimit(50);
                      }} 
                      className="w-full h-7 bg-[#F3F4F6] border-none rounded-sm px-2 pr-6 focus:ring-1 focus:ring-blue-500 outline-none text-[11px] appearance-none text-gray-500"
                    >
                      <option value=""></option>
                      <option value="Admin">Admin</option>
                      <option value="David C">David C</option>
                      <option value="John McCafferty">John McCafferty</option>
                      <option value="Kemal">Kemal</option>
                      <option value="Machinist 1">Machinist 1</option>
                      <option value="Machinist 2">Machinist 2</option>
                      <option value="Shikha Yadav">Shikha Yadav</option>
                      <option value="Steve">Steve</option>
                      <option value="Welder 1">Welder 1</option>
                      <option value="WJC 1">WJC 1</option>
                      <option value="WJC 2">WJC 2</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 absolute right-1.5 top-1.5 text-gray-400 pointer-events-none" />
                  </div>
                </th>
              )}
              {visibleCols.arrival_date && (
                <th className="p-1.5 align-top border-r border-gray-300 font-normal space-y-1 w-[130px]">
                  <input name="min_arrival_date" value={filters.min_arrival_date} onChange={handleChange} onKeyDown={handleKeyDown} type="date" className="w-full h-7 bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px] text-gray-500" />
                  <input name="max_arrival_date" value={filters.max_arrival_date} onChange={handleChange} onKeyDown={handleKeyDown} type="date" className="w-full h-7 bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px] text-gray-500" />
                </th>
              )}
              {visibleCols.order_id && (
                <th className="p-1.5 align-top border-r border-gray-300 font-normal">
                  <input name="order_id" value={filters.order_id} onChange={handleChange} onKeyDown={handleKeyDown} type="text" className="w-full h-7 bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px]" />
                </th>
              )}
              {visibleCols.order_date && (
                <th className="p-1.5 align-top border-r border-gray-300 font-normal space-y-1 w-[130px]">
                  <input name="min_order_date" value={filters.min_order_date} onChange={handleChange} onKeyDown={handleKeyDown} type="date" className="w-full h-7 bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px] text-gray-500" />
                  <input name="max_order_date" value={filters.max_order_date} onChange={handleChange} onKeyDown={handleKeyDown} type="date" className="w-full h-7 bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px] text-gray-500" />
                </th>
              )}
              {visibleCols.invoice_id && (
                <th className="p-1.5 align-top border-r border-gray-300 font-normal">
                  <input name="invoice_id" value={filters.invoice_id} onChange={handleChange} onKeyDown={handleKeyDown} type="text" className="w-full h-7 bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px]" />
                </th>
              )}
              {visibleCols.invoice_date && (
                <th className="p-1.5 align-top border-r border-gray-300 font-normal space-y-1 w-[130px]">
                  <input name="min_invoice_date" value={filters.min_invoice_date} onChange={handleChange} onKeyDown={handleKeyDown} type="date" className="w-full h-7 bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px] text-gray-500" />
                  <input name="max_invoice_date" value={filters.max_invoice_date} onChange={handleChange} onKeyDown={handleKeyDown} type="date" className="w-full h-7 bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px] text-gray-500" />
                </th>
              )}
              {visibleCols.due_date && (
                <th className="p-1.5 align-top border-r border-gray-300 font-normal space-y-1 w-[130px]">
                  <input name="min_due_date" value={filters.min_due_date} onChange={handleChange} onKeyDown={handleKeyDown} type="date" className="w-full h-7 bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px] text-gray-500" />
                  <input name="max_due_date" value={filters.max_due_date} onChange={handleChange} onKeyDown={handleKeyDown} type="date" className="w-full h-7 bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px] text-gray-500" />
                </th>
              )}
              {visibleCols.shipped_on && (
                <th className="p-1.5 align-top border-r border-gray-300 font-normal space-y-1 w-[130px]">
                  <input name="min_shipped_on" value={filters.min_shipped_on} onChange={handleChange} onKeyDown={handleKeyDown} type="date" className="w-full h-7 bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px] text-gray-500" />
                  <input name="max_shipped_on" value={filters.max_shipped_on} onChange={handleChange} onKeyDown={handleKeyDown} type="date" className="w-full h-7 bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px] text-gray-500" />
                </th>
              )}
              {visibleCols.delay && (
                <th className="p-1.5 align-top border-r border-gray-300 font-normal space-y-1 w-24">
                  <input name="min_delay" value={filters.min_delay} onChange={handleNumericChange} onBlur={handleBlur} onKeyDown={handleKeyDown} type="text" placeholder="min" className="w-full h-7 bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px] placeholder-gray-400" />
                  <input name="max_delay" value={filters.max_delay} onChange={handleNumericChange} onBlur={handleBlur} onKeyDown={handleKeyDown} type="text" placeholder="max" className="w-full h-7 bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px] placeholder-gray-400" />
                </th>
              )}
              {visibleCols.po_free_text && (
                <th className="p-1.5 align-top border-r border-gray-300 font-normal">
                  <input name="po_free_text" value={filters.po_free_text} onChange={handleChange} onKeyDown={handleKeyDown} type="text" className="w-full h-7 bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px]" />
                </th>
              )}
              {visibleCols.total_quantity && (
                <th className="p-1.5 align-top border-r border-gray-300 font-normal space-y-1 w-24">
                  <input name="min_total_quantity" value={filters.min_total_quantity} onChange={handleNumericChange} onBlur={handleBlur} onKeyDown={handleKeyDown} type="text" placeholder="min" className="w-full h-7 bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px] placeholder-gray-400" />
                  <input name="max_total_quantity" value={filters.max_total_quantity} onChange={handleNumericChange} onBlur={handleBlur} onKeyDown={handleKeyDown} type="text" placeholder="max" className="w-full h-7 bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px] placeholder-gray-400" />
                </th>
              )}
              {visibleCols.bwe_job_id && (
                <th className="p-1.5 align-top border-r border-gray-300 font-normal">
                  <input name="bwe_job_id" value={filters.bwe_job_id} onChange={handleChange} onKeyDown={handleKeyDown} type="text" className="w-full h-7 bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px]" />
                </th>
              )}
              {visibleCols.po_emailed && (
                <th className="p-1.5 align-top border-r border-gray-300 font-normal w-24">
                  <div className="relative">
                    <select
                      name="po_emailed"
                      value={filters.po_emailed || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFilters(prev => ({ ...prev, po_emailed: val }));
                        setActiveFilters(prev => ({ ...prev, po_emailed: val }));
                        setLimit(50);
                      }}
                      className="w-full h-7 bg-[#F3F4F6] border-none rounded-sm px-2 pr-6 focus:ring-1 focus:ring-blue-500 outline-none text-[11px] appearance-none text-gray-500"
                    >
                      <option value=""></option>
                      <option value="Y">Y</option>
                      <option value="N">N</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 absolute right-1.5 top-1.5 text-gray-400 pointer-events-none" />
                  </div>
                </th>
              )}
              {visibleCols.attention && (
                <th className="p-1.5 align-top border-r border-gray-300 font-normal w-32">
                  <div className="relative">
                    <select
                      name="attention"
                      value={filters.attention || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFilters(prev => ({ ...prev, attention: val }));
                        setActiveFilters(prev => ({ ...prev, attention: val }));
                        setLimit(50);
                      }}
                      className="w-full h-7 bg-[#F3F4F6] border-none rounded-sm px-2 pr-6 focus:ring-1 focus:ring-blue-500 outline-none text-[11px] appearance-none text-gray-500"
                    >
                      <option value=""></option>
                      <option value="DAVID C">DAVID C</option>
                      <option value="DERRYN F">DERRYN F</option>
                      <option value="STEPHEN P">STEPHEN P</option>
                      <option value="JOHN Mc">JOHN Mc</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 absolute right-1.5 top-1.5 text-gray-400 pointer-events-none" />
                  </div>
                </th>
              )}
              {visibleCols.notes && (
                <th className="p-1.5 align-top border-r border-gray-300 font-normal">
                  <input name="notes" value={filters.notes || ""} onChange={handleChange} onKeyDown={handleKeyDown} type="text" className="w-full h-7 bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px]" />
                </th>
              )}
              {visibleCols.account && (
                <th className="p-1.5 align-top border-r border-gray-300 font-normal w-24">
                  <div className="relative">
                    <select
                      name="account"
                      value={filters.account || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFilters(prev => ({ ...prev, account: val }));
                        setActiveFilters(prev => ({ ...prev, account: val }));
                        setLimit(50);
                      }}
                      className="w-full h-7 bg-[#F3F4F6] border-none rounded-sm px-2 pr-6 focus:ring-1 focus:ring-blue-500 outline-none text-[11px] appearance-none text-gray-500"
                    >
                      <option value=""></option>
                      <option value="Y">Y</option>
                      <option value="N">N</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 absolute right-1.5 top-1.5 text-gray-400 pointer-events-none" />
                  </div>
                </th>
              )}
              <th className="p-1.5 align-top border-r border-gray-300 text-center bg-[#f9fafb]"></th>
              <th className="p-1.5 align-top bg-[#f9fafb]">
                <div className="flex items-center gap-2 pr-2 pt-1 ml-1">
                  <button onClick={handleSearch} className="px-3 py-1.5 bg-[#f0f4fc] text-[#1e5aa0] hover:bg-[#e4ebf7] rounded font-medium text-[12px] transition-colors cursor-pointer border-none">Search</button>
                  <button onClick={handleClear} className="text-[#1e5aa0] hover:underline text-[12px] font-medium bg-transparent border-none cursor-pointer px-2">Clear</button>
                </div>
              </th>
            </tr>
            {/* Totals Row */}
            {orders.length > 0 && (
              <tr className="bg-white font-bold border-b border-gray-300">
                <td className="p-2 text-right pr-6 border-r border-gray-300">Total:</td>
                {ALL_COLUMNS.map(col => {
                  if (!visibleCols[col.id]) return null;
                  
                  if (['total', 'tax', 'total_including_tax', 'paid', 'unpaid'].includes(col.id)) {
                    const sum = Object.values(currencyTotals).reduce((acc: number, curr: any) => acc + Number(curr[col.id] || 0), 0);
                    return (
                      <td key={col.id} className="p-2 text-right border-r border-gray-300 text-gray-800">
                        <div className="whitespace-nowrap leading-tight">
                          ${formatCurrency(sum)}
                        </div>
                      </td>
                    );
                  }
                  
                  if (['total_in_currency', 'tax_in_currency', 'total_including_tax_in_currency', 'paid_in_currency', 'unpaid_in_currency'].includes(col.id)) {
                    return (
                      <td key={col.id} className="p-2 text-right border-r border-gray-300 text-gray-800">
                        {Object.keys(currencyTotals).map(curr => (
                          <div key={curr} className="whitespace-nowrap leading-tight">
                            {curr} {formatCurrency(currencyTotals[curr][col.id])}
                          </div>
                        ))}
                      </td>
                    );
                  }
                  
                  return <td key={col.id} className="p-2 border-r border-gray-300"></td>;
                })}
                <td colSpan={2}></td>
              </tr>
            )}
          </thead>
          <tbody>

            {isLoading && limit === 50 && orders.length === 0 ? (
              <tr>
                <td colSpan={Object.values(visibleCols).filter(Boolean).length + 3} className="text-center py-12 text-gray-500">Loading purchase orders...</td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={Object.values(visibleCols).filter(Boolean).length + 3} className="px-4 py-8 text-center text-gray-500">No data available</td>
              </tr>
            ) : orders.map((order: any, i: number) => (
              <tr key={order.id || i} className="hover:bg-gray-50 border-b border-gray-200 cursor-pointer text-gray-600">
                <td className="p-2 text-center text-gray-400 border-r border-gray-200">{i + 1}</td>
                {visibleCols.total && <td className="p-2 border-r border-gray-200 whitespace-nowrap text-right font-medium">${formatCurrency(order.total || 0)}</td>}
                {visibleCols.po_number && (
                  <td className="p-2 border-r border-gray-200 whitespace-nowrap">
                    <Link href={`/dashboard/mrp/procurement/${order.po_number}`} className="text-[#1e5aa0] hover:underline font-medium">
                      {order.po_number}
                    </Link>
                  </td>
                )}
                {visibleCols.status && <td className="p-2 border-r border-gray-200 whitespace-nowrap">{order.status}</td>}
                {visibleCols.created_date && <td className="p-2 border-r border-gray-200 whitespace-nowrap">{formatShortDate(order.created_date)}</td>}
                {visibleCols.expected_date && <td className="p-2 border-r border-gray-200 whitespace-nowrap">{formatShortDate(order.expected_date)}</td>}
                {visibleCols.vendor_number && <td className="p-2 border-r border-gray-200 whitespace-nowrap">{order.vendor_number}</td>}
                {visibleCols.vendor_name && <td className="p-2 border-r border-gray-200 whitespace-nowrap">{order.vendor_name}</td>}
                {visibleCols.tax && <td className="p-2 border-r border-gray-200 whitespace-nowrap text-right font-medium">${formatCurrency(order.tax || 0)}</td>}
                {visibleCols.total_including_tax && <td className="p-2 border-r border-gray-200 whitespace-nowrap text-right font-medium">${formatCurrency(order.total_including_tax || 0)}</td>}
                {visibleCols.paid && <td className="p-2 border-r border-gray-200 whitespace-nowrap text-right font-medium">${formatCurrency(order.paid || 0)}</td>}
                {visibleCols.unpaid && <td className="p-2 border-r border-gray-200 whitespace-nowrap text-right font-medium">${formatCurrency(order.unpaid || 0)}</td>}
                {visibleCols.currency && <td className="p-2 border-r border-gray-200 whitespace-nowrap text-center">{order.currency}</td>}
                {visibleCols.total_in_currency && <td className="p-2 border-r border-gray-200 whitespace-nowrap text-right font-medium">{order.currency || '$'} {formatCurrency(order.total_in_currency || 0)}</td>}
                {visibleCols.tax_in_currency && <td className="p-2 border-r border-gray-200 whitespace-nowrap text-right font-medium">{order.currency || '$'} {formatCurrency(order.tax_in_currency || 0)}</td>}
                {visibleCols.total_including_tax_in_currency && <td className="p-2 border-r border-gray-200 whitespace-nowrap text-right font-medium">{order.currency || '$'} {formatCurrency(order.total_including_tax_in_currency || 0)}</td>}
                {visibleCols.paid_in_currency && <td className="p-2 border-r border-gray-200 whitespace-nowrap text-right font-medium">{order.currency || '$'} {formatCurrency(order.paid_in_currency || 0)}</td>}
                {visibleCols.unpaid_in_currency && <td className="p-2 border-r border-gray-200 whitespace-nowrap text-right font-medium">{order.currency || '$'} {formatCurrency(order.unpaid_in_currency || 0)}</td>}
                {visibleCols.invoice_status && <td className="p-2 border-r border-gray-200 whitespace-nowrap">{getStatusBadge(order.invoice_status)}</td>}
                {visibleCols.payment_status && <td className="p-2 border-r border-gray-200 whitespace-nowrap">{getStatusBadge(order.payment_status)}</td>}
                {visibleCols.created_by && <td className="p-2 border-r border-gray-200 whitespace-nowrap">{order.created_by}</td>}
                {visibleCols.arrival_date && <td className="p-2 border-r border-gray-200 whitespace-nowrap">{formatShortDate(order.arrival_date)}</td>}
                {visibleCols.order_id && <td className="p-2 border-r border-gray-200 whitespace-nowrap">{order.order_id}</td>}
                {visibleCols.order_date && <td className="p-2 border-r border-gray-200 whitespace-nowrap">{formatShortDate(order.order_date)}</td>}
                {visibleCols.invoice_id && <td className="p-2 border-r border-gray-200 whitespace-nowrap">{order.invoice_id}</td>}
                {visibleCols.invoice_date && <td className="p-2 border-r border-gray-200 whitespace-nowrap">{formatShortDate(order.invoice_date)}</td>}
                {visibleCols.due_date && <td className="p-2 border-r border-gray-200 whitespace-nowrap">{formatShortDate(order.due_date)}</td>}
                {visibleCols.shipped_on && <td className="p-2 border-r border-gray-200 whitespace-nowrap">{formatShortDate(order.shipped_on)}</td>}
                {visibleCols.delay && <td className="p-2 border-r border-gray-200 whitespace-nowrap text-center">{order.delay != null && order.delay !== '' ? `${order.delay} d` : ''}</td>}
                {visibleCols.po_free_text && <td className="p-2 border-r border-gray-200 whitespace-nowrap">{order.po_free_text}</td>}
                {visibleCols.total_quantity && <td className="p-2 border-r border-gray-200 whitespace-nowrap">{order.total_quantity}</td>}
                {visibleCols.bwe_job_id && <td className="p-2 border-r border-gray-200 whitespace-nowrap">{order.bwe_job_id}</td>}
                {visibleCols.po_emailed && <td className="p-2 border-r border-gray-200 whitespace-nowrap">{order.po_emailed}</td>}
                {visibleCols.attention && <td className="p-2 border-r border-gray-200 whitespace-nowrap">{order.attention}</td>}
                {visibleCols.notes && <td className="p-2 border-r border-gray-200 whitespace-nowrap">{order.notes}</td>}
                {visibleCols.account && <td className="p-2 border-r border-gray-200 whitespace-nowrap">{order.account}</td>}
                <td className="p-2 border-r border-gray-200 text-center">
                  <button 
                    onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/mrp/procurement/${order.po_number}`); }}
                    className="bg-transparent border-none p-0 cursor-pointer flex items-center justify-center mx-auto"
                    title="Edit PO"
                  >
                    <Edit2 className="h-3.5 w-3.5 text-gray-400 hover:text-[#1e5aa0]" />
                  </button>
                </td>
                <td className="p-2 text-center">
                  <button 
                    onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/mrp/procurement/${order.po_number}/reports`); }}
                    className="bg-transparent border-none p-0 cursor-pointer flex items-center justify-center mx-auto"
                    title="Reports"
                  >
                    <BarChart2 className="h-3.5 w-3.5 text-gray-400 hover:text-[#1e5aa0]" />
                  </button>
                </td>
              </tr>
            ))}
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
