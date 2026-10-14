"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchOpportunity, updateOpportunity, fetchOwners } from "@/services/api";
import { RouteGuard } from "@/components/auth/RouteGuard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import GraduateCustomerDialog from "@/components/crm/GraduateCustomerDialog";
import OpportunityLossDialog from "@/components/crm/OpportunityLossDialog";
import { 
  ArrowLeft, 
  Building2, 
  Mail, 
  Phone, 
  UserCircle2, 
  DollarSign, 
  CalendarDays, 
  TrendingUp, 
  CheckCircle2, 
  XCircle, 
  ShoppingBag, 
  ArrowRight, 
  Save, 
  RefreshCw,
  Award,
  ExternalLink,
  ChevronRight
} from "lucide-react";

const STAGES = ["prospecting", "qualification", "proposal", "negotiation", "closed_won", "closed_lost"] as const;

const stageColors: Record<string, string> = {
  prospecting: "bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800/40 dark:text-slate-300",
  qualification: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400",
  proposal: "bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400",
  negotiation: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400",
  closed_won: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400",
  closed_lost: "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400",
};

const stageProbabilities: Record<string, number> = {
  prospecting: 10,
  qualification: 25,
  proposal: 50,
  negotiation: 80,
  closed_won: 100,
  closed_lost: 0,
};

function OpportunityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const oppId = params.id as string;

  const [graduateOpen, setGraduateOpen] = useState(false);
  const [lossOpen, setLossOpen] = useState(false);

  const { data: opp, isLoading, error } = useQuery({
    queryKey: ["crm-opportunity", oppId],
    queryFn: () => fetchOpportunity(oppId),
    enabled: !!oppId,
  });

  const { data: owners } = useQuery({
    queryKey: ["crm-owners"],
    queryFn: fetchOwners,
  });

  const [formData, setFormData] = useState({
    name: "",
    expected_value: "",
    stage: "prospecting",
    probability: 10,
    expected_close_date: "",
    assigned_to: "",
    win_reason: "",
    loss_reason: "",
  });

  useEffect(() => {
    if (opp) {
      setFormData({
        name: opp.name || "",
        expected_value: opp.expected_value ? opp.expected_value.toString() : "",
        stage: opp.stage || "prospecting",
        probability: opp.probability !== undefined ? Number(opp.probability) : 10,
        expected_close_date: opp.expected_close_date 
          ? new Date(opp.expected_close_date).toISOString().split("T")[0] 
          : "",
        assigned_to: opp.assigned_to ? opp.assigned_to.toString() : "",
        win_reason: opp.win_reason || "",
        loss_reason: opp.loss_reason || "",
      });
    }
  }, [opp]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => updateOpportunity(oppId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-opportunity", oppId] });
      queryClient.invalidateQueries({ queryKey: ["crm-opportunities"] });
      toast.success("Opportunity saved successfully");
    },
    onError: (err: any) => {
      toast.error("Failed to save opportunity: " + (err.message || "Unknown error"));
    }
  });

  const handleStageChange = (newStage: string) => {
    if (newStage === "closed_won") {
      setGraduateOpen(true);
      return;
    }
    if (newStage === "closed_lost") {
      setLossOpen(true);
      return;
    }
    const defaultProb = stageProbabilities[newStage] ?? formData.probability;
    setFormData({
      ...formData,
      stage: newStage,
      probability: defaultProb
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      ...formData,
      expected_value: parseFloat(formData.expected_value) || 0,
      probability: Number(formData.probability) || 0,
      assigned_to: formData.assigned_to ? parseInt(formData.assigned_to) : null,
      expected_close_date: formData.expected_close_date || null,
    });
  };

  const handleCreateCustomerOrder = () => {
    if (!opp) return;
    const params = new URLSearchParams();
    if (opp.name) params.set("title", opp.name);
    if (opp.expected_value) params.set("amount", opp.expected_value.toString());
    if (opp.company_name) params.set("customer", opp.company_name);
    router.push(`/dashboard/mrp/crm/customer-orders/new?${params.toString()}`);
  };

  const isWon = formData.stage === "closed_won";
  const isLost = formData.stage === "closed_lost";

  const formatCurrency = (val: number | string) => {
    const num = typeof val === "string" ? parseFloat(val) : val;
    if (!num || isNaN(num)) return "$0";
    return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 }).format(num);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <RefreshCw className="h-6 w-6 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground">Loading opportunity details...</span>
      </div>
    );
  }

  if (error || !opp) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-red-500 font-medium">Opportunity not found or error loading record.</p>
        <Button variant="outline" onClick={() => router.push("/dashboard/crm/opportunities")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Pipeline
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Navigation & Action Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard/crm/opportunities")}
            className="h-8 px-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Opportunities
          </Button>
          <Separator orientation="vertical" className="h-4" />
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold tracking-tight text-foreground">{formData.name || opp.name}</h1>
              <Badge variant="outline" className={`capitalize font-semibold text-xs ${stageColors[formData.stage] || ""}`}>
                {formData.stage.replace("_", " ")}
              </Badge>
              <span className="text-sm font-bold text-primary">
                {formatCurrency(formData.expected_value || 0)}
              </span>
            </div>
            {opp.company_name && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
                <Building2 className="h-3 w-3 text-muted-foreground" />
                {opp.company_name}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap self-end sm:self-auto">
          {!isWon && (
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 h-8 text-xs font-medium shadow-sm"
              onClick={() => setGraduateOpen(true)}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Mark Closed-Won & Graduate
            </Button>
          )}

          {!isLost && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs text-rose-600 hover:bg-rose-50 border-rose-200"
              onClick={() => setLossOpen(true)}
            >
              <XCircle className="h-3.5 w-3.5 mr-1" />
              Mark Closed-Lost
            </Button>
          )}

          <Button
            size="sm"
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="h-8 gap-1.5 text-xs font-medium"
          >
            <Save className="h-3.5 w-3.5" />
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Visual Pipeline Progression Bar */}
      <Card className="p-4 bg-muted/20">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-muted-foreground uppercase tracking-wider">Pipeline Stage Progression</span>
            <span className="font-bold text-primary">{formData.probability}% Probability</span>
          </div>

          <div className="flex items-center gap-2 pt-1">
            {["prospecting", "qualification", "proposal", "negotiation", "closed_won"].map((st, idx) => {
              const currentIdx = ["prospecting", "qualification", "proposal", "negotiation", "closed_won"].indexOf(formData.stage);
              const isActive = idx <= currentIdx;
              const isCurrent = st === formData.stage;

              return (
                <button
                  type="button"
                  key={st}
                  onClick={() => handleStageChange(st)}
                  className={`flex-1 flex flex-col items-center gap-1.5 py-1 px-2 rounded-lg border text-xs font-medium transition-all ${
                    isCurrent 
                      ? "border-primary bg-primary/10 text-primary font-bold shadow-sm" 
                      : isActive 
                      ? "border-primary/40 bg-card text-foreground" 
                      : "border-border bg-card/40 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <div className={`h-1.5 w-full rounded-full ${isActive ? "bg-primary" : "bg-muted"}`} />
                  <span className="capitalize text-[11px] truncate max-w-full">
                    {st.replace("_", " ")}
                  </span>
                </button>
              );
            })}
          </div>

          {isLost && (
            <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/20 border border-rose-200 text-xs text-rose-700 dark:text-rose-300 flex items-center justify-between mt-2">
              <span className="font-medium flex items-center gap-1.5">
                <XCircle className="h-4 w-4 text-rose-600" />
                This deal was closed as Lost. Reason: <strong>{formData.loss_reason || "Not specified"}</strong>
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-[11px] text-rose-700 hover:text-rose-800"
                onClick={() => setLossOpen(true)}
              >
                Edit Reason
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Main Content Form */}
      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Deal Details (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-primary" />
                Deal Information & Terms
              </CardTitle>
              <CardDescription className="text-xs">
                Revenue expectations, deal size, and target closing timeframe.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-1.5">
                <Label htmlFor="opp-name" className="text-xs font-semibold">Opportunity Name <span className="text-red-500">*</span></Label>
                <Input
                  id="opp-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="h-9 text-xs"
                  placeholder="e.g. Acme Concrete - 1000kg Vacuum Lifter System"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <Label htmlFor="opp-val" className="text-xs font-semibold">Expected Revenue ($ AUD)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="opp-val"
                      type="number"
                      value={formData.expected_value}
                      onChange={(e) => setFormData({ ...formData, expected_value: e.target.value })}
                      className="pl-9 h-9 text-xs"
                      placeholder="35000"
                    />
                  </div>
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="opp-prob" className="text-xs font-semibold">Probability / Conversion Chance (%)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="opp-prob"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.probability}
                      onChange={(e) => setFormData({ ...formData, probability: Number(e.target.value) })}
                      className="h-9 text-xs w-24"
                    />
                    <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          formData.probability >= 70 ? "bg-emerald-500" : formData.probability >= 40 ? "bg-amber-500" : "bg-rose-400"
                        }`}
                        style={{ width: `${Math.min(100, formData.probability)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <Label htmlFor="opp-date" className="text-xs font-semibold">Target Close Date</Label>
                  <div className="relative">
                    <CalendarDays className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="opp-date"
                      type="date"
                      value={formData.expected_close_date}
                      onChange={(e) => setFormData({ ...formData, expected_close_date: e.target.value })}
                      className="pl-9 h-9 text-xs"
                    />
                  </div>
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="opp-owner" className="text-xs font-semibold">Assigned Sales Rep</Label>
                  <select
                    id="opp-owner"
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    value={formData.assigned_to}
                    onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                  >
                    <option value="">Unassigned</option>
                    {owners?.map((o: any) => (
                      <option key={o.id} value={o.id.toString()}>
                        {o.firstname} {o.lastname}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Win / Loss Reason Card */}
          {(isWon || isLost) && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  {isWon ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <XCircle className="h-4 w-4 text-rose-600" />}
                  {isWon ? "Deal Won Outcome Notes" : "Loss Analysis & Findings"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {isWon && (
                  <div className="grid gap-1.5">
                    <Label htmlFor="win-reason" className="text-xs font-semibold">Win Details & Contract Notes</Label>
                    <textarea
                      id="win-reason"
                      rows={3}
                      value={formData.win_reason}
                      onChange={(e) => setFormData({ ...formData, win_reason: e.target.value })}
                      placeholder="e.g. Client approved custom vacuum attachment specs. Agreed on 50% deposit."
                      className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                    />
                  </div>
                )}
                {isLost && (
                  <div className="grid gap-1.5">
                    <Label htmlFor="loss-reason-field" className="text-xs font-semibold">Loss Reason Details</Label>
                    <textarea
                      id="loss-reason-field"
                      rows={3}
                      value={formData.loss_reason}
                      onChange={(e) => setFormData({ ...formData, loss_reason: e.target.value })}
                      placeholder="Why did this opportunity fail to convert?"
                      className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: MRPeasy Customer Graduation & Lead Link */}
        <div className="space-y-6">
          {/* MRPeasy Manufacturing Handoff Widget */}
          <Card className={isWon ? "border-emerald-300 bg-emerald-50/40 dark:bg-emerald-950/20" : "border-primary/20 bg-muted/10"}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Award className={`h-4 w-4 ${isWon ? "text-emerald-600" : "text-primary"}`} />
                MRPeasy ERP Graduation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              {isWon ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span className="font-bold text-emerald-900 dark:text-emerald-200">
                      Customer Account Ready in ERP
                    </span>
                  </div>
                  <p className="text-emerald-700 dark:text-emerald-300">
                    Deal is won. You can now immediately launch a manufacturing customer order in MRPeasy.
                  </p>
                  <Button
                    type="button"
                    onClick={handleCreateCustomerOrder}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 gap-1.5 font-medium shadow-sm"
                  >
                    <ShoppingBag className="h-4 w-4" />
                    Create MRPeasy Customer Order
                    <ArrowRight className="h-3.5 w-3.5 ml-auto" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-muted-foreground">
                    Closing this deal as <strong>Won</strong> will automatically register the customer into the MRPeasy database.
                  </p>
                  <Button
                    type="button"
                    onClick={() => setGraduateOpen(true)}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 gap-1.5 font-medium shadow-sm"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Graduate to MRPeasy Customer
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Associated Contact & Lead Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <UserCircle2 className="h-4 w-4 text-primary" />
                Associated Inbound Contact
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              {opp.contact_id ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground text-sm">
                      {opp.contact_firstname ? `${opp.contact_firstname} ${opp.contact_lastname || ""}`.trim() : "Contact"}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 text-[11px] text-blue-600 hover:text-blue-700 px-1.5"
                      onClick={() => router.push(`/dashboard/crm/leads/${opp.contact_id}`)}
                    >
                      View Profile <ExternalLink className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                  {opp.company_name && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Building2 className="h-3.5 w-3.5 text-muted-foreground/70" />
                      <span>{opp.company_name}</span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">No specific contact linked to this opportunity.</p>
              )}
            </CardContent>
          </Card>

          {/* Meta Details */}
          <Card>
            <CardContent className="pt-5 space-y-3 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Opportunity ID:</span>
                <span className="font-mono font-medium text-foreground">{opp.id}</span>
              </div>
              <div className="flex justify-between">
                <span>Created Date:</span>
                <span className="font-medium text-foreground">
                  {opp.created_at ? new Date(opp.created_at).toLocaleDateString() : "-"}
                </span>
              </div>
              {opp.actual_close_date && (
                <div className="flex justify-between">
                  <span>Actual Close Date:</span>
                  <span className="font-medium text-foreground">
                    {new Date(opp.actual_close_date).toLocaleDateString()}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </form>

      {/* Graduate to Customer Modal */}
      <GraduateCustomerDialog
        opportunity={opp}
        open={graduateOpen}
        onOpenChange={setGraduateOpen}
      />

      {/* Opportunity Loss Modal */}
      <OpportunityLossDialog
        opportunity={opp}
        open={lossOpen}
        onOpenChange={setLossOpen}
      />
    </div>
  );
}

export default function OpportunityDetailPageGuarded() {
  return (
    <RouteGuard module="crm">
      <OpportunityDetailPage />
    </RouteGuard>
  );
}
