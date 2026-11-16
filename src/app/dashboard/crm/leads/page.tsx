"use client";

import { useState } from "react";
import MarketingLeadsTable from "@/components/crm/MarketingLeadsTable";
import ImportLeadsDialog from "@/components/crm/ImportLeadsDialog";
import CreateLeadDialog from "@/components/crm/CreateLeadDialog";
import DailyLeadsSummaryDialog from "@/components/crm/DailyLeadsSummaryDialog";
import { RouteGuard } from "@/components/auth/RouteGuard";
import { Button } from "@/components/ui/button";
import { Upload, Sparkles, UserPlus } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchDailyLeadsSummary } from "@/services/api";

function LeadsPage() {
  const [summaryDialogOpen, setSummaryDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [createLeadOpen, setCreateLeadOpen] = useState(false);
  const queryClient = useQueryClient();

  // Pre-fetch today's count for CTA badge
  const { data: summaryData } = useQuery({
    queryKey: ["crm-daily-summary", "today"],
    queryFn: () => fetchDailyLeadsSummary({ timeframe: "today" }),
    staleTime: 60 * 1000
  });

  const pendingActionCount = summaryData?.data?.metrics?.pendingAction ?? 0;
  const totalToday = summaryData?.data?.metrics?.total ?? 0;

  return (
    <div className="space-y-6 overflow-x-hidden w-full max-w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Leads</h1>
          <p className="text-sm text-muted-foreground">
            Manage your incoming leads, marketing prospects, and inbound opportunities.
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap w-full sm:w-auto">
          {/* Add Lead Manually CTA */}
          <Button
            onClick={() => setCreateLeadOpen(true)}
            className="flex-1 sm:flex-initial gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm h-9 px-3.5 text-xs sm:text-sm cursor-pointer justify-center"
          >
            <UserPlus className="h-4 w-4" />
            <span>Add Lead</span>
          </Button>

          {/* Call To Action: Today's Leads Summary */}
          <Button
            onClick={() => setSummaryDialogOpen(true)}
            className="flex-1 sm:flex-initial gap-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-700 hover:to-purple-800 text-white font-medium shadow-md shadow-indigo-500/20 h-9 px-3.5 text-xs sm:text-sm cursor-pointer transition-all hover:scale-[1.02] justify-center"
          >
            <Sparkles className="h-4 w-4 text-amber-300 animate-pulse" />
            <span>Today&apos;s Summary</span>
            {pendingActionCount > 0 ? (
              <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-400 text-slate-900 ml-0.5">
                {pendingActionCount}
              </span>
            ) : totalToday > 0 ? (
              <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-white/20 text-white ml-0.5">
                {totalToday}
              </span>
            ) : null}
          </Button>

          <Button
            onClick={() => setImportDialogOpen(true)}
            variant="outline"
            className="w-full sm:w-auto gap-2 border-border/80 font-medium shadow-sm h-9 px-4 text-xs sm:text-sm cursor-pointer justify-center"
          >
            <Upload className="h-4 w-4 text-muted-foreground" />
            Import Leads
          </Button>
        </div>
      </div>

      <MarketingLeadsTable onOpenSummary={() => setSummaryDialogOpen(true)} />

      {/* Manual Add Lead Dialog */}
      <CreateLeadDialog
        open={createLeadOpen}
        onOpenChange={setCreateLeadOpen}
      />

      {/* Daily Leads Summary & Action Center Dialog */}
      <DailyLeadsSummaryDialog
        open={summaryDialogOpen}
        onOpenChange={setSummaryDialogOpen}
      />

      <ImportLeadsDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["crm-daily-summary"] });
          queryClient.invalidateQueries({ queryKey: ["crm-contacts-leads"] });
          queryClient.invalidateQueries({ queryKey: ["crm-contacts"] });
          queryClient.invalidateQueries({ queryKey: ["crm-contact-countries"] });
        }}
      />
    </div>
  );
}

export default function LeadsPageGuarded() {
  return (
    <RouteGuard module="crm">
      <LeadsPage />
    </RouteGuard>
  );
}
