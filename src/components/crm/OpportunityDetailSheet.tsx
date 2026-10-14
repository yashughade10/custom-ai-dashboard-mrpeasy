"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchOpportunity, updateOpportunityStage } from "@/services/api";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import GraduateCustomerDialog from "./GraduateCustomerDialog";
import OpportunityLossDialog from "./OpportunityLossDialog";
import { 
  UserCircle, 
  Building2, 
  Target, 
  DollarSign, 
  CalendarDays, 
  TrendingUp, 
  CheckCircle2, 
  XCircle,
  ShoppingBag,
  ArrowRight,
  ChevronRight,
  Award
} from "lucide-react";

const stageColors: Record<string, string> = {
  prospecting: "bg-slate-100 text-slate-700 dark:bg-slate-800/40 dark:text-slate-300",
  qualification: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  proposal: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
  negotiation: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  closed_won: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  closed_lost: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const stageOrder = ["prospecting", "qualification", "proposal", "negotiation", "closed_won"];

type OpportunityDetailSheetProps = {
  opportunityId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function OpportunityDetailSheet({ opportunityId, open, onOpenChange }: OpportunityDetailSheetProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [graduateOpen, setGraduateOpen] = useState(false);
  const [lossOpen, setLossOpen] = useState(false);

  const { data: opp, isLoading, error } = useQuery({
    queryKey: ["crm-opportunity", opportunityId],
    queryFn: () => fetchOpportunity(opportunityId as string),
    enabled: !!opportunityId,
  });

  const stageMutation = useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: string }) => updateOpportunityStage(id, stage),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["crm-opportunity", opportunityId] });
      queryClient.invalidateQueries({ queryKey: ["crm-opportunities"] });
      toast.success(`Opportunity moved to ${variables.stage.replace("_", " ")}`);
    },
    onError: (err: any) => {
      toast.error("Failed to update stage: " + (err.message || "Unknown error"));
    }
  });

  const formatCurrency = (val: number | string) => {
    const num = typeof val === "string" ? parseFloat(val) : val;
    if (!num || isNaN(num)) return "$0";
    return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 }).format(num);
  };

  const handleStageSelect = (newStage: string) => {
    if (newStage === "closed_won") {
      setGraduateOpen(true);
    } else if (newStage === "closed_lost") {
      setLossOpen(true);
    } else {
      stageMutation.mutate({ id: opp.id.toString(), stage: newStage });
    }
  };

  const handleCreateCustomerOrder = () => {
    if (!opp) return;
    const params = new URLSearchParams();
    if (opp.name) params.set("title", opp.name);
    if (opp.expected_value) params.set("amount", opp.expected_value.toString());
    if (opp.company_name) params.set("customer", opp.company_name);
    
    onOpenChange(false);
    router.push(`/dashboard/mrp/crm/customer-orders/new?${params.toString()}`);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto p-0 flex flex-col">
          <SheetHeader className="px-6 pt-6 pb-2">
            <SheetTitle>Opportunity Details</SheetTitle>
            <SheetDescription>View pipeline lifecycle, stages, and MRPeasy manufacturing orders.</SheetDescription>
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
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-xl font-semibold tracking-tight">{opp.name}</h3>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Created {opp.created_at ? new Date(opp.created_at).toLocaleDateString() : "-"}
                </p>
              </div>

              {/* Quick Stage Controls */}
              <div className="flex items-center gap-2">
                {opp.stage !== "closed_won" && (
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 gap-1.5 flex-1"
                    disabled={stageMutation.isPending}
                    onClick={() => setGraduateOpen(true)}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Mark Closed-Won
                  </Button>
                )}
                {opp.stage !== "closed_lost" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-8 text-muted-foreground hover:text-red-600 border-red-200/50 hover:bg-red-50"
                    disabled={stageMutation.isPending}
                    onClick={() => setLossOpen(true)}
                  >
                    <XCircle className="h-3.5 w-3.5 mr-1" />
                    Mark Lost
                  </Button>
                )}
              </div>

              {/* Stage Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pipeline Progress</p>
                  <select
                    className="text-xs border rounded px-2 py-1 bg-background font-medium"
                    value={opp.stage}
                    onChange={(e) => handleStageSelect(e.target.value)}
                    disabled={stageMutation.isPending}
                  >
                    <option value="prospecting">Prospecting (10%)</option>
                    <option value="qualification">Qualification (25%)</option>
                    <option value="proposal">Proposal (50%)</option>
                    <option value="negotiation">Negotiation (80%)</option>
                    <option value="closed_won">Closed Won (100%)</option>
                    <option value="closed_lost">Closed Lost (0%)</option>
                  </select>
                </div>

                <div className="flex items-center gap-1 pt-1">
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
                          <span className="text-[10px] font-medium capitalize text-primary truncate max-w-[65px]">
                            {stage.replace("_", " ")}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
                {opp.stage === "closed_lost" && (
                  <div className="text-xs text-rose-600 font-medium mt-1 flex items-center gap-1">
                    <XCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>Closed Lost: {opp.loss_reason || "Deal did not convert"}</span>
                  </div>
                )}
              </div>

              {/* MRPeasy Manufacturing / Customer Order Handoff Card */}
              {opp.stage === "closed_won" ? (
                <div className="p-4 rounded-xl border border-emerald-300 bg-emerald-50/70 dark:bg-emerald-950/20 dark:border-emerald-800 space-y-3">
                  <div className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <div>
                      <h4 className="font-semibold text-sm text-emerald-900 dark:text-emerald-200">Deal Closed & Won!</h4>
                      <p className="text-xs text-emerald-700 dark:text-emerald-300">Customer account created. Ready for manufacturing order.</p>
                    </div>
                  </div>
                  <Button
                    onClick={handleCreateCustomerOrder}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs h-9 gap-2 shadow-sm"
                  >
                    <ShoppingBag className="h-4 w-4" />
                    Create MRPeasy Customer Order
                    <ArrowRight className="h-3.5 w-3.5 ml-auto" />
                  </Button>
                </div>
              ) : (
                <div className="p-3 rounded-lg border bg-muted/40 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">When won, automatically graduates into MRPeasy ERP.</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-blue-600 hover:text-blue-700 font-medium px-2"
                    onClick={() => setGraduateOpen(true)}
                  >
                    Win & Graduate <ChevronRight className="h-3 w-3 ml-0.5" />
                  </Button>
                </div>
              )}

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
                      <span className="text-sm font-semibold text-green-800 dark:text-green-400">Win Notes</span>
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

      {/* Graduate to MRPeasy customer dialog */}
      <GraduateCustomerDialog
        opportunity={opp}
        open={graduateOpen}
        onOpenChange={setGraduateOpen}
      />

      {/* Mark opportunity as lost dialog */}
      <OpportunityLossDialog
        opportunity={opp}
        open={lossOpen}
        onOpenChange={setLossOpen}
      />
    </>
  );
}
