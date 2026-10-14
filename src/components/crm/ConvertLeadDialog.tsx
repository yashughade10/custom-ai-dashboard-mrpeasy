"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createOpportunity, updateContact, fetchOwners } from "@/services/api";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { 
  Building2, 
  Mail, 
  UserCircle2, 
  Sparkles, 
  TrendingUp, 
  DollarSign, 
  CalendarDays,
  Loader2,
  CheckCircle2
} from "lucide-react";

interface ConvertLeadDialogProps {
  contact: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (createdOpp: any) => void;
}

const defaultProbabilities: Record<string, number> = {
  prospecting: 10,
  qualification: 25,
  proposal: 50,
  negotiation: 80,
  closed_won: 100,
  closed_lost: 0
};

export default function ConvertLeadDialog({
  contact,
  open,
  onOpenChange,
  onSuccess
}: ConvertLeadDialogProps) {
  const queryClient = useQueryClient();
  const router = useRouter();

  const fullName = contact 
    ? `${contact.firstname || ""} ${contact.lastname || ""}`.trim() || contact.email || "Lead"
    : "";
  const companyName = contact?.company_name || contact?.company || "";

  const [oppName, setOppName] = useState("");
  const [stage, setStage] = useState("qualification");
  const [probability, setProbability] = useState(25);
  const [expectedValue, setExpectedValue] = useState("15000");
  const [closeDate, setCloseDate] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [updateLifecycle, setUpdateLifecycle] = useState(true);

  const { data: owners } = useQuery({
    queryKey: ["crm-owners"],
    queryFn: fetchOwners,
    enabled: open
  });

  useEffect(() => {
    if (contact && open) {
      const defaultName = companyName 
        ? `${companyName} - Vaclift Solution`
        : `${fullName} - Inquiry`;
      setOppName(defaultName);
      setStage("qualification");
      setProbability(25);
      setExpectedValue("15000");
      
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      setCloseDate(futureDate.toISOString().split("T")[0]);
      
      setAssignedTo(contact.owner_id ? contact.owner_id.toString() : "");
      setUpdateLifecycle(true);
    }
  }, [contact, open, companyName, fullName]);

  const handleStageChange = (newStage: string) => {
    setStage(newStage);
    if (defaultProbabilities[newStage] !== undefined) {
      setProbability(defaultProbabilities[newStage]);
    }
  };

  const convertMutation = useMutation({
    mutationFn: async () => {
      if (!contact) throw new Error("No contact selected");
      if (!oppName.trim()) throw new Error("Opportunity name is required");

      const oppPayload = {
        name: oppName.trim(),
        contact_id: contact.id,
        company_id: contact.company_id || null,
        stage,
        probability: Number(probability) || 0,
        expected_value: parseFloat(expectedValue) || 0,
        expected_close_date: closeDate || null,
        assigned_to: assignedTo ? parseInt(assignedTo) : null
      };

      const createdOpp = await createOpportunity(oppPayload);

      if (updateLifecycle) {
        await updateContact(contact.id.toString(), { lifecycle_stage: "opportunity" });
      }

      return createdOpp;
    },
    onSuccess: (createdOpp) => {
      queryClient.invalidateQueries({ queryKey: ["crm-opportunities"] });
      queryClient.invalidateQueries({ queryKey: ["crm-contacts-leads"] });
      queryClient.invalidateQueries({ queryKey: ["crm-contacts"] });
      if (contact?.id) {
        queryClient.invalidateQueries({ queryKey: ["crm-contact", contact.id.toString()] });
      }

      toast.success("Lead converted successfully!", {
        description: `Created opportunity "${oppName}".`,
        action: {
          label: "View Pipeline",
          onClick: () => router.push("/dashboard/crm/opportunities")
        }
      });

      onOpenChange(false);
      if (onSuccess) onSuccess(createdOpp);
    },
    onError: (err: any) => {
      toast.error("Failed to convert lead: " + (err.message || "Unknown error"));
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px]">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary font-semibold text-xs tracking-wider uppercase">
            <Sparkles className="h-4 w-4 text-blue-600" />
            CRM Lifecycle Conversion
          </div>
          <DialogTitle className="text-xl">Convert Lead to Opportunity</DialogTitle>
          <DialogDescription>
            Advance this marketing lead into an active sales opportunity in your pipeline.
          </DialogDescription>
        </DialogHeader>

        {/* Lead Summary Header Card */}
        {contact && (
          <div className="p-3.5 rounded-lg bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/70 dark:border-blue-900/40 text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground text-sm flex items-center gap-1.5">
                <UserCircle2 className="h-4 w-4 text-blue-600" />
                {fullName}
              </span>
              <span className="capitalize px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 font-medium text-[11px]">
                {contact.lifecycle_stage || "Lead"}
              </span>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground">
              {contact.email && (
                <span className="flex items-center gap-1">
                  <Mail className="h-3 w-3 text-muted-foreground/70" />
                  {contact.email}
                </span>
              )}
              {companyName && (
                <span className="flex items-center gap-1 font-medium text-foreground">
                  <Building2 className="h-3 w-3 text-muted-foreground/70" />
                  {companyName}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Form Fields */}
        <div className="space-y-4 py-2">
          <div className="grid gap-1.5">
            <Label htmlFor="opp-name" className="text-xs font-semibold">
              Opportunity / Deal Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="opp-name"
              value={oppName}
              onChange={(e) => setOppName(e.target.value)}
              placeholder="e.g. Acme Corp - Vaclift 500kg System"
              className="h-9"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="opp-stage" className="text-xs font-semibold flex items-center gap-1">
                <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                Pipeline Stage
              </Label>
              <select
                id="opp-stage"
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
                value={stage}
                onChange={(e) => handleStageChange(e.target.value)}
              >
                <option value="prospecting">Prospecting (10%)</option>
                <option value="qualification">Qualification (25%)</option>
                <option value="proposal">Proposal (50%)</option>
                <option value="negotiation">Negotiation (80%)</option>
              </select>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="opp-val" className="text-xs font-semibold flex items-center gap-1">
                <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                Expected Value (AUD)
              </Label>
              <Input
                id="opp-val"
                type="number"
                value={expectedValue}
                onChange={(e) => setExpectedValue(e.target.value)}
                placeholder="15000"
                className="h-9"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="opp-close" className="text-xs font-semibold flex items-center gap-1">
                <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                Target Close Date
              </Label>
              <Input
                id="opp-close"
                type="date"
                value={closeDate}
                onChange={(e) => setCloseDate(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="opp-owner" className="text-xs font-semibold flex items-center gap-1">
                <UserCircle2 className="h-3.5 w-3.5 text-muted-foreground" />
                Assigned Sales Rep
              </Label>
              <select
                id="opp-owner"
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
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

          <div className="pt-2">
            <label className="flex items-center gap-2 text-xs font-medium cursor-pointer select-none">
              <input
                type="checkbox"
                checked={updateLifecycle}
                onChange={(e) => setUpdateLifecycle(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Advance lead lifecycle stage to <strong>Opportunity</strong></span>
            </label>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={convertMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
            onClick={() => convertMutation.mutate()}
            disabled={convertMutation.isPending || !oppName.trim()}
          >
            {convertMutation.isPending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Converting...
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                Convert to Opportunity
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
