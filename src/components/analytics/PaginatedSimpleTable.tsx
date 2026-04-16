"use client";

import SimpleTable from "@/components/analytics/SimpleTable";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import React, { useMemo, useState } from "react";

type Column = {
  key: string;
  label: string;
  align?: "left" | "right";
  className?: string;
};

type PaginatedSimpleTableProps = {
  columns: Column[];
  rows: Record<string, React.ReactNode>[];
  emptyLabel?: string;
  rowClassName?: (row: Record<string, React.ReactNode>, index: number) => string;
  initialPageSize?: number;
  pageSizeOptions?: number[];
  paginationLabel?: string;
};

export default function PaginatedSimpleTable({
  columns,
  rows,
  emptyLabel = "No data available",
  rowClassName,
  initialPageSize = 10,
  pageSizeOptions = [10, 25, 50],
  paginationLabel = "Rows per page",
}: PaginatedSimpleTableProps) {
  const [pageSize, setPageSize] = useState(() =>
    pageSizeOptions.includes(initialPageSize) ? initialPageSize : pageSizeOptions[0] ?? initialPageSize
  );
  const [pageIndex, setPageIndex] = useState(0);

  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const clampedPageIndex = Math.min(pageIndex, pageCount - 1);

  const { pageRows, startRow, endRow } = useMemo(() => {
    const start = clampedPageIndex * pageSize;
    const end = Math.min(rows.length, start + pageSize);
    return {
      pageRows: rows.slice(start, end),
      startRow: rows.length === 0 ? 0 : start + 1,
      endRow: end,
    };
  }, [clampedPageIndex, pageSize, rows]);

  const canGoPrev = clampedPageIndex > 0;
  const canGoNext = clampedPageIndex < pageCount - 1;

  return (
    <div className="space-y-2">
      <SimpleTable
        columns={columns}
        rows={pageRows}
        emptyLabel={emptyLabel}
        rowClassName={rowClassName}
      />

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={rows.length === 0}>
                {paginationLabel}: {pageSize}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-44">
              <DropdownMenuLabel>{paginationLabel}</DropdownMenuLabel>
              {pageSizeOptions.map((size) => (
                <DropdownMenuItem
                  key={size}
                  onSelect={() => {
                    setPageSize(size);
                    setPageIndex(0);
                  }}
                  className={cn(size === pageSize && "bg-accent text-accent-foreground")}
                >
                  {size}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <span className="tabular-nums">
            {startRow}-{endRow} of {rows.length}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon-xs"
            disabled={!canGoPrev || rows.length === 0}
            onClick={() => setPageIndex(0)}
            aria-label="First page"
          >
            <ChevronsLeft />
          </Button>
          <Button
            variant="outline"
            size="icon-xs"
            disabled={!canGoPrev || rows.length === 0}
            onClick={() => setPageIndex((p) => Math.max(0, Math.min(p, pageCount - 1) - 1))}
            aria-label="Previous page"
          >
            <ChevronLeft />
          </Button>
          <span className="px-2 tabular-nums">
            Page {clampedPageIndex + 1} of {pageCount}
          </span>
          <Button
            variant="outline"
            size="icon-xs"
            disabled={!canGoNext || rows.length === 0}
            onClick={() => setPageIndex((p) => Math.min(pageCount - 1, Math.min(p, pageCount - 1) + 1))}
            aria-label="Next page"
          >
            <ChevronRight />
          </Button>
          <Button
            variant="outline"
            size="icon-xs"
            disabled={!canGoNext || rows.length === 0}
            onClick={() => setPageIndex(pageCount - 1)}
            aria-label="Last page"
          >
            <ChevronsRight />
          </Button>
        </div>
      </div>
    </div>
  );
}
