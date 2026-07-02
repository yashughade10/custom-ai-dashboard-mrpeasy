"use client";

import { useRef } from "react";
import ActivitiesTimeline from "@/components/crm/ActivitiesTimeline";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function ActivitiesPage() {
  const openCreateRef = useRef<(() => void) | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Activities</h1>
          <p className="text-sm text-muted-foreground">
            View your upcoming tasks, meetings, calls, and follow-ups.
          </p>
        </div>
        
        <Button size="sm" className="gap-1.5" onClick={() => openCreateRef.current?.()}>
          <Plus className="h-4 w-4" />
          Log Activity
        </Button>
      </div>

      <div className="bg-card border rounded-lg p-6">
        <ActivitiesTimeline onOpenCreate={(fn) => { openCreateRef.current = fn; }} />
      </div>
    </div>
  );
}
