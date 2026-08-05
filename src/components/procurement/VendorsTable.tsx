"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { mrpApi } from "@/services/mrpApi";
import { CalendarDays, Plus, Settings2, Edit2, ChevronDown, Loader2, Save, BarChart2, Download, Upload, X } from "lucide-react";
import { useRouter } from "next/navigation";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "sonner";

const ALL_COLUMNS = [
  { id: 'vendor_number', label: 'Number' },
  { id: 'name', label: 'Name' },
  { id: 'phone', label: 'Phone' },
  { id: 'teams', label: 'Teams' },
  { id: 'email', label: 'E-mail' },
  { id: 'url', label: 'URL' },
  { id: 'address', label: 'Address' },
  { id: 'on_time', label: 'On time' },
  { id: 'average_delay', label: 'Average delay' },
  { id: 'currency', label: 'Currency' },
  { id: 'default_lead_time', label: 'Default lead time' },
  { id: 'total_cost', label: 'Total cost' },
  { id: 'notes', label: 'NOTES' },
  { id: 'account', label: 'ACCOUNT' }
];

const DEFAULT_VISIBLE = [
  'vendor_number', 'name', 'on_time', 'average_delay', 'total_cost'
];

export default function VendorsTable() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [showColDropdown, setShowColDropdown] = useState(false);
  const [visibleCols, setVisibleCols] = useState<Record<string, boolean>>(() => {
    const cols: Record<string, boolean> = {};
    ALL_COLUMNS.forEach(col => {
      cols[col.id] = DEFAULT_VISIBLE.includes(col.id);
    });
    return cols;
  });

  const [filters, setFilters] = useState<any>({});
  const [activeFilters, setActiveFilters] = useState<any>({});

  const [savedSearches, setSavedSearches] = useState<{name: string, filters: Record<string, string>}[]>([]);
  const [showSaveMenu, setShowSaveMenu] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [newSearchName, setNewSearchName] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem('mrp_vendor_saved_searches');
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
    localStorage.setItem('mrp_vendor_saved_searches', JSON.stringify(newSearches));
    setNewSearchName("");
    setShowSaveModal(false);
    setShowSaveMenu(false);
  };

  const loadSavedSearch = (searchFilters: Record<string, string>) => {
    setFilters(searchFilters);
    setActiveFilters(searchFilters);
    setLimit(50);
    setShowSaveMenu(false);
  };

  const deleteSavedSearch = (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this saved search?")) return;
    const newSearches = savedSearches.filter(s => s.name !== name);
    setSavedSearches(newSearches);
    localStorage.setItem('mrp_vendor_saved_searches', JSON.stringify(newSearches));
  };
  
  const [period, setPeriod] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  
  // Fake pagination
  const [limit, setLimit] = useState(50);
  
  const { data: response, isLoading, isFetching } = useQuery({
    queryKey: ['mrp-vendors'],
    queryFn: () => mrpApi.getVendors(),
  });

  const toggleCol = (id: string) => {
    setVisibleCols(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSearch = () => {
    setActiveFilters({ ...filters });
    setLimit(50);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const handlePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setPeriod(val);
    
    const today = new Date();
    let start = new Date();
    let end = new Date();

    if (val === 'today') {
      // nothing changes
    } else if (val === 'yesterday') {
      start.setDate(today.getDate() - 1);
      end.setDate(today.getDate() - 1);
    } else if (val === 'tomorrow') {
      start.setDate(today.getDate() + 1);
      end.setDate(today.getDate() + 1);
    } else if (val === 'this_week') {
      const day = today.getDay();
      const diff = today.getDate() - day + (day === 0 ? -6 : 1);
      start.setDate(diff);
      end = new Date(start);
      end.setDate(start.getDate() + 6);
    } else if (val === 'last_week') {
      const day = today.getDay();
      const diff = today.getDate() - day + (day === 0 ? -6 : 1) - 7;
      start.setDate(diff);
      end = new Date(start);
      end.setDate(start.getDate() + 6);
    } else if (val === 'next_week') {
      const day = today.getDay();
      const diff = today.getDate() - day + (day === 0 ? -6 : 1) + 7;
      start.setDate(diff);
      end = new Date(start);
      end.setDate(start.getDate() + 6);
    } else if (val === 'this_month') {
      start = new Date(today.getFullYear(), today.getMonth(), 1);
      end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    } else if (val === 'last_month') {
      start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      end = new Date(today.getFullYear(), today.getMonth(), 0);
    } else if (val === 'next_month') {
      start = new Date(today.getFullYear(), today.getMonth() + 1, 1);
      end = new Date(today.getFullYear(), today.getMonth() + 2, 0);
    } else if (val === 'this_quarter') {
      const quarter = Math.floor(today.getMonth() / 3);
      start = new Date(today.getFullYear(), quarter * 3, 1);
      end = new Date(today.getFullYear(), quarter * 3 + 3, 0);
    } else if (val === 'last_quarter') {
      const quarter = Math.floor(today.getMonth() / 3) - 1;
      start = new Date(today.getFullYear(), quarter * 3, 1);
      end = new Date(today.getFullYear(), quarter * 3 + 3, 0);
    } else if (val === 'next_quarter') {
      const quarter = Math.floor(today.getMonth() / 3) + 1;
      start = new Date(today.getFullYear(), quarter * 3, 1);
      end = new Date(today.getFullYear(), quarter * 3 + 3, 0);
    } else if (val === 'this_year') {
      start = new Date(today.getFullYear(), 0, 1);
      end = new Date(today.getFullYear(), 11, 31);
    } else if (val === 'last_year') {
      start = new Date(today.getFullYear() - 1, 0, 1);
      end = new Date(today.getFullYear() - 1, 11, 31);
    } else if (val === 'last_12_months') {
      start = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
    }

    if (val) {
      setStartDate(formatDate(start));
      setEndDate(formatDate(end));
    } else {
      setStartDate("");
      setEndDate("");
    }
  };

  const handleClear = () => {
    setFilters({});
    setActiveFilters({});
    setLimit(50);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const newFilters = { ...filters, [e.target.name]: e.target.value };
    setFilters(newFilters);
    
    // For select dropdowns, automatically apply the filter
    if (e.target.tagName === 'SELECT') {
      setActiveFilters(newFilters);
      setLimit(50);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSearch();
  };

  // Client side filtering since backend doesn't support it yet
  let vendors = response?.data || [];
  
  if (Object.keys(activeFilters).length > 0) {
    vendors = vendors.filter((v: any) => {
      let match = true;
      if (activeFilters.vendor_number && !String(v.vendor_number).toLowerCase().includes(String(activeFilters.vendor_number).toLowerCase())) match = false;
      if (activeFilters.name && !String(v.name).toLowerCase().includes(String(activeFilters.name).toLowerCase())) match = false;
      
      if (activeFilters.min_on_time && v.on_time < Number(activeFilters.min_on_time)) match = false;
      if (activeFilters.max_on_time && v.on_time > Number(activeFilters.max_on_time)) match = false;

      if (activeFilters.min_average_delay && v.average_delay < Number(activeFilters.min_average_delay)) match = false;
      if (activeFilters.max_average_delay && v.average_delay > Number(activeFilters.max_average_delay)) match = false;

      if (activeFilters.min_total_cost && Number(v.total_cost) < Number(activeFilters.min_total_cost)) match = false;
      if (activeFilters.max_total_cost && Number(v.total_cost) > Number(activeFilters.max_total_cost)) match = false;

      // Handle explicit exact matches for dropdowns
      if (activeFilters.currency && String(v.currency || "").toLowerCase() !== String(activeFilters.currency).toLowerCase()) match = false;
      if (activeFilters.account && String(v.account || "").toLowerCase() !== String(activeFilters.account).toLowerCase()) match = false;

      // Handle all other text columns dynamically
      const textColumns = ['vendor_number', 'name', 'phone', 'teams', 'email', 'url', 'address', 'notes'];
      textColumns.forEach(col => {
        if (activeFilters[col]) {
          const cellValue = String(v[col] || "").toLowerCase();
          const filterValue = String(activeFilters[col]).toLowerCase();
          if (!cellValue.includes(filterValue)) {
            match = false;
          }
        }
      });

      return match;
    });
  }
  
  const formatCurrency = (val: any) => Number(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const exportData = vendors;
  
  const totalCount = vendors.length;
  vendors = vendors.slice(0, limit);
  
  const handleDownloadCSV = () => {
    if (exportData.length === 0) return;
    
    const headers = ALL_COLUMNS.filter(c => visibleCols[c.id]).map(c => c.label);
    const csvRows = [];
    csvRows.push(headers.join(","));
    
    exportData.forEach((vendor: any) => {
      const row = ALL_COLUMNS.filter(c => visibleCols[c.id]).map(c => {
        let val = vendor[c.id];
        if (c.id === 'on_time') val = `${val || 0}%`;
        else if (c.id === 'average_delay' || c.id === 'default_lead_time') val = `${val || 0} d`;
        else if (c.id === 'total_cost') val = `$${formatCurrency(val)}`;
        
        if (val === null || val === undefined) val = "";
        val = String(val).replace(/"/g, '""');
        return `"${val}"`;
      });
      csvRows.push(row.join(","));
    });

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "vendors.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadPDF = () => {
    if (exportData.length === 0) return;

    const doc = new jsPDF({ orientation: 'landscape', format: 'a4' });
    
    doc.setFontSize(16);
    doc.text('Vendors List', 14, 15);
    
    const head = [ALL_COLUMNS.filter(c => visibleCols[c.id]).map(c => c.label)];
    const body: any[] = exportData.map((vendor: any) => {
      return ALL_COLUMNS.filter(c => visibleCols[c.id]).map(c => {
        let val = vendor[c.id];
        if (c.id === 'on_time') val = `${val || 0}%`;
        else if (c.id === 'average_delay' || c.id === 'default_lead_time') val = `${val || 0} d`;
        else if (c.id === 'total_cost') val = `$${formatCurrency(val)}`;
        return val !== null && val !== undefined ? String(val) : "";
      });
    });

    const isTooBig = body.length > 2000;
    if (isTooBig) {
       body.length = 2000;
       const msg = 'This list is too big for PDF creation. Please export the data in CSV format.';
       body.push([{ content: msg, colSpan: head[0].length, styles: { halign: 'center', textColor: [200, 0, 0], fontStyle: 'bold' } }]);
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
    
    doc.save('vendors.pdf');
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    toast.loading("Parsing CSV...", { id: "import" });

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const rows = text.split('\n').map(row => row.trim()).filter(row => row);
        
        if (rows.length <= 1) {
          toast.error("CSV file is empty or has only headers", { id: "import" });
          setIsImporting(false);
          if (fileInputRef.current) fileInputRef.current.value = "";
          return;
        }

        const headers = rows[0].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(h => h.replace(/^"|"$/g, '').trim());
        
        const numIdx = headers.findIndex(h => h === "Number");
        const nameIdx = headers.findIndex(h => h === "Name");
        
        if (nameIdx === -1) {
          toast.error("CSV must contain a 'Name' column", { id: "import" });
          setIsImporting(false);
          if (fileInputRef.current) fileInputRef.current.value = "";
          return;
        }

        toast.loading(`Importing ${rows.length - 1} vendors...`, { id: "import" });
        
        let successCount = 0;
        let failCount = 0;

        for (let i = 1; i < rows.length; i++) {
          const cols = rows[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => c.replace(/^"|"$/g, '').trim());
          
          const vendorData = {
            vendor_number: numIdx !== -1 && cols[numIdx] ? cols[numIdx] : `V${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
            name: cols[nameIdx] || "Unknown Vendor",
            phone: headers.includes("Phone") ? cols[headers.indexOf("Phone")] : "",
            email: headers.includes("E-mail") ? cols[headers.indexOf("E-mail")] : "",
            address: headers.includes("Address") ? cols[headers.indexOf("Address")] : "",
            currency: headers.includes("Currency") ? cols[headers.indexOf("Currency")] : "USD",
            account: headers.includes("ACCOUNT") ? cols[headers.indexOf("ACCOUNT")] : "N",
          };

          try {
            await mrpApi.addVendor(vendorData);
            successCount++;
          } catch (err) {
            failCount++;
          }
        }

        queryClient.invalidateQueries({ queryKey: ['mrp-vendors'] });
        toast.success(`Import complete! Added ${successCount}, failed ${failCount}`, { id: "import" });
      } catch (error) {
        toast.error("Failed to parse CSV", { id: "import" });
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.onerror = () => {
      toast.error("Failed to read file", { id: "import" });
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.readAsText(file);
  };

  return (
    <div className="w-full bg-white text-[12px] text-gray-800 flex flex-col flex-1 min-h-0 relative">
      
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-3 px-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-medium text-gray-800 m-0 p-0">Vendors</h1>
          <button 
            className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-1.5 rounded text-[13px] font-medium hover:bg-blue-700 transition-colors border-none cursor-pointer"
            onClick={() => router.push('/dashboard/mrp/procurement/vendors/create')}
          >
            <Plus className="w-4 h-4" />
            Create
          </button>
        </div>
        <div className="flex items-center gap-2 mt-3 sm:mt-0 text-[12px]">
          <button onClick={handleDownloadPDF} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#e4e9f0] hover:bg-[#d1d8e4] text-gray-700 rounded transition-colors border-none cursor-pointer font-medium">
            <Download className="w-3.5 h-3.5" />
            PDF
          </button>
          <button onClick={handleDownloadCSV} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#e4e9f0] hover:bg-[#d1d8e4] text-gray-700 rounded transition-colors border-none cursor-pointer font-medium">
            <Download className="w-3.5 h-3.5" />
            CSV
          </button>
          <input 
            type="file" 
            accept=".csv" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
            style={{ display: 'none' }}
          />
          <button 
            onClick={() => fileInputRef.current?.click()} 
            disabled={isImporting}
            className={`flex items-center gap-1.5 px-3 py-1.5 ${isImporting ? 'bg-gray-200 text-gray-400' : 'bg-[#e4e9f0] hover:bg-[#d1d8e4] text-gray-700'} rounded transition-colors border-none cursor-pointer font-medium`}
          >
            {isImporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            {isImporting ? 'Importing...' : 'Import from CSV'}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-200 bg-white">
        <div className="flex items-center bg-[#eef2f6] rounded border border-[#d1d9e6]">
          <select value={period} onChange={handlePeriodChange} className="bg-transparent border-none py-1.5 px-3 text-gray-700 text-[12px] outline-none hover:bg-gray-50 cursor-pointer">
            <option value="">Period</option>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="tomorrow">Tomorrow</option>
            <option value="this_week">This week</option>
            <option value="last_week">Last week</option>
            <option value="next_week">Next week</option>
            <option value="this_month">This month</option>
            <option value="last_month">Last month</option>
            <option value="next_month">Next month</option>
            <option value="this_quarter">This quarter</option>
            <option value="last_quarter">Last quarter</option>
            <option value="next_quarter">Next quarter</option>
            <option value="this_year">This year</option>
            <option value="last_year">Last year</option>
            <option value="last_12_months">Last 12 months</option>
          </select>
          <div className="w-px h-5 bg-[#d1d9e6]"></div>
          <div className="flex items-center px-2 text-gray-600 gap-2">
            <input type="text" value={startDate} onChange={e => setStartDate(e.target.value)} placeholder="02/12/2025" className="w-20 bg-transparent border-none text-[12px] outline-none text-center" />
            <CalendarDays className="w-3.5 h-3.5" />
            <span>-</span>
            <input type="text" value={endDate} onChange={e => setEndDate(e.target.value)} placeholder="05/08/2026" className="w-20 bg-transparent border-none text-[12px] outline-none text-center" />
            <CalendarDays className="w-3.5 h-3.5" />
          </div>
        </div>
        <button className="bg-blue-600 text-white p-1.5 rounded hover:bg-blue-700 transition-colors border-none cursor-pointer flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        </button>
      </div>

      <div className="overflow-auto w-full flex-1 relative">
        <table className="w-full text-left table-auto">
          <thead className="bg-[#f0f4f8] text-gray-700 font-medium border-b border-gray-300">
            <tr>
              <th className="p-0 w-8 border-r border-b border-gray-300">
                <button 
                  onClick={() => router.push('/dashboard/mrp/procurement/vendors/create')}
                  className="w-full h-full p-2 flex items-center justify-center bg-transparent border-none cursor-pointer hover:bg-gray-200 text-gray-700 font-bold"
                >
                  +
                </button>
              </th>
              {ALL_COLUMNS.map(col => visibleCols[col.id] && (
                <th key={col.id} className="p-2 leading-tight border-r border-b border-gray-300 whitespace-nowrap">
                  {col.label} {col.id === 'name' ? '↑' : ''}
                </th>
              ))}
              <th className="p-2 w-16 text-center border-r border-b border-gray-300 relative">
                <div 
                  className="flex items-center justify-center cursor-pointer hover:bg-gray-200 p-1 rounded"
                  onClick={() => setShowColDropdown(!showColDropdown)}
                >
                  <Settings2 className="w-3.5 h-3.5" />
                </div>
                {showColDropdown && (
                  <div 
                    className="absolute right-0 top-full mt-1 bg-white border border-gray-200 shadow-lg rounded-sm w-48 max-h-[400px] overflow-y-auto z-50 text-left font-normal"
                    onMouseLeave={() => setShowColDropdown(false)}
                  >
                    {ALL_COLUMNS.map(col => {
                      const isDisabled = col.id === 'vendor_number';
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
              <th className="p-2 w-8 text-center text-gray-400 font-bold border-b border-gray-300 relative">
                +
              </th>
            </tr>
            {/* Filter Row */}
            <tr className="bg-white border-b border-gray-300">
              <th className="p-1.5 border-r border-gray-300 bg-[#f9fafb] text-center align-top relative">
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
                          <button onClick={(e) => deleteSavedSearch(s.name, e)} className="text-gray-400 hover:text-red-500 bg-transparent border-none cursor-pointer p-0 ml-2">
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
              {ALL_COLUMNS.map(col => {
                if (!visibleCols[col.id]) return null;

                if (col.id === 'on_time' || col.id === 'average_delay' || col.id === 'total_cost') {
                  return (
                    <th key={col.id} className="p-1.5 align-top border-r border-gray-300 font-normal">
                      <div className="flex flex-col gap-1">
                        <input name={`min_${col.id}`} value={filters[`min_${col.id}`] || ""} onChange={handleChange} onKeyDown={handleKeyDown} type="text" placeholder="min" className="w-full h-7 bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px]" />
                        <input name={`max_${col.id}`} value={filters[`max_${col.id}`] || ""} onChange={handleChange} onKeyDown={handleKeyDown} type="text" placeholder="max" className="w-full h-7 bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px]" />
                      </div>
                    </th>
                  );
                }

                if (col.id === 'vendor_number' || col.id === 'name') {
                  return (
                    <th key={col.id} className="p-1.5 align-top border-r border-gray-300 font-normal">
                      <input name={col.id} value={filters[col.id] || ""} onChange={handleChange} onKeyDown={handleKeyDown} type="text" className="w-full h-7 bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px]" />
                    </th>
                  );
                }

                if (col.id === 'currency') {
                  return (
                    <th key={col.id} className="p-1.5 align-top border-r border-gray-300 font-normal">
                      <select name={col.id} value={filters[col.id] || ""} onChange={handleChange} className="w-full h-7 bg-[#F3F4F6] border-none rounded-sm px-1 focus:ring-1 focus:ring-blue-500 outline-none text-[11px] cursor-pointer">
                        <option value=""></option>
                        <option value="$">$</option>
                        <option value="AUD">AUD</option>
                        <option value="USD">USD</option>
                        <option value="NZD">NZD</option>
                      </select>
                    </th>
                  );
                }

                if (col.id === 'account') {
                  return (
                    <th key={col.id} className="p-1.5 align-top border-r border-gray-300 font-normal">
                      <select name={col.id} value={filters[col.id] || ""} onChange={handleChange} className="w-full h-7 bg-[#F3F4F6] border-none rounded-sm px-1 focus:ring-1 focus:ring-blue-500 outline-none text-[11px] cursor-pointer">
                        <option value=""></option>
                        <option value="N">N</option>
                        <option value="Y">Y</option>
                      </select>
                    </th>
                  );
                }

                return (
                  <th key={col.id} className="p-1.5 align-top border-r border-gray-300 font-normal">
                    <input name={col.id} value={filters[col.id] || ""} onChange={handleChange} onKeyDown={handleKeyDown} type="text" className="w-full h-7 bg-[#F3F4F6] border-none rounded-sm px-2 focus:ring-1 focus:ring-blue-500 outline-none text-[11px]" />
                  </th>
                );
              })}
              <th className="p-1.5 align-top border-r border-gray-300 text-center bg-[#f9fafb]"></th>
              <th className="p-1.5 align-top bg-[#f9fafb]">
                <div className="flex items-center gap-2 pr-2 pt-1 ml-1">
                  <button onClick={handleSearch} className="px-3 py-1.5 bg-[#f0f4fc] text-[#1e5aa0] hover:bg-[#e4ebf7] rounded font-medium text-[12px] transition-colors cursor-pointer border-none">Search</button>
                  <button onClick={handleClear} className="text-[#1e5aa0] hover:underline text-[12px] font-medium bg-transparent border-none cursor-pointer px-2">Clear</button>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={Object.values(visibleCols).filter(Boolean).length + 3} className="text-center py-12 text-gray-500">Loading vendors...</td>
              </tr>
            ) : vendors.length === 0 ? (
              <tr>
                <td colSpan={Object.values(visibleCols).filter(Boolean).length + 3} className="px-4 py-8 text-center text-gray-500">No data available</td>
              </tr>
            ) : vendors.map((vendor: any, i: number) => (
              <tr key={vendor.id || i} className="hover:bg-gray-50 border-b border-gray-200 text-gray-600">
                <td className="p-2 text-center text-gray-400 border-r border-gray-200">{i + 1}</td>
                {ALL_COLUMNS.map(col => {
                  if (!visibleCols[col.id]) return null;

                  let val = vendor[col.id];
                  
                  if (col.id === 'on_time') val = `${val || 0}%`;
                  else if (col.id === 'average_delay' || col.id === 'default_lead_time') val = `${val || 0} d`;
                  else if (col.id === 'total_cost') val = `$${formatCurrency(val)}`;
                  else val = val || '';

                  if (col.id === 'phone' && val) {
                    return (
                      <td key={col.id} className="p-2 border-r border-gray-200 whitespace-nowrap">
                        <a href={`tel:${val}`} className="text-blue-600 hover:underline">{val}</a>
                      </td>
                    );
                  }
                  
                  if (col.id === 'email' && val) {
                    return (
                      <td key={col.id} className="p-2 border-r border-gray-200 whitespace-nowrap">
                        <a href={`mailto:${val}`} className="text-blue-600 hover:underline">{val}</a>
                      </td>
                    );
                  }

                  if (col.id === 'vendor_number') {
                    return (
                      <td key={col.id} className="p-2 border-r border-gray-200 whitespace-nowrap">
                        <span 
                          onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/mrp/procurement/vendors/${vendor.vendor_number}`); }}
                          className="text-[#1e5aa0] hover:underline cursor-pointer"
                        >
                          {val}
                        </span>
                      </td>
                    );
                  }

                  return (
                    <td key={col.id} className="p-2 border-r border-gray-200 whitespace-nowrap">
                      {val}
                    </td>
                  );
                })}
                <td className="p-2 border-r border-gray-200 text-center">
                  <button 
                    onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/mrp/procurement/vendors/${vendor.vendor_number}`); }}
                    className="bg-transparent border-none p-0 cursor-pointer flex items-center justify-center mx-auto"
                    title="Edit Vendor"
                  >
                    <Edit2 className="h-3.5 w-3.5 text-gray-400 hover:text-[#1e5aa0]" />
                  </button>
                </td>
                <td className="p-2 text-center">
                  <button 
                    onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/mrp/procurement/vendors/${vendor.vendor_number}/reports`); }}
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
        
        {isFetching && vendors.length > 0 && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] flex items-center justify-center z-10 transition-opacity">
            <div className="bg-white p-3 rounded-full shadow-lg border border-gray-200">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          </div>
        )}
        
        {totalCount > limit && (
          <div className="w-full flex justify-center py-6 bg-white border-t border-gray-200">
            <button 
              onClick={() => setLimit(prev => prev + 50)} 
              className="px-6 py-2 bg-[#f0f4fc] text-[#1e5aa0] hover:bg-[#e4ebf7] rounded font-medium text-[13px] transition-colors cursor-pointer border-none shadow-sm"
            >
              Load more
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
