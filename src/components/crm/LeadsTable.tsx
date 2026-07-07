"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchLeads, createLead, updateLead, deleteLead, convertLead, fetchOwners
} from "@/services/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Plus, MoreHorizontal, Pencil, Trash2, Loader2, ArrowRightLeft, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const STATUS_OPTIONS = ["new", "contacted", "qualified", "unqualified", "converted"] as const;
const SOURCE_OPTIONS = ["website", "referral", "social_media", "email_campaign", "trade_show", "cold_call", "other"] as const;

const statusColors: Record<string, string> = {
  new: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  contacted: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  qualified: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  unqualified: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  converted: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
};

const emptyForm = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  company_name: "",
  source: "other" as string,
  status: "new" as string,
  score: 0,
  assigned_to: "",
  notes: "",
};

export default function LeadsTable({ onOpenCreate }: { onOpenCreate?: (fn: () => void) => void }) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Create / Edit dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);

  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingLeadId, setDeletingLeadId] = useState<string | null>(null);

  // Convert confirmation
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [convertingLead, setConvertingLead] = useState<any>(null);
  const [convertResult, setConvertResult] = useState<any>(null);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["crm-leads", { page, search, status: statusFilter }],
    queryFn: () => fetchLeads({ page, search, status: statusFilter }),
    placeholderData: (previousData) => previousData,
  });

  const { data: ownersData, isLoading: isLoadingOwners } = useQuery({
    queryKey: ["crm-owners"],
    queryFn: () => fetchOwners(),
  });

  const owners = ownersData || [];
  const leads = data?.data || [];
  const pagination = data?.pagination || { total: 0, page: 1, limit: 50, totalPages: 1 };

  const createMutation = useMutation({
    mutationFn: (data: Record<string, any>) => createLead(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["crm-leads"] }); closeDialog(); toast.success("Lead created successfully"); },
    onError: (error: any) => toast.error(error.message || "Failed to create lead"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, any> }) => updateLead(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["crm-leads"] }); closeDialog(); toast.success("Lead updated successfully"); },
    onError: (error: any) => toast.error(error.message || "Failed to update lead"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteLead(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["crm-leads"] }); setDeleteDialogOpen(false); setDeletingLeadId(null); toast.success("Lead deleted successfully"); },
    onError: (error: any) => toast.error(error.message || "Failed to delete lead"),
  });

  const convertMutation = useMutation({
    mutationFn: (id: string) => convertLead(id),
    onSuccess: (result) => {
      setConvertResult(result);
      queryClient.invalidateQueries({ queryKey: ["crm-leads"] });
      toast.success("Lead converted successfully");
    },
    onError: (error: any) => toast.error(error.message || "Failed to convert lead"),
  });

  const openCreateDialog = () => {
    setEditingLead(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  // Expose openCreateDialog to parent via callback ref
  if (onOpenCreate) onOpenCreate(openCreateDialog);

  const openEditDialog = (lead: any) => {
    setEditingLead(lead);
    setForm({
      first_name: lead.first_name || "",
      last_name: lead.last_name || "",
      email: lead.email || "",
      phone: lead.phone || "",
      company_name: lead.company_name || "",
      source: lead.source || "other",
      status: lead.status || "new",
      score: lead.score || 0,
      assigned_to: lead.assigned_to?.toString() || "",
      notes: lead.notes || "",
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingLead(null);
    setForm(emptyForm);
  };

  const openConvertDialog = (lead: any) => {
    setConvertingLead(lead);
    setConvertResult(null);
    setConvertDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.first_name || form.first_name.trim().length === 0) {
      toast.error("First name is required");
      return;
    }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      toast.error("Invalid email address format");
      return;
    }
    if (form.score < 0 || form.score > 100) {
      toast.error("Score must be between 0 and 100");
      return;
    }

    const payload = {
      first_name: form.first_name.trim(),
      last_name: form.last_name?.trim() || null,
      email: form.email?.trim() || null,
      phone: form.phone?.trim() || null,
      company_name: form.company_name?.trim() || null,
      source: form.source || "other",
      status: form.status || "new",
      score: form.score,
      assigned_to: form.assigned_to ? parseInt(form.assigned_to) : null,
      notes: form.notes?.trim() || null,
    };
    if (editingLead) {
      updateMutation.mutate({ id: editingLead.id.toString(), data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 50) return "text-amber-600 dark:text-amber-400";
    return "text-red-500 dark:text-red-400";
  };

  const isMutating = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-[250px]">
            <Input
              placeholder="Search name, email, company..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full"
            />
          </div>
          <select
            className="flex h-9 w-full sm:w-[200px] items-center rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map((s) => (
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
              <TableHead>Email</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading || isFetching ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                  Loading leads...
                </TableCell>
              </TableRow>
            ) : leads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  No leads found. Create your first lead to get started.
                </TableCell>
              </TableRow>
            ) : (
              leads.map((lead: any) => (
                <TableRow key={lead.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">{lead.first_name} {lead.last_name || ""}</TableCell>
                  <TableCell className="text-sm">{lead.email || "-"}</TableCell>
                  <TableCell className="text-sm">{lead.company_name || "-"}</TableCell>
                  <TableCell className="text-xs capitalize">{lead.source?.replace("_", " ") || "-"}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${statusColors[lead.status] || ""}`}>
                      {lead.status?.replace("_", " ")}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <div className="w-10 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${lead.score >= 80 ? "bg-green-500" : lead.score >= 50 ? "bg-amber-500" : "bg-red-400"}`}
                          style={{ width: `${Math.min(100, lead.score || 0)}%` }}
                        />
                      </div>
                      <span className={`text-xs font-medium ${getScoreColor(lead.score || 0)}`}>{lead.score || 0}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{lead.assigned_name || "-"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {lead.created_at ? new Date(lead.created_at).toLocaleDateString() : "-"}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm" onClick={(e) => e.stopPropagation()}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(lead)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        {lead.status !== "converted" && (
                          <DropdownMenuItem onClick={() => openConvertDialog(lead)}>
                            <ArrowRightLeft className="h-4 w-4 mr-2" />
                            Convert to Contact
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600 focus:text-red-600"
                          onClick={() => { setDeletingLeadId(lead.id.toString()); setDeleteDialogOpen(true); }}
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
            Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} leads
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

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingLead ? "Edit Lead" : "Create New Lead"}</DialogTitle>
            <DialogDescription>
              {editingLead ? "Update lead details below." : "Fill in the details to create a new lead."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-2 pb-6">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">First Name *</label>
                  <Input
                    required
                    value={form.first_name}
                    onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                    placeholder="John"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Last Name</label>
                  <Input
                    value={form.last_name}
                    onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                    placeholder="Doe"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Email</label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="john@example.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Phone</label>
                  <Input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+61412345678"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Company Name</label>
                <Input
                  value={form.company_name}
                  onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                  placeholder="Acme Corp"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Source</label>
                  <select
                    className="flex h-9 w-full items-center rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    value={form.source}
                    onChange={(e) => setForm({ ...form, source: e.target.value })}
                  >
                    {SOURCE_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1).replace("_", " ")}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Status</label>
                  <select
                    className="flex h-9 w-full items-center rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1).replace("_", " ")}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Score (0-100)</label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={form.score}
                    onChange={(e) => setForm({ ...form, score: parseInt(e.target.value) || 0 })}
                  />
                </div>
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
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Notes</label>
                <textarea
                  className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Any additional notes..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button>
              <Button type="submit" disabled={isMutating}>
                {isMutating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingLead ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Lead</DialogTitle>
            <DialogDescription>
              Are you sure? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => deletingLeadId && deleteMutation.mutate(deletingLeadId)}
            >
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Convert Lead Dialog */}
      <Dialog open={convertDialogOpen} onOpenChange={(open) => { if (!open) { setConvertDialogOpen(false); setConvertResult(null); } }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{convertResult ? "Lead Converted!" : "Convert Lead"}</DialogTitle>
            <DialogDescription>
              {convertResult
                ? "The lead has been successfully converted."
                : `This will convert "${convertingLead?.first_name} ${convertingLead?.last_name || ""}" into a Contact and create a Deal.`
              }
            </DialogDescription>
          </DialogHeader>
          {convertResult && (
            <div className="space-y-2 py-2">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>Contact created (ID: {convertResult.data?.contactId})</span>
              </div>
              {convertResult.data?.companyId && (
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>Company linked (ID: {convertResult.data.companyId})</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>Deal created (ID: {convertResult.data?.dealId})</span>
              </div>
            </div>
          )}
          <DialogFooter>
            {convertResult ? (
              <Button onClick={() => { setConvertDialogOpen(false); setConvertResult(null); }}>Done</Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => setConvertDialogOpen(false)}>Cancel</Button>
                <Button
                  disabled={convertMutation.isPending}
                  onClick={() => convertingLead && convertMutation.mutate(convertingLead.id.toString())}
                >
                  {convertMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Convert
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
