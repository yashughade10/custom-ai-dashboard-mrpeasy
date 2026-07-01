import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useQuery } from "@tanstack/react-query";
import { fetchOpportunity } from "@/services/api";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { UserCircle, Building2, Target, DollarSign, CalendarDays, TrendingUp, CheckCircle2, XCircle } from "lucide-react";

const stageColors: Record<string, string> = {
  prospecting: "bg-slate-100 text-slate-700 dark:bg-slate-800/40 dark:text-slate-300",
  qualification: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  proposal: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
  negotiation: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  closed_won: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  closed_lost: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const stageOrder = ["prospecting", "qualification", "proposal", "negotiation", "closed_won"];

type OpportunityDetailSheetProps = {
  opportunityId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function OpportunityDetailSheet({ opportunityId, open, onOpenChange }: OpportunityDetailSheetProps) {
  const { data: opp, isLoading, error } = useQuery({
    queryKey: ["crm-opportunity", opportunityId],
    queryFn: () => fetchOpportunity(opportunityId as string),
    enabled: !!opportunityId,
  });

  const formatCurrency = (val: number | string) => {
    const num = typeof val === "string" ? parseFloat(val) : val;
    if (!num || isNaN(num)) return "$0";
    return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 }).format(num);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto p-0 flex flex-col">
        <SheetHeader className="px-6 pt-6 pb-2">
          <SheetTitle>Opportunity Details</SheetTitle>
          <SheetDescription>View opportunity pipeline information.</SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <div className="px-6 pb-6 mt-4 space-y-8 animate-in fade-in duration-300">
            <div className="space-y-2">
              <Skeleton className="h-7 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
            <div className="space-y-4 pt-4">
              <div className="flex justify-between"><Skeleton className="h-4 w-1/3" /><Skeleton className="h-6 w-1/4 rounded-full" /></div>
              <div className="flex justify-between"><Skeleton className="h-4 w-1/3" /><Skeleton className="h-4 w-1/4" /></div>
              <div className="flex justify-between"><Skeleton className="h-4 w-1/3" /><Skeleton className="h-4 w-1/4" /></div>
            </div>
          </div>
        ) : error ? (
          <div className="px-6 py-8 text-center text-red-500">
            <p className="font-medium">Failed to load opportunity details.</p>
            <p className="text-sm text-muted-foreground mt-1">Please try again later.</p>
          </div>
        ) : opp ? (
          <div className="px-6 pb-6 mt-4 space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
            {/* Header */}
            <div>
              <h3 className="text-xl font-semibold tracking-tight">{opp.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Created {opp.created_at ? new Date(opp.created_at).toLocaleDateString() : "-"}
              </p>
            </div>

            {/* Stage Progress */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Pipeline Progress</p>
              <div className="flex items-center gap-1">
                {stageOrder.map((stage, idx) => {
                  const currentIdx = stageOrder.indexOf(opp.stage);
                  const isActive = idx <= currentIdx;
                  const isCurrent = stage === opp.stage;
                  return (
                    <div key={stage} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className={`h-2 w-full rounded-full transition-all ${
                          opp.stage === "closed_lost"
                            ? "bg-red-200 dark:bg-red-900/30"
                            : isActive
                            ? "bg-primary"
                            : "bg-muted"
                        }`}
                      />
                      {isCurrent && (
                        <span className="text-[10px] font-medium capitalize text-primary">
                          {stage.replace("_", " ")}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
              {opp.stage === "closed_lost" && (
                <p className="text-xs text-red-500 font-medium mt-1">✕ Closed Lost</p>
              )}
            </div>

            {/* Info Card */}
            <div className="space-y-4 rounded-xl border bg-card/50 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Target className="h-4 w-4" />
                  <span className="text-sm font-medium">Stage</span>
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${stageColors[opp.stage] || ""}`}>
                  {opp.stage?.replace("_", " ")}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-sm font-medium">Probability</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        opp.probability >= 70 ? "bg-green-500" : opp.probability >= 40 ? "bg-amber-500" : "bg-red-400"
                      }`}
                      style={{ width: `${Math.min(100, opp.probability || 0)}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold">{opp.probability || 0}%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <DollarSign className="h-4 w-4" />
                  <span className="text-sm font-medium">Expected Value</span>
                </div>
                <span className="text-sm font-bold text-primary">{formatCurrency(opp.expected_value)}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <UserCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Contact</span>
                </div>
                <span className="text-sm font-medium">
                  {opp.contact_firstname ? `${opp.contact_firstname} ${opp.contact_lastname || ""}`.trim() : "None"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Building2 className="h-4 w-4" />
                  <span className="text-sm font-medium">Company</span>
                </div>
                <span className="text-sm font-medium">{opp.company_name || "None"}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <UserCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Assigned To</span>
                </div>
                <span className="text-sm font-medium">{opp.assigned_name || "Unassigned"}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CalendarDays className="h-4 w-4" />
                  <span className="text-sm font-medium">Expected Close</span>
                </div>
                <span className="text-sm font-medium">
                  {opp.expected_close_date ? new Date(opp.expected_close_date).toLocaleDateString() : "-"}
                </span>
              </div>
            </div>

            {/* Win / Loss Reason */}
            {opp.stage === "closed_won" && opp.win_reason && (
              <>
                <Separator />
                <div className="p-4 rounded-xl border border-green-200 bg-green-50/50 dark:bg-green-900/10 dark:border-green-800/30">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span className="text-sm font-semibold text-green-800 dark:text-green-400">Win Reason</span>
                  </div>
                  <p className="text-sm text-green-700 dark:text-green-300">{opp.win_reason}</p>
                </div>
              </>
            )}
            {opp.stage === "closed_lost" && opp.loss_reason && (
              <>
                <Separator />
                <div className="p-4 rounded-xl border border-red-200 bg-red-50/50 dark:bg-red-900/10 dark:border-red-800/30">
                  <div className="flex items-center gap-2 mb-2">
                    <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                    <span className="text-sm font-semibold text-red-800 dark:text-red-400">Loss Reason</span>
                  </div>
                  <p className="text-sm text-red-700 dark:text-red-300">{opp.loss_reason}</p>
                </div>
              </>
            )}
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
