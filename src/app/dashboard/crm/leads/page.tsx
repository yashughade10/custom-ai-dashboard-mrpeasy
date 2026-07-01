"use client";

import { useState } from "react";
import LeadsTable from "@/components/crm/LeadsTable";
import LeadKanbanBoard from "@/components/crm/LeadKanbanBoard";
import { Button } from "@/components/ui/button";
import { List, Kanban } from "lucide-react";

export default function LeadsPage() {
  const [view, setView] = useState<"table" | "kanban">("table");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Leads</h1>
          <p className="text-sm text-muted-foreground">
            Manage your incoming leads, score them, and convert them to contacts.
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
              variant={view === "kanban" ? "secondary" : "ghost"}
              size="sm"
              className="h-8 px-2"
              onClick={() => setView("kanban")}
            >
              <Kanban className="h-4 w-4 mr-1" />
              Board
            </Button>
          </div>
          <Button>Add Lead</Button>
        </div>
      </div>

      {view === "table" ? <LeadsTable /> : <LeadKanbanBoard />}
    </div>
  );
}
