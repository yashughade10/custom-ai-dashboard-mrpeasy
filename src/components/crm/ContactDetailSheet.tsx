"use client";

import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchContact, updateContact, fetchOwners } from "@/services/api";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { UserCircle, Building2, Briefcase, Phone, Mail, Hash, Sparkles, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import ConvertLeadDialog from "./ConvertLeadDialog";
import DisqualifyLeadDialog from "./DisqualifyLeadDialog";

type ContactDetailSheetProps = {
  contactId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialEditMode?: boolean;
};

export default function ContactDetailSheet({ contactId, open, onOpenChange, initialEditMode }: ContactDetailSheetProps) {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const [convertOpen, setConvertOpen] = useState(false);
  const [disqualifyOpen, setDisqualifyOpen] = useState(false);

  useEffect(() => {
    if (open) {
      setIsEditing(!!initialEditMode);
    }
  }, [open, initialEditMode]);

  const { data: contact, isLoading, error } = useQuery({
    queryKey: ["crm-contact", contactId],
    queryFn: () => fetchContact(contactId as string),
    enabled: !!contactId,
  });

  const { data: owners } = useQuery({
    queryKey: ["crm-owners"],
    queryFn: fetchOwners,
    enabled: open,
  });

  useEffect(() => {
    if (contact) {
      setEditData({
        firstname: contact.firstname || "",
        lastname: contact.lastname || "",
        email: contact.email || "",
        phone: contact.phone || "",
        lifecycle_stage: contact.lifecycle_stage || "",
        owner_id: contact.owner_id || ""
      });
    }
  }, [contact]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => updateContact(contactId as string, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-contact", contactId] });
      queryClient.invalidateQueries({ queryKey: ["crm-contacts-leads"] });
      queryClient.invalidateQueries({ queryKey: ["crm-contacts"] });
      toast.success("Lead details updated successfully");
      setIsEditing(false);
    },
    onError: (error) => {
      toast.error("Failed to update contact: " + error.message);
    }
  });

  const handleSave = () => {
    updateMutation.mutate(editData);
  };

  const isCustomer = contact?.lifecycle_stage === "customer";
  const isLost = contact?.lifecycle_stage === "other" || contact?.lifecycle_stage === "lost" || contact?.lifecycle_stage === "disqualified";

  return (
    <Sheet open={open} onOpenChange={(val) => {
      if (!val) setIsEditing(false);
      onOpenChange(val);
    }}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto p-0 flex flex-col">
        <SheetHeader className="px-6 pt-6 pb-2">
          <SheetTitle>Lead & Contact Details</SheetTitle>
          <SheetDescription>View information, edit profile, and advance lifecycle stages.</SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <div className="px-6 pb-6 mt-4 space-y-8 animate-in fade-in duration-300">
            <div className="flex items-center gap-4">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-6 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
            <div className="space-y-4 pt-4">
              <div className="flex justify-between items-center"><Skeleton className="h-4 w-1/3" /><Skeleton className="h-6 w-1/4 rounded-full" /></div>
              <div className="flex justify-between items-center"><Skeleton className="h-4 w-1/3" /><Skeleton className="h-4 w-1/4" /></div>
              <div className="flex justify-between items-center"><Skeleton className="h-4 w-1/3" /><Skeleton className="h-4 w-1/4" /></div>
            </div>
            <Separator />
            <div className="space-y-3 pt-2">
              <Skeleton className="h-5 w-1/3 mb-4" />
              <Skeleton className="h-20 w-full rounded-xl" />
              <Skeleton className="h-20 w-full rounded-xl" />
            </div>
          </div>
        ) : error ? (
          <div className="px-6 py-8 text-center text-red-500">
            <p className="font-medium">Failed to load contact details.</p>
            <p className="text-sm text-muted-foreground mt-1">Please try again later.</p>
          </div>
        ) : contact ? (
          <div className="px-6 pb-6 mt-4 space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{isEditing ? "Edit Lead Profile" : "Lead Overview"}</h2>
              {!isEditing && (
                <div className="flex items-center gap-1.5">
                  {!isCustomer && !isLost && (
                    <Button
                      size="sm"
                      className="h-8 px-2.5 bg-blue-600 hover:bg-blue-700 text-white gap-1 text-xs shadow-sm font-medium"
                      onClick={() => setConvertOpen(true)}
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      Convert
                    </Button>
                  )}
                  {!isLost && !isCustomer && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-2 text-xs text-rose-600 hover:bg-rose-50 border-rose-200"
                      onClick={() => setDisqualifyOpen(true)}
                    >
                      <Ban className="h-3 w-3 mr-1" />
                      Disqualify
                    </Button>
                  )}
                  <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setIsEditing(true)}>Edit</Button>
                </div>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-4 pt-1">
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1.5">
                    <Label htmlFor="firstname" className="text-xs font-semibold">First Name</Label>
                    <Input id="firstname" value={editData.firstname} onChange={(e) => setEditData({...editData, firstname: e.target.value})} className="h-9 text-xs" />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="lastname" className="text-xs font-semibold">Last Name</Label>
                    <Input id="lastname" value={editData.lastname} onChange={(e) => setEditData({...editData, lastname: e.target.value})} className="h-9 text-xs" />
                  </div>
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="email" className="text-xs font-semibold">Email</Label>
                  <Input id="email" type="email" value={editData.email} onChange={(e) => setEditData({...editData, email: e.target.value})} className="h-9 text-xs" />
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="phone" className="text-xs font-semibold">Phone</Label>
                  <Input id="phone" value={editData.phone} onChange={(e) => setEditData({...editData, phone: e.target.value})} className="h-9 text-xs" />
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="lifecycle_stage" className="text-xs font-semibold">Lifecycle Stage</Label>
                  <select 
                    id="lifecycle_stage"
                    className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-1.5 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    value={editData.lifecycle_stage}
                    onChange={(e) => setEditData({...editData, lifecycle_stage: e.target.value})}
                  >
                    <option value="lead">Inbound Lead</option>
                    <option value="marketingqualifiedlead">Marketing Qualified Lead (MQL)</option>
                    <option value="salesqualifiedlead">Sales Qualified Lead (SQL)</option>
                    <option value="opportunity">In Pipeline (Opportunity)</option>
                    <option value="customer">Customer</option>
                    <option value="other">Disqualified / Lost</option>
                  </select>
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="owner_id" className="text-xs font-semibold">Assigned Owner</Label>
                  <select
                    id="owner_id"
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    value={editData.owner_id || ""}
                    onChange={(e) => setEditData({...editData, owner_id: e.target.value})}
                  >
                    <option value="">Unassigned</option>
                    {owners?.map((o: any) => (
                      <option key={o.id} value={o.id.toString()}>
                        {o.firstname} {o.lastname}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-3">
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>Cancel</Button>
                  <Button size="sm" onClick={handleSave} disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-start gap-4">
                  <div className="h-16 w-16 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <span className="text-2xl font-bold uppercase">
                      {contact.firstname?.[0] || ""}{contact.lastname?.[0] || ""}
                    </span>
                  </div>
                  <div className="space-y-1 mt-1">
                    <h3 className="text-2xl font-semibold tracking-tight">{contact.firstname} {contact.lastname}</h3>
                    <div className="flex items-center gap-2 text-muted-foreground mt-1 text-sm">
                      <Mail className="h-3.5 w-3.5" />
                      <span>{contact.email}</span>
                    </div>
                    {contact.phone && (
                      <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <Phone className="h-3.5 w-3.5" />
                        <span>{contact.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4 rounded-xl border bg-card/50 p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Hash className="h-4 w-4" />
                      <span className="text-sm font-medium">Lifecycle Stage</span>
                    </div>
                    <Badge variant={isLost ? "destructive" : isCustomer ? "default" : "outline"} className="capitalize text-xs">
                      {isLost ? "Disqualified" : contact.lifecycle_stage || "Lead"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <UserCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">Owner</span>
                    </div>
                    <span className="text-sm font-medium">{contact.owner_name || "Unassigned"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Building2 className="h-4 w-4" />
                      <span className="text-sm font-medium">Company</span>
                    </div>
                    <span className="text-sm font-medium">{contact.company_name || contact.company || "None"}</span>
                  </div>
                </div>

                <Separator />

                <div className="pt-2">
                  <div className="flex items-center gap-2 mb-4">
                    <Briefcase className="h-5 w-5 text-primary" />
                    <h4 className="font-semibold text-lg tracking-tight">Associated Deals & Pipeline</h4>
                  </div>
                  {contact.deals && contact.deals.length > 0 ? (
                    <div className="space-y-3">
                      {contact.deals.map((deal: any) => (
                        <div key={deal.id} className="p-4 border rounded-xl bg-card transition-colors hover:bg-accent/40 group">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-sm group-hover:text-primary transition-colors">{deal.dealname}</span>
                            <span className="text-sm font-semibold text-primary">
                              ${Number(deal.amount).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center justify-between mt-3">
                            <Badge variant="secondary" className="text-xs font-normal bg-secondary/50 capitalize">
                              {deal.dealstage?.replace(/_/g, ' ') || 'Unknown'}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                              {deal.pipeline || 'Sales Pipeline'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 rounded-xl border border-dashed bg-muted/20">
                      <Briefcase className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                      <p className="text-sm text-muted-foreground font-medium">No active deals yet.</p>
                      {!isCustomer && !isLost && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-3 text-xs text-blue-600 border-blue-200"
                          onClick={() => setConvertOpen(true)}
                        >
                          Convert to Opportunity
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        ) : null}

        {/* Convert lead dialog */}
        <ConvertLeadDialog
          contact={contact}
          open={convertOpen}
          onOpenChange={setConvertOpen}
        />

        {/* Disqualify lead dialog */}
        <DisqualifyLeadDialog
          contact={contact}
          open={disqualifyOpen}
          onOpenChange={setDisqualifyOpen}
        />
      </SheetContent>
    </Sheet>
  );
}
