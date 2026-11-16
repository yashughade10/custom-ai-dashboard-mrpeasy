"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createContact, fetchOwners } from "@/services/api";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  UserPlus,
  Building2,
  Mail,
  Phone,
  Tag,
  Globe,
  Layers,
  ShieldCheck,
  Loader2,
  FileText,
  MapPin,
  Sparkles
} from "lucide-react";

interface CreateLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (createdLead: any) => void;
}

export default function CreateLeadDialog({
  open,
  onOpenChange,
  onSuccess
}: CreateLeadDialogProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: owners } = useQuery({
    queryKey: ["crm-owners"],
    queryFn: fetchOwners,
    enabled: open
  });

  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    email: "",
    phone: "",
    company: "",
    owner_id: "",
    source_website: "manual_entry",
    form_type: "quote_request",
    lifecycle_stage: "lead",
    lead_status: "New",
    product: "",
    item_to_lift: "",
    quantity: 1,
    size_capacity: "",
    preferred_power_source: "",
    subject: "",
    message: "",
    city: "",
    country: "Australia"
  });

  const resetForm = () => {
    setFormData({
      firstname: "",
      lastname: "",
      email: "",
      phone: "",
      company: "",
      owner_id: "",
      source_website: "manual_entry",
      form_type: "quote_request",
      lifecycle_stage: "lead",
      lead_status: "New",
      product: "",
      item_to_lift: "",
      quantity: 1,
      size_capacity: "",
      preferred_power_source: "",
      subject: "",
      message: "",
      city: "",
      country: "Australia"
    });
  };

  const createMutation = useMutation({
    mutationFn: createContact,
    onSuccess: (newLead) => {
      queryClient.invalidateQueries({ queryKey: ["crm-contacts-leads"] });
      queryClient.invalidateQueries({ queryKey: ["crm-contacts"] });
      queryClient.invalidateQueries({ queryKey: ["crm-daily-summary"] });
      toast.success("Lead created successfully!", {
        description: `${newLead.firstname || ""} ${newLead.lastname || ""}`.trim() || newLead.email
      });
      resetForm();
      onOpenChange(false);
      onSuccess?.(newLead);
      if (newLead?.id) {
        router.push(`/dashboard/crm/leads/${newLead.id}`);
      }
    },
    onError: (err: any) => {
      toast.error("Failed to create lead", { description: err.message || "Unknown error" });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.firstname?.trim() && !formData.lastname?.trim() && !formData.company?.trim()) {
      toast.error("Please enter at least a Lead Name or Company Name.");
      return;
    }

    if (!formData.email?.trim() && !formData.phone?.trim()) {
      toast.error("Please provide at least an Email address or Phone number.");
      return;
    }

    createMutation.mutate({
      ...formData,
      quantity: parseInt(String(formData.quantity), 10) || 1
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden gap-0">
        {/* Header */}
        <div className="p-5 border-b bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-sm">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">Add New Lead</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Manually record a sales lead, quote inquiry, or prospect into the CRM pipeline.
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <form id="create-lead-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Section 1: Contact Details */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5" />
              Contact & Organization
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="firstname" className="text-xs font-semibold">
                  First Name <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="firstname"
                  placeholder="e.g. John"
                  value={formData.firstname}
                  onChange={(e) => setFormData({ ...formData, firstname: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="lastname" className="text-xs font-semibold">
                  Last Name
                </Label>
                <Input
                  id="lastname"
                  placeholder="e.g. Smith"
                  value={formData.lastname}
                  onChange={(e) => setFormData({ ...formData, lastname: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="email" className="text-xs font-semibold">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground absolute left-2.5 top-3" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@company.com.au"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="h-9 text-xs pl-8"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="phone" className="text-xs font-semibold">
                  Phone / Mobile
                </Label>
                <div className="relative">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground absolute left-2.5 top-3" />
                  <Input
                    id="phone"
                    placeholder="e.g. 0412 345 678"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="h-9 text-xs pl-8"
                  />
                </div>
              </div>

              <div className="sm:col-span-2 space-y-1">
                <Label htmlFor="company" className="text-xs font-semibold">
                  Company / Business Name
                </Label>
                <Input
                  id="company"
                  placeholder="e.g. ABC Manufacturing Pty Ltd"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Source, Stage & Assignment */}
          <div className="space-y-3 pt-2 border-t">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5" />
              Source, Stage & Assignment
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label htmlFor="source_website" className="text-xs font-semibold">
                  Lead Channel
                </Label>
                <select
                  id="source_website"
                  value={formData.source_website}
                  onChange={(e) => setFormData({ ...formData, source_website: e.target.value })}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-primary font-medium cursor-pointer"
                >
                  <option value="manual_entry">Manual Entry (Direct)</option>
                  <option value="direct_call">Inbound Phone Call</option>
                  <option value="vaclift">Vaclift Website</option>
                  <option value="pipeboss">Pipeboss Website</option>
                  <option value="blue_water">Blue Water Engineering</option>
                  <option value="digital_marketing">Marketing Campaign</option>
                  <option value="referral">Referral / Word of mouth</option>
                  <option value="trade_show">Trade Show / Event</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="form_type" className="text-xs font-semibold">
                  Inquiry Type
                </Label>
                <select
                  id="form_type"
                  value={formData.form_type}
                  onChange={(e) => setFormData({ ...formData, form_type: e.target.value })}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-primary font-medium cursor-pointer"
                >
                  <option value="quote_request">Quote Request</option>
                  <option value="demo_request">Demo Request</option>
                  <option value="book_repair">Repair / Service</option>
                  <option value="contact_form">General Inquiry</option>
                  <option value="manual_entry">Direct Sales Opportunity</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="lifecycle_stage" className="text-xs font-semibold">
                  Initial Stage
                </Label>
                <select
                  id="lifecycle_stage"
                  value={formData.lifecycle_stage}
                  onChange={(e) => {
                    const st = e.target.value;
                    setFormData({
                      ...formData,
                      lifecycle_stage: st,
                      lead_status: st === "salesqualifiedlead" ? "Qualified" : "New"
                    });
                  }}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-primary font-medium cursor-pointer"
                >
                  <option value="lead">Inbound Lead</option>
                  <option value="salesqualifiedlead">Sales Qualified (SQL)</option>
                  <option value="opportunity">In Pipeline (Deal)</option>
                </select>
              </div>

              {owners && owners.length > 0 && (
                <div className="sm:col-span-3 space-y-1">
                  <Label htmlFor="owner_id" className="text-xs font-semibold">
                    Assigned Owner
                  </Label>
                  <select
                    id="owner_id"
                    value={formData.owner_id}
                    onChange={(e) => setFormData({ ...formData, owner_id: e.target.value })}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-primary font-medium cursor-pointer"
                  >
                    <option value="">-- Unassigned --</option>
                    {owners.map((o: any) => (
                      <option key={o.id} value={o.id}>
                        {o.name || `${o.firstname || ''} ${o.lastname || ''}`.trim()} ({o.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Equipment & Technical Specs (item_to_lift) */}
          <div className="space-y-3 pt-2 border-t">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5" />
              Equipment & Lifting Specifications
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="product" className="text-xs font-semibold">
                  Product / Equipment Interest
                </Label>
                <Input
                  id="product"
                  placeholder="e.g. VacLift 500, Waterjet, Pipeboss"
                  value={formData.product}
                  onChange={(e) => setFormData({ ...formData, product: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="item_to_lift" className="text-xs font-semibold text-primary">
                  Item to Lift / Material Description
                </Label>
                <Input
                  id="item_to_lift"
                  placeholder="e.g. Steel plates 500kg, Glass panels, Precast slab"
                  value={formData.item_to_lift}
                  onChange={(e) => setFormData({ ...formData, item_to_lift: e.target.value })}
                  className="h-9 text-xs font-medium"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="size_capacity" className="text-xs font-semibold">
                  Size / Lifting Capacity
                </Label>
                <Input
                  id="size_capacity"
                  placeholder="e.g. 500kg, 1000kg"
                  value={formData.size_capacity}
                  onChange={(e) => setFormData({ ...formData, size_capacity: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="preferred_power_source" className="text-xs font-semibold">
                  Preferred Power Source
                </Label>
                <select
                  id="preferred_power_source"
                  value={formData.preferred_power_source}
                  onChange={(e) => setFormData({ ...formData, preferred_power_source: e.target.value })}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-primary font-medium cursor-pointer"
                >
                  <option value="">-- Not specified --</option>
                  <option value="Compressed Air">Compressed Air</option>
                  <option value="Battery (12V/24V)">Battery (12V/24V)</option>
                  <option value="240V Electric">240V Electric</option>
                  <option value="Manual / Mechanical">Manual / Mechanical</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 4: Inquiry Message & Location */}
          <div className="space-y-3 pt-2 border-t">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              Requirements & Notes
            </h4>

            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="subject" className="text-xs font-semibold">
                  Subject / Summary
                </Label>
                <Input
                  id="subject"
                  placeholder="e.g. Quote requested for 500kg vacuum lifter"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="message" className="text-xs font-semibold">
                  Message / Scope Notes
                </Label>
                <Textarea
                  id="message"
                  placeholder="Enter any initial client notes, dimensions, site constraints, or customer inquiries..."
                  rows={3}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="text-xs resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="city" className="text-xs font-semibold">
                    City / Suburb
                  </Label>
                  <Input
                    id="city"
                    placeholder="e.g. Brisbane"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="country" className="text-xs font-semibold">
                    Country
                  </Label>
                  <Input
                    id="country"
                    placeholder="Australia"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="h-9 text-xs"
                  />
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <DialogFooter className="p-4 border-t bg-muted/20 flex items-center justify-between sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              resetForm();
              onOpenChange(false);
            }}
            disabled={createMutation.isPending}
            className="text-xs text-muted-foreground"
          >
            Cancel
          </Button>

          <Button
            type="submit"
            form="create-lead-form"
            size="sm"
            disabled={createMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs gap-1.5 h-9 px-4"
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating Lead...
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4" />
                Create Lead
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

