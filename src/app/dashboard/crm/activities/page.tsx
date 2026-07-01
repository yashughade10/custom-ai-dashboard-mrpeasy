"use client";

import ActivitiesTimeline from "@/components/crm/ActivitiesTimeline";
import { Button } from "@/components/ui/button";

export default function ActivitiesPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Activities</h1>
          <p className="text-sm text-muted-foreground">
            View your upcoming tasks, meetings, calls, and follow-ups.
          </p>
        </div>
        
        <Button>Log Activity</Button>
      </div>

      <div className="bg-card border rounded-lg p-6">
        <ActivitiesTimeline />
      </div>
    </div>
  );
}
