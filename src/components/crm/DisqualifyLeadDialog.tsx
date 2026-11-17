"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateContact } from "@/services/api";
import { toast } from "sonner";
import { AlertTriangle, Loader2 } from "lucide-react";

interface DisqualifyLeadDialogProps {
  contact: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const LOSS_REASONS = [
  "Spam / Bot / Fake inquiry",
  "Test submission / Incomplete details",
  "No budget / Price sensitive",
  "Unresponsive / Ghosted after outreach",
  "Wrong specifications / Not possible with Vaclift",
  "Competitor / Vendor mismatch",
  "Project cancelled or postponed indefinitely",
  "Other"
];

export default function DisqualifyLeadDialog({
  contact,
  open,
  onOpenChange,
  onSuccess
}: DisqualifyLeadDialogProps) {
  const queryClient = useQueryClient();
  const [reason, setReason] = useState(LOSS_REASONS[0]);
  const [notes, setNotes] = useState("");

  const fullName = contact 
    ? `${contact.firstname || ""} ${contact.lastname || ""}`.trim() || contact.email || "Lead"
    : "";

  const mutation = useMutation({
    mutationFn: async () => {
      if (!contact?.id) throw new Error("No contact selected");
      return await updateContact(contact.id.toString(), {
        lifecycle_stage: "spam",
        lead_status: "Spam",
        change_reason: `Marked as Spam: ${reason}${notes.trim() ? ` - ${notes.trim()}` : ""}`
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-contacts-leads"] });
      queryClient.invalidateQueries({ queryKey: ["crm-contacts"] });
      if (contact?.id) {
        queryClient.invalidateQueries({ queryKey: ["crm-contact", contact.id.toString()] });
      }
      toast.info(`Lead "${fullName}" marked as Spam`, {
        description: `Reason: ${reason}`
      });
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (err: any) => {
      toast.error("Failed to mark lead as spam: " + (err.message || "Unknown error"));
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <div className="flex items-center gap-2 text-rose-600 font-semibold text-xs tracking-wider uppercase">
            <AlertTriangle className="h-4 w-4" />
            Lead Status
          </div>
          <DialogTitle className="text-xl">Mark Lead as Spam</DialogTitle>
          <DialogDescription>
            Flag <strong>{fullName}</strong> as spam to remove it from active leads and move it to the Spam tab.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid gap-1.5">
            <Label htmlFor="loss-reason" className="text-xs font-semibold">
              Reason <span className="text-red-500">*</span>
            </Label>
            <select
              id="loss-reason"
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            >
              {LOSS_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="loss-notes" className="text-xs font-semibold">
              Additional Notes (Optional)
            </Label>
            <textarea
              id="loss-notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Incomplete submission, bot marketing spam, or invalid phone/email."
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
              "Confirm Spam"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
