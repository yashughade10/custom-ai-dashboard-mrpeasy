"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchContacts, fetchOwners } from "@/services/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
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
  Filter
} from "lucide-react";

export default function MarketingLeadsTable() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [lifecycleFilter, setLifecycleFilter] = useState("lead");

  // Conversion & Disqualification modal states
  const [convertingContact, setConvertingContact] = useState<any | null>(null);
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [disqualifyContact, setDisqualifyContact] = useState<any | null>(null);
  const [disqualifyOpen, setDisqualifyOpen] = useState(false);

  const queryLifecycle = lifecycleFilter === "all" ? "" : lifecycleFilter;

  const { data, isLoading } = useQuery({
    queryKey: ["crm-contacts-leads", { page, search, lifecycle: queryLifecycle }],
    queryFn: () => fetchContacts({ 
      page, 
      search, 
      lifecycle: queryLifecycle || undefined, 
      limit: 50 
    }),
    placeholderData: (previousData) => previousData,
  });

  const { data: owners } = useQuery({
    queryKey: ["crm-owners"],
    queryFn: fetchOwners,
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

  return (
    <div className="space-y-4">
      {/* Top search & status filter bar */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search leads by name, email, company..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9 h-9"
            />
          </div>

          <div className="text-xs text-muted-foreground font-medium">
            Total Records: <span className="font-semibold text-foreground">{pagination.total.toLocaleString()}</span>
          </div>
        </div>

        {/* Lifecycle Stage Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-muted-foreground mr-1 text-xs font-medium flex items-center gap-1">
            <Filter className="h-3 w-3" /> Filter:
          </span>
          <button
            onClick={() => { setLifecycleFilter("lead"); setPage(1); }}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
              lifecycleFilter === "lead" 
                ? "bg-blue-600 text-white shadow-sm" 
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            Inbound Leads
          </button>
          <button
            onClick={() => { setLifecycleFilter("salesqualifiedlead"); setPage(1); }}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
              lifecycleFilter === "salesqualifiedlead" 
                ? "bg-indigo-600 text-white shadow-sm" 
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            Qualified
          </button>
          <button
            onClick={() => { setLifecycleFilter("opportunity"); setPage(1); }}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
              lifecycleFilter === "opportunity" 
                ? "bg-amber-600 text-white shadow-sm" 
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            In Pipeline (Deal)
          </button>
          <button
            onClick={() => { setLifecycleFilter("customer"); setPage(1); }}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
              lifecycleFilter === "customer" 
                ? "bg-emerald-600 text-white shadow-sm" 
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            Converted (Customers)
          </button>
          <button
            onClick={() => { setLifecycleFilter("other"); setPage(1); }}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
              lifecycleFilter === "other" 
                ? "bg-rose-600 text-white shadow-sm" 
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            Disqualified / Lost
          </button>
          <button
            onClick={() => { setLifecycleFilter("all"); setPage(1); }}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
              lifecycleFilter === "all" 
                ? "bg-foreground text-background shadow-sm" 
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            All Records
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="min-w-[170px] font-semibold">Lead Name</TableHead>
              <TableHead className="min-w-[170px] font-semibold">Email</TableHead>
              <TableHead className="w-[130px] font-semibold">Phone</TableHead>
              <TableHead className="min-w-[160px] font-semibold">Company</TableHead>
              <TableHead className="w-[120px] font-semibold">Lifecycle</TableHead>
              <TableHead className="w-[130px] font-semibold">Owner</TableHead>
              <TableHead className="w-[110px] font-semibold">Last Modified</TableHead>
              <TableHead className="w-[180px] text-right font-semibold">Actions</TableHead>
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
                    <p className="text-xs text-muted-foreground">Try adjusting your status filter or search query.</p>
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
                        <span className="truncate max-w-[180px]">{fullName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {contact.email ? (
                        <a
                          href={`mailto:${contact.email}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-blue-600 hover:underline flex items-center gap-1 truncate max-w-[180px]"
                        >
                          <Mail className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          <span className="truncate">{contact.email}</span>
                        </a>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {contact.phone ? (
                        <a
                          href={`tel:${contact.phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="hover:underline flex items-center gap-1 text-muted-foreground hover:text-foreground"
                        >
                          <Phone className="h-3.5 w-3.5 shrink-0" />
                          <span>{contact.phone}</span>
                        </a>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-foreground">
                      {contact.company_name || contact.company ? (
                        <div className="flex items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span className="truncate max-w-[160px]">{contact.company_name || contact.company}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {getLifecycleBadge(contact.lifecycle_stage)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {contact.owner_name ? (
                        <div className="flex items-center gap-1">
                          <UserCheck className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span className="truncate max-w-[110px]">{contact.owner_name}</span>
                        </div>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {contact.lastmodifieddate ? (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                          <span>{new Date(contact.lastmodifieddate).toLocaleDateString()}</span>
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
