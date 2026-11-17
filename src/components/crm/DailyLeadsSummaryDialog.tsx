"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchDailyLeadsSummary, updateContact, triggerDailyCrmSummaryEmail } from "@/services/api";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import ConvertLeadDialog from "./ConvertLeadDialog";
import DisqualifyLeadDialog from "./DisqualifyLeadDialog";
import {
  Sparkles,
  TrendingUp,
  ShieldCheck,
  Ban,
  Clock,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  Building2,
  Mail,
  Phone,
  PhoneCall,
  PhoneMissed,
  PhoneOff,
  Tag,
  CheckCircle2,
  HelpCircle,
  ExternalLink,
  Flame,
  Globe,
  Layers,
  Calendar,
  UserCheck,
  Copy,
  Check,
  FileText
} from "lucide-react";
import { cn } from "@/lib/utils";
import LogCallDialog from "./LogCallDialog";

interface DailyLeadsSummaryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function DailyLeadsSummaryDialog({
  open,
  onOpenChange
}: DailyLeadsSummaryDialogProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [timeframe, setTimeframe] = useState<"today" | "yesterday" | "7d">("today");
  const [activeTab, setActiveTab] = useState<"pending" | "all" | "calls" | "summaryText">("pending");
  const [copied, setCopied] = useState(false);

  // Modals for actions
  const [selectedContactForConvert, setSelectedContactForConvert] = useState<any | null>(null);
  const [convertOpen, setConvertOpen] = useState(false);
  const [selectedContactForDisqualify, setSelectedContactForDisqualify] = useState<any | null>(null);
  const [disqualifyOpen, setDisqualifyOpen] = useState(false);
  const [selectedContactForCall, setSelectedContactForCall] = useState<any | null>(null);
  const [callOpen, setCallOpen] = useState(false);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["crm-daily-summary", timeframe],
    queryFn: () => fetchDailyLeadsSummary({ timeframe }),
    enabled: open,
    staleTime: 60 * 1000
  });

  const summary = data?.data || {};
  const metrics = summary.metrics || {
    total: 0,
    pendingAction: 0,
    qualified: 0,
    converted: 0,
    disqualified: 0,
    bySource: {},
    calls: { total: 0, byOutcome: {} }
  };
  const aiSummary = summary.aiSummary;
  const pendingLeads = summary.pendingLeads || [];
  const allLeads = summary.allLeads || [];
  const callLogs = summary.callLogs || metrics.calls?.recentCalls || [];
  const callsMetric = metrics.calls || { total: 0, byOutcome: {} };
  const period = summary.period || { label: "Today" };
  const deals = summary.deals || metrics.deals?.items || [];

  // Derive text summary from backend or build clean formatted fallback
  const textSummary: string = summary.textSummary || aiSummary?.textSummary || (() => {
    const lines: string[] = [];
    lines.push("================================================================================");
    lines.push("VAC LIFT AUSTRALIA — DAILY CRM & SALES OPERATIONS ACTIONS SUMMARY");
    lines.push(`Period: ${period.label || timeframe} | Generated: ${new Date().toLocaleTimeString('en-AU', { timeZone: 'Australia/Sydney', hour: '2-digit', minute: '2-digit' })} AEST`);
    lines.push("================================================================================");
    lines.push("");
    lines.push("1. EXECUTIVE HIGHLIGHTS & KEY METRICS");
    lines.push("--------------------------------------------------------------------------------");
    lines.push(`• Total Inbound Leads: ${metrics.total}`);
    lines.push(`• Leads Sales Qualified (SQL): ${metrics.qualified} (Acknowledgment email sent, CC: Sales@vaclifts.com)`);
    lines.push(`• Actions Pending Review: ${metrics.pendingAction}`);
    lines.push(`• Deals in Pipeline / Converted: ${metrics.converted}`);
    lines.push(`• Spam / Disqualified Leads: ${metrics.disqualified}`);
    lines.push(`• Sales Phone Outreach: ${callsMetric.total || callLogs.length} call(s) logged`);
    lines.push("");
    lines.push("2. PHONE CALLS & SALES OUTREACH ACTIONS");
    lines.push("--------------------------------------------------------------------------------");
    if ((callsMetric.total || callLogs.length) === 0) {
      lines.push("No phone calls logged for this period yet.");
    } else {
      lines.push(`Total Calls: ${callsMetric.total || callLogs.length} [Picked: ${callsMetric.byOutcome?.picked || 0} | Rang Unanswered: ${callsMetric.byOutcome?.ringing_unanswered || 0} | Not Picked: ${callsMetric.byOutcome?.not_picked || 0} | Invalid Number: ${callsMetric.byOutcome?.not_valid_number || 0}]`);
      lines.push("");
      callLogs.forEach((c: any, idx: number) => {
        lines.push(`  ${idx + 1}. ${c.contact?.name || c.contact_name || 'Lead'} - Outcome: ${c.outcome || 'Call'}${c.duration_minutes ? ` (${c.duration_minutes}m)` : ''}`);
        lines.push(`     Discussion Notes: ${c.summary || c.notes || c.description || 'No notes entered'}`);
      });
    }
    lines.push("");
    lines.push("3. LEAD STATUS & QUALIFICATION ACTIONS");
    lines.push("--------------------------------------------------------------------------------");
    lines.push(`• Qualified Leads (SQL): ${metrics.qualified}`);
    lines.push(`• Pending Review / Backlog: ${pendingLeads.length}`);
    lines.push(`• Spam / Disqualified: ${metrics.disqualified}`);
    lines.push("");
    if (deals && deals.length > 0) {
      lines.push("4. OPPORTUNITIES & PIPELINE PROGRESS");
      lines.push("--------------------------------------------------------------------------------");
      deals.forEach((d: any) => {
        lines.push(`• ${d.dealname || 'Deal'} | Stage: ${d.dealstage || 'Pipeline'} | Value: ${d.amount ? `$${Number(d.amount).toLocaleString()} AUD` : 'N/A'}`);
      });
      lines.push("");
    }
    lines.push("5. RECOMMENDED NEXT ACTIONS & ACTION CHECKLIST");
    lines.push("--------------------------------------------------------------------------------");
    if ((callsMetric.byOutcome?.ringing_unanswered || 0) > 0 || (callsMetric.byOutcome?.not_picked || 0) > 0) {
      lines.push("[ ] Schedule retry calls for leads where calls went unanswered today.");
    }
    if ((callsMetric.byOutcome?.not_valid_number || 0) > 0) {
      lines.push("[ ] Send direct emails to leads with invalid phone numbers.");
    }
    if (metrics.pendingAction > 0) {
      lines.push(`[ ] Qualify and review the ${metrics.pendingAction} pending lead(s).`);
    }
    lines.push("[ ] Prepare tailored quotes / cut-sheets for all connected calls.");
    lines.push("[ ] Verify all newly qualified leads have acknowledgment email delivered (CC: Sales@vaclifts.com).");
    lines.push("================================================================================");
    return lines.join("\n");
  })();

  const handleCopySummary = async () => {
    if (!textSummary) {
      toast.error("No text summary available to copy.");
      return;
    }
    try {
      await navigator.clipboard.writeText(textSummary);
      setCopied(true);
      toast.success("Daily CRM actions text summary copied to clipboard!");
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      toast.error("Failed to copy summary to clipboard.");
    }
  };

  // Qualify lead mutation
  const qualifyMutation = useMutation({
    mutationFn: ({ id, leadName }: { id: string | number; leadName: string }) =>
      updateContact(String(id), {
        lifecycle_stage: "salesqualifiedlead",
        lead_status: "Qualified",
        change_reason: "Marked as Qualified (SQL) from Daily Leads Summary"
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["crm-daily-summary"] });
      queryClient.invalidateQueries({ queryKey: ["crm-contacts-leads"] });
      queryClient.invalidateQueries({ queryKey: ["crm-contacts"] });
      toast.success(`${variables.leadName} qualified! Automated acknowledgment email sent with sales CC.`);
    },
    onError: (err: any) => {
      toast.error("Failed to update lead: " + (err.message || "Unknown error"));
    }
  });

  const emailReportMutation = useMutation({
    mutationFn: () => triggerDailyCrmSummaryEmail(),
    onSuccess: (res: any) => {
      toast.success(res?.message || "Daily CRM summary email dispatched successfully to management and sales!");
    },
    onError: (err: any) => {
      toast.error("Failed to send CRM summary email: " + (err.message || "Unknown error"));
    }
  });

  const getSourceBadge = (src?: string) => {
    const s = (src || "").toLowerCase();
    switch (s) {
      case "pipeboss":
        return <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 text-[10px]">Pipeboss</Badge>;
      case "vaclift":
        return <Badge className="bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/30 text-[10px]">Vaclift</Badge>;
      case "blue_water":
        return <Badge className="bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/30 text-[10px]">Blue Water</Badge>;
      case "digital_marketing":
        return <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[10px]">Marketing</Badge>;
      default:
        return src ? <Badge variant="outline" className="text-[10px]">{src}</Badge> : null;
    }
  };

  const getLifecycleBadge = (stage?: string, status?: string) => {
    const s = (stage || "lead").toLowerCase();
    if (s === "customer") return <Badge className="bg-emerald-600 text-white text-[10px]">Customer</Badge>;
    if (s === "opportunity") return <Badge className="bg-amber-600 text-white text-[10px]">In Pipeline</Badge>;
    if (s === "salesqualifiedlead" || s === "marketingqualifiedlead" || status === "Qualified") {
      return <Badge className="bg-indigo-600 text-white text-[10px]">Qualified (SQL)</Badge>;
    }
    if (s === "other" || s === "lost" || s === "disqualified" || s === "spam" || status === "Disqualified" || status === "Spam") {
      return <Badge variant="destructive" className="text-[10px]">Spam</Badge>;
    }
    return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[10px]">Inbound Lead</Badge>;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-4xl max-h-[92vh] flex flex-col p-0 overflow-hidden gap-0">
          {/* Header */}
          <div className="p-5 border-b bg-gradient-to-r from-indigo-50/80 via-background to-purple-50/80 dark:from-indigo-950/20 dark:to-purple-950/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/20">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-bold flex items-center gap-2">
                    Daily Leads Summary & Action Center
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                    Executive overview of inbound leads, conversion velocity, and actionable opportunities.
                  </DialogDescription>
                </div>
              </div>

              {/* Action buttons & Timeframe selector pills */}
              <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs px-2.5 font-medium gap-1.5 border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-950/50"
                  onClick={handleCopySummary}
                  title="Copy formatted daily actions text summary to clipboard"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? "Copied!" : "Copy Summary"}
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs px-2.5 font-medium gap-1.5 border-indigo-200 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-300 dark:hover:bg-indigo-950/50"
                  disabled={emailReportMutation.isPending}
                  onClick={() => emailReportMutation.mutate()}
                  title="Send the 5:00 PM AEST Daily CRM Summary Email now"
                >
                  <Mail className={cn("h-3.5 w-3.5", emailReportMutation.isPending && "animate-spin")} />
                  {emailReportMutation.isPending ? "Sending..." : "Email Report"}
                </Button>

                <div className="flex items-center gap-1.5 bg-background p-1 rounded-lg border shadow-sm">
                  <Button
                    size="sm"
                    variant={timeframe === "today" ? "default" : "ghost"}
                    className="h-7 text-xs px-2.5 font-medium"
                    onClick={() => setTimeframe("today")}
                  >
                    Today
                  </Button>
                  <Button
                    size="sm"
                    variant={timeframe === "yesterday" ? "default" : "ghost"}
                    className="h-7 text-xs px-2.5 font-medium"
                    onClick={() => setTimeframe("yesterday")}
                  >
                    Yesterday
                  </Button>
                  <Button
                    size="sm"
                    variant={timeframe === "7d" ? "default" : "ghost"}
                    className="h-7 text-xs px-2.5 font-medium"
                    onClick={() => setTimeframe("7d")}
                  >
                    Past 7 Days
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                    onClick={() => refetch()}
                    title="Refresh summary & re-run analysis"
                  >
                    <RefreshCw className={cn("h-3.5 w-3.5", isFetching && "animate-spin text-primary")} />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Dialog Body (Scrollable) */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {isLoading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3 text-muted-foreground">
                <RefreshCw className="h-7 w-7 animate-spin text-primary" />
                <p className="text-sm font-medium">Generating daily leads summary & AI brief...</p>
              </div>
            ) : (
              <>
                {/* Metrics Cards Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                  {/* Total Inbound */}
                  <div className="p-3 rounded-lg border bg-card shadow-sm flex flex-col justify-between">
                    <span className="text-[11px] text-muted-foreground font-medium">Total Inbound</span>
                    <div className="flex items-baseline justify-between mt-1">
                      <span className="text-xl font-bold tracking-tight text-foreground">{metrics.total}</span>
                      <span className="text-[10px] text-muted-foreground font-medium">{period.label}</span>
                    </div>
                    {metrics.bySource && Object.keys(metrics.bySource).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5 pt-1.5 border-t text-[9px]">
                        {Object.entries(metrics.bySource).slice(0, 3).map(([src, count]) => (
                          <span key={src} className="px-1 py-0.2 rounded bg-muted font-medium text-muted-foreground truncate">
                            {src}: {count as number}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Calls Conducted */}
                  <div className="p-3 rounded-lg border bg-emerald-500/[0.04] border-emerald-500/20 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">Calls Logged</span>
                      <PhoneCall className="h-3.5 w-3.5 text-emerald-600" />
                    </div>
                    <div className="flex items-baseline justify-between mt-1">
                      <span className="text-xl font-bold tracking-tight text-emerald-700 dark:text-emerald-300">
                        {callsMetric.total || callLogs.length}
                      </span>
                      <span className="text-[10px] font-semibold text-emerald-600/80">
                        {callsMetric.byOutcome?.picked || 0} Picked
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1.5 pt-1.5 border-t border-emerald-500/20 text-[9px]">
                      {(callsMetric.byOutcome?.ringing_unanswered || 0) > 0 && (
                        <span className="px-1 py-0.2 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300 font-medium">
                          {callsMetric.byOutcome.ringing_unanswered} Rang
                        </span>
                      )}
                      {(callsMetric.byOutcome?.not_picked || 0) > 0 && (
                        <span className="px-1 py-0.2 rounded bg-slate-500/10 text-slate-700 dark:text-slate-300 font-medium">
                          {callsMetric.byOutcome.not_picked} Missed
                        </span>
                      )}
                      {(callsMetric.byOutcome?.not_valid_number || 0) > 0 && (
                        <span className="px-1 py-0.2 rounded bg-rose-500/10 text-rose-700 dark:text-rose-300 font-medium">
                          {callsMetric.byOutcome.not_valid_number} Invalid
                        </span>
                      )}
                      {callsMetric.total === 0 && (
                        <span className="text-muted-foreground italic text-[9px]">No calls yet</span>
                      )}
                    </div>
                  </div>

                  {/* Needs Action */}
                  <div className={cn(
                    "p-3 rounded-lg border shadow-sm flex flex-col justify-between transition-colors",
                    metrics.pendingAction > 0 
                      ? "bg-amber-500/10 border-amber-500/30 text-amber-950 dark:text-amber-200" 
                      : "bg-card text-foreground"
                  )}>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-300">Needs Action</span>
                      {metrics.pendingAction > 0 && (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                      )}
                    </div>
                    <div className="flex items-baseline justify-between mt-1">
                      <span className="text-xl font-bold tracking-tight text-amber-700 dark:text-amber-300">
                        {metrics.pendingAction}
                      </span>
                      <span className="text-[10px] font-semibold text-amber-700/80 dark:text-amber-300/80">
                        Review
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1.5 pt-1.5 border-t">
                      Awaiting review
                    </p>
                  </div>

                  {/* Qualified */}
                  <div className="p-3 rounded-lg border bg-card shadow-sm flex flex-col justify-between">
                    <span className="text-[11px] text-muted-foreground font-medium">Qualified (SQL)</span>
                    <div className="flex items-baseline justify-between mt-1">
                      <span className="text-xl font-bold tracking-tight text-indigo-600 dark:text-indigo-400">
                        {metrics.qualified}
                      </span>
                      <ShieldCheck className="h-3.5 w-3.5 text-indigo-500" />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1.5 pt-1.5 border-t">
                      Sales Qualified
                    </p>
                  </div>

                  {/* Converted */}
                  <div className="p-3 rounded-lg border bg-card shadow-sm flex flex-col justify-between">
                    <span className="text-[11px] text-muted-foreground font-medium">Pipeline / Won</span>
                    <div className="flex items-baseline justify-between mt-1">
                      <span className="text-xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                        {metrics.converted}
                      </span>
                      <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1.5 pt-1.5 border-t">
                      Deals & Customers
                    </p>
                  </div>

                  {/* Disqualified / Spam */}
                  <div className="p-3 rounded-lg border bg-card shadow-sm flex flex-col justify-between">
                    <span className="text-[11px] text-muted-foreground font-medium">Spam / Lost</span>
                    <div className="flex items-baseline justify-between mt-1">
                      <span className="text-xl font-bold tracking-tight text-rose-600 dark:text-rose-400">
                        {metrics.disqualified}
                      </span>
                      <Ban className="h-3.5 w-3.5 text-rose-500" />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1.5 pt-1.5 border-t">
                      Spam & Invalid
                    </p>
                  </div>
                </div>

                {/* AI Executive Briefing Container */}
                {aiSummary && (
                  <div className="p-4 rounded-xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/[0.04] via-background to-purple-500/[0.04] space-y-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-600 text-white">
                          <Sparkles className="h-3 w-3" />
                          AI Executive Brief
                        </span>
                        <h4 className="text-sm font-bold text-foreground">
                          {aiSummary.headline || "Daily Leads Performance Overview"}
                        </h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setActiveTab("summaryText")}
                          className="h-6 text-[11px] px-2 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100/50 dark:hover:bg-indigo-900/50 gap-1 font-semibold"
                        >
                          <FileText className="h-3 w-3" />
                          View Text Summary &rarr;
                        </Button>
                        <span className="text-[11px] text-muted-foreground font-medium">
                          Period: {period.label}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {aiSummary.summary}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                      {/* Key Observations */}
                      {aiSummary.key_observations && aiSummary.key_observations.length > 0 && (
                        <div className="p-3 rounded-lg bg-card/80 border text-xs space-y-1.5">
                          <span className="font-semibold text-foreground flex items-center gap-1 text-[11px]">
                            <Flame className="h-3.5 w-3.5 text-amber-500" />
                            Key Inbound Highlights
                          </span>
                          <ul className="space-y-1 text-muted-foreground text-[11px]">
                            {aiSummary.key_observations.map((item: string, i: number) => (
                              <li key={i} className="flex items-start gap-1.5">
                                <span className="text-primary font-bold">•</span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Action Checklist */}
                      {aiSummary.action_recommendations && aiSummary.action_recommendations.length > 0 && (
                        <div className="p-3 rounded-lg bg-card/80 border text-xs space-y-1.5">
                          <span className="font-semibold text-foreground flex items-center gap-1 text-[11px]">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                            Recommended Actions
                          </span>
                          <ul className="space-y-1 text-muted-foreground text-[11px]">
                            {aiSummary.action_recommendations.map((action: string, i: number) => (
                              <li key={i} className="flex items-start gap-1.5">
                                <ArrowRight className="h-3 w-3 text-emerald-500 shrink-0 mt-0.5" />
                                <span>{action}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Interactive Action Tabs */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b pb-2 flex-wrap gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Button
                        size="sm"
                        variant={activeTab === "pending" ? "default" : "outline"}
                        className="h-8 text-xs gap-1.5 font-medium"
                        onClick={() => setActiveTab("pending")}
                      >
                        <AlertCircle className="h-3.5 w-3.5" />
                        Action Required
                        {pendingLeads.length > 0 && (
                          <Badge className="bg-amber-500 text-white text-[10px] px-1.5 py-0 h-4 ml-1">
                            {pendingLeads.length}
                          </Badge>
                        )}
                      </Button>

                      <Button
                        size="sm"
                        variant={activeTab === "all" ? "default" : "outline"}
                        className="h-8 text-xs gap-1.5 font-medium"
                        onClick={() => setActiveTab("all")}
                      >
                        <Layers className="h-3.5 w-3.5" />
                        All Period Leads
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 ml-1">
                          {allLeads.length}
                        </Badge>
                      </Button>

                      <Button
                        size="sm"
                        variant={activeTab === "calls" ? "default" : "outline"}
                        className="h-8 text-xs gap-1.5 font-medium"
                        onClick={() => setActiveTab("calls")}
                      >
                        <PhoneCall className="h-3.5 w-3.5 text-emerald-600" />
                        Calls & Outreach
                        {callLogs.length > 0 && (
                          <Badge className="bg-emerald-600 text-white text-[10px] px-1.5 py-0 h-4 ml-1">
                            {callLogs.length}
                          </Badge>
                        )}
                      </Button>

                      <Button
                        size="sm"
                        variant={activeTab === "summaryText" ? "default" : "outline"}
                        className="h-8 text-xs gap-1.5 font-medium"
                        onClick={() => setActiveTab("summaryText")}
                      >
                        <FileText className="h-3.5 w-3.5 text-indigo-600" />
                        Text Summary
                      </Button>
                    </div>

                    <span className="text-xs text-muted-foreground hidden sm:inline">
                      {activeTab === "pending"
                        ? "Take immediate actions to progress inbound leads"
                        : activeTab === "calls"
                        ? "Review phone outreach logs & discussion notes"
                        : activeTab === "summaryText"
                        ? "Daily operations narrative text summary with one-click copy"
                        : "Complete roster for selected timeframe"}
                    </span>
                  </div>

                  {/* Tab 1: Pending Action Leads */}
                  {activeTab === "pending" && (
                    <div className="space-y-3">
                      {pendingLeads.length === 0 ? (
                        <div className="p-8 text-center rounded-lg border bg-muted/20 space-y-2">
                          <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto" />
                          <h4 className="text-sm font-semibold">All Leads Actioned!</h4>
                          <p className="text-xs text-muted-foreground max-w-md mx-auto">
                            No un-actioned leads found for {period.label}. All inbound leads have been reviewed, qualified, converted, or disqualified.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2.5">
                          {summary.usingBacklog && (
                            <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-800 dark:text-blue-300 flex items-center justify-between">
                              <span>Showing {pendingLeads.length} un-actioned leads from your review backlog.</span>
                            </div>
                          )}

                          {pendingLeads.map((lead: any) => (
                            <div
                              key={lead.id}
                              className="p-3.5 rounded-lg border bg-card hover:bg-muted/30 transition-colors space-y-2.5 shadow-sm"
                            >
                              {/* Lead Top Bar */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-bold text-sm text-foreground">{lead.name}</span>
                                  {getSourceBadge(lead.source_website)}
                                  {lead.isHighPriority && (
                                    <Badge className="bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30 text-[10px] font-semibold">
                                      High Priority
                                    </Badge>
                                  )}
                                  {lead.form_type && (
                                    <Badge variant="outline" className="text-[10px] capitalize">
                                      {lead.form_type.replace('_', ' ')}
                                    </Badge>
                                  )}
                                </div>

                                <span className="text-[11px] text-muted-foreground font-mono">
                                  {lead.createdate ? new Date(lead.createdate).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                                </span>
                              </div>

                              {/* Details Grid */}
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                                <div className="space-y-1">
                                  {lead.company && (
                                    <div className="flex items-center gap-1.5 text-muted-foreground">
                                      <Building2 className="h-3.5 w-3.5 shrink-0" />
                                      <span className="truncate font-medium text-foreground">{lead.company}</span>
                                    </div>
                                  )}
                                  {lead.email && (
                                    <div className="flex items-center gap-1.5 text-muted-foreground">
                                      <Mail className="h-3.5 w-3.5 shrink-0" />
                                      <span className="truncate">{lead.email}</span>
                                    </div>
                                  )}
                                  {lead.phone && (
                                    <div className="flex items-center gap-1.5 text-muted-foreground">
                                      <Phone className="h-3.5 w-3.5 shrink-0" />
                                      <span>{lead.phone}</span>
                                    </div>
                                  )}
                                </div>

                                <div className="sm:col-span-2 space-y-1 bg-muted/40 p-2 rounded border">
                                  {lead.product && (
                                    <div className="flex items-center gap-1.5 text-foreground font-medium">
                                      <Tag className="h-3.5 w-3.5 text-primary shrink-0" />
                                      <span>Product Interest: {lead.product}</span>
                                    </div>
                                  )}
                                  {lead.item_to_lift && (
                                    <div className="text-[11px] text-foreground font-semibold flex items-center gap-1">
                                      <span className="text-primary uppercase text-[10px]">Item to lift:</span>
                                      <span>{lead.item_to_lift}</span>
                                    </div>
                                  )}
                                  {lead.message && (
                                    <p className="text-[11px] text-muted-foreground line-clamp-2 italic">
                                      &ldquo;{lead.message}&rdquo;
                                    </p>
                                  )}
                                </div>
                              </div>

                              {/* Lead Action Buttons Toolbar */}
                              <div className="flex items-center justify-between pt-2 border-t gap-2 flex-wrap">
                                <span className="text-[11px] text-amber-700 dark:text-amber-400 font-semibold flex items-center gap-1">
                                  <AlertCircle className="h-3 w-3" />
                                  Action Required: Select next stage
                                </span>

                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {/* Call Button */}
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs font-semibold gap-1 text-emerald-700 bg-emerald-50/70 hover:bg-emerald-100 hover:text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300"
                                    onClick={() => {
                                      setSelectedContactForCall(lead);
                                      setCallOpen(true);
                                    }}
                                  >
                                    <PhoneCall className="h-3.5 w-3.5 text-emerald-600" />
                                    Call
                                  </Button>

                                  {/* Mark Qualified Button */}
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs font-medium gap-1 text-indigo-700 bg-indigo-50/60 hover:bg-indigo-100 border-indigo-200 dark:bg-indigo-950/40 dark:border-indigo-800"
                                    disabled={qualifyMutation.isPending}
                                    onClick={() => qualifyMutation.mutate({ id: lead.id, leadName: lead.name })}
                                  >
                                    <ShieldCheck className="h-3.5 w-3.5 text-indigo-600" />
                                    Mark Qualified (SQL)
                                  </Button>

                                  {/* Convert to Opportunity Button */}
                                  <Button
                                    size="sm"
                                    className="h-7 text-xs font-medium gap-1 bg-blue-600 hover:bg-blue-700 text-white"
                                    onClick={() => {
                                      setSelectedContactForConvert(lead);
                                      setConvertOpen(true);
                                    }}
                                  >
                                    <TrendingUp className="h-3.5 w-3.5" />
                                    Convert to Deal
                                  </Button>

                                  {/* Mark Spam Button */}
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs font-medium gap-1 text-rose-600 hover:bg-rose-50 border-rose-200"
                                    onClick={() => {
                                      setSelectedContactForDisqualify(lead);
                                      setDisqualifyOpen(true);
                                    }}
                                  >
                                    <Ban className="h-3 w-3" />
                                    Spam
                                  </Button>

                                  {/* View Full Details */}
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 text-xs font-medium gap-1 text-muted-foreground hover:text-foreground"
                                    onClick={() => {
                                      onOpenChange(false);
                                      router.push(`/dashboard/crm/leads/${lead.id}`);
                                    }}
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                    View
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tab 2: All Leads Roster */}
                  {activeTab === "all" && (
                    <div className="space-y-2">
                      {allLeads.length === 0 ? (
                        <div className="p-8 text-center rounded-lg border bg-muted/20 text-xs text-muted-foreground">
                          No leads recorded for {period.label}.
                        </div>
                      ) : (
                        <div className="rounded-lg border overflow-hidden">
                          <table className="w-full text-xs text-left">
                            <thead className="bg-muted/50 border-b font-semibold text-muted-foreground">
                              <tr>
                                <th className="p-2.5">Lead Name</th>
                                <th className="p-2.5">Source</th>
                                <th className="p-2.5">Company / Inquiry</th>
                                <th className="p-2.5">Status</th>
                                <th className="p-2.5">Date</th>
                                <th className="p-2.5 text-right">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y">
                              {allLeads.map((c: any) => (
                                <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                                  <td className="p-2.5 font-medium text-foreground">
                                    <div className="font-semibold">{c.name}</div>
                                    <div className="text-[11px] text-muted-foreground">{c.email || c.phone}</div>
                                  </td>
                                  <td className="p-2.5">
                                    {getSourceBadge(c.source_website)}
                                  </td>
                                  <td className="p-2.5">
                                    <div className="truncate max-w-[180px] font-medium">{c.company || "-"}</div>
                                    <div className="truncate max-w-[180px] text-[11px] text-muted-foreground">
                                      {c.item_to_lift ? `Lift: ${c.item_to_lift}` : c.product || "-"}
                                    </div>
                                  </td>
                                  <td className="p-2.5">
                                    {getLifecycleBadge(c.lifecycle_stage, c.lead_status)}
                                  </td>
                                  <td className="p-2.5 text-muted-foreground whitespace-nowrap">
                                    {c.createdate ? new Date(c.createdate).toLocaleDateString('en-AU', { day: '2-digit', month: 'short' }) : "-"}
                                  </td>
                                  <td className="p-2.5 text-right whitespace-nowrap">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-7 px-2 text-xs font-semibold gap-1 text-emerald-700 bg-emerald-50/70 hover:bg-emerald-100 border-emerald-300 mr-1"
                                      onClick={() => {
                                        setSelectedContactForCall(c);
                                        setCallOpen(true);
                                      }}
                                    >
                                      <PhoneCall className="h-3 w-3 text-emerald-600" />
                                      Call
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                                      onClick={() => {
                                        onOpenChange(false);
                                        router.push(`/dashboard/crm/leads/${c.id}`);
                                      }}
                                    >
                                      View <ExternalLink className="h-3 w-3 ml-1" />
                                    </Button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tab 3: Calls Logged & Outreach */}
                  {activeTab === "calls" && (
                    <div className="space-y-3">
                      {/* Mini Outcome Summary Badges */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <div className="p-2.5 rounded-lg border bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 text-xs">
                          <span className="text-[10px] font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                            <PhoneCall className="h-3 w-3 text-emerald-600" />
                            Picked / Connected
                          </span>
                          <span className="text-lg font-bold text-emerald-900 dark:text-emerald-200 mt-0.5 block">
                            {callsMetric.byOutcome?.picked || 0}
                          </span>
                        </div>

                        <div className="p-2.5 rounded-lg border bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800 text-xs">
                          <span className="text-[10px] font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-1">
                            <PhoneMissed className="h-3 w-3 text-amber-600" />
                            Ringing (Unanswered)
                          </span>
                          <span className="text-lg font-bold text-amber-900 dark:text-amber-200 mt-0.5 block">
                            {callsMetric.byOutcome?.ringing_unanswered || 0}
                          </span>
                        </div>

                        <div className="p-2.5 rounded-lg border bg-slate-50/60 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800 text-xs">
                          <span className="text-[10px] font-semibold text-slate-800 dark:text-slate-300 flex items-center gap-1">
                            <PhoneOff className="h-3 w-3 text-slate-600" />
                            Not Picked / Missed
                          </span>
                          <span className="text-lg font-bold text-slate-900 dark:text-slate-200 mt-0.5 block">
                            {callsMetric.byOutcome?.not_picked || 0}
                          </span>
                        </div>

                        <div className="p-2.5 rounded-lg border bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800 text-xs">
                          <span className="text-[10px] font-semibold text-rose-800 dark:text-rose-300 flex items-center gap-1">
                            <Ban className="h-3 w-3 text-rose-600" />
                            Invalid Numbers
                          </span>
                          <span className="text-lg font-bold text-rose-900 dark:text-rose-200 mt-0.5 block">
                            {callsMetric.byOutcome?.not_valid_number || 0}
                          </span>
                        </div>
                      </div>

                      {callLogs.length === 0 ? (
                        <div className="p-8 text-center rounded-lg border bg-muted/20 space-y-2">
                          <PhoneCall className="h-8 w-8 text-muted-foreground/50 mx-auto" />
                          <p className="text-xs font-semibold text-foreground">No phone calls logged for this period yet</p>
                          <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
                            Switch to the &quot;Action Required&quot; tab and click &quot;Call&quot; on any lead to dial, select the call outcome, and log discussion notes.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2.5">
                          {callLogs.map((log: any) => {
                            const outcomeLower = (log.outcome || "").toLowerCase();
                            const isPicked = outcomeLower.includes("pick") || outcomeLower.includes("connect");
                            const isRang = outcomeLower.includes("ring");
                            const isInvalid = outcomeLower.includes("invalid") || outcomeLower.includes("not a valid");

                            return (
                              <div
                                key={log.id}
                                className="p-3 rounded-lg border bg-card shadow-sm hover:border-emerald-500/40 transition-colors space-y-2"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="space-y-0.5 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="font-bold text-xs text-foreground">
                                        {log.contact?.name || "Lead"}
                                      </span>
                                      {log.contact?.company && (
                                        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                                          <Building2 className="h-3 w-3" />
                                          {log.contact.company}
                                        </span>
                                      )}
                                      <Badge
                                        className={cn(
                                          "text-[10px] font-semibold border",
                                          isPicked
                                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                                            : isInvalid
                                            ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800"
                                            : isRang
                                            ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800"
                                            : "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/40 dark:text-slate-300 dark:border-slate-800"
                                        )}
                                      >
                                        {isPicked ? <CheckCircle2 className="h-3 w-3 mr-1" /> : isInvalid ? <Ban className="h-3 w-3 mr-1" /> : <Clock className="h-3 w-3 mr-1" />}
                                        {log.outcome}
                                      </Badge>
                                    </div>
                                    {log.contact?.phone && (
                                      <a
                                        href={`tel:${log.contact.phone}`}
                                        className="text-[11px] text-blue-600 hover:underline flex items-center gap-1"
                                      >
                                        <Phone className="h-3 w-3 shrink-0" />
                                        <span>{log.contact.phone}</span>
                                      </a>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-1.5 shrink-0">
                                    {log.duration_minutes && (
                                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium">
                                        {log.duration_minutes} min
                                      </span>
                                    )}
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-7 text-xs font-semibold gap-1 text-emerald-700 bg-emerald-50/70 hover:bg-emerald-100 border-emerald-300"
                                      onClick={() => {
                                        setSelectedContactForCall(log.contact);
                                        setCallOpen(true);
                                      }}
                                    >
                                      <PhoneCall className="h-3 w-3 text-emerald-600" />
                                      Call Again
                                    </Button>
                                  </div>
                                </div>

                                {log.summary && (
                                  <div className="p-2 rounded bg-muted/40 border text-xs text-foreground/90 leading-relaxed font-normal">
                                    <span className="font-semibold text-[10px] text-muted-foreground uppercase block mb-0.5">
                                      Call Notes:
                                    </span>
                                    {log.summary}
                                  </div>
                                )}

                                <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t">
                                  <span>Logged by: <strong>{log.caller_name || "Sales Team"}</strong></span>
                                  <span>{log.created_at ? new Date(log.created_at).toLocaleString() : ""}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tab 4: Operations Text Summary */}
                  {activeTab === "summaryText" && (
                    <div className="space-y-3">
                      <div className="p-4 rounded-xl border bg-card shadow-sm space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b">
                          <div>
                            <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                              <FileText className="h-4 w-4 text-indigo-600" />
                              Daily CRM Operations & Actions Text Summary
                            </h4>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Consolidated plain-text summary covering inbound inquiries, outreach calls, outcomes, qualifications, and opportunities.
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge variant="outline" className="text-[11px] font-mono">
                              {period.label}
                            </Badge>
                            <Button
                              size="sm"
                              className="h-8 text-xs font-semibold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                              onClick={handleCopySummary}
                            >
                              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                              {copied ? "Copied to Clipboard!" : "Copy Text Summary"}
                            </Button>
                          </div>
                        </div>

                        {/* Text Preview Box */}
                        <div className="relative">
                          <pre className="p-4 rounded-lg bg-slate-950 text-slate-100 dark:bg-slate-900/90 font-mono text-[11px] sm:text-xs leading-relaxed whitespace-pre-wrap select-all overflow-x-auto max-h-[460px] border border-slate-800 shadow-inner">
                            {textSummary}
                          </pre>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                          <span>💡 Click &ldquo;Copy Text Summary&rdquo; to paste directly into daily handover notes, emails, or Slack.</span>
                          <span className="font-mono">{textSummary.length} characters</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Convert to Opportunity Modal */}
      <ConvertLeadDialog
        contact={selectedContactForConvert}
        open={convertOpen}
        onOpenChange={setConvertOpen}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["crm-daily-summary"] });
          queryClient.invalidateQueries({ queryKey: ["crm-contacts-leads"] });
          queryClient.invalidateQueries({ queryKey: ["crm-contacts"] });
        }}
      />

      {/* Disqualify Modal */}
      <DisqualifyLeadDialog
        contact={selectedContactForDisqualify}
        open={disqualifyOpen}
        onOpenChange={setDisqualifyOpen}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["crm-daily-summary"] });
          queryClient.invalidateQueries({ queryKey: ["crm-contacts-leads"] });
          queryClient.invalidateQueries({ queryKey: ["crm-contacts"] });
        }}
      />

      {/* Log Call Modal */}
      <LogCallDialog
        contact={selectedContactForCall}
        open={callOpen}
        onOpenChange={setCallOpen}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["crm-daily-summary"] });
          queryClient.invalidateQueries({ queryKey: ["crm-contacts-leads"] });
          queryClient.invalidateQueries({ queryKey: ["crm-contacts"] });
        }}
      />
    </>
  );
}

