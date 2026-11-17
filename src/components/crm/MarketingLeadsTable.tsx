"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchContacts, fetchOwners, syncLeadsNow, fetchContactCountries, updateContact } from "@/services/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import ConvertLeadDialog from "./ConvertLeadDialog";
import DisqualifyLeadDialog from "./DisqualifyLeadDialog";
import { 
  Search, 
  Building2, 
  Mail, 
  Phone, 
  PhoneCall,
  UserCircle2, 
  Calendar,
  Pencil,
  RefreshCw,
  UserCheck,
  Sparkles,
  Ban,
  Filter,
  Globe,
  MapPin,
  Tag,
  RotateCcw,
  ArrowUpDown,
  CheckCircle2,
  ShieldCheck,
  Loader2,
  AlertTriangle,
  AlertCircle,
  Clock
} from "lucide-react";
import { cn } from "@/lib/utils";
import LogCallDialog from "./LogCallDialog";

interface MarketingLeadsTableProps {
  onOpenSummary?: () => void;
  isSpamView?: boolean;
}

export default function MarketingLeadsTable({ onOpenSummary, isSpamView = false }: MarketingLeadsTableProps = {}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [lifecycleFilter, setLifecycleFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [countryFilter, setCountryFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");

  // Conversion, Disqualification & Call modal states
  const [convertingContact, setConvertingContact] = useState<any | null>(null);
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [disqualifyContact, setDisqualifyContact] = useState<any | null>(null);
  const [disqualifyOpen, setDisqualifyOpen] = useState(false);
  const [callContact, setCallContact] = useState<any | null>(null);
  const [callDialogOpen, setCallDialogOpen] = useState(false);
  const [navigatingId, setNavigatingId] = useState<string | null>(null);

  const queryLifecycle = lifecycleFilter === "all" ? "" : lifecycleFilter;
  const querySource = sourceFilter === "all" ? "" : sourceFilter;
  const queryCountry = countryFilter === "all" ? "" : countryFilter;

  const { data, isLoading } = useQuery({
    queryKey: ["crm-contacts-leads", { page, search, lifecycle: queryLifecycle, source: querySource, country: queryCountry, sort: sortOrder, isSpamView }],
    queryFn: () => fetchContacts({ 
      page, 
      search, 
      lifecycle: queryLifecycle || undefined,
      source: querySource || undefined,
      country: queryCountry || undefined,
      sort: sortOrder || undefined,
      limit: 10,
      is_spam: isSpamView ? "true" : undefined,
      exclude_spam: !isSpamView ? "true" : undefined,
    }),
    placeholderData: (previousData) => previousData,
  });

  const { data: owners } = useQuery({
    queryKey: ["crm-owners"],
    queryFn: fetchOwners,
  });

  const { data: availableCountries = [] } = useQuery({
    queryKey: ["crm-contact-countries"],
    queryFn: fetchContactCountries,
  });

  const syncMutation = useMutation({
    mutationFn: syncLeadsNow,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-contacts-leads"] });
      queryClient.invalidateQueries({ queryKey: ["crm-contacts"] });
      toast.success("Websites synced successfully! Ingested latest inquiries.");
    },
    onError: (err: any) => {
      toast.error("Website sync notice: " + (err.message || "Failed to sync"));
    }
  });

  const qualifyMutation = useMutation({
    mutationFn: ({ id, isCurrentlyQualified }: { id: string; isCurrentlyQualified: boolean }) =>
      updateContact(id, {
        lifecycle_stage: isCurrentlyQualified ? "lead" : "salesqualifiedlead",
        lead_status: isCurrentlyQualified ? "New" : "Qualified",
        change_reason: isCurrentlyQualified ? "Reverted lead to Inbound Lead" : "Marked lead as Qualified (SQL)"
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["crm-contacts-leads"] });
      queryClient.invalidateQueries({ queryKey: ["crm-contacts"] });
      toast.success(
        variables.isCurrentlyQualified 
          ? "Lead moved back to Inbound Lead" 
          : "Lead marked as Qualified! Automated acknowledgment sent & CC'd to sales."
      );
    },
    onError: (err: any) => {
      toast.error("Failed to update lead: " + (err.message || "Unknown error"));
    }
  });

  const unspamMutation = useMutation({
    mutationFn: (id: string) =>
      updateContact(id, {
        lifecycle_stage: "lead",
        lead_status: "New",
        change_reason: "Marked as Not Spam / Restored to Active Lead"
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-contacts-leads"] });
      queryClient.invalidateQueries({ queryKey: ["crm-contacts"] });
      toast.success("Lead marked as Not Spam and restored to Leads!");
    },
    onError: (err: any) => {
      toast.error("Failed to restore lead: " + (err.message || "Unknown error"));
    }
  });

  const leads = data?.data || [];
  const pagination = data?.pagination || { total: 0, page: 1, limit: 10, totalPages: 1 };

  const handleRowClick = (id: string) => {
    setNavigatingId(id);
    router.push(`/dashboard/crm/leads/${id}`);
  };

  const handleEditClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setNavigatingId(id);
    router.push(`/dashboard/crm/leads/${id}`);
  };

  const getSourceBadge = (source?: string, formType?: string) => {
    const s = (source || "").toLowerCase();
    const ft = (formType || "").toLowerCase();

    let formTypeLabel = "";
    if (ft === "quote_request") formTypeLabel = "Quote";
    else if (ft === "demo_request") formTypeLabel = "Demo";
    else if (ft === "book_repair") formTypeLabel = "Repair";
    else if (ft === "contact_form") formTypeLabel = "Contact";
    else if (ft === "csv_import") formTypeLabel = "Marketing";

    switch (s) {
      case "pipeboss":
        return (
          <div className="flex flex-col gap-1 items-start">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              Pipeboss
            </span>
            {formTypeLabel && (
              <span className="text-[10px] text-muted-foreground font-medium pl-1">
                {formTypeLabel}
              </span>
            )}
          </div>
        );
      case "vaclift":
        return (
          <div className="flex flex-col gap-1 items-start">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-500"></span>
              Vaclift
            </span>
            {formTypeLabel && (
              <span className="text-[10px] text-muted-foreground font-medium pl-1">
                {formTypeLabel}
              </span>
            )}
          </div>
        );
      case "blue_water":
        return (
          <div className="flex flex-col gap-1 items-start">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
              Blue Water
            </span>
            {formTypeLabel && (
              <span className="text-[10px] text-muted-foreground font-medium pl-1">
                {formTypeLabel}
              </span>
            )}
          </div>
        );
      case "digital_marketing":
        return (
          <div className="flex flex-col gap-1 items-start">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Marketing
            </span>
          </div>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-muted text-muted-foreground">
            Inbound
          </span>
        );
    }
  };

  const getLifecycleBadge = (stage: string) => {
    const s = (stage || "lead").toLowerCase();
    switch (s) {
      case "lead":
      case "subscriber":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800 text-[11px] capitalize">
            Inbound Lead
          </Badge>
        );
      case "marketingqualifiedlead":
      case "salesqualifiedlead":
        return (
          <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800 text-[11px] capitalize">
            Qualified
          </Badge>
        );
      case "opportunity":
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 text-[11px] capitalize">
            In Pipeline
          </Badge>
        );
      case "customer":
        return (
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 text-[11px] capitalize">
            Customer
          </Badge>
        );
      case "other":
      case "lost":
      case "disqualified":
      case "spam":
        return (
          <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800 text-[11px] capitalize">
            Spam
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-[11px] capitalize">
            {stage || "Lead"}
          </Badge>
        );
    }
  };

  const isContactUnactioned = (contact: any) => {
    const stage = (contact.lifecycle_stage || "lead").toLowerCase();
    const status = (contact.lead_status || "").toLowerCase();
    const isActionedStage = ["salesqualifiedlead", "marketingqualifiedlead", "opportunity", "customer", "other", "lost", "disqualified", "spam"].includes(stage);
    const isActionedStatus = ["qualified", "converted", "disqualified", "customer", "lost", "spam"].includes(status);
    return !isActionedStage && !isActionedStatus;
  };

  const getLeadAlertInfo = (contact: any) => {
    // Only alert on leads that have not been actioned yet
    if (!isContactUnactioned(contact)) {
      return null;
    }

    const dateVal = contact.createdate || contact.lastmodifieddate;
    if (!dateVal) {
      return {
        type: "needs_action" as const,
        label: "Needs Action",
        days: 0,
        badge: (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 shrink-0" title="Awaiting qualification / action">
            <AlertTriangle className="w-3 h-3 text-amber-500" />
            Action Needed
          </span>
        ),
        rowClass: "border-l-amber-500 bg-amber-500/[0.03]"
      };
    }

    const createdTime = new Date(dateVal).getTime();
    if (isNaN(createdTime)) {
      return {
        type: "needs_action" as const,
        label: "Needs Action",
        days: 0,
        badge: (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 shrink-0" title="Awaiting qualification / action">
            <AlertTriangle className="w-3 h-3 text-amber-500" />
            Action Needed
          </span>
        ),
        rowClass: "border-l-amber-500 bg-amber-500/[0.03]"
      };
    }

    const now = new Date().getTime();
    const diffHours = (now - createdTime) / (1000 * 60 * 60);
    const diffDays = Math.floor(diffHours / 24);

    // Received within last 24 hours
    if (diffHours >= 0 && diffHours <= 24) {
      return {
        type: "today" as const,
        label: "NEW TODAY",
        days: 0,
        badge: (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 shrink-0" title="New lead received in the last 24 hours">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            NEW TODAY
          </span>
        ),
        rowClass: "border-l-emerald-500 bg-emerald-500/[0.02]"
      };
    }

    // 1 to 3 days without action
    if (diffDays >= 1 && diffDays <= 3) {
      return {
        type: "needs_action" as const,
        label: `Action Needed (${diffDays}d)`,
        days: diffDays,
        badge: (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 shrink-0" title={`No action taken for ${diffDays} day${diffDays > 1 ? 's' : ''}`}>
            <AlertTriangle className="w-3 h-3 text-amber-500" />
            Action Needed ({diffDays}d)
          </span>
        ),
        rowClass: "border-l-amber-500 bg-amber-500/[0.03]"
      };
    }

    // > 3 days (Overdue / Stale lead)
    return {
      type: "overdue" as const,
      label: `Overdue (${diffDays}d)`,
      days: diffDays,
      badge: (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30 shrink-0 animate-pulse" title={`No action taken for ${diffDays} days! Urgent qualification required.`}>
          <AlertCircle className="w-3 h-3 text-rose-500" />
          Overdue ({diffDays}d)
        </span>
      ),
      rowClass: "border-l-rose-500 bg-rose-500/[0.04]"
    };
  };

  const unactionedLeads = leads.filter(isContactUnactioned);
  const overdueCount = unactionedLeads.filter((c: any) => getLeadAlertInfo(c)?.type === "overdue").length;
  const needsActionCount = unactionedLeads.length;

  const hasActiveFilters = sourceFilter !== "all" || lifecycleFilter !== "all" || countryFilter !== "all" || sortOrder !== "newest" || search !== "";

  const handleResetFilters = () => {
    setSourceFilter("all");
    setLifecycleFilter("all");
    setCountryFilter("all");
    setSortOrder("newest");
    setSearch("");
    setPage(1);
  };

  return (
    <div className="space-y-4">
      {/* Top Filter Controls Bar with Dropdowns */}
      <div className="flex flex-col gap-3 bg-card p-3 rounded-lg border shadow-sm">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          
          {/* Search Input */}
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search leads by name, email, company, product..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9 h-9 text-xs w-full"
            />
          </div>

          {/* Filter Dropdowns - Responsive 2x2 grid on mobile, flex on desktop */}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:flex lg:flex-wrap items-center gap-2 w-full lg:w-auto">
            
            {/* Source Website Dropdown */}
            <div className="relative w-full sm:w-auto sm:min-w-[140px]">
              <Globe className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <select
                value={sourceFilter}
                onChange={(e) => {
                  setSourceFilter(e.target.value);
                  setPage(1);
                }}
                className="flex h-9 w-full rounded-md border border-input bg-background pl-8 pr-7 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-primary font-medium cursor-pointer"
              >
                <option value="all">All Sources</option>
                <option value="websites_only">All Websites (Live)</option>
                <option value="vaclift">Vaclift</option>
                <option value="pipeboss">Pipeboss</option>
                <option value="blue_water">Blue Water</option>
                <option value="digital_marketing">Marketing</option>
              </select>
            </div>

            {/* Lifecycle / Status Dropdown */}
            <div className="relative w-full sm:w-auto sm:min-w-[150px]">
              <Filter className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <select
                value={lifecycleFilter}
                onChange={(e) => {
                  setLifecycleFilter(e.target.value);
                  setPage(1);
                }}
                className="flex h-9 w-full rounded-md border border-input bg-background pl-8 pr-7 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-primary font-medium cursor-pointer"
              >
                {isSpamView ? (
                  <>
                    <option value="all">All Spam & Disqualified</option>
                    <option value="spam">Flagged as Spam</option>
                    <option value="other">Lost / Inactive</option>
                  </>
                ) : (
                  <>
                    <option value="all">All Active Stages</option>
                    <option value="unactioned">⚠️ Needs Action</option>
                    <option value="lead">Inbound Leads</option>
                    <option value="salesqualifiedlead">Qualified (Valid)</option>
                    <option value="opportunity">In Pipeline (Deal)</option>
                    <option value="customer">Converted (Customers)</option>
                  </>
                )}
              </select>
            </div>

            {/* Country Dropdown */}
            <div className="relative w-full sm:w-auto sm:min-w-[130px]">
              <MapPin className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <select
                value={countryFilter}
                onChange={(e) => {
                  setCountryFilter(e.target.value);
                  setPage(1);
                }}
                className="flex h-9 w-full rounded-md border border-input bg-background pl-8 pr-7 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-primary font-medium cursor-pointer"
              >
                <option value="all">All Countries</option>
                {availableCountries.map((c: string) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="relative w-full sm:w-auto sm:min-w-[130px]">
              <ArrowUpDown className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <select
                value={sortOrder}
                onChange={(e) => {
                  setSortOrder(e.target.value);
                  setPage(1);
                }}
                className="flex h-9 w-full rounded-md border border-input bg-background pl-8 pr-7 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-primary font-medium cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="recently_updated">Recently Updated</option>
              </select>
            </div>
          </div>

          {/* Action Buttons Toolbar */}
          <div className="flex items-center gap-2 flex-wrap self-end lg:self-auto">
            {/* Reset Filters Button */}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="h-9 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
                title="Reset all filters to defaults"
              >
                <RotateCcw className="h-3 w-3" />
                Reset
              </Button>
            )}

            {/* Sync Websites Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => syncMutation.mutate()}
              disabled={syncMutation.isPending}
              className="h-9 gap-1.5 text-xs font-medium border-border/80"
              title="Automatically syncs every 5 minutes. Click to sync instantly."
            >
              <RefreshCw className={`h-3.5 w-3.5 ${syncMutation.isPending ? 'animate-spin text-primary' : ''}`} />
              {syncMutation.isPending ? "Syncing..." : "Sync"}
            </Button>

            {/* Today's Summary Button */}
            {onOpenSummary && (
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenSummary}
                className="h-9 gap-1.5 text-xs font-medium border-indigo-200 text-indigo-700 bg-indigo-50/50 hover:bg-indigo-100 hover:text-indigo-800 dark:border-indigo-800 dark:bg-indigo-950/30 dark:text-indigo-300"
                title="Open Daily Leads Summary & Action Center"
              >
                <Sparkles className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                Summary
              </Button>
            )}
          </div>
        </div>

        {/* Count summary bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-muted-foreground px-1 pt-2 border-t">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span>
              Source: <span className="font-semibold text-foreground capitalize">{sourceFilter === "all" ? "All Sources" : sourceFilter.replace('_', ' ')}</span>
            </span>
            <span>•</span>
            <span>
              Status: <span className="font-semibold text-foreground capitalize">{lifecycleFilter === "all" ? "All Stages" : lifecycleFilter}</span>
            </span>
            <span>•</span>
            <span>
              Country: <span className="font-semibold text-foreground">{countryFilter === "all" ? "All Countries" : countryFilter}</span>
            </span>
            <span>•</span>
            <span>
              Sort: <span className="font-semibold text-foreground capitalize">{sortOrder === "newest" ? "Newest First" : sortOrder === "oldest" ? "Oldest First" : "Recently Updated"}</span>
            </span>
          </div>
          <div className="flex items-center gap-2 justify-between sm:justify-end">
            {needsActionCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  setLifecycleFilter(lifecycleFilter === "unactioned" ? "all" : "unactioned");
                  setPage(1);
                }}
                className={cn(
                  "inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border transition-all cursor-pointer shadow-sm",
                  lifecycleFilter === "unactioned"
                    ? "bg-amber-600 text-white border-amber-600 ring-2 ring-amber-500/30"
                    : overdueCount > 0
                    ? "bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-400 border-rose-500/30"
                    : "bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/30"
                )}
                title="Click to toggle filter: Show leads awaiting action"
              >
                <AlertTriangle className="h-3 w-3 shrink-0" />
                <span>{needsActionCount} Awaiting Action</span>
                {overdueCount > 0 && (
                  <span className="px-1 py-0.2 rounded bg-rose-500 text-white text-[9px] font-bold">
                    {overdueCount} overdue
                  </span>
                )}
              </button>
            )}
            <div>
              Total: <span className="font-bold text-foreground">{pagination.total.toLocaleString()}</span> {isSpamView ? "spam / disqualified" : "leads"}
            </div>
          </div>
        </div>
      </div>

      {/* Desktop / Tablet Table View (screens >= 768px) */}
      <div className="hidden md:block rounded-md border bg-card shadow-sm overflow-hidden w-full">
        <Table containerClassName="overflow-x-auto lg:overflow-x-hidden" className="w-full table-fixed min-w-[760px] lg:min-w-0">
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-[16%] font-semibold pl-3">Lead Contact</TableHead>
              <TableHead className="w-[8%] font-semibold">Source & Form</TableHead>
              <TableHead className="w-[14%] font-semibold">Email & Phone</TableHead>
              <TableHead className="w-[13%] font-semibold">Company / Inquiry</TableHead>
              <TableHead className="w-[9%] font-semibold">Lifecycle</TableHead>
              <TableHead className="w-[10%] font-semibold">Date</TableHead>
              <TableHead className="w-[30%] text-right font-semibold pr-3">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <RefreshCw className="h-5 w-5 animate-spin text-primary" />
                    <span>Loading {isSpamView ? "spam entries..." : "marketing leads..."}</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : leads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <UserCircle2 className="h-8 w-8 text-muted-foreground/50" />
                    <p className="font-medium">{isSpamView ? "No spam or disqualified leads found" : "No leads found in this view"}</p>
                    <p className="text-xs text-muted-foreground">{isSpamView ? "Spam inquiries will appear here when flagged." : "Try adjusting your filters or search query."}</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              leads.map((contact: any) => {
                const fullName = `${contact.firstname || ""} ${contact.lastname || ""}`.trim() || "Unnamed Lead";
                const isLost = contact.lifecycle_stage === "other" || contact.lifecycle_stage === "lost" || contact.lifecycle_stage === "disqualified" || contact.lifecycle_stage === "spam" || contact.lead_status === "Spam" || contact.lead_status === "Disqualified";
                const isCustomer = contact.lifecycle_stage === "customer";
                const isOpportunity = contact.lifecycle_stage === "opportunity";
                const isQualified = contact.lifecycle_stage === "salesqualifiedlead" || contact.lifecycle_stage === "marketingqualifiedlead";

                const alertInfo = getLeadAlertInfo(contact);
                const isNavigatingThis = navigatingId === contact.id.toString();

                return (
                  <TableRow
                    key={contact.id}
                    className={cn(
                      "cursor-pointer hover:bg-muted/50 transition-colors border-l-4",
                      alertInfo ? alertInfo.rowClass : "border-l-transparent",
                      isNavigatingThis && "bg-primary/[0.06] opacity-80"
                    )}
                    onClick={() => handleRowClick(contact.id.toString())}
                  >
                    <TableCell className="font-medium text-foreground py-2.5 px-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {isNavigatingThis ? (
                          <Loader2 className="h-4 w-4 text-primary animate-spin shrink-0" />
                        ) : (
                          <UserCircle2 className="h-4 w-4 text-blue-600 shrink-0" />
                        )}
                        <span className="truncate max-w-[130px] font-semibold">{fullName}</span>
                        {isNavigatingThis ? (
                          <span className="inline-flex items-center text-[10px] text-primary font-medium bg-primary/10 px-1.5 py-0.5 rounded animate-pulse">
                            Opening...
                          </span>
                        ) : (
                          alertInfo?.badge
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="py-2.5 px-2">
                      {getSourceBadge(contact.source_website, contact.form_type)}
                    </TableCell>

                    <TableCell className="text-xs py-2.5 px-2">
                      <div className="space-y-1 min-w-0">
                        {contact.email ? (
                          <a
                            href={`mailto:${contact.email}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-blue-600 hover:underline flex items-center gap-1 truncate max-w-full"
                            title={contact.email}
                          >
                            <Mail className="h-3 w-3 shrink-0 text-muted-foreground" />
                            <span className="truncate">{contact.email}</span>
                          </a>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                        {contact.phone && (
                          <a
                            href={`tel:${contact.phone}`}
                            onClick={(e) => e.stopPropagation()}
                            className="hover:underline flex items-center gap-1 text-muted-foreground hover:text-foreground truncate max-w-full"
                            title={contact.phone}
                          >
                            <Phone className="h-3 w-3 shrink-0" />
                            <span className="truncate">{contact.phone}</span>
                          </a>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="text-xs text-foreground py-2.5 px-2">
                      <div className="space-y-0.5 min-w-0">
                        {contact.company_name || contact.company ? (
                          <div className="flex items-center gap-1 font-medium truncate max-w-full" title={contact.company_name || contact.company}>
                            <Building2 className="h-3 w-3 text-muted-foreground shrink-0" />
                            <span className="truncate">{contact.company_name || contact.company}</span>
                          </div>
                        ) : null}
                        {contact.product ? (
                          <div className="text-[11px] text-muted-foreground truncate max-w-full flex items-center gap-1" title={contact.product}>
                            <Tag className="h-2.5 w-2.5 shrink-0" />
                            <span className="truncate">{contact.product}</span>
                          </div>
                        ) : null}
                        {contact.item_to_lift ? (
                          <div 
                            className="text-[11px] text-slate-700 dark:text-slate-300 truncate max-w-full flex items-center gap-1 font-normal bg-muted/60 px-1.5 py-0.5 rounded border border-border/50"
                            title={`Item to lift: ${contact.item_to_lift}`}
                          >
                            <span className="text-[10px] font-semibold text-primary shrink-0 uppercase">Lift:</span>
                            <span className="truncate">{contact.item_to_lift}</span>
                          </div>
                        ) : contact.subject ? (
                          <div className="text-[11px] text-muted-foreground truncate max-w-full" title={contact.subject}>
                            {contact.subject}
                          </div>
                        ) : (!contact.company && !contact.product) ? (
                          <span className="text-muted-foreground">-</span>
                        ) : null}
                      </div>
                    </TableCell>

                    <TableCell className="py-2.5 px-2">
                      {getLifecycleBadge(contact.lifecycle_stage)}
                    </TableCell>

                    <TableCell className="text-xs text-muted-foreground py-2.5 px-2 whitespace-nowrap">
                      {contact.createdate || contact.lastmodifieddate ? (
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                          <span>{new Date(contact.createdate || contact.lastmodifieddate).toLocaleDateString()}</span>
                        </div>
                      ) : (
                        "-"
                      )}
                    </TableCell>

                    <TableCell className="text-right py-2 px-2.5 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5 flex-nowrap">
                        {/* Call Button */}
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 px-2 text-[11px] font-semibold text-emerald-700 bg-emerald-50/70 hover:bg-emerald-100 hover:text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300 shrink-0"
                          title={contact.phone ? `Call ${contact.phone}` : "Log Phone Call"}
                          onClick={(e) => {
                            e.stopPropagation();
                            setCallContact(contact);
                            setCallDialogOpen(true);
                          }}
                        >
                          <PhoneCall className="h-3 w-3 mr-1 text-emerald-600" />
                          Call
                        </Button>

                        {isSpamView ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 text-[11px] font-medium text-emerald-700 bg-emerald-50/70 hover:bg-emerald-100 border-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300 shrink-0"
                            title="Mark as Not Spam (Restore to Leads)"
                            disabled={unspamMutation.isPending}
                            onClick={(e) => {
                              e.stopPropagation();
                              unspamMutation.mutate(contact.id.toString());
                            }}
                          >
                            <RotateCcw className="h-3 w-3 mr-1 text-emerald-600" />
                            Not Spam
                          </Button>
                        ) : (
                          <>
                            {!isCustomer && !isLost && !isOpportunity && (
                              <Button
                                variant="outline"
                                size="sm"
                                className={cn(
                                  "h-7 px-2 text-[11px] font-medium border transition-colors shrink-0",
                                  isQualified
                                    ? "text-indigo-700 bg-indigo-50/70 hover:bg-indigo-100 border-indigo-300 dark:bg-indigo-950/40 dark:border-indigo-800"
                                    : "text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 border-indigo-200/80 dark:border-indigo-800"
                                )}
                                title={isQualified ? "Click to revert to Inbound Lead" : "Mark Lead as Qualified (SQL)"}
                                disabled={qualifyMutation.isPending}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  qualifyMutation.mutate({ id: contact.id.toString(), isCurrentlyQualified: isQualified });
                                }}
                              >
                                <ShieldCheck className="h-3 w-3 mr-1 text-indigo-600" />
                                {isQualified ? "Qualified" : "Qualify"}
                              </Button>
                            )}
                            {!isLost && !isCustomer && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 px-2 text-[11px] font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200/80 dark:border-rose-900/60 dark:text-rose-400 shrink-0"
                                title="Mark Lead as Spam"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDisqualifyContact(contact);
                                  setDisqualifyOpen(true);
                                }}
                              >
                                <Ban className="h-3 w-3 mr-1 text-rose-500" />
                                Spam
                              </Button>
                            )}
                          </>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-1.5 text-[11px] text-muted-foreground hover:text-foreground shrink-0"
                          onClick={(e) => handleEditClick(e, contact.id.toString())}
                          title="View / edit lead details"
                        >
                          <Pencil className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card List View (Phones and compact screens < 768px) */}
      <div className="block md:hidden space-y-3">
        {isLoading ? (
          <div className="p-8 text-center bg-card rounded-lg border text-muted-foreground flex flex-col items-center justify-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin text-primary" />
            <span className="text-xs">Loading {isSpamView ? "spam entries..." : "marketing leads..."}</span>
          </div>
        ) : leads.length === 0 ? (
          <div className="p-8 text-center bg-card rounded-lg border text-muted-foreground flex flex-col items-center justify-center gap-2">
            <UserCircle2 className="h-8 w-8 text-muted-foreground/50" />
            <p className="font-medium text-sm">{isSpamView ? "No spam or disqualified leads found" : "No leads found in this view"}</p>
            <p className="text-xs text-muted-foreground">{isSpamView ? "Spam inquiries will appear here when flagged." : "Try adjusting your filters or search query."}</p>
          </div>
        ) : (
          leads.map((contact: any) => {
            const fullName = `${contact.firstname || ""} ${contact.lastname || ""}`.trim() || "Unnamed Lead";
            const isLost = contact.lifecycle_stage === "other" || contact.lifecycle_stage === "lost" || contact.lifecycle_stage === "disqualified" || contact.lifecycle_stage === "spam" || contact.lead_status === "Spam" || contact.lead_status === "Disqualified";
            const isCustomer = contact.lifecycle_stage === "customer";
            const isOpportunity = contact.lifecycle_stage === "opportunity";
            const isQualified = contact.lifecycle_stage === "salesqualifiedlead" || contact.lifecycle_stage === "marketingqualifiedlead";

            const alertInfo = getLeadAlertInfo(contact);
            const isNavigatingThis = navigatingId === contact.id.toString();

            return (
              <div
                key={contact.id}
                onClick={() => handleRowClick(contact.id.toString())}
                className={cn(
                  "p-3.5 rounded-lg border bg-card shadow-xs transition-colors cursor-pointer border-l-4 space-y-3",
                  alertInfo ? alertInfo.rowClass : "border-l-transparent",
                  isNavigatingThis && "bg-primary/[0.06] opacity-80"
                )}
              >
                {/* Header: Contact & Source */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                    {isNavigatingThis ? (
                      <Loader2 className="h-4 w-4 text-primary animate-spin shrink-0" />
                    ) : (
                      <UserCircle2 className="h-4 w-4 text-blue-600 shrink-0" />
                    )}
                    <span className="font-semibold text-sm text-foreground truncate max-w-[170px]">{fullName}</span>
                    {alertInfo?.badge}
                  </div>
                  <div className="shrink-0">
                    {getSourceBadge(contact.source_website, contact.form_type)}
                  </div>
                </div>

                {/* Info Grid: Email/Phone & Status/Date */}
                <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/50">
                  <div className="space-y-1 min-w-0">
                    {contact.email ? (
                      <a
                        href={`mailto:${contact.email}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-blue-600 hover:underline flex items-center gap-1 truncate text-[11px]"
                      >
                        <Mail className="h-3 w-3 shrink-0 text-muted-foreground" />
                        <span className="truncate">{contact.email}</span>
                      </a>
                    ) : (
                      <span className="text-muted-foreground text-[11px]">-</span>
                    )}
                    {contact.phone && (
                      <a
                        href={`tel:${contact.phone}`}
                        onClick={(e) => e.stopPropagation()}
                        className="hover:underline flex items-center gap-1 text-muted-foreground text-[11px] truncate"
                      >
                        <Phone className="h-3 w-3 shrink-0" />
                        <span className="truncate">{contact.phone}</span>
                      </a>
                    )}
                  </div>

                  <div className="space-y-1 min-w-0 flex flex-col items-end">
                    <div>
                      {getLifecycleBadge(contact.lifecycle_stage)}
                    </div>
                    {contact.createdate || contact.lastmodifieddate ? (
                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Calendar className="h-3 w-3 shrink-0" />
                        <span>{new Date(contact.createdate || contact.lastmodifieddate).toLocaleDateString()}</span>
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* Company & Inbound Equipment Specifications */}
                {(contact.company || contact.item_to_lift || contact.product) && (
                  <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap pt-0.5">
                    {contact.company && (
                      <span className="font-medium text-foreground flex items-center gap-1">
                        <Building2 className="h-3 w-3 text-muted-foreground" />
                        <span className="truncate">{contact.company}</span>
                      </span>
                    )}
                    {contact.item_to_lift && (
                      <span className="text-[10px] bg-muted/60 px-1.5 py-0.5 rounded border font-medium text-primary flex items-center gap-1">
                        <span className="font-bold text-[9px] uppercase">Lift:</span>
                        <span className="truncate max-w-[180px]">{contact.item_to_lift}</span>
                      </span>
                    )}
                    {!contact.item_to_lift && contact.product && (
                      <span className="text-[10px] bg-muted/40 px-1.5 py-0.5 rounded border text-muted-foreground flex items-center gap-1">
                        <Tag className="h-2.5 w-2.5" />
                        <span className="truncate max-w-[180px]">{contact.product}</span>
                      </span>
                    )}
                  </div>
                )}

                {/* Mobile Actions Toolbar */}
                <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-border/40 flex-wrap" onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2.5 text-xs font-semibold text-emerald-700 bg-emerald-50/80 hover:bg-emerald-100 border-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300"
                    onClick={() => {
                      setCallContact(contact);
                      setCallDialogOpen(true);
                    }}
                  >
                    <PhoneCall className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                    Call
                  </Button>

                  {isSpamView ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-2.5 text-xs font-medium text-emerald-700 bg-emerald-50/80 hover:bg-emerald-100 border-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300"
                      disabled={unspamMutation.isPending}
                      onClick={() => unspamMutation.mutate(contact.id.toString())}
                    >
                      <RotateCcw className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                      Not Spam
                    </Button>
                  ) : (
                    <>
                      {!isCustomer && !isLost && !isOpportunity && (
                        <Button
                          variant="outline"
                          size="sm"
                          className={cn(
                            "h-7 px-2.5 text-xs font-medium border transition-colors",
                            isQualified
                              ? "text-indigo-700 bg-indigo-50/70 hover:bg-indigo-100 border-indigo-300"
                              : "text-indigo-600 hover:bg-indigo-50 border-indigo-200"
                          )}
                          disabled={qualifyMutation.isPending}
                          onClick={() => qualifyMutation.mutate({ id: contact.id.toString(), isCurrentlyQualified: isQualified })}
                        >
                          <ShieldCheck className="h-3.5 w-3.5 mr-1 text-indigo-600" />
                          {isQualified ? "Qualified" : "Qualify"}
                        </Button>
                      )}
                      {!isLost && !isCustomer && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 px-2.5 text-xs font-medium text-rose-600 hover:bg-rose-50 border-rose-200"
                          onClick={() => {
                            setDisqualifyContact(contact);
                            setDisqualifyOpen(true);
                          }}
                        >
                          <Ban className="h-3.5 w-3.5 mr-1 text-rose-500" />
                          Spam
                        </Button>
                      )}
                    </>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={(e) => handleEditClick(e, contact.id.toString())}
                  >
                    <Pencil className="h-3.5 w-3.5 mr-1" />
                    Details
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination - Responsive on all devices */}
      {pagination.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground pt-1">
          <div className="text-xs text-center sm:text-left">
            Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} leads
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="h-8 px-3 text-xs"
            >
              Previous
            </Button>
            <span className="text-xs">
              Page {page} of {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page === pagination.totalPages}
              className="h-8 px-3 text-xs"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Convert lead to opportunity dialog */}
      <ConvertLeadDialog
        contact={convertingContact}
        open={convertDialogOpen}
        onOpenChange={setConvertDialogOpen}
      />

      {/* Disqualify lead dialog */}
      <DisqualifyLeadDialog
        contact={disqualifyContact}
        open={disqualifyOpen}
        onOpenChange={setDisqualifyOpen}
      />

      {/* Log phone call dialog */}
      <LogCallDialog
        contact={callContact}
        open={callDialogOpen}
        onOpenChange={setCallDialogOpen}
      />
    </div>
  );
}
