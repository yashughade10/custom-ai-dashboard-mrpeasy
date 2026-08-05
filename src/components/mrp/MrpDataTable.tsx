import React from "react";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";

export interface Column<T> {
  header: string;
  accessorKey: keyof T | string;
  cell?: (row: T) => React.ReactNode;
  sortable?: boolean;
  searchable?: boolean;
  filterType?: 'text' | 'range' | 'date';
}

interface MrpDataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  className?: string;
  totals?: Record<string, React.ReactNode>;
}

export function MrpDataTable<T>({ columns, data, onRowClick, className, totals }: MrpDataTableProps<T>) {
  const [filters, setFilters] = React.useState<Record<string, string>>({});
  const [rangeFilters, setRangeFilters] = React.useState<Record<string, { min?: string; max?: string }>>({});

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleRangeFilterChange = (key: string, field: 'min' | 'max', value: string) => {
    setRangeFilters(prev => ({
      ...prev,
      [key]: { ...prev[key], [field]: value }
    }));
  };

  const filteredData = React.useMemo(() => {
    return data.filter(row => {
      // Check text filters
      const passesText = Object.entries(filters).every(([key, query]) => {
        if (!query) return true;
        const val = (row as any)[key];
        if (val == null) return false;
        return String(val).toLowerCase().includes(query.toLowerCase());
      });

      if (!passesText) return false;

      // Check range filters (number or date)
      const passesRange = Object.entries(rangeFilters).every(([key, range]) => {
        if (!range.min && !range.max) return true;
        const val = (row as any)[key];
        if (val == null) return false;

        const isDate = isNaN(Number(val)) && !isNaN(Date.parse(val));
        
        if (isDate) {
          const rowDate = new Date(val).getTime();
          if (range.min && rowDate < new Date(range.min).getTime()) return false;
          // Set max date to end of day for inclusive filtering
          if (range.max) {
            const maxDate = new Date(range.max);
            maxDate.setHours(23, 59, 59, 999);
            if (rowDate > maxDate.getTime()) return false;
          }
        } else {
          const numVal = Number(val);
          if (range.min && numVal < Number(range.min)) return false;
          if (range.max && numVal > Number(range.max)) return false;
        }
        
        return true;
      });

      return passesRange;
    });
  }, [data, filters, rangeFilters]);

  return (
    <div className={cn("w-full overflow-auto bg-white border border-gray-200 shadow-sm", className)}>
      <table className="w-full text-sm text-left">
        <thead className="bg-[#f0f4f8] text-gray-700 font-semibold border-b border-gray-300">
          <tr>
            {/* Index Column */}
            <th className="px-3 py-2 w-10 border-r border-gray-300">#</th>
            {columns.map((col, idx) => (
              <th key={idx} className="px-3 py-2 border-r border-gray-300 whitespace-nowrap">
                <div className="flex items-center gap-1">
                  {col.header}
                  {col.sortable && <span className="text-gray-400 text-xs">↕</span>}
                </div>
              </th>
            ))}
          </tr>
          {/* Search Row */}
          <tr className="bg-white border-b border-gray-300">
            <th className="px-2 py-1 border-r border-gray-300 bg-[#f9fafb]"></th>
            {columns.map((col, idx) => (
              <th key={idx} className="px-1 py-1 border-r border-gray-300 font-normal align-top">
                {col.filterType === 'range' || col.filterType === 'date' ? (
                  <div className="flex flex-col gap-1">
                    <input
                      type={col.filterType === 'date' ? 'date' : 'number'}
                      className="w-full h-7 px-2 text-xs border border-gray-300 rounded-sm focus:outline-none focus:border-blue-500"
                      placeholder="min"
                      value={rangeFilters[col.accessorKey as string]?.min || ""}
                      onChange={(e) => handleRangeFilterChange(col.accessorKey as string, 'min', e.target.value)}
                    />
                    <input
                      type={col.filterType === 'date' ? 'date' : 'number'}
                      className="w-full h-7 px-2 text-xs border border-gray-300 rounded-sm focus:outline-none focus:border-blue-500"
                      placeholder="max"
                      value={rangeFilters[col.accessorKey as string]?.max || ""}
                      onChange={(e) => handleRangeFilterChange(col.accessorKey as string, 'max', e.target.value)}
                    />
                  </div>
                ) : col.searchable || col.filterType === 'text' ? (
                  <div className="relative">
                    <input
                      type="text"
                      className="w-full h-7 px-2 text-xs border border-gray-300 rounded-sm focus:outline-none focus:border-blue-500"
                      placeholder={`Search ${col.header}...`}
                      value={filters[col.accessorKey as string] || ""}
                      onChange={(e) => handleFilterChange(col.accessorKey as string, e.target.value)}
                    />
                  </div>
                ) : null}
              </th>
            ))}
          </tr>
          {totals && (
            <tr className="bg-white border-b border-gray-300 font-bold text-gray-900">
              <td className="px-3 py-2 border-r border-gray-300 text-left pl-6" colSpan={4}>Total:</td>
              {columns.map((col, idx) => (
                idx >= 3 ? (
                  <td key={idx} className="px-3 py-2 border-r border-gray-300">
                    {totals[col.accessorKey as string]}
                  </td>
                ) : null
              ))}
            </tr>
          )}
        </thead>
        <tbody>
          {filteredData.length === 0 ? (
            <tr>
              <td colSpan={columns.length + 1} className="px-4 py-8 text-center text-gray-500">
                No data available
              </td>
            </tr>
          ) : (
            filteredData.map((row, rowIdx) => (
              <tr
                key={rowIdx}
                onClick={() => onRowClick?.(row)}
                className="border-b border-gray-200 hover:bg-[#f0f7ff] transition-colors cursor-pointer"
              >
                <td className="px-3 py-1.5 border-r border-gray-200 text-gray-500 w-10">
                  {rowIdx + 1}
                </td>
                {columns.map((col, colIdx) => {
                  const val = col.accessorKey ? (row as any)[col.accessorKey] : undefined;
                  return (
                    <td key={colIdx} className="px-3 py-1.5 border-r border-gray-200 truncate max-w-[200px]">
                      {col.cell ? col.cell(row) : val}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
