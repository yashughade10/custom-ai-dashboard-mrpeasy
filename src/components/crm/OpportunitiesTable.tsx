"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchOpportunities, createOpportunity, updateOpportunity, deleteOpportunity,
  fetchContacts, fetchCompanies, fetchDeals, fetchOwners
} from "@/services/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import OpportunityDetailSheet from "./OpportunityDetailSheet";
import { Plus, MoreHorizontal, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

const STAGE_OPTIONS = ["prospecting", "qualification", "proposal", "negotiation", "closed_won", "closed_lost"] as const;

const stageColors: Record<string, string> = {
  prospecting: "bg-slate-100 text-slate-700 dark:bg-slate-800/40 dark:text-slate-300",
  qualification: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  proposal: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
  negotiation: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  closed_won: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  closed_lost: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const emptyForm = {
  name: "",
  contact_id: "",
  company_id: "",
  deal_id: "",
  stage: "prospecting" as string,
  probability: 10,
  expected_value: "",
  expected_close_date: "",
  actual_close_date: "",
  win_reason: "",
  loss_reason: "",
  assigned_to: "",
};

export default function OpportunitiesTable({ onOpenCreate }: { onOpenCreate?: (fn: () => void) => void }) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("");
  const [selectedOppId, setSelectedOppId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Create / Edit dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingOpp, setEditingOpp] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingOppId, setDeletingOppId] = useState<string | null>(null);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["crm-opportunities", { page, search, stage: stageFilter }],
    queryFn: () => fetchOpportunities({ page, search, stage: stageFilter }),
    placeholderData: (previousData) => previousData,
  });

  const { data: contactsData, isLoading: isLoadingContacts } = useQuery({ queryKey: ["crm-contacts-all"], queryFn: () => fetchContacts({ limit: 1000 }) });
  const { data: companiesData, isLoading: isLoadingCompanies } = useQuery({ queryKey: ["crm-companies-all"], queryFn: () => fetchCompanies({ limit: 1000 }) });
  const { data: dealsData, isLoading: isLoadingDeals } = useQuery({ queryKey: ["crm-deals-all"], queryFn: () => fetchDeals({ limit: 1000 }) });
  const { data: ownersData, isLoading: isLoadingOwners } = useQuery({ queryKey: ["crm-owners"], queryFn: () => fetchOwners() });

  const contacts = contactsData?.data || [];
  const companies = companiesData?.data || [];
  const deals = dealsData?.data || [];
  const owners = ownersData || [];

  const isFetchingOptions = isLoadingContacts || isLoadingCompanies || isLoadingDeals || isLoadingOwners;

  const opportunities = data?.data || [];
  const pagination = data?.pagination || { total: 0, page: 1, limit: 50, totalPages: 1 };

  const createMutation = useMutation({
    mutationFn: (data: Record<string, any>) => createOpportunity(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["crm-opportunities"] }); closeDialog(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, any> }) => updateOpportunity(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["crm-opportunities"] }); closeDialog(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteOpportunity(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["crm-opportunities"] }); setDeleteDialogOpen(false); setDeletingOppId(null); },
  });

  const openCreateDialog = () => {
    setEditingOpp(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  if (onOpenCreate) onOpenCreate(openCreateDialog);

  const openEditDialog = (opp: any) => {
    setEditingOpp(opp);
    setForm({
      name: opp.name || "",
      contact_id: opp.contact_id?.toString() || "",
      company_id: opp.company_id?.toString() || "",
      deal_id: opp.deal_id?.toString() || "",
      stage: opp.stage || "prospecting",
      probability: opp.probability || 0,
      expected_value: opp.expected_value?.toString() || "",
      expected_close_date: opp.expected_close_date ? new Date(opp.expected_close_date).toISOString().split("T")[0] : "",
      actual_close_date: opp.actual_close_date ? new Date(opp.actual_close_date).toISOString().split("T")[0] : "",
      win_reason: opp.win_reason || "",
      loss_reason: opp.loss_reason || "",
      assigned_to: opp.assigned_to?.toString() || "",
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingOpp(null);
    setForm(emptyForm);
    setErrors({});
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    let newErrors: Record<string, string> = {};

    if (!form.name || form.name.trim().length === 0) {
      newErrors.name = "Opportunity name is required";
    }
    if (form.probability < 0 || form.probability > 100) {
      newErrors.probability = "Probability must be between 0 and 100";
    }
    const parsedValue = form.expected_value ? parseFloat(form.expected_value) : 0;
    if (parsedValue < 0) {
      newErrors.expected_value = "Expected value cannot be negative";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const payload = {
      name: form.name.trim(),
      contact_id: form.contact_id ? parseInt(form.contact_id) : null,
      company_id: form.company_id ? parseInt(form.company_id) : null,
      deal_id: form.deal_id ? parseInt(form.deal_id) : null,
      stage: form.stage || 'prospecting',
      probability: form.probability,
      expected_value: parsedValue,
      expected_close_date: form.expected_close_date || null,
      actual_close_date: form.actual_close_date || null,
      win_reason: form.win_reason?.trim() || null,
      loss_reason: form.loss_reason?.trim() || null,
      assigned_to: form.assigned_to ? parseInt(form.assigned_to) : null,
    };
    if (editingOpp) {
      updateMutation.mutate({ id: editingOpp.id.toString(), data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleRowClick = (id: string) => {
    setSelectedOppId(id);
    setSheetOpen(true);
  };

  const formatCurrency = (val: number | string) => {
    const num = typeof val === "string" ? parseFloat(val) : val;
    if (!num || isNaN(num)) return "$0";
    return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 }).format(num);
  };

  const isMutating = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-[250px]">
            <Input
              placeholder="Search opportunities..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full"
            />
          </div>
          <select
            className="flex h-9 w-full sm:w-[200px] items-center rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            value={stageFilter}
            onChange={(e) => { setStageFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Stages</option>
            {STAGE_OPTIONS.map((s) => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1).replace("_", " ")}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>Probability</TableHead>
              <TableHead>Expected Value</TableHead>
              <TableHead>Close Date</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading || isFetching ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                  Loading opportunities...
                </TableCell>
              </TableRow>
            ) : opportunities.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No opportunities found. Create your first opportunity to get started.
                </TableCell>
              </TableRow>
            ) : (
              opportunities.map((opp: any) => (
                <TableRow
                  key={opp.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleRowClick(opp.id.toString())}
                >
                  <TableCell className="font-medium">{opp.name}</TableCell>
                  <TableCell className="text-sm">
                    {opp.contact_firstname ? `${opp.contact_firstname} ${opp.contact_lastname || ""}`.trim() : "-"}
                  </TableCell>
                  <TableCell className="text-sm">{opp.company_name || "-"}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${stageColors[opp.stage] || ""}`}>
                      {opp.stage?.replace("_", " ")}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${opp.probability >= 70 ? "bg-green-500" : opp.probability >= 40 ? "bg-amber-500" : "bg-red-400"}`}
                          style={{ width: `${Math.min(100, opp.probability || 0)}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">{opp.probability || 0}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-sm">{formatCurrency(opp.expected_value)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {opp.expected_close_date ? new Date(opp.expected_close_date).toLocaleDateString() : "-"}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm" onClick={(e) => e.stopPropagation()}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEditDialog(opp); }}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600 focus:text-red-600"
                          onClick={(e) => { e.stopPropagation(); setDeletingOppId(opp.id.toString()); setDeleteDialogOpen(true); }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} opportunities
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
              Previous
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))} disabled={page === pagination.totalPages}>
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Detail Sheet */}
      <OpportunityDetailSheet opportunityId={selectedOppId} open={sheetOpen} onOpenChange={setSheetOpen} />

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingOpp ? "Edit Opportunity" : "Create New Opportunity"}</DialogTitle>
            <DialogDescription>
              {editingOpp ? "Update opportunity details below." : "Fill in the details to create a new opportunity."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-2 pb-6">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Opportunity Name *</label>
                <Input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Enterprise Deal - Acme Corp"
                  className={errors.name ? "border-red-500 focus-visible:ring-red-500" : ""}
                />
                {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Contact</label>
                  <select
                    className="flex h-9 w-full items-center rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
                    value={form.contact_id}
                    onChange={(e) => setForm({ ...form, contact_id: e.target.value })}
                    disabled={isLoadingContacts}
                  >
                    <option value="">{isLoadingContacts ? "Loading..." : "Select Contact..."}</option>
                    {contacts.map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.firstname ? `${c.firstname} ${c.lastname || ""}`.trim() : c.email || c.id}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Company</label>
                  <select
                    className="flex h-9 w-full items-center rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
                    value={form.company_id}
                    onChange={(e) => setForm({ ...form, company_id: e.target.value })}
                    disabled={isLoadingCompanies}
                  >
                    <option value="">{isLoadingCompanies ? "Loading..." : "Select Company..."}</option>
                    {companies.map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.name || c.domain || c.id}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Deal</label>
                  <select
                    className="flex h-9 w-full items-center rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
                    value={form.deal_id}
                    onChange={(e) => setForm({ ...form, deal_id: e.target.value })}
                    disabled={isLoadingDeals}
                  >
                    <option value="">{isLoadingDeals ? "Loading..." : "Select Deal..."}</option>
                    {deals.map((d: any) => (
                      <option key={d.id} value={d.id}>
                        {d.dealname || d.id}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Stage</label>
                  <select
                    className="flex h-9 w-full items-center rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    value={form.stage}
                    onChange={(e) => setForm({ ...form, stage: e.target.value })}
                  >
                    {STAGE_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1).replace("_", " ")}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Probability %</label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={form.probability}
                    onChange={(e) => setForm({ ...form, probability: parseInt(e.target.value) || 0 })}
                    className={errors.probability ? "border-red-500 focus-visible:ring-red-500" : ""}
                  />
                  {errors.probability && <p className="text-xs text-red-500">{errors.probability}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Expected Value ($)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={form.expected_value}
                    onChange={(e) => setForm({ ...form, expected_value: e.target.value })}
                    placeholder="25000"
                    className={errors.expected_value ? "border-red-500 focus-visible:ring-red-500" : ""}
                  />
                  {errors.expected_value && <p className="text-xs text-red-500">{errors.expected_value}</p>}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Expected Close</label>
                  <Input
                    type="date"
                    value={form.expected_close_date}
                    onChange={(e) => setForm({ ...form, expected_close_date: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Actual Close</label>
                  <Input
                    type="date"
                    value={form.actual_close_date}
                    onChange={(e) => setForm({ ...form, actual_close_date: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Assigned To</label>
                  <select
                    className="flex h-9 w-full items-center rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
                    value={form.assigned_to}
                    onChange={(e) => setForm({ ...form, assigned_to: e.target.value })}
                    disabled={isLoadingOwners}
                  >
                    <option value="">{isLoadingOwners ? "Loading..." : "Select Owner..."}</option>
                    {owners.map((o: any) => (
                      <option key={o.id} value={o.id}>
                        {o.firstname ? `${o.firstname} ${o.lastname || ""}`.trim() : o.email || o.id}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Win Reason</label>
                  <textarea
                    className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                    value={form.win_reason}
                    onChange={(e) => setForm({ ...form, win_reason: e.target.value })}
                    placeholder="Why did we win?"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Loss Reason</label>
                  <textarea
                    className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                    value={form.loss_reason}
                    onChange={(e) => setForm({ ...form, loss_reason: e.target.value })}
                    placeholder="Why did we lose?"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button>
              <Button type="submit" disabled={isMutating}>
                {isMutating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingOpp ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Opportunity</DialogTitle>
            <DialogDescription>
              Are you sure? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => deletingOppId && deleteMutation.mutate(deletingOppId)}
            >
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
