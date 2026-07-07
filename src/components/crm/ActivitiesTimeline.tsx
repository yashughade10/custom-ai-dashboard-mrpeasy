"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchActivities, createActivity, updateActivity, deleteActivity,
  fetchContacts, fetchCompanies, fetchDeals, fetchOwners
} from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Calendar, PhoneCall, CheckSquare, MessageCircle, Clock, Mail, FileText, Plus, MoreHorizontal, Pencil, Trash2, Loader2 } from "lucide-react";
import { format, isPast, isToday } from "date-fns";

const ACTIVITY_TYPES = ["call", "email", "meeting", "task", "note"] as const;
const STATUS_OPTIONS = ["scheduled", "completed", "cancelled"] as const;

const statusColors: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  completed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const formatDateLocal = (dateString?: string | null) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60000;
  const localDate = new Date(date.getTime() - offset);
  return localDate.toISOString().slice(0, 10);
};

const typeColors: Record<string, string> = {
  call: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200",
  email: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400 border-cyan-200",
  meeting: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200",
  task: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200",
  note: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 border-gray-200",
  follow_up: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200",
};

const emptyForm = {
  activity_type: "call" as string,
  subject: "",
  description: "",
  status: "scheduled" as string,
  due_date: "",
  completed_at: "",
  duration_minutes: "",
  outcome: "",
  contact_id: "",
  company_id: "",
  deal_id: "",
  lead_id: "",
  assigned_to: "",
};

export default function ActivitiesTimeline({ onOpenCreate }: { onOpenCreate?: (fn: () => void) => void }) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Create / Edit dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingActivityId, setDeletingActivityId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["crm-activities", { page, type: typeFilter, status: statusFilter }],
    queryFn: () => fetchActivities({ page, type: typeFilter, status: statusFilter }),
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

  const activities = data?.data || [];
  const pagination = data?.pagination || { total: 0, page: 1, limit: 50, totalPages: 1 };

  const createMutation = useMutation({
    mutationFn: (data: Record<string, any>) => createActivity(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["crm-activities"] }); closeDialog(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, any> }) => updateActivity(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["crm-activities"] }); closeDialog(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteActivity(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["crm-activities"] }); setDeleteDialogOpen(false); setDeletingActivityId(null); },
  });

  const openCreateDialog = () => {
    setEditingActivity(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  if (onOpenCreate) onOpenCreate(openCreateDialog);

  const openEditDialog = (activity: any) => {
    setEditingActivity(activity);
    setForm({
      activity_type: activity.activity_type || "call",
      subject: activity.subject || "",
      description: activity.description || "",
      status: activity.status || "scheduled",
      due_date: formatDateLocal(activity.due_date),
      completed_at: formatDateLocal(activity.completed_at),
      duration_minutes: activity.duration_minutes?.toString() || "",
      outcome: activity.outcome || "",
      contact_id: activity.contact_id?.toString() || "",
      company_id: activity.company_id?.toString() || "",
      deal_id: activity.deal_id?.toString() || "",
      lead_id: activity.lead_id?.toString() || "",
      assigned_to: activity.assigned_to?.toString() || "",
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingActivity(null);
    setForm(emptyForm);
    setErrors({});
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const newErrors: Record<string, string> = {};

    if (!form.subject || form.subject.trim().length === 0) {
      newErrors.subject = "Subject is required";
    }
    const duration = form.duration_minutes ? parseInt(form.duration_minutes) : null;
    if (duration !== null && duration < 0) {
      newErrors.duration = "Duration cannot be negative";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const payload = {
      activity_type: form.activity_type,
      subject: form.subject.trim(),
      description: form.description?.trim() || null,
      status: form.status || "scheduled",
      due_date: form.due_date ? new Date(form.due_date).toISOString() : null,
      completed_at: form.completed_at ? new Date(form.completed_at).toISOString() : null,
      duration_minutes: duration,
      outcome: form.outcome?.trim() || null,
      contact_id: form.contact_id ? parseInt(form.contact_id) : null,
      company_id: form.company_id ? parseInt(form.company_id) : null,
      deal_id: form.deal_id ? parseInt(form.deal_id) : null,
      lead_id: form.lead_id ? parseInt(form.lead_id) : null,
      assigned_to: form.assigned_to ? parseInt(form.assigned_to) : null,
    };
    if (editingActivity) {
      updateMutation.mutate({ id: editingActivity.id.toString(), data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const getActivityIcon = (actType: string) => {
    switch (actType) {
      case "call": return <PhoneCall className="h-4 w-4" />;
      case "email": return <Mail className="h-4 w-4" />;
      case "meeting": return <Calendar className="h-4 w-4" />;
      case "task": return <CheckSquare className="h-4 w-4" />;
      case "note": return <FileText className="h-4 w-4" />;
      case "follow_up": return <MessageCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const isMutating = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="flex gap-2">
          <select
            className="flex h-9 w-full max-w-[200px] items-center rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Types</option>
            {ACTIVITY_TYPES.map((t) => (
              <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
            ))}
          </select>
          <select
            className="flex h-9 w-full max-w-[200px] items-center rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Timeline */}
      {isLoading ? (
        <div className="py-8 text-center text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
          Loading activities...
        </div>
      ) : activities.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground">No activities found. Log your first activity to get started.</div>
      ) : (
        <div className="relative border-l border-muted ml-3 space-y-8 pb-4">
          {activities.map((activity: any) => {
            const dateStr = activity.due_date || activity.created_at;
            const date = new Date(dateStr);
            const past = isPast(date) && !isToday(date) && activity.status !== "completed";

            return (
              <div key={activity.id} className="relative pl-6 group">
                <div className={`absolute -left-3.5 mt-1.5 flex h-7 w-7 items-center justify-center rounded-full border bg-background shadow-sm ${past ? "text-destructive border-destructive/50" : "text-muted-foreground"}`}>
                  {getActivityIcon(activity.activity_type)}
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${typeColors[activity.activity_type] || typeColors.note}`}>
                        {activity.activity_type?.replace("_", " ")}
                      </span>
                      <h4 className="text-sm font-semibold">{activity.subject}</h4>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <Badge variant={
                        activity.status === "completed" ? "default" :
                        activity.status === "cancelled" ? "secondary" : "outline"
                      }>
                        {activity.status}
                      </Badge>
                      <span className={`text-muted-foreground ${past ? "text-destructive font-medium" : ""}`}>
                        {format(date, "MMM d, yyyy h:mm a")}
                        {activity.completed_at && (
                          <span className="text-green-600 dark:text-green-400 ml-2 font-normal">
                            (Done: {format(new Date(activity.completed_at), "MMM d, h:mm a")})
                          </span>
                        )}
                      </span>

                      {/* Actions */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm" className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6">
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(activity)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-600"
                            onClick={() => { setDeletingActivityId(activity.id.toString()); setDeleteDialogOpen(true); }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {activity.description && (
                    <p className="text-sm text-muted-foreground mt-1">{activity.description}</p>
                  )}

                  {activity.outcome && (
                    <p className="text-sm mt-1"><span className="text-muted-foreground">Outcome:</span> <span className="font-medium">{activity.outcome}</span></p>
                  )}

                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
                    {activity.contact_firstname && (
                      <span>Contact: <span className="font-medium text-foreground">{activity.contact_firstname} {activity.contact_lastname}</span></span>
                    )}
                    {activity.company_name && (
                      <span>Company: <span className="font-medium text-foreground">{activity.company_name}</span></span>
                    )}
                    {activity.deal_name && (
                      <span>Deal: <span className="font-medium text-foreground">{activity.deal_name}</span></span>
                    )}
                    {activity.assigned_name && (
                      <span>Assigned to: <span className="font-medium text-foreground">{activity.assigned_name}</span></span>
                    )}
                    {activity.duration_minutes && (
                      <span>Duration: <span className="font-medium text-foreground">{activity.duration_minutes} min</span></span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} activities
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
            <DialogTitle>{editingActivity ? "Edit Activity" : "Log New Activity"}</DialogTitle>
            <DialogDescription>
              {editingActivity ? "Update activity details below." : "Fill in the details to log a new activity."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-2 pb-6">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Activity Type *</label>
                  <select
                    className="flex h-9 w-full items-center rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    value={form.activity_type}
                    onChange={(e) => setForm({ ...form, activity_type: e.target.value })}
                  >
                    {ACTIVITY_TYPES.map((t) => (
                      <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
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
                      <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Subject *</label>
                <Input
                  required
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  placeholder="Follow-up call with client"
                  className={errors.subject ? "border-red-500 focus-visible:ring-red-500" : ""}
                />
                {errors.subject && <p className="text-xs text-red-500">{errors.subject}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Description</label>
                <textarea
                  className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Discuss pricing and next steps..."
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Due Date</label>
                  <Input
                    type="date"
                    value={form.due_date}
                    onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Completed At</label>
                  <Input
                    type="date"
                    value={form.completed_at}
                    onChange={(e) => setForm({ ...form, completed_at: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Duration (min)</label>
                  <Input
                    type="number"
                    min={0}
                    value={form.duration_minutes}
                    onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })}
                    placeholder="30"
                    className={errors.duration ? "border-red-500 focus-visible:ring-red-500" : ""}
                  />
                  {errors.duration && <p className="text-xs text-red-500">{errors.duration}</p>}
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Outcome</label>
                <Input
                  value={form.outcome}
                  onChange={(e) => setForm({ ...form, outcome: e.target.value })}
                  placeholder="Positive / Negative / Follow-up needed"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
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
              </div>
              <div className="grid grid-cols-2 gap-3">
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
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button>
              <Button type="submit" disabled={isMutating}>
                {isMutating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingActivity ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Activity</DialogTitle>
            <DialogDescription>
              Are you sure? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => deletingActivityId && deleteMutation.mutate(deletingActivityId)}
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
