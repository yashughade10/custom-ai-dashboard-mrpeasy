import React from "react";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";

export interface Column<T> {
  header: string;
  accessorKey: keyof T | string;
  cell?: (row: T) => React.ReactNode;
  sortable?: boolean;
  searchable?: boolean;
}

interface MrpDataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  className?: string;
}

export function MrpDataTable<T>({ columns, data, onRowClick, className }: MrpDataTableProps<T>) {
  const [filters, setFilters] = React.useState<Record<string, string>>({});

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const filteredData = React.useMemo(() => {
    return data.filter(row => {
      return Object.entries(filters).every(([key, query]) => {
        if (!query) return true;
        const val = (row as any)[key];
        if (val == null) return false;
        return String(val).toLowerCase().includes(query.toLowerCase());
      });
    });
  }, [data, filters]);

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
              <th key={idx} className="px-1 py-1 border-r border-gray-300 font-normal">
                {col.searchable ? (
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
