import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import React from "react";

type Column = {
  key: string;
  label: string;
  align?: "left" | "right";
  className?: string;
};

type SimpleTableProps = {
  columns: Column[];
  rows: Record<string, React.ReactNode>[];
  emptyLabel?: string;
  rowClassName?: (row: Record<string, React.ReactNode>, index: number) => string;
};

export default function SimpleTable({ columns, rows, emptyLabel = "No data available", rowClassName }: SimpleTableProps) {
  return (
    <div className="w-full min-w-0 rounded-lg border">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            {columns.map((column) => (
              <TableHead
                key={column.key}
                className={cn(column.align === "right" && "text-right", column.className)}
              >
                {column.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="text-center text-sm text-muted-foreground">
                {emptyLabel}
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row, index) => (
              <TableRow key={index} className={rowClassName?.(row, index)}>
                {columns.map((column) => (
                  <TableCell
                    key={column.key}
                    className={cn(column.align === "right" && "text-right", column.className)}
                  >
                    {row[column.key] ?? "-"}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
