// components/quotations/quotations-table.tsx
"use client";

import { useState } from "react";
import { MoreHorizontal, Loader2 } from "lucide-react";

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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { QuotationStatusBadge } from "./quotation-status-badge";
import {
  useApproveQuotation,
  useConvertQuotation,
  useDeleteQuotation,
  useSendQuotation,
} from "@/hooks/use-quotations";
import { getQuotationPdfUrl } from "@/lib/api/quotations";
import type { Quotation } from "@/types/quotation";

interface QuotationsTableProps {
  quotations: Quotation[];
  isLoading: boolean;
  onEdit: (quotation: Quotation) => void;
}

export function QuotationsTable({
  quotations,
  isLoading,
  onEdit,
}: QuotationsTableProps) {
  const [deleteTarget, setDeleteTarget] = useState<Quotation | null>(null);
  const [sendTarget, setSendTarget] = useState<Quotation | null>(null);
  const [sendEmail, setSendEmail] = useState("");

  const deleteMutation = useDeleteQuotation();
  const sendMutation = useSendQuotation();
  const approveMutation = useApproveQuotation();
  const convertMutation = useConvertQuotation();

  const formatMoney = (value: number, currency: string) =>
    new Intl.NumberFormat("en-AU", { style: "currency", currency }).format(
      value,
    );

  const isMutating =
    deleteMutation.isPending ||
    sendMutation.isPending ||
    approveMutation.isPending ||
    convertMutation.isPending;

  if (isLoading) {
    return (
      <div className="rounded-md border p-8 text-center text-sm text-slate-500">
        Loading quotations…
      </div>
    );
  }

  if (quotations.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-12 text-center">
        <p className="text-sm font-medium text-slate-700">
          No quotations yet
        </p>
        <p className="mt-1 text-sm text-slate-500">
          Create your first quotation to get started.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="relative">
        {isMutating && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/50 backdrop-blur-[1px] rounded-md">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}
        <div className="overflow-hidden rounded-md border">
          <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Quote #</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Valid until</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {quotations.map((q) => (
              <TableRow key={q.id} className="cursor-pointer">
                <TableCell
                  className="font-mono text-sm font-medium"
                  onClick={() => onEdit(q)}
                >
                  {q.quote_number}
                </TableCell>
                <TableCell onClick={() => onEdit(q)}>
                  {q.company_name ?? "—"}
                </TableCell>
                <TableCell onClick={() => onEdit(q)}>
                  <QuotationStatusBadge status={q.status} />
                </TableCell>
                <TableCell onClick={() => onEdit(q)}>
                  {q.valid_until ?? "—"}
                </TableCell>
                <TableCell
                  className="text-right tabular-nums"
                  onClick={() => onEdit(q)}
                >
                  {formatMoney(q.total, q.currency)}
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(q)}>
                        View / edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          window.open(getQuotationPdfUrl(q.id), "_blank")
                        }
                      >
                        Download PDF
                      </DropdownMenuItem>

                      {q.status === "draft" && (
                        <DropdownMenuItem
                          onClick={() => {
                            setSendTarget(q);
                            setSendEmail(q.contact?.email || "");
                          }}
                        >
                          Send to customer
                        </DropdownMenuItem>
                      )}

                      {q.status === "sent" && (
                        <DropdownMenuItem
                          onClick={() => approveMutation.mutate(q.id)}
                        >
                          Approve
                        </DropdownMenuItem>
                      )}

                      {q.status === "accepted" && (
                        <DropdownMenuItem
                          onClick={() => convertMutation.mutate(q.id)}
                        >
                          Convert to sales order
                        </DropdownMenuItem>
                      )}

                      {q.status === "draft" && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-600"
                            onClick={() => setDeleteTarget(q)}
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
      </div>

      {/* Delete confirmation */}
      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this quotation?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.quote_number} will be permanently removed. This
              can't be undone.
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

      {/* Send to customer */}
      <Dialog
        open={Boolean(sendTarget)}
        onOpenChange={(open) => !open && setSendTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send {sendTarget?.quote_number}</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            {sendTarget?.contact?.email && (
              <p className="text-sm text-muted-foreground mb-2">
                This quotation will be sent to the contact's email address by default. You can change it below if needed.
              </p>
            )}
            <Label>Customer email</Label>
            <Input
              type="email"
              placeholder="customer@example.com"
              value={sendEmail}
              onChange={(e) => setSendEmail(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendTarget(null)}>
              Cancel
            </Button>
            <Button
              disabled={!sendEmail || sendMutation.isPending}
              onClick={() => {
                if (!sendTarget) return;
                sendMutation.mutate(
                  { id: sendTarget.id, payload: { email: sendEmail } },
                  { onSuccess: () => setSendTarget(null) },
                );
              }}
            >
              {sendMutation.isPending ? "Sending…" : "Send"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
