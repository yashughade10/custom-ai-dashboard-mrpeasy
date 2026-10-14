"use client";

import { useState, useMemo } from "react";
import { useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { mrpApi } from "@/services/mrpApi";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  RefreshCw, 
  Download, 
  FileSpreadsheet, 
  Search, 
  Building2, 
  Mail, 
  Phone, 
  ExternalLink,
  CreditCard,
  UserCheck
} from "lucide-react";
import { toast } from "sonner";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "/api";

export default function CustomerContactsTable() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 50;

  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);

  const { data: response, isLoading, isFetching } = useQuery({
    queryKey: ["mrpCustomers", 2000],
    queryFn: () => mrpApi.getCustomers(1, 2000),
    placeholderData: keepPreviousData,
  });

  const rawCustomers: any[] = response?.data || [];

  const handleXeroSync = async () => {
    setSyncing(true);
    setSyncMsg(null);
    try {
      const res = await fetch(`${API_BASE}/xero/sync/pull-contacts`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Sync failed");
      const msg = data.message || "Customers synced from Xero!";
      setSyncMsg(`✓ ${msg}`);
      toast.success(msg);
      queryClient.invalidateQueries({ queryKey: ["mrpCustomers"] });
    } catch (err: any) {
      const errText = err.message || "Failed to sync with Xero";
      setSyncMsg(`✗ ${errText}`);
      toast.error(errText);
    } finally {
      setSyncing(false);
    }
  };

  // Filtered customers based on search and status
  const filteredCustomers = useMemo(() => {
    let result = rawCustomers;

    if (statusFilter !== "all") {
      result = result.filter((c) => 
        (c.status || "").toLowerCase() === statusFilter.toLowerCase()
      );
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((c) =>
        (c.customer_number || "").toLowerCase().includes(q) ||
        (c.name || "").toLowerCase().includes(q) ||
        (c.email || "").toLowerCase().includes(q) ||
        (c.phone || "").toLowerCase().includes(q) ||
        (c.address || "").toLowerCase().includes(q) ||
        (c.account_manager || "").toLowerCase().includes(q)
      );
    }

    return result;
  }, [rawCustomers, search, statusFilter]);

  const total = filteredCustomers.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const paginatedCustomers = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredCustomers.slice(start, start + pageSize);
  }, [filteredCustomers, page, pageSize]);

  return (
    <div className="space-y-4">
      {/* Top action bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-center gap-2 flex-1">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search number, name, email, phone..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9 h-9"
            />
          </div>

          <select
            className="flex h-9 w-full sm:w-44 items-center justify-between rounded-md border border-input bg-card px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-end">
          <Button
            size="sm"
            variant="outline"
            className="h-9 gap-1.5 text-xs font-medium border-blue-200 text-blue-700 bg-blue-50/60 hover:bg-blue-100/80 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300"
            onClick={handleXeroSync}
            disabled={syncing}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Syncing..." : "Sync from Xero"}
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="h-9 gap-1.5 text-xs"
            onClick={() => window.open(`${API_BASE}/mrp/crm/customers/export/csv`, "_blank")}
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            CSV
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="h-9 gap-1.5 text-xs"
            onClick={() => window.open(`${API_BASE}/mrp/crm/customers/export/pdf`, "_blank")}
          >
            <Download className="h-3.5 w-3.5" />
            PDF
          </Button>

          <Button
            size="sm"
            className="h-9 gap-1.5 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => router.push("/dashboard/crm/contacts/new")}
          >
            <Plus className="h-4 w-4" />
            Create Customer
          </Button>
        </div>
      </div>

      {syncMsg && (
        <div className={`text-xs px-3 py-1.5 rounded-md ${
          syncMsg.startsWith("✓") ? "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400" : "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400"
        }`}>
          {syncMsg}
        </div>
      )}

      {/* Table container */}
      <div className="rounded-md border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-[120px] font-semibold">Number</TableHead>
              <TableHead className="min-w-[220px] font-semibold">Customer / Company Name</TableHead>
              <TableHead className="w-[100px] font-semibold">Status</TableHead>
              <TableHead className="w-[150px] font-semibold">Account Manager</TableHead>
              <TableHead className="min-w-[180px] font-semibold">Email</TableHead>
              <TableHead className="w-[140px] font-semibold">Phone</TableHead>
              <TableHead className="min-w-[200px] font-semibold">Address</TableHead>
              <TableHead className="w-[130px] text-right font-semibold">Available Credit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <RefreshCw className="h-5 w-5 animate-spin text-primary" />
                    <span>Loading customers...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : paginatedCustomers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Building2 className="h-8 w-8 text-muted-foreground/50" />
                    <p className="font-medium">No customers found</p>
                    <p className="text-xs text-muted-foreground">Try adjusting your search terms or sync from Xero.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedCustomers.map((cust) => {
                const targetId = cust.customer_number || cust.id;
                const isInactive = (cust.status || "").toLowerCase() === "inactive";
                return (
                  <TableRow
                    key={cust.id || cust.customer_number}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => router.push(`/dashboard/crm/contacts/${targetId}`)}
                  >
                    <TableCell className="font-mono text-xs font-semibold text-primary">
                      {cust.customer_number || "-"}
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="truncate max-w-[280px]">{cust.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={isInactive ? "secondary" : "outline"}
                        className={isInactive ? "bg-muted text-muted-foreground" : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800 text-[11px]"}
                      >
                        {cust.status || "Active"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {cust.account_manager ? (
                        <div className="flex items-center gap-1.5">
                          <UserCheck className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span className="truncate">{cust.account_manager}</span>
                        </div>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {cust.email ? (
                        <a
                          href={`mailto:${cust.email}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-blue-600 hover:underline flex items-center gap-1 truncate max-w-[200px]"
                        >
                          <Mail className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{cust.email}</span>
                        </a>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {cust.phone ? (
                        <a
                          href={`tel:${cust.phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="hover:underline flex items-center gap-1 text-muted-foreground hover:text-foreground"
                        >
                          <Phone className="h-3.5 w-3.5 shrink-0" />
                          <span>{cust.phone}</span>
                        </a>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      <span className="line-clamp-1 max-w-[260px]" title={cust.address}>
                        {cust.address || "-"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm font-medium">
                      {cust.available_credit !== undefined && cust.available_credit !== null ? (
                        <span className={Number(cust.available_credit) < 0 ? "text-red-600" : "text-emerald-600"}>
                          ${Number(cust.available_credit).toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground pt-1">
        <div>
          Showing {total === 0 ? 0 : (page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total} customer contacts
        </div>
        {totalPages > 1 && (
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
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="h-8 px-3 text-xs"
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
