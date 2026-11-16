"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchDailyLeadsSummary, updateContact } from "@/services/api";
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
  Tag,
  CheckCircle2,
  HelpCircle,
  ExternalLink,
  Flame,
  Globe,
  Layers,
  Calendar,
  UserCheck
} from "lucide-react";
import { cn } from "@/lib/utils";

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
  const [activeTab, setActiveTab] = useState<"pending" | "all">("pending");

  // Modals for actions
  const [selectedContactForConvert, setSelectedContactForConvert] = useState<any | null>(null);
  const [convertOpen, setConvertOpen] = useState(false);
  const [selectedContactForDisqualify, setSelectedContactForDisqualify] = useState<any | null>(null);
  const [disqualifyOpen, setDisqualifyOpen] = useState(false);

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
    bySource: {}
  };
  const aiSummary = summary.aiSummary;
  const pendingLeads = summary.pendingLeads || [];
  const allLeads = summary.allLeads || [];
  const period = summary.period || { label: "Today" };

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
      toast.success(`${variables.leadName} successfully marked as Qualified (SQL)!`);
    },
    onError: (err: any) => {
      toast.error("Failed to update lead: " + (err.message || "Unknown error"));
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
    if (s === "other" || s === "lost" || s === "disqualified" || status === "Disqualified") {
      return <Badge variant="destructive" className="text-[10px]">Disqualified</Badge>;
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

              {/* Timeframe selector pills */}
              <div className="flex items-center gap-1.5 bg-background p-1 rounded-lg border shadow-sm self-start sm:self-auto">
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
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {/* Total Inbound */}
                  <div className="p-3.5 rounded-lg border bg-card shadow-sm flex flex-col justify-between">
                    <span className="text-xs text-muted-foreground font-medium">Total Inbound</span>
                    <div className="flex items-baseline justify-between mt-1">
                      <span className="text-2xl font-bold tracking-tight text-foreground">{metrics.total}</span>
                      <span className="text-[11px] text-muted-foreground font-medium">{period.label}</span>
                    </div>
                    {metrics.bySource && Object.keys(metrics.bySource).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t text-[10px]">
                        {Object.entries(metrics.bySource).map(([src, count]) => (
                          <span key={src} className="px-1.5 py-0.2 rounded bg-muted font-medium text-muted-foreground">
                            {src}: {count as number}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Needs Action */}
                  <div className={cn(
                    "p-3.5 rounded-lg border shadow-sm flex flex-col justify-between transition-colors",
                    metrics.pendingAction > 0 
                      ? "bg-amber-500/10 border-amber-500/30 text-amber-950 dark:text-amber-200" 
                      : "bg-card text-foreground"
                  )}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">Needs Action</span>
                      {metrics.pendingAction > 0 && (
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                      )}
                    </div>
                    <div className="flex items-baseline justify-between mt-1">
                      <span className="text-2xl font-bold tracking-tight text-amber-700 dark:text-amber-300">
                        {metrics.pendingAction}
                      </span>
                      <span className="text-[10px] font-semibold text-amber-700/80 dark:text-amber-300/80">
                        Awaiting Review
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-2 pt-2 border-t">
                      Unqualified or uncontacted leads
                    </p>
                  </div>

                  {/* Qualified */}
                  <div className="p-3.5 rounded-lg border bg-card shadow-sm flex flex-col justify-between">
                    <span className="text-xs text-muted-foreground font-medium">Qualified (SQL)</span>
                    <div className="flex items-baseline justify-between mt-1">
                      <span className="text-2xl font-bold tracking-tight text-indigo-600 dark:text-indigo-400">
                        {metrics.qualified}
                      </span>
                      <ShieldCheck className="h-4 w-4 text-indigo-500" />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-2 pt-2 border-t">
                      Sales or Marketing Qualified
                    </p>
                  </div>

                  {/* Converted */}
                  <div className="p-3.5 rounded-lg border bg-card shadow-sm flex flex-col justify-between">
                    <span className="text-xs text-muted-foreground font-medium">In Pipeline / Won</span>
                    <div className="flex items-baseline justify-between mt-1">
                      <span className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                        {metrics.converted}
                      </span>
                      <TrendingUp className="h-4 w-4 text-emerald-500" />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-2 pt-2 border-t">
                      Opportunities & Customers
                    </p>
                  </div>

                  {/* Disqualified */}
                  <div className="p-3.5 rounded-lg border bg-card shadow-sm flex flex-col justify-between">
                    <span className="text-xs text-muted-foreground font-medium">Disqualified</span>
                    <div className="flex items-baseline justify-between mt-1">
                      <span className="text-2xl font-bold tracking-tight text-rose-600 dark:text-rose-400">
                        {metrics.disqualified}
                      </span>
                      <Ban className="h-4 w-4 text-rose-500" />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-2 pt-2 border-t">
                      Lost, Spam, or Out of scope
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
                      <span className="text-[11px] text-muted-foreground font-medium">
                        Period: {period.label}
                      </span>
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
                  <div className="flex items-center justify-between border-b pb-2">
                    <div className="flex items-center gap-2">
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
                    </div>

                    <span className="text-xs text-muted-foreground hidden sm:inline">
                      {activeTab === "pending"
                        ? "Take immediate actions to progress inbound leads"
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

                                <div className="flex items-center gap-1.5">
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

                                  {/* Disqualify Button */}
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
                                    Disqualify
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
                                  <td className="p-2.5 text-right">
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
    </>
  );
}

