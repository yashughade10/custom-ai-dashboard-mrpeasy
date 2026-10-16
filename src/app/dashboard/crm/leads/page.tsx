"use client";

import { useState } from "react";
import MarketingLeadsTable from "@/components/crm/MarketingLeadsTable";
import ImportLeadsDialog from "@/components/crm/ImportLeadsDialog";
import { RouteGuard } from "@/components/auth/RouteGuard";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

function LeadsPage() {
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  return (
    <div className="space-y-6 overflow-x-hidden w-full max-w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Leads</h1>
          <p className="text-sm text-muted-foreground">
            Manage your incoming leads, marketing prospects, and inbound opportunities.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            onClick={() => setImportDialogOpen(true)}
            className="gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm h-9 px-4 text-xs sm:text-sm cursor-pointer"
          >
            <Upload className="h-4 w-4" />
            Import Leads
          </Button>
        </div>
      </div>

      <MarketingLeadsTable />

      <ImportLeadsDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onSuccess={() => {
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

