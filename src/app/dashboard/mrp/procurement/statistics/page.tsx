"use client";

import { useState, useMemo } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Calendar as CalendarIcon, Settings2, Search, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { mrpApi } from "@/services/mrpApi";

const UOM_OPTIONS = ['BOX', 'CAN', 'Hourly Rate', 'kg', 'l', 'm', 'mm', 'm²', 'pcs', 'REEL'];

const ALL_COLUMNS = [
  { id: 'part_no', label: 'Part No.', filter: 'text' as const },
  { id: 'part_description', label: 'Part description', filter: 'text' as const },
  { id: 'group_number', label: 'Group number', filter: 'text' as const },
  { id: 'group_name', label: 'Group name', filter: 'text' as const },
  { id: 'quantity', label: 'Quantity', filter: 'range' as const },
  { id: 'uom', label: 'UoM', filter: 'select' as const },
  { id: 'cost', label: 'Cost', filter: 'range' as const },
];

type FilterState = Record<string, string>;

const emptyFilters: FilterState = {
  part_no: '', part_description: '', group_number: '', group_name: '',
  quantity_min: '', quantity_max: '', uom: '', cost_min: '', cost_max: '',
};

const formatDate = (d: Date) => {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

const getDateRange = (period: string): { from: string; to: string } => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  switch (period) {
    case 'today':
      return { from: formatDate(today), to: formatDate(today) };
    case 'yesterday': {
      const y = new Date(today);
      y.setDate(y.getDate() - 1);
      return { from: formatDate(y), to: formatDate(y) };
    }
    case 'this_week': {
      const start = new Date(today);
      const day = start.getDay();
      start.setDate(start.getDate() - (day === 0 ? 6 : day - 1)); // Monday
      return { from: formatDate(start), to: formatDate(today) };
    }
    case 'last_week': {
      const end = new Date(today);
      const day = end.getDay();
      end.setDate(end.getDate() - (day === 0 ? 7 : day)); // Last Sunday
      const start = new Date(end);
      start.setDate(start.getDate() - 6); // Last Monday
      return { from: formatDate(start), to: formatDate(end) };
    }
    case 'this_month': {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      return { from: formatDate(start), to: formatDate(today) };
    }
    case 'last_month': {
      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const end = new Date(today.getFullYear(), today.getMonth(), 0);
      return { from: formatDate(start), to: formatDate(end) };
    }
    case 'this_quarter': {
      const qStart = Math.floor(today.getMonth() / 3) * 3;
      const start = new Date(today.getFullYear(), qStart, 1);
      return { from: formatDate(start), to: formatDate(today) };
    }
    case 'last_quarter': {
      const qStart = Math.floor(today.getMonth() / 3) * 3;
      const start = new Date(today.getFullYear(), qStart - 3, 1);
      const end = new Date(today.getFullYear(), qStart, 0);
      return { from: formatDate(start), to: formatDate(end) };
    }
    default:
      return { from: formatDate(today), to: formatDate(today) };
  }
};

export default function ProcurementStatisticsPage() {
  const [visibleCols, setVisibleCols] = useState<Record<string, boolean>>(
    Object.fromEntries(ALL_COLUMNS.map(c => [c.id, true]))
  );
  const [showColDropdown, setShowColDropdown] = useState(false);
  const [filters, setFilters] = useState<FilterState>({ ...emptyFilters });
  const [appliedFilters, setAppliedFilters] = useState<FilterState>({ ...emptyFilters });
  const [dateFrom, setDateFrom] = useState(formatDate(new Date(new Date().getFullYear(), new Date().getMonth(), 1)));
  const [dateTo, setDateTo] = useState(formatDate(new Date()));

  const handlePeriodChange = (value: string) => {
    if (value === 'period') return;
    const range = getDateRange(value);
    setDateFrom(range.from);
    setDateTo(range.to);
  };

  const { data: response, isLoading } = useQuery({
    queryKey: ["materialsShippedStatistics"],
    queryFn: () => mrpApi.getMaterialsShippedStatistics(),
  });

  const allMaterials = response?.data || [];

  // Client-side filtering
  const materials = useMemo(() => {
    return allMaterials.filter((item: any) => {
      for (const col of ALL_COLUMNS) {
        if (col.filter === 'text') {
          const filterVal = appliedFilters[col.id]?.toLowerCase().trim();
          if (filterVal) {
            const cellVal = String(item[col.id] || '').toLowerCase();
            if (!cellVal.includes(filterVal)) return false;
          }
        } else if (col.filter === 'select') {
          const filterVal = appliedFilters[col.id]?.trim();
          if (filterVal) {
            const cellVal = String(item[col.id] || '').trim();
            if (cellVal !== filterVal) return false;
          }
        } else if (col.filter === 'range') {
          const minVal = appliedFilters[`${col.id}_min`]?.trim();
          const maxVal = appliedFilters[`${col.id}_max`]?.trim();
          const cellNum = Number(item[col.id]) || 0;
          if (minVal && cellNum < Number(minVal)) return false;
          if (maxVal && cellNum > Number(maxVal)) return false;
        }
      }
      return true;
    });
  }, [allMaterials, appliedFilters]);

  const totalQuantity = materials.reduce((sum: number, item: any) => sum + (Number(item.quantity) || 0), 0);
  const totalCost = materials.reduce((sum: number, item: any) => sum + (Number(item.cost) || 0), 0);

  const formatCurrency = (val: any) => {
    if (!val && val !== 0) return "";
    const num = Number(val);
    if (isNaN(num)) return val;
    return `$ ${num.toFixed(2)}`;
  };

  const formatQuantity = (val: any) => {
    const num = Number(val);
    if (isNaN(num)) return val;
    // Show clean number: remove trailing zeros after decimal
    return parseFloat(num.toFixed(4)).toString();
  };

  const toggleCol = (id: string) => {
    setVisibleCols(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSearch = () => {
    setAppliedFilters({ ...filters });
  };

  const handleClear = () => {
    setFilters({ ...emptyFilters });
    setAppliedFilters({ ...emptyFilters });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleDownloadCSV = () => {
    if (materials.length === 0) return;
    const cols = ALL_COLUMNS.filter(c => visibleCols[c.id]);
    const headers = cols.map(c => c.label);
    const csvRows = [headers.join(",")];
    materials.forEach((item: any) => {
      const row = cols.map(c => {
        let val = c.id === 'quantity' ? formatQuantity(item[c.id]) : c.id === 'cost' ? formatCurrency(item[c.id]) : (item[c.id] ?? '');
        val = String(val).replace(/"/g, '""');
        return `"${val}"`;
      });
      csvRows.push(row.join(","));
    });
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.setAttribute("download", "materials_shipped.csv");
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPDF = async () => {
    if (materials.length === 0) return;
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');

    const doc = new jsPDF('landscape');
    const cols = ALL_COLUMNS.filter(c => visibleCols[c.id]);

    // Title
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Materials used in shipped goods", 14, 15);

    // Date range
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Period: ${dateFrom} - ${dateTo}`, 14, 22);
    const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    doc.text(`Generated: ${today}`, doc.internal.pageSize.width - 14, 15, { align: "right" });

    // Table headers
    const headers = cols.map(c => c.label);

    // Total row
    const totalRow = cols.map(c => {
      if (c.id === 'quantity') return formatQuantity(totalQuantity);
      if (c.id === 'cost') return formatCurrency(totalCost);
      return '';
    });

    // Data rows
    const dataRows = materials.map((item: any) =>
      cols.map(c => {
        if (c.id === 'quantity') return formatQuantity(item[c.id]);
        if (c.id === 'cost') return formatCurrency(item[c.id]);
        return String(item[c.id] ?? '');
      })
    );

    autoTable(doc, {
      head: [headers],
      body: [totalRow, ...dataRows],
      startY: 28,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [238, 242, 249], textColor: [75, 85, 99], fontStyle: 'bold' },
      bodyStyles: { textColor: [51, 51, 51] },
      didParseCell: (data: any) => {
        // Bold total row
        if (data.section === 'body' && data.row.index === 0) {
          data.cell.styles.fontStyle = 'bold';
        }
      },
      theme: 'grid',
    });

    doc.save("materials_shipped.pdf");
  };

  const visibleColumns = ALL_COLUMNS.filter(c => visibleCols[c.id]);

  return (
    <div className="p-3 sm:p-4 lg:p-6 flex-1 flex flex-col overflow-hidden">
      {/* Title */}
      <h1 className="text-xl font-bold text-[#0056b3] mb-3">Statistics</h1>

      {/* Top Filter Bar */}
      <div className="flex flex-col gap-1 mb-3">
        {/* Row 1: Report */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-600 min-w-[40px]">Report</span>
          <Select defaultValue="materials">
            <SelectTrigger className="h-7 w-[250px] text-xs bg-white border-gray-300 rounded-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="materials" className="text-xs">Materials used in shipped goods</SelectItem>
              <SelectItem value="premature" className="text-xs">Premature orders</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {/* Row 2: Period + Dates + Search */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-600 min-w-[40px]">Period</span>
          <Select defaultValue="period" onValueChange={handlePeriodChange}>
            <SelectTrigger className="h-7 w-[80px] text-xs bg-white border-gray-300 rounded-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="period" className="text-xs">Period</SelectItem>
              <SelectItem value="today" className="text-xs">Today</SelectItem>
              <SelectItem value="yesterday" className="text-xs">Yesterday</SelectItem>
              <SelectItem value="this_week" className="text-xs">This week</SelectItem>
              <SelectItem value="last_week" className="text-xs">Last week</SelectItem>
              <SelectItem value="this_month" className="text-xs">This month</SelectItem>
              <SelectItem value="last_month" className="text-xs">Last month</SelectItem>
              <SelectItem value="this_quarter" className="text-xs">This quarter</SelectItem>
              <SelectItem value="last_quarter" className="text-xs">Last quarter</SelectItem>
            </SelectContent>
          </Select>
          <div className="relative">
            <CalendarIcon className="absolute left-2 top-1.5 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            <Input className="h-7 w-[105px] text-xs pl-7 bg-white border-gray-300 rounded-sm" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          </div>
          <span className="text-gray-400 text-xs">-</span>
          <div className="relative">
            <CalendarIcon className="absolute left-2 top-1.5 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            <Input className="h-7 w-[105px] text-xs pl-7 bg-white border-gray-300 rounded-sm" value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </div>
          <Button size="sm" className="h-7 w-7 p-0 bg-[#0056b3] hover:bg-[#004494] text-white rounded-sm">
            <Search className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Subheading + Export */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-800">Materials used in shipped goods</span>
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2.5 text-xs text-gray-600 rounded-sm border-gray-300 bg-[#f8f9fa] hover:bg-gray-200 flex items-center gap-1"
            onClick={handleDownloadPDF}
          >
            <Download className="w-3 h-3" /> PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2.5 text-xs text-gray-600 rounded-sm border-gray-300 bg-[#f8f9fa] hover:bg-gray-200 flex items-center gap-1"
            onClick={handleDownloadCSV}
          >
            <Download className="w-3 h-3" /> CSV
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto flex-1 min-h-0 bg-white border border-gray-200 rounded-sm">
        <table className="w-full text-left border-collapse text-[12px] whitespace-nowrap table-fixed">
          {/* Column Headers */}
          <thead className="sticky top-0 z-10">
            <tr className="bg-[#eef2f9] border-b border-gray-300">
              <th className="py-2 px-1 border-r border-gray-300 font-semibold text-gray-600 w-7 text-center"></th>
              {visibleColumns.map(col => (
                <th key={col.id} className="py-2 px-2 border-r border-gray-300 font-semibold text-gray-600 text-[11px] overflow-hidden text-ellipsis">
                  {col.label}{col.id === 'part_no' ? ' ↑' : ''}
                </th>
              ))}
              <th className="py-2 px-1 w-[70px] text-center align-middle relative font-semibold text-gray-600">
                <div
                  className="flex items-center justify-center cursor-pointer text-gray-400 hover:text-gray-700"
                  onClick={() => setShowColDropdown(!showColDropdown)}
                >
                  <Settings2 className="w-3.5 h-3.5" />
                </div>
                {showColDropdown && (
                  <div
                    className="absolute right-0 top-full mt-1 bg-white border border-gray-200 shadow-lg rounded w-44 max-h-[280px] overflow-y-auto z-50 text-left font-normal"
                    onMouseLeave={() => setShowColDropdown(false)}
                  >
                    {ALL_COLUMNS.map(col => {
                      const isDisabled = col.id === 'part_no';
                      return (
                        <label key={col.id} className={`flex items-center gap-2 px-3 py-1.5 text-gray-700 select-none ${isDisabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'hover:bg-[#eef2f9] cursor-pointer'}`}>
                          <input
                            type="checkbox"
                            checked={!!visibleCols[col.id]}
                            onChange={() => !isDisabled && toggleCol(col.id)}
                            disabled={isDisabled}
                            className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600"
                          />
                          <span className="text-[11px]">{col.label}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </th>
            </tr>
            {/* Filter Row */}
            <tr className="bg-white border-b border-gray-300">
              <th className="py-1.5 px-2 border-r border-gray-300 text-center align-middle">
                <CalendarIcon className="w-3.5 h-3.5 text-gray-400 mx-auto" />
              </th>
              {visibleColumns.map(col => (
                <th key={`f-${col.id}`} className="py-1.5 px-1.5 border-r border-gray-300 font-normal align-top">
                  {col.filter === 'range' ? (
                    <div className="flex flex-col gap-0.5">
                      <input
                        type="text"
                        placeholder="min"
                        value={filters[`${col.id}_min`] || ''}
                        onChange={e => handleFilterChange(`${col.id}_min`, e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="w-full h-[20px] bg-[#f0f2f5] border-none rounded px-1.5 focus:ring-1 focus:ring-blue-400 outline-none text-[10px] placeholder-gray-400"
                      />
                      <input
                        type="text"
                        placeholder="max"
                        value={filters[`${col.id}_max`] || ''}
                        onChange={e => handleFilterChange(`${col.id}_max`, e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="w-full h-[20px] bg-[#f0f2f5] border-none rounded px-1.5 focus:ring-1 focus:ring-blue-400 outline-none text-[10px] placeholder-gray-400"
                      />
                    </div>
                  ) : col.filter === 'select' ? (
                    <select
                      value={filters[col.id] || ''}
                      onChange={e => handleFilterChange(col.id, e.target.value)}
                      className="w-full h-[20px] bg-[#f0f2f5] border-none rounded px-1 focus:ring-1 focus:ring-blue-400 outline-none text-[10px] text-gray-700 cursor-pointer appearance-auto"
                    >
                      <option value=""></option>
                      {UOM_OPTIONS.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={filters[col.id] || ''}
                      onChange={e => handleFilterChange(col.id, e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="w-full h-[20px] bg-[#f0f2f5] border-none rounded px-1.5 focus:ring-1 focus:ring-blue-400 outline-none text-[10px]"
                    />
                  )}
                </th>
              ))}
              <th className="py-1.5 px-1 text-center align-middle">
                <div className="flex items-center justify-center gap-1.5">
                  <button
                    onClick={handleSearch}
                    className="text-[#0056b3] text-[10px] font-medium hover:underline cursor-pointer border-none bg-transparent"
                  >
                    Search
                  </button>
                  <button
                    onClick={handleClear}
                    className="text-[#0056b3] text-[10px] font-medium hover:underline cursor-pointer border-none bg-transparent"
                  >
                    Clear
                  </button>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={visibleColumns.length + 2} className="p-8 text-center text-gray-500">Loading...</td></tr>
            ) : materials.length === 0 ? (
              <tr><td colSpan={visibleColumns.length + 2} className="p-8 text-center text-gray-500">No data found</td></tr>
            ) : (
              <>
                {/* Total Row */}
                <tr className="bg-white font-bold text-[#333] border-b border-gray-200">
                  <td className="py-1.5 px-2 border-r border-gray-200 text-[11px]">Total:</td>
                  {visibleColumns.map(col => (
                    <td key={`t-${col.id}`} className="py-1.5 px-2 border-r border-gray-200 text-[11px] overflow-hidden text-ellipsis">
                      {col.id === 'quantity' ? formatQuantity(totalQuantity) : ''}
                      {col.id === 'cost' ? formatCurrency(totalCost) : ''}
                    </td>
                  ))}
                  <td className="py-1.5 px-1"></td>
                </tr>
                {/* Data Rows */}
                {materials.map((item: any, index: number) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-[#f8f9ff] transition-colors">
                    <td className="py-1.5 px-1 border-r border-gray-200 text-center text-[#5a8ec5] text-[11px]">{index + 1}</td>
                    {visibleCols.part_no && <td className="py-1.5 px-2 border-r border-gray-200 text-[#0056b3] cursor-pointer hover:underline text-[11px] overflow-hidden text-ellipsis">{item.part_no}</td>}
                    {visibleCols.part_description && <td className="py-1.5 px-2 border-r border-gray-200 text-[11px] text-[#333] overflow-hidden text-ellipsis">{item.part_description}</td>}
                    {visibleCols.group_number && <td className="py-1.5 px-2 border-r border-gray-200 text-[11px] text-[#333] overflow-hidden text-ellipsis">{item.group_number}</td>}
                    {visibleCols.group_name && <td className="py-1.5 px-2 border-r border-gray-200 text-[11px] text-[#333] overflow-hidden text-ellipsis">{item.group_name}</td>}
                    {visibleCols.quantity && <td className="py-1.5 px-2 border-r border-gray-200 text-[11px] text-[#333]">{formatQuantity(item.quantity)}</td>}
                    {visibleCols.uom && <td className="py-1.5 px-2 border-r border-gray-200 text-[11px] text-[#333]">{item.uom}</td>}
                    {visibleCols.cost && <td className="py-1.5 px-2 border-r border-gray-200 text-[11px] text-[#333]">{formatCurrency(item.cost)}</td>}
                    <td className="py-1.5 px-1"></td>
                  </tr>
                ))}
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
