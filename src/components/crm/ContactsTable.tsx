"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchContacts, fetchLifecycles, fetchOwners } from "@/services/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ContactDetailSheet from "./ContactDetailSheet";
import { Badge } from "@/components/ui/badge";

export default function ContactsTable() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [lifecycle, setLifecycle] = useState("");
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["crm-contacts", { page, search, lifecycle }],
    queryFn: () => fetchContacts({ page, search, lifecycle }),
    placeholderData: (previousData) => previousData,
  });

  const { data: lifecycles } = useQuery({ queryKey: ["crm-lifecycle"], queryFn: fetchLifecycles });
  
  const contacts = data?.data || [];
  const pagination = data?.pagination || { total: 0, page: 1, limit: 50, totalPages: 1 };

  const handleRowClick = (id: string) => {
    setSelectedContactId(id);
    setSheetOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <Input 
          placeholder="Search name or email..." 
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="max-w-xs"
        />
        <select 
          className="flex h-9 w-full max-w-[200px] items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          value={lifecycle}
          onChange={(e) => {
            setLifecycle(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Lifecycles</option>
          {lifecycles?.map((l: any) => (
            <option key={l.lifecycle_stage} value={l.lifecycle_stage}>{l.lifecycle_stage}</option>
          ))}
        </select>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Lifecycle Stage</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Last Modified</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">Loading contacts...</TableCell>
              </TableRow>
            ) : contacts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">No contacts found.</TableCell>
              </TableRow>
            ) : (
              contacts.map((contact: any) => (
                <TableRow 
                  key={contact.id} 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleRowClick(contact.id.toString())}
                >
                  <TableCell className="font-medium">{contact.firstname} {contact.lastname}</TableCell>
                  <TableCell>{contact.email}</TableCell>
                  <TableCell>{contact.company_name || "-"}</TableCell>
                  <TableCell>
                    {contact.lifecycle_stage && <Badge variant="outline">{contact.lifecycle_stage}</Badge>}
                  </TableCell>
                  <TableCell>{contact.owner_name || "-"}</TableCell>
                  <TableCell>{new Date(contact.lastmodifieddate).toLocaleDateString()}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} contacts
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page === pagination.totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <ContactDetailSheet 
        contactId={selectedContactId} 
        open={sheetOpen} 
        onOpenChange={setSheetOpen} 
      />
    </div>
  );
}
