"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchContacts, fetchOwners, syncLeadsNow, fetchContactCountries } from "@/services/api";
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
  RotateCcw
} from "lucide-react";

export default function MarketingLeadsTable() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [lifecycleFilter, setLifecycleFilter] = useState("lead");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [countryFilter, setCountryFilter] = useState("all");

  // Conversion & Disqualification modal states
  const [convertingContact, setConvertingContact] = useState<any | null>(null);
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [disqualifyContact, setDisqualifyContact] = useState<any | null>(null);
  const [disqualifyOpen, setDisqualifyOpen] = useState(false);

  const queryLifecycle = lifecycleFilter === "all" ? "" : lifecycleFilter;
  const querySource = sourceFilter === "all" ? "" : sourceFilter;
  const queryCountry = countryFilter === "all" ? "" : countryFilter;

  const { data, isLoading } = useQuery({
    queryKey: ["crm-contacts-leads", { page, search, lifecycle: queryLifecycle, source: querySource, country: queryCountry }],
    queryFn: () => fetchContacts({ 
      page, 
      search, 
      lifecycle: queryLifecycle || undefined,
      source: querySource || undefined,
      country: queryCountry || undefined,
      limit: 50 
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

  const leads = data?.data || [];
  const pagination = data?.pagination || { total: 0, page: 1, limit: 50, totalPages: 1 };

  const handleRowClick = (id: string) => {
    router.push(`/dashboard/crm/leads/${id}`);
  };

  const handleEditClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
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
        return (
          <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800 text-[11px] capitalize">
            Disqualified
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

  const hasActiveFilters = sourceFilter !== "all" || lifecycleFilter !== "lead" || countryFilter !== "all" || search !== "";

  const handleResetFilters = () => {
    setSourceFilter("all");
    setLifecycleFilter("lead");
    setCountryFilter("all");
    setSearch("");
    setPage(1);
  };

  return (
    <div className="space-y-4">
      {/* Top Filter Controls Bar with Dropdowns */}
      <div className="flex flex-col gap-3 bg-card p-3 rounded-lg border shadow-sm">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          
          {/* Search Input */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search leads by name, email, company, product..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9 h-9 text-xs"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Source Website Dropdown */}
            <div className="relative min-w-[150px]">
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
            <div className="relative min-w-[160px]">
              <Filter className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <select
                value={lifecycleFilter}
                onChange={(e) => {
                  setLifecycleFilter(e.target.value);
                  setPage(1);
                }}
                className="flex h-9 w-full rounded-md border border-input bg-background pl-8 pr-7 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-primary font-medium cursor-pointer"
              >
                <option value="lead">Inbound Leads</option>
                <option value="salesqualifiedlead">Qualified (SQL)</option>
                <option value="opportunity">In Pipeline (Deal)</option>
                <option value="customer">Converted (Customers)</option>
                <option value="other">Disqualified / Lost</option>
                <option value="all">All Stages</option>
              </select>
            </div>

            {/* Country Dropdown */}
            <div className="relative min-w-[145px]">
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
          </div>
        </div>

        {/* Count summary bar */}
        <div className="flex items-center justify-between text-xs text-muted-foreground px-1 pt-2 border-t">
          <div className="flex items-center gap-2 flex-wrap">
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
          </div>
          <div>
            Total: <span className="font-bold text-foreground">{pagination.total.toLocaleString()}</span> leads
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="min-w-[170px] font-semibold">Lead Contact</TableHead>
              <TableHead className="w-[125px] font-semibold">Source & Form</TableHead>
              <TableHead className="min-w-[170px] font-semibold">Email & Phone</TableHead>
              <TableHead className="min-w-[150px] font-semibold">Company / Inquiry</TableHead>
              <TableHead className="w-[110px] font-semibold">Lifecycle</TableHead>
              <TableHead className="w-[120px] font-semibold">Owner</TableHead>
              <TableHead className="w-[110px] font-semibold">Date</TableHead>
              <TableHead className="w-[170px] text-right font-semibold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <RefreshCw className="h-5 w-5 animate-spin text-primary" />
                    <span>Loading marketing leads...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : leads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <UserCircle2 className="h-8 w-8 text-muted-foreground/50" />
                    <p className="font-medium">No leads found in this view</p>
                    <p className="text-xs text-muted-foreground">Try adjusting your filters or search query.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              leads.map((contact: any) => {
                const fullName = `${contact.firstname || ""} ${contact.lastname || ""}`.trim() || "Unnamed Lead";
                const isLost = contact.lifecycle_stage === "other" || contact.lifecycle_stage === "lost" || contact.lifecycle_stage === "disqualified";
                const isCustomer = contact.lifecycle_stage === "customer";

                return (
                  <TableRow
                    key={contact.id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => handleRowClick(contact.id.toString())}
                  >
                    <TableCell className="font-medium text-foreground">
                      <div className="flex items-center gap-2">
                        <UserCircle2 className="h-4 w-4 text-blue-600 shrink-0" />
                        <span className="truncate max-w-[170px] font-semibold">{fullName}</span>
                      </div>
                    </TableCell>

                    <TableCell>
                      {getSourceBadge(contact.source_website, contact.form_type)}
                    </TableCell>

                    <TableCell className="text-xs">
                      <div className="space-y-1">
                        {contact.email ? (
                          <a
                            href={`mailto:${contact.email}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-blue-600 hover:underline flex items-center gap-1 truncate max-w-[170px]"
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
                            className="hover:underline flex items-center gap-1 text-muted-foreground hover:text-foreground"
                          >
                            <Phone className="h-3 w-3 shrink-0" />
                            <span>{contact.phone}</span>
                          </a>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="text-xs text-foreground">
                      <div className="space-y-0.5">
                        {contact.company_name || contact.company ? (
                          <div className="flex items-center gap-1 font-medium truncate max-w-[160px]">
                            <Building2 className="h-3 w-3 text-muted-foreground shrink-0" />
                            <span className="truncate">{contact.company_name || contact.company}</span>
                          </div>
                        ) : null}
                        {contact.product ? (
                          <div className="text-[11px] text-muted-foreground truncate max-w-[160px] flex items-center gap-1">
                            <Tag className="h-2.5 w-2.5 shrink-0" />
                            <span className="truncate">{contact.product}</span>
                          </div>
                        ) : contact.subject ? (
                          <div className="text-[11px] text-muted-foreground truncate max-w-[160px]">
                            {contact.subject}
                          </div>
                        ) : !contact.company ? (
                          <span className="text-muted-foreground">-</span>
                        ) : null}
                      </div>
                    </TableCell>

                    <TableCell>
                      {getLifecycleBadge(contact.lifecycle_stage)}
                    </TableCell>

                    <TableCell className="text-xs text-muted-foreground">
                      {contact.owner_name ? (
                        <div className="flex items-center gap-1">
                          <UserCheck className="h-3 w-3 text-muted-foreground shrink-0" />
                          <span className="truncate max-w-[110px]">{contact.owner_name}</span>
                        </div>
                      ) : (
                        "-"
                      )}
                    </TableCell>

                    <TableCell className="text-xs text-muted-foreground">
                      {contact.createdate || contact.lastmodifieddate ? (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 shrink-0 text-muted-foreground/60" />
                          <span>{new Date(contact.createdate || contact.lastmodifieddate).toLocaleDateString()}</span>
                        </div>
                      ) : (
                        "-"
                      )}
                    </TableCell>

                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        {!isCustomer && !isLost && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200/80 dark:border-blue-800"
                            onClick={(e) => {
                              e.stopPropagation();
                              setConvertingContact(contact);
                              setConvertDialogOpen(true);
                            }}
                          >
                            <Sparkles className="h-3 w-3 mr-1 text-blue-600" />
                            Convert
                          </Button>
                        )}
                        {!isLost && !isCustomer && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-1.5 text-xs text-muted-foreground hover:text-rose-600 hover:bg-rose-50"
                            title="Disqualify Lead"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDisqualifyContact(contact);
                              setDisqualifyOpen(true);
                            }}
                          >
                            <Ban className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={(e) => handleEditClick(e, contact.id.toString())}
                        >
                          <Pencil className="h-3.5 w-3.5 mr-1" />
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

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground pt-1">
          <div>
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
    </div>
  );
}
