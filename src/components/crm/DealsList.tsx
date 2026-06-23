"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchDeals, fetchDealsPipeline } from "@/services/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { LayoutGrid, List } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function DealsList() {
  const [view, setView] = useState<"table" | "pipeline">("table");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [stage, setStage] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["crm-deals", { page, search, stage }],
    queryFn: () => fetchDeals({ page, search, stage }),
    placeholderData: (previousData) => previousData,
  });

  const { data: pipelineData } = useQuery({ 
    queryKey: ["crm-pipeline-stages"], 
    queryFn: fetchDealsPipeline 
  });
  
  const deals = data?.data || [];
  const pagination = data?.pagination || { total: 0, page: 1, limit: 50, totalPages: 1 };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="flex flex-col sm:flex-row gap-3">
          <Input 
            placeholder="Search deal name..." 
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
            {pipelineData?.map((p: any) => (
              <option key={p.dealstage} value={p.dealstage}>{p.dealstage}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center rounded-md border bg-muted p-1">
          <Button 
            variant={view === "table" ? "secondary" : "ghost"} 
            size="sm" 
            className="px-3"
            onClick={() => setView("table")}
          >
            <List className="w-4 h-4 mr-2" />
            Table
          </Button>
          <Button 
            variant={view === "pipeline" ? "secondary" : "ghost"} 
            size="sm"
            className="px-3"
            onClick={() => setView("pipeline")}
          >
            <LayoutGrid className="w-4 h-4 mr-2" />
            Pipeline
          </Button>
        </div>
      </div>

      {view === "table" ? (
        <>
          <div className="rounded-md border bg-card">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Deal Name</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Close Date</TableHead>
                  <TableHead>Owner</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">Loading deals...</TableCell>
                  </TableRow>
                ) : deals.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">No deals found.</TableCell>
                  </TableRow>
                ) : (
                  deals.map((deal: any) => (
                    <TableRow key={deal.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{deal.dealname}</TableCell>
                      <TableCell><Badge variant="outline">{deal.dealstage}</Badge></TableCell>
                      <TableCell className="font-semibold">${Number(deal.amount).toLocaleString()}</TableCell>
                      <TableCell>{deal.closedate ? new Date(deal.closedate).toLocaleDateString() : "-"}</TableCell>
                      <TableCell>{deal.owner_name || "-"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} deals
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
        </>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4 pt-2">
          {pipelineData?.map((stageData: any) => (
            <div key={stageData.dealstage} className="flex-shrink-0 w-80 bg-muted/30 rounded-lg p-3">
              <div className="flex items-center justify-between mb-4 px-1">
                <h3 className="font-semibold">{stageData.dealstage}</h3>
                <span className="text-xs font-medium text-muted-foreground">
                  ${Number(stageData.total_value).toLocaleString()}
                </span>
              </div>
              
              <div className="space-y-3">
                {/* This is a naive client-side filter. In a real app we'd fetch deals per column or fetch all deals. */}
                {deals
                  .filter((d: any) => d.dealstage === stageData.dealstage)
                  .map((deal: any) => (
                    <Card key={deal.id} className="cursor-pointer hover:border-primary/50 transition-colors">
                      <CardContent className="p-3">
                        <h4 className="font-medium text-sm mb-2">{deal.dealname}</h4>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className="font-semibold text-foreground">${Number(deal.amount).toLocaleString()}</span>
                          <span>{deal.owner_name || "Unassigned"}</span>
                        </div>
                      </CardContent>
                    </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
