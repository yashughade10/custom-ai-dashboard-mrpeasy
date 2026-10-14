"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchContacts, fetchOwners } from "@/services/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import ContactDetailSheet from "./ContactDetailSheet";
import { 
  Search, 
  Building2, 
  Mail, 
  Phone, 
  UserCircle2, 
  Calendar,
  ExternalLink,
  Pencil,
  RefreshCw,
  UserCheck
} from "lucide-react";

export default function MarketingLeadsTable() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [isEditingSheet, setIsEditingSheet] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["crm-contacts-leads", { page, search, lifecycle: "lead" }],
    queryFn: () => fetchContacts({ page, search, lifecycle: "lead", limit: 50 }),
    placeholderData: (previousData) => previousData,
  });

  const { data: owners } = useQuery({
    queryKey: ["crm-owners"],
    queryFn: fetchOwners,
  });

  const leads = data?.data || [];
  const pagination = data?.pagination || { total: 0, page: 1, limit: 50, totalPages: 1 };

  const handleRowClick = (id: string) => {
    setSelectedContactId(id);
    setSheetOpen(true);
    setIsEditingSheet(false);
  };

  const handleEditClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSelectedContactId(id);
    setIsEditingSheet(true);
    setSheetOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Top search & filter bar */}
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
          Total Leads: <span className="font-semibold text-foreground">{pagination.total.toLocaleString()}</span>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="min-w-[180px] font-semibold">Lead Name</TableHead>
              <TableHead className="min-w-[180px] font-semibold">Email</TableHead>
              <TableHead className="w-[140px] font-semibold">Phone</TableHead>
              <TableHead className="min-w-[180px] font-semibold">Company</TableHead>
              <TableHead className="w-[120px] font-semibold">Lifecycle</TableHead>
              <TableHead className="w-[140px] font-semibold">Owner</TableHead>
              <TableHead className="w-[120px] font-semibold">Last Modified</TableHead>
              <TableHead className="w-[80px] text-right font-semibold">Actions</TableHead>
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
                    <p className="font-medium">No leads found</p>
                    <p className="text-xs text-muted-foreground">Try clearing or adjusting your search term.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              leads.map((contact: any) => {
                const fullName = `${contact.firstname || ""} ${contact.lastname || ""}`.trim() || "Unnamed Lead";
                return (
                  <TableRow
                    key={contact.id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => handleRowClick(contact.id.toString())}
                  >
                    <TableCell className="font-medium text-foreground">
                      <div className="flex items-center gap-2">
                        <UserCircle2 className="h-4 w-4 text-blue-600 shrink-0" />
                        <span className="truncate max-w-[200px]">{fullName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {contact.email ? (
                        <a
                          href={`mailto:${contact.email}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-blue-600 hover:underline flex items-center gap-1 truncate max-w-[200px]"
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
                          <span className="truncate max-w-[180px]">{contact.company_name || contact.company}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800 text-[11px] capitalize">
                        {contact.lifecycle_stage || "Lead"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {contact.owner_name ? (
                        <div className="flex items-center gap-1">
                          <UserCheck className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span className="truncate max-w-[120px]">{contact.owner_name}</span>
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
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={(e) => handleEditClick(e, contact.id.toString())}
                      >
                        <Pencil className="h-3.5 w-3.5 mr-1" />
                        Edit
                      </Button>
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

      {/* Contact detail / edit sheet */}
      <ContactDetailSheet
        contactId={selectedContactId}
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open);
          if (!open) setIsEditingSheet(false);
        }}
        initialEditMode={isEditingSheet}
      />
    </div>
  );
}
