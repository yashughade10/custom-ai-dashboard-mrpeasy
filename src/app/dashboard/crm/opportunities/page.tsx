"use client";

import { useState } from "react";
import OpportunitiesTable from "@/components/crm/OpportunitiesTable";
import OpportunityPipeline from "@/components/crm/OpportunityPipeline";
import { Button } from "@/components/ui/button";
import { List, LayoutDashboard } from "lucide-react";

export default function OpportunitiesPage() {
  const [view, setView] = useState<"table" | "pipeline">("pipeline");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Opportunities</h1>
          <p className="text-sm text-muted-foreground">
            Track deals through your sales pipeline and manage win rates.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
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
              variant={view === "pipeline" ? "secondary" : "ghost"}
              size="sm"
              className="h-8 px-2"
              onClick={() => setView("pipeline")}
            >
              <LayoutDashboard className="h-4 w-4 mr-1" />
              Pipeline
            </Button>
          </div>
          <Button>Add Opportunity</Button>
        </div>
      </div>

      {view === "table" ? <OpportunitiesTable /> : <OpportunityPipeline />}
    </div>
  );
}
