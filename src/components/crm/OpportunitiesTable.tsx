"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchOpportunities } from "@/services/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function OpportunitiesTable() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [stage, setStage] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["crm-opportunities", { page, search, stage }],
    queryFn: () => fetchOpportunities({ page, search, stage }),
    placeholderData: (previousData) => previousData,
  });

  const opportunities = data?.data || [];
  const pagination = data?.pagination || { total: 0, page: 1, limit: 50, totalPages: 1 };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <Input 
          placeholder="Search opportunity name..." 
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="max-w-xs"
        />
        <select 
          className="flex h-9 w-full max-w-[200px] items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          value={stage}
          onChange={(e) => {
            setStage(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Stages</option>
          <option value="prospecting">Prospecting</option>
          <option value="qualification">Qualification</option>
          <option value="proposal">Proposal</option>
          <option value="negotiation">Negotiation</option>
          <option value="closed_won">Closed Won</option>
          <option value="closed_lost">Closed Lost</option>
        </select>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Opportunity Name</TableHead>
              <TableHead>Related Company</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Probability</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead>Close Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">Loading opportunities...</TableCell>
              </TableRow>
            ) : opportunities.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">No opportunities found.</TableCell>
              </TableRow>
            ) : (
              opportunities.map((opp: any) => (
                <TableRow 
                  key={opp.id} 
                  className="hover:bg-muted/50"
                >
                  <TableCell className="font-medium">{opp.name}</TableCell>
                  <TableCell>{opp.company_name || "-"}</TableCell>
                  <TableCell>
                    <Badge variant={
                      opp.stage === 'closed_won' ? 'default' : 
                      opp.stage === 'closed_lost' ? 'destructive' : 'outline'
                    }>
                      {opp.stage.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>${parseFloat(opp.expected_value).toLocaleString(undefined, {minimumFractionDigits: 2})}</TableCell>
                  <TableCell>{opp.probability}%</TableCell>
                  <TableCell>{opp.assigned_name || "-"}</TableCell>
                  <TableCell>{opp.expected_close_date ? new Date(opp.expected_close_date).toLocaleDateString() : "-"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} opportunities
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
    </div>
  );
}
