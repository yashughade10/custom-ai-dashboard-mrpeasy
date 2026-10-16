"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateContact } from "@/services/api";
import { toast } from "sonner";
import { 
  History, 
  Clock, 
  ArrowRight, 
  User, 
  Sparkles, 
  TrendingUp, 
  ShieldCheck, 
  Ban, 
  CheckCircle2, 
  Calendar,
  MessageSquare,
  PlusCircle,
  X,
  Send
} from "lucide-react";

interface LifecycleHistoryItem {
  id: number | string;
  contact_id: string;
  old_stage: string | null;
  new_stage: string;
  old_status?: string | null;
  new_status?: string | null;
  changed_by?: string | null;
  notes?: string | null;
  created_at: string;
}

interface LeadLifecycleHistoryTimelineProps {
  contactId: string;
  history?: LifecycleHistoryItem[];
  createdDate?: string;
  sourceWebsite?: string;
  currentStage?: string;
  onHistoryUpdated?: () => void;
}

const STAGE_CONFIG: Record<string, { label: string; badgeClass: string; icon: any }> = {
  lead: {
    label: "Inbound Lead",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
    icon: Sparkles
  },
  subscriber: {
    label: "Inbound Lead",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
    icon: Sparkles
  },
  marketingqualifiedlead: {
    label: "Marketing Qualified (MQL)",
    badgeClass: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800",
    icon: CheckCircle2
  },
  salesqualifiedlead: {
    label: "Sales Qualified (SQL)",
    badgeClass: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800",
    icon: CheckCircle2
  },
  opportunity: {
    label: "In Pipeline (Deal)",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
    icon: TrendingUp
  },
  customer: {
    label: "Customer Account",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
    icon: ShieldCheck
  },
  other: {
    label: "Disqualified / Lost",
    badgeClass: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800",
    icon: Ban
  },
  lost: {
    label: "Disqualified / Lost",
    badgeClass: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800",
    icon: Ban
  },
  disqualified: {
    label: "Disqualified / Lost",
    badgeClass: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800",
    icon: Ban
  }
};

function formatStageBadge(stageKey?: string | null) {
  const key = (stageKey || "lead").toLowerCase();
  const config = STAGE_CONFIG[key] || {
    label: stageKey || "Lead",
    badgeClass: "bg-muted text-muted-foreground border-border",
    icon: Sparkles
  };

  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${config.badgeClass}`}>
      <Icon className="h-3 w-3 shrink-0" />
      <span>{config.label}</span>
    </span>
  );
}

function formatRelativeTime(dateString?: string) {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSec < 60) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 30) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  } catch {
    return "";
  }
}

export default function LeadLifecycleHistoryTimeline({
  contactId,
  history = [],
  createdDate,
  sourceWebsite,
  currentStage = "lead",
  onHistoryUpdated
}: LeadLifecycleHistoryTimelineProps) {
  const queryClient = useQueryClient();

  // Quick stage update form states
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [targetStage, setTargetStage] = useState(currentStage);
  const [stageNotes, setStageNotes] = useState("");

  const updateMutation = useMutation({
    mutationFn: (payload: { lifecycle_stage: string; change_reason: string }) => 
      updateContact(contactId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-contact", contactId] });
      queryClient.invalidateQueries({ queryKey: ["crm-contacts-leads"] });
      queryClient.invalidateQueries({ queryKey: ["crm-contacts"] });
      toast.success("Stage updated and history entry recorded");
      setShowUpdateForm(false);
      setStageNotes("");
      onHistoryUpdated?.();
    },
    onError: (err: any) => {
      toast.error("Failed to update stage: " + (err.message || "Unknown error"));
    }
  });

  const handleQuickUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetStage) return;
    updateMutation.mutate({
      lifecycle_stage: targetStage,
      change_reason: stageNotes.trim() || `Stage changed to ${STAGE_CONFIG[targetStage]?.label || targetStage}`
    });
  };

  const getSourceDisplay = (source?: string) => {
    const s = (source || "").toLowerCase();
    switch (s) {
      case "vaclift":
        return "Vaclift Website";
      case "pipeboss":
        return "Pipeboss Website";
      case "blue_water":
        return "Blue Water Engineering";
      case "digital_marketing":
        return "Digital Marketing Import";
      default:
        return source || "Direct Website Submission";
    }
  };

  return (
    <Card className="shadow-sm border">
      <CardHeader className="pb-3 border-b bg-muted/20">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <History className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">Lifecycle History & Timeline</CardTitle>
              <CardDescription className="text-xs">
                Audit trail of qualification status, lifecycle stage transitions, and admin remarks.
              </CardDescription>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setTargetStage(currentStage);
              setShowUpdateForm(!showUpdateForm);
            }}
            className="text-xs h-8 gap-1.5 border-dashed"
          >
            {showUpdateForm ? (
              <>
                <X className="h-3.5 w-3.5" />
                Cancel
              </>
            ) : (
              <>
                <PlusCircle className="h-3.5 w-3.5 text-primary" />
                Log Stage Change
              </>
            )}
          </Button>
        </div>

        {/* Quick Transition Form */}
        {showUpdateForm && (
          <form onSubmit={handleQuickUpdate} className="mt-3 p-3.5 rounded-lg border bg-background shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground">Record Lifecycle Transition</span>
              <span className="text-[11px] text-muted-foreground">Will be logged with your timestamp</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <Label htmlFor="quick-stage" className="text-xs">New Stage</Label>
                <select
                  id="quick-stage"
                  value={targetStage}
                  onChange={(e) => setTargetStage(e.target.value)}
                  className="flex h-8 w-full rounded-md border border-input bg-background px-2.5 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-primary font-medium"
                >
                  <option value="lead">Inbound Lead (New Inquiry)</option>
                  <option value="marketingqualifiedlead">Marketing Qualified Lead (MQL)</option>
                  <option value="salesqualifiedlead">Sales Qualified Lead (SQL - Ready to Quote)</option>
                  <option value="opportunity">In Pipeline (Active Deal)</option>
                  <option value="customer">Customer (Won Account)</option>
                  <option value="other">Disqualified / Lost</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="quick-notes" className="text-xs">Reason / Remark (Optional)</Label>
                <Input
                  id="quick-notes"
                  value={stageNotes}
                  onChange={(e) => setStageNotes(e.target.value)}
                  placeholder="e.g. Verified technical specs, ready for quote"
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowUpdateForm(false)}
                className="h-7 text-xs px-2"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={updateMutation.isPending || targetStage === currentStage && !stageNotes.trim()}
                className="h-7 text-xs px-3 bg-blue-600 hover:bg-blue-700 text-white gap-1"
              >
                <Send className="h-3 w-3" />
                {updateMutation.isPending ? "Logging..." : "Log Transition"}
              </Button>
            </div>
          </form>
        )}
      </CardHeader>

      <CardContent className="pt-5 pb-6">
        <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-border/80">
          
          {/* History Event Entries (Newest First) */}
          {history.map((item, index) => {
            const hasNotes = Boolean(item.notes);
            const relativeTime = formatRelativeTime(item.created_at);
            const exactTime = item.created_at ? new Date(item.created_at).toLocaleString() : "";

            return (
              <div key={item.id || index} className="relative group">
                {/* Timeline Node Dot */}
                <span className="absolute -left-6 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-background border-2 border-primary ring-4 ring-background">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                </span>

                <div className="space-y-1.5 bg-muted/30 hover:bg-muted/60 p-3 rounded-lg border transition-colors">
                  {/* Stage Transition Header */}
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap text-xs">
                      {item.old_stage && (
                        <>
                          {formatStageBadge(item.old_stage)}
                          <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        </>
                      )}
                      {formatStageBadge(item.new_stage)}
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1" title={exactTime}>
                        <Clock className="h-3 w-3" />
                        {relativeTime}
                      </span>
                    </div>
                  </div>

                  {/* Actor & Metadata */}
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap">
                    {item.changed_by && (
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        Changed by <strong className="text-foreground font-medium">{item.changed_by}</strong>
                      </span>
                    )}
                    <span>•</span>
                    <span className="text-[10px]">{exactTime}</span>
                  </div>

                  {/* Notes / Reason Callout */}
                  {hasNotes && (
                    <div className="mt-2 text-xs text-foreground bg-background p-2.5 rounded border border-border/80 flex items-start gap-2">
                      <MessageSquare className="h-3.5 w-3.5 text-blue-600 mt-0.5 shrink-0" />
                      <p className="leading-relaxed whitespace-pre-wrap">{item.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Lead Creation & Inception Point (Anchor at the start of journey) */}
          <div className="relative group">
            {/* Creation Node Dot */}
            <span className="absolute -left-6 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-background border-2 border-emerald-500 ring-4 ring-background">
              <Sparkles className="h-2.5 w-2.5 text-emerald-600" />
            </span>

            <div className="space-y-1.5 bg-muted/20 p-3 rounded-lg border border-dashed border-border/80">
              <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">Lead Created & Ingested</span>
                  {formatStageBadge("lead")}
                </div>

                <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>{createdDate ? new Date(createdDate).toLocaleDateString() : "Initial Inquiry"}</span>
                </div>
              </div>

              <p className="text-[11px] text-muted-foreground">
                Inbound query received via <strong className="text-foreground">{getSourceDisplay(sourceWebsite)}</strong>. Initial lifecycle stage set to Inbound Lead.
              </p>
            </div>
          </div>

        </div>
      </CardContent>
    </Card>
  );
}
