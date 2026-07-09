// components/sales-orders/SalesOrdersTable.tsx
"use client";

import { useState } from "react";
import { MoreHorizontal } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { SalesOrderStatusBadge } from "./SalesOrderStatusBadge";
import { useRouter } from "next/navigation";
import { useConfirmSalesOrder, useDeleteSalesOrder, usePackSalesOrder, useFulfillSalesOrder } from "@/hooks/use-sales-orders";
import { getSalesOrderPdfUrl, getSalesOrder } from "@/lib/api/sales-orders";
import type { SalesOrder } from "@/types/sales-order";

interface SalesOrdersTableProps {
  orders: SalesOrder[];
  isLoading: boolean;
  onEdit: (order: SalesOrder) => void;
}

export function SalesOrdersTable({ orders, isLoading, onEdit }: SalesOrdersTableProps) {
  const router = useRouter();
  const [deleteTarget, setDeleteTarget] = useState<SalesOrder | null>(null);
  const confirmMutation = useConfirmSalesOrder();
  const deleteMutation = useDeleteSalesOrder();
  const packMutation = usePackSalesOrder();
  const fulfillMutation = useFulfillSalesOrder();

  const openProductionOrder = async (order: SalesOrder) => {
    try {
      const fullOrder = await getSalesOrder(order.id);
      const firstItem = fullOrder.items?.[0];
      const params = new URLSearchParams();
      params.set("new", "true");
      params.set("po_number", order.order_number);
      if (firstItem?.product_id) {
        params.set("product_id", firstItem.product_id.toString());
        params.set("quantity", firstItem.quantity.toString());
      }
      router.push(`/dashboard/production/orders?${params.toString()}`);
    } catch (err) {
      router.push(`/dashboard/production/orders?new=true&po_number=${order.order_number}`);
    }
  };

  const formatMoney = (value: number, currency: string) =>
    new Intl.NumberFormat("en-AU", { style: "currency", currency }).format(value);

  if (isLoading) {
    return (
      <div className="rounded-md border p-8 text-center text-sm text-slate-500">
        Loading sales orders…
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-12 text-center">
        <p className="text-sm font-medium text-slate-700">No sales orders yet</p>
        <p className="mt-1 text-sm text-slate-500">
          Create one directly, or convert an accepted quotation.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order #</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Customer PO</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Delivery date</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((o) => (
              <TableRow key={o.id} className="cursor-pointer">
                <TableCell className="font-mono text-sm font-medium" onClick={() => onEdit(o)}>
                  {o.order_number}
                </TableCell>
                <TableCell onClick={() => onEdit(o)}>{o.company_name ?? "—"}</TableCell>
                <TableCell onClick={() => onEdit(o)}>{o.customer_po ?? "—"}</TableCell>
                <TableCell onClick={() => onEdit(o)}>
                  <SalesOrderStatusBadge status={o.status} />
                </TableCell>
                <TableCell onClick={() => onEdit(o)}>{o.delivery_date ?? "—"}</TableCell>
                <TableCell className="text-right tabular-nums" onClick={() => onEdit(o)}>
                  {formatMoney(o.total, o.currency)}
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(o)}>View / edit</DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => window.open(getSalesOrderPdfUrl(o.id), "_blank")}
                      >
                        Download PDF
                      </DropdownMenuItem>

                      {o.status === "draft" && (
                        <DropdownMenuItem onClick={() => confirmMutation.mutate(o.id)}>
                          Confirm order
                        </DropdownMenuItem>
                      )}

                      {o.status === "confirmed" && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-amber-600 focus:text-amber-600 font-medium"
                            onClick={() => openProductionOrder(o)}
                          >
                            Create Production Order
                          </DropdownMenuItem>
                        </>
                      )}

                      {(o.status === "allocated" || o.status === "confirmed") && (
                        <DropdownMenuItem onClick={() => packMutation.mutate(o.id)}>
                          Mark as Ready to Ship (Pack)
                        </DropdownMenuItem>
                      )}

                      {o.status === "ready_to_ship" && (
                        <DropdownMenuItem onClick={() => fulfillMutation.mutate(o.id)}>
                          Ship Order
                        </DropdownMenuItem>
                      )}

                      {o.status === "draft" && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-600"
                            onClick={() => setDeleteTarget(o)}
                          >
                            Delete
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this sales order?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.order_number} will be permanently removed. This can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                if (deleteTarget) deleteMutation.mutate(deleteTarget.id);
                setDeleteTarget(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
