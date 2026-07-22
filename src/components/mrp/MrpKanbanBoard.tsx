import React from "react";
import { cn } from "@/lib/utils";

interface KanbanColumn {
  id: string;
  title: string;
  totalValue?: number;
  items: KanbanItem[];
}

interface KanbanItem {
  id: string;
  title: string;
  subtitle: string;
  amount?: number;
}

interface MrpKanbanBoardProps {
  columns: KanbanColumn[];
  onItemClick?: (item: KanbanItem) => void;
}

export function MrpKanbanBoard({ columns, onItemClick }: MrpKanbanBoardProps) {
  return (
    <div className="flex h-full gap-4 overflow-x-auto pb-4">
      {columns.map((column) => (
        <div key={column.id} className="flex flex-col flex-shrink-0 w-72 bg-[#f0f4f8] rounded-sm border border-gray-200">
          {/* Column Header */}
          <div className="p-3 border-b border-gray-200 flex justify-between items-center bg-[#e2e8f0]">
            <h3 className="font-semibold text-sm text-gray-700">{column.title}</h3>
            {column.totalValue !== undefined && (
              <span className="text-xs font-bold text-gray-500">
                ${column.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            )}
          </div>
          
          {/* Column Items */}
          <div className="flex-1 p-2 overflow-y-auto space-y-2">
            {column.items.map((item) => (
              <div
                key={item.id}
                onClick={() => onItemClick?.(item)}
                className="bg-white p-3 rounded-sm shadow-sm border border-gray-200 cursor-pointer hover:border-blue-400 hover:shadow-md transition-all"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm font-semibold text-blue-600">{item.id}</span>
                  {item.amount !== undefined && (
                    <span className="text-sm font-bold text-gray-700">
                      ${item.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-800">{item.title}</div>
                {item.subtitle && <div className="text-xs text-gray-500 mt-1">{item.subtitle}</div>}
              </div>
            ))}
            {column.items.length === 0 && (
              <div className="text-center p-4 text-xs text-gray-400 border-2 border-dashed border-gray-300 rounded-sm">
                No orders
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
