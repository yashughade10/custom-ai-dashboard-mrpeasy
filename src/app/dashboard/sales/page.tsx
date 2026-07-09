// app/(dashboard)/sales/quotations/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

import { QuotationsTable } from "@/components/quotations/quotations-table";
import { QuotationFormSheet } from "@/components/quotations/quotation-form-sheet";
import { useQuotations, useQuotation } from "@/hooks/use-quotations";
import type { Quotation, QuotationStatus } from "@/types/quotation";
import { RouteGuard } from "@/components/auth/RouteGuard";

const STATUS_FILTERS: { label: string; value: QuotationStatus | "all" }[] = [
  { label: "All statuses", value: "all" },
  { label: "Draft", value: "draft" },
  { label: "Sent", value: "sent" },
  { label: "Accepted", value: "accepted" },
  { label: "Rejected", value: "rejected" },
  { label: "Expired", value: "expired" },
];

function QuotationsPage() {
  const [status, setStatus] = useState<QuotationStatus | "all">("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const { data, isLoading } = useQuotations({
    status: status === "all" ? undefined : status,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
    page,
    limit: 10,
  });

  // Fetch full quotation details when editing
  const { data: editingQuotation } = useQuotation(editingId);

  // Clear editing ID when form closes
  useEffect(() => {
    if (!formOpen) {
      setEditingId(null);
    }
  }, [formOpen]);

  const openCreate = () => {
    setEditingId(null);
    setFormOpen(true);
  };

  const openEdit = (quotation: Quotation) => {
    setEditingId(quotation.id);
    setFormOpen(true);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Quotations
          </h1>
          <p className="text-sm text-slate-500">
            Create, send, and track sales quotations.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-1.5 h-4 w-4" />
          New quotation
        </Button>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="w-44 space-y-1.5">
          <label className="text-xs font-medium text-slate-500">Status</label>
          <Select
            value={status}
            onValueChange={(v) => {
              setStatus(v as QuotationStatus | "all");
              setPage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_FILTERS.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-500">From</label>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-500">To</label>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      <QuotationsTable
        quotations={data?.data ?? []}
        isLoading={isLoading}
        onEdit={openEdit}
      />

      {data?.meta && data.meta.total_pages > 1 && (
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>
            Page {data.meta.page} of {data.meta.total_pages} ·{" "}
            {data.meta.total} total
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= data.meta.total_pages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <QuotationFormSheet
        open={formOpen}
        onOpenChange={setFormOpen}
        quotation={editingQuotation}
      />
    </div>
  );
}

export default function QuotationsPageGuarded() {
  return (
    <RouteGuard module="sales">
      <QuotationsPage />
    </RouteGuard>
  );
}
