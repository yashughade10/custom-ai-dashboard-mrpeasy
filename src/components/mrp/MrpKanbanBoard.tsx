import React, { useEffect, useRef } from "react";
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
  onLoadMore?: () => void;
  hasMore?: boolean;
}

export function MrpKanbanBoard({ columns, onItemClick, onLoadMore, hasMore }: MrpKanbanBoardProps) {
  const loadMoreRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (!hasMore || !onLoadMore) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        onLoadMore();
      }
    });

    loadMoreRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => {
      observer.disconnect();
    };
  }, [hasMore, onLoadMore, columns]);
  return (
    <div className="flex h-full gap-2.5 overflow-x-auto pb-4">
      {columns.map((column, index) => (
        <div key={column.id} className="flex flex-col flex-1 min-w-[200px] bg-[#f1f5f9] rounded-sm border border-gray-200">
          {/* Column Header matching MRPeasy chevron design */}
          <div className="p-2.5 border-b border-gray-200 bg-[#e2e8f0] flex flex-col justify-between min-h-[50px]">
            <h3 className="font-semibold text-xs text-gray-800 leading-tight">{column.title}</h3>
            {column.totalValue !== undefined && (
              <span className="text-[11px] font-semibold text-gray-600 mt-1">
                $ {column.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            )}
          </div>
          
          {/* Column Items */}
          <div className="flex-1 p-2 overflow-y-auto space-y-2">
            {column.items.map((item) => (
              <div
                key={item.id}
                onClick={() => onItemClick?.(item)}
                className="bg-white p-2.5 rounded-sm shadow-xs border border-gray-200 cursor-pointer hover:border-blue-400 hover:shadow-sm transition-all"
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="text-xs font-bold text-gray-900">{item.id}</span>
                </div>
                <div className="text-[11px] font-medium text-gray-700 leading-tight mb-2">
                  {item.title}
                </div>
                {item.amount !== undefined && (
                  <div className="flex justify-between items-center border-t border-gray-100 pt-1.5 mt-1 text-[11px]">
                    <span className="text-gray-400">Total:</span>
                    <span className="font-bold text-gray-900">
                      ${item.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
              </div>
            ))}
            {column.items.length === 0 && (
              <div className="text-center p-4 text-xs text-gray-400 border border-dashed border-gray-300 rounded-sm bg-white/50">
                No orders
              </div>
            )}
            {hasMore && (
              <div
                ref={(el) => {
                  loadMoreRefs.current[index] = el;
                }}
                className="py-2 text-center text-[10px] text-gray-400"
              >
                Loading more...
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
