"use client";

import MarketingLeadsTable from "@/components/crm/MarketingLeadsTable";
import { RouteGuard } from "@/components/auth/RouteGuard";
import { ShieldAlert } from "lucide-react";

function SpamPage() {
  return (
    <div className="space-y-6 overflow-x-hidden w-full max-w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Spam Leads</h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
              <ShieldAlert className="w-3.5 h-3.5" />
              Isolated
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Review spam inquiries, junk submissions, and disqualified leads separated from your active sales pipeline.
          </p>
        </div>
      </div>

      <MarketingLeadsTable isSpamView={true} />
    </div>
  );
}

export default function Page() {
  return (
    <RouteGuard module="crm">
      <SpamPage />
    </RouteGuard>
  );
}

