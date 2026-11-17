"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createActivity, updateContact, fetchActivities } from "@/services/api";
import { toast } from "sonner";
import {
  Phone,
  PhoneCall,
  PhoneMissed,
  PhoneOff,
  Clock,
  Building2,
  Mail,
  User,
  Ban,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  AlertTriangle,
  ExternalLink,
  History,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface LogCallDialogProps {
  contact: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const CALL_OUTCOMES = [
  {
    value: "Call Picked / Connected",
    label: "Call Picked / Connected",
    icon: PhoneCall,
    color: "text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
  },
  {
    value: "Not Picked / No Answer",
    label: "Not Picked / No Answer",
    icon: PhoneMissed,
    color: "text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800"
  },
  {
    value: "Ringing but didn't pick up",
    label: "Ringing but didn't pick up",
    icon: Clock,
    color: "text-orange-700 bg-orange-50 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800"
  },
  {
    value: "Not a valid number",
    label: "Not a valid number",
    icon: Ban,
    color: "text-rose-700 bg-rose-50 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800"
  },
  {
    value: "Line Busy",
    label: "Line Busy",
    icon: PhoneOff,
    color: "text-slate-700 bg-slate-50 border-slate-200 dark:bg-slate-900/40 dark:text-slate-300 dark:border-slate-800"
  },
  {
    value: "Left Voicemail / Message",
    label: "Left Voicemail / Message",
    icon: Mail,
    color: "text-blue-700 bg-blue-50 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800"
  },
  {
    value: "Call Back Requested",
    label: "Call Back Requested",
    icon: Clock,
    color: "text-indigo-700 bg-indigo-50 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800"
  }
];

export default function LogCallDialog({
  contact,
  open,
  onOpenChange,
  onSuccess
}: LogCallDialogProps) {
  const queryClient = useQueryClient();

  const [outcome, setOutcome] = useState<string>("Call Picked / Connected");
  const [summary, setSummary] = useState<string>("");
  const [duration, setDuration] = useState<number>(2);
  const [autoQualify, setAutoQualify] = useState<boolean>(false);
  const [autoDisqualify, setAutoDisqualify] = useState<boolean>(false);
  const [showHistory, setShowHistory] = useState<boolean>(false);

  const contactId = contact?.id ? String(contact.id) : null;
  const { data: pastCallsData } = useQuery({
    queryKey: ["crm-contact-call-history", contactId],
    queryFn: () => fetchActivities({ contact_id: contactId as string, type: "call" }),
    enabled: !!contactId && open,
    staleTime: 5 * 1000
  });

  const pastCalls = pastCallsData?.activities || [];

  // Sync state when contact changes
  useEffect(() => {
    if (open) {
      setOutcome("Call Picked / Connected");
      setSummary("");
      setDuration(2);
      setShowHistory(false);
      const isUnactioned =
        !contact?.lifecycle_stage ||
        contact?.lifecycle_stage === "lead" ||
        contact?.lifecycle_stage === "subscriber";
      setAutoQualify(isUnactioned);
      setAutoDisqualify(false);
    }
  }, [open, contact]);

  // Adjust auto check recommendations based on outcome
  const handleOutcomeChange = (val: string) => {
    setOutcome(val);
    if (val === "Call Picked / Connected") {
      setAutoQualify(true);
      setAutoDisqualify(false);
    } else if (val === "Not a valid number") {
      setAutoQualify(false);
      setAutoDisqualify(true);
    } else {
      setAutoQualify(false);
      setAutoDisqualify(false);
    }
  };

  const fullName = contact
    ? `${contact.firstname || ""} ${contact.lastname || ""}`.trim() ||
      contact.company ||
      contact.email ||
      "Lead"
    : "Lead";

  const phoneNumber = contact?.phone || "";
  const companyName = contact?.company_name || contact?.company || "";

  const logCallMutation = useMutation({
    mutationFn: async () => {
      if (!contact?.id) throw new Error("No contact selected");

      // 1. Log activity in crm_activities
      await createActivity({
        activity_type: "call",
        subject: `Phone Call (${outcome}) - ${fullName}`,
        outcome: outcome,
        description: summary.trim() || `Call outcome: ${outcome}`,
        status: "completed",
        completed_at: new Date().toISOString(),
        duration_minutes: duration ? Number(duration) : 2,
        contact_id: Number(contact.id),
        assigned_to: contact.owner_id || undefined
      });

      // 2. Optionally update lead qualification/status
      if (autoQualify) {
        await updateContact(contact.id.toString(), {
          lifecycle_stage: "salesqualifiedlead",
          lead_status: "Qualified",
          change_reason: `Marked Qualified after call: ${outcome}${summary ? ` (${summary})` : ""}`
        });
      } else if (autoDisqualify) {
        await updateContact(contact.id.toString(), {
          lifecycle_stage: "other",
          lead_status: "Disqualified",
          change_reason: `Disqualified via call: ${outcome}${summary ? ` (${summary})` : ""}`
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-daily-summary"] });
      queryClient.invalidateQueries({ queryKey: ["crm-contacts-leads"] });
      queryClient.invalidateQueries({ queryKey: ["crm-contacts"] });
      queryClient.invalidateQueries({ queryKey: ["crm-activities"] });
      queryClient.invalidateQueries({ queryKey: ["crm-contact-call-history"] });
      if (contact?.id) {
        queryClient.invalidateQueries({ queryKey: ["crm-contact", contact.id.toString()] });
      }

      toast.success(`Call logged for ${fullName}!`, {
        description: `Outcome: ${outcome}${autoQualify ? " • Lead Qualified (SQL)" : autoDisqualify ? " • Lead Disqualified" : ""}`
      });

      if (onSuccess) onSuccess();
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast.error("Failed to log call: " + (err.message || "Unknown error"));
    }
  });

  const selectedOutcomeConfig =
    CALL_OUTCOMES.find((o) => o.value === outcome) || CALL_OUTCOMES[0];
  const OutcomeIcon = selectedOutcomeConfig.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden max-h-[92vh] flex flex-col gap-0">
        {/* Header with Call Badge */}
        <div className="p-5 border-b bg-gradient-to-r from-emerald-500/10 via-background to-teal-500/10 dark:from-emerald-950/20 dark:to-teal-950/20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/20">
              <PhoneCall className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-base font-bold truncate">
                Log Phone Call &bull; {fullName}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2 flex-wrap">
                {companyName && (
                  <span className="flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    {companyName}
                  </span>
                )}
                {contact?.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {contact.email}
                  </span>
                )}
              </DialogDescription>
            </div>
          </div>

          {/* Quick Dial Banner */}
          {phoneNumber ? (
            <div className="mt-3.5 flex items-center justify-between gap-3 bg-card p-2.5 rounded-lg border shadow-sm">
              <div className="flex items-center gap-2 min-w-0">
                <Phone className="h-4 w-4 text-emerald-600 shrink-0" />
                <span className="text-xs font-semibold text-foreground truncate">
                  {phoneNumber}
                </span>
              </div>
              <a
                href={`tel:${phoneNumber}`}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shrink-0 shadow-sm"
                title="Click to dial on phone or desktop caller"
              >
                <PhoneCall className="h-3.5 w-3.5" />
                Start Call
              </a>
            </div>
          ) : (
            <div className="mt-3.5 flex items-center gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              <span>No direct phone number listed for this lead.</span>
            </div>
          )}

          {/* Past Call History Toggle Pill (if previous calls exist) */}
          {pastCalls.length > 0 && (
            <div className="mt-3 pt-2.5 border-t border-border/40 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowHistory(!showHistory)}
                className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1.5 cursor-pointer"
              >
                <History className="h-3.5 w-3.5" />
                Previous Call History ({pastCalls.length} call{pastCalls.length === 1 ? "" : "s"} logged)
                {showHistory ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>
              <span className="text-[10px] text-muted-foreground">History preserved in DB</span>
            </div>
          )}
        </div>

        {/* Body Fields (Scrollable) */}
        <div className="p-5 space-y-4 flex-1 overflow-y-auto">
          {/* Collapsible Past Calls Timeline */}
          {showHistory && pastCalls.length > 0 && (
            <div className="p-3 rounded-lg border bg-muted/40 space-y-2 text-xs animate-in fade-in-50 duration-150">
              <div className="font-semibold text-foreground flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300">
                  <History className="h-3.5 w-3.5 text-emerald-600" />
                  Past Call Logs Timeline
                </span>
                <span className="text-[10px] text-muted-foreground font-normal">
                  All calls recorded permanently
                </span>
              </div>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {pastCalls.map((call: any) => (
                  <div key={call.id} className="p-2 rounded bg-card border text-[11px] space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                        {call.outcome || "Call"}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {call.created_at ? new Date(call.created_at).toLocaleDateString("en-AU", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit"
                        }) : ""}
                      </span>
                    </div>
                    {call.description && (
                      <p className="text-muted-foreground line-clamp-2 text-[10px] italic">
                        &ldquo;{call.description}&rdquo;
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 1. Call Outcome Dropdown */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground flex items-center justify-between">
              <span>Call Outcome / Status *</span>
              <span className="text-[11px] font-normal text-muted-foreground">Used in Daily CRM report</span>
            </Label>

            <Select value={outcome} onValueChange={handleOutcomeChange}>
              <SelectTrigger className="w-full text-xs h-9">
                <div className="flex items-center gap-2 truncate">
                  <OutcomeIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <SelectValue placeholder="Select call outcome..." />
                </div>
              </SelectTrigger>
              <SelectContent>
                {CALL_OUTCOMES.map((opt) => {
                  const Icon = opt.icon;
                  return (
                    <SelectItem key={opt.value} value={opt.value} className="text-xs py-2">
                      <div className="flex items-center gap-2">
                        <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="font-medium">{opt.label}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>

            <div className="pt-0.5">
              <Badge className={cn("text-[11px] font-medium border", selectedOutcomeConfig.color)}>
                <OutcomeIcon className="h-3 w-3 mr-1" />
                {selectedOutcomeConfig.label}
              </Badge>
            </div>
          </div>

          {/* 2. Call Notes & Summary */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">
              Call Summary & Discussion Notes *
            </Label>
            <Textarea
              placeholder="e.g. Spoke with site manager. Needs heavy duty lifter for 2,400kg steel plate fabrication project. Requested quote and technical drawing by tomorrow."
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="text-xs min-h-[90px] resize-none"
            />
            <p className="text-[10px] text-muted-foreground">
              This summary will be saved to the lead activity timeline and featured in today&apos;s 5:00 PM summary brief.
            </p>
          </div>

          {/* 3. Call Duration & Time */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground flex items-center justify-between">
              <span>Call Duration</span>
              <span className="text-[11px] font-normal text-muted-foreground">{duration} min</span>
            </Label>
            <div className="flex items-center gap-1.5 flex-wrap">
              {[1, 2, 5, 10, 15, 30].map((mins) => (
                <Button
                  key={mins}
                  type="button"
                  size="sm"
                  variant={duration === mins ? "default" : "outline"}
                  className="h-7 text-xs px-2.5 font-medium"
                  onClick={() => setDuration(mins)}
                >
                  {mins}m
                </Button>
              ))}
            </div>
          </div>

          {/* 4. Automated Action Checkboxes */}
          <div className="pt-2 border-t space-y-2">
            {outcome === "Call Picked / Connected" && (
              <label className="flex items-center gap-2 p-2 rounded-lg bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-800 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={autoQualify}
                  onChange={(e) => setAutoQualify(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <ShieldCheck className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                <span className="font-medium text-foreground">
                  Mark lead as <strong>Qualified (SQL)</strong> & trigger confirmation email
                </span>
              </label>
            )}

            {outcome === "Not a valid number" && (
              <label className="flex items-center gap-2 p-2 rounded-lg bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={autoDisqualify}
                  onChange={(e) => setAutoDisqualify(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-gray-300 text-rose-600 focus:ring-rose-500"
                />
                <Ban className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                <span className="font-medium text-foreground">
                  Mark lead as <strong>Disqualified</strong> (Invalid Number)
                </span>
              </label>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-muted/30 flex items-center justify-end gap-3 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 px-4 text-xs font-medium"
            onClick={() => onOpenChange(false)}
            disabled={logCallMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            className="h-8 px-4 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm"
            disabled={logCallMutation.isPending}
            onClick={() => logCallMutation.mutate()}
          >
            {logCallMutation.isPending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Saving Call Log...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-3.5 w-3.5" />
                Save Call Log
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

