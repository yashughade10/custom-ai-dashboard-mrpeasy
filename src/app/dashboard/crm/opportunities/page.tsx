"use client";

import { useState, useRef } from "react";
import OpportunitiesTable from "@/components/crm/OpportunitiesTable";
import OpportunityPipeline from "@/components/crm/OpportunityPipeline";
import { Button } from "@/components/ui/button";
import { List, Kanban, Plus } from "lucide-react";

export default function OpportunitiesPage() {
  const [view, setView] = useState<"table" | "kanban">("table");
  const openCreateRef = useRef<(() => void) | null>(null);

  return (
    <div className="space-y-6 overflow-x-hidden w-full max-w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Opportunities</h1>
          <p className="text-sm text-muted-foreground">
            Track your sales pipeline, manage deal stages, and monitor expected revenue.
          </p>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          <div className="bg-muted p-1 rounded-md flex items-center">
            <Button
              variant={view === "table" ? "secondary" : "ghost"}
              size="sm"
              className="h-8 px-2"
              onClick={() => setView("table")}
            >
              <List className="h-4 w-4 mr-1" />
              List
            </Button>
            <Button
              variant={view === "kanban" ? "secondary" : "ghost"}
              size="sm"
              className="h-8 px-2"
              onClick={() => setView("kanban")}
            >
              <Kanban className="h-4 w-4 mr-1" />
              Board
            </Button>
          </div>
          {view === "table" && (
            <Button size="sm" className="gap-1.5" onClick={() => openCreateRef.current?.()}>
              <Plus className="h-4 w-4" />
              Add Opportunity
            </Button>
          )}
        </div>
      </div>

      {view === "table" ? (
        <OpportunitiesTable onOpenCreate={(fn) => { openCreateRef.current = fn; }} />
      ) : (
        <OpportunityPipeline />
      )}
    </div>
  );
}
