"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateOpportunity, updateContact } from "@/services/api";
import { toast } from "sonner";
import { XCircle, Loader2 } from "lucide-react";

interface OpportunityLossDialogProps {
  opportunity: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const LOSS_REASONS = [
  "Price too high / Budget constraints",
  "Selected competitor product",
  "Project cancelled or deferred",
  "Technical specifications mismatch",
  "Customer unresponsive / Ghosted",
  "Decided to build in-house / Used alternative method",
  "Other"
];

export default function OpportunityLossDialog({
  opportunity,
  open,
  onOpenChange,
  onSuccess
}: OpportunityLossDialogProps) {
  const queryClient = useQueryClient();
  const [lossReason, setLossReason] = useState(LOSS_REASONS[0]);
  const [notes, setNotes] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      if (!opportunity?.id) throw new Error("No opportunity selected");

      const combinedReason = notes ? `${lossReason}: ${notes}` : lossReason;

      // 1. Update opportunity status to closed_lost
      await updateOpportunity(opportunity.id.toString(), {
        stage: "closed_lost",
        probability: 0,
        loss_reason: combinedReason,
        actual_close_date: new Date().toISOString().split("T")[0]
      });

      // 2. If contact_id exists, update contact lifecycle to other/lost
      if (opportunity.contact_id) {
        try {
          await updateContact(opportunity.contact_id.toString(), {
            lifecycle_stage: "other"
          });
        } catch (e) {
          console.error("Could not update contact lifecycle stage:", e);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-opportunities"] });
      queryClient.invalidateQueries({ queryKey: ["crm-opportunity", opportunity?.id?.toString()] });
      queryClient.invalidateQueries({ queryKey: ["crm-contacts-leads"] });
      queryClient.invalidateQueries({ queryKey: ["crm-contacts"] });

      toast.info(`Opportunity marked as Closed-Lost`, {
        description: `Reason: ${lossReason}`
      });

      onOpenChange(false);
      onSuccess?.();
    },
    onError: (err: any) => {
      toast.error("Failed to mark as lost: " + (err.message || "Unknown error"));
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <div className="flex items-center gap-2 text-rose-600 font-semibold text-xs tracking-wider uppercase">
            <XCircle className="h-4 w-4" />
            Pipeline Status: Closed Lost
          </div>
          <DialogTitle className="text-xl">Mark Opportunity as Lost</DialogTitle>
          <DialogDescription>
            Record why <strong>{opportunity?.name}</strong> did not convert to help analyze lost deal trends.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid gap-1.5">
            <Label htmlFor="opp-loss-reason" className="text-xs font-semibold">
              Primary Loss Reason <span className="text-red-500">*</span>
            </Label>
            <select
              id="opp-loss-reason"
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
              value={lossReason}
              onChange={(e) => setLossReason(e.target.value)}
            >
              {LOSS_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="opp-loss-notes" className="text-xs font-semibold">
              Details & Feedback
            </Label>
            <textarea
              id="opp-loss-notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Client budget was $20k, Vaclift quote came in at $28k. Keep in touch for next financial year."
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            variant="destructive"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                Updating...
              </>
            ) : (
              "Confirm Closed Lost"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
