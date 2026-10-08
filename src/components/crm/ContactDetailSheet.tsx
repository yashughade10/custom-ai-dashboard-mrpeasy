import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchContact, updateContact } from "@/services/api";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { UserCircle, Building2, Briefcase, Phone, Mail, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

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

  useEffect(() => {
    if (contact) {
      setEditData({
        firstname: contact.firstname || "",
        lastname: contact.lastname || "",
        lifecycle_stage: contact.lifecycle_stage || ""
      });
    }
  }, [contact]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => updateContact(contactId as string, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-contact", contactId] });
      queryClient.invalidateQueries({ queryKey: ["crm-contacts"] });
      toast.success("Contact updated successfully");
      setIsEditing(false);
    },
    onError: (error) => {
      toast.error("Failed to update contact: " + error.message);
    }
  });

  const handleSave = () => {
    updateMutation.mutate(editData);
  };

  return (
    <Sheet open={open} onOpenChange={(val) => {
      if (!val) setIsEditing(false);
      onOpenChange(val);
    }}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto p-0 flex flex-col">
        <SheetHeader className="px-6 pt-6 pb-2">
          <SheetTitle>Contact Details</SheetTitle>
          <SheetDescription>View information and associated records.</SheetDescription>
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
          <div className="px-6 pb-6 mt-4 space-y-8 animate-in slide-in-from-right-4 fade-in duration-300">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">{isEditing ? "Edit Contact" : "Contact Overview"}</h2>
              {!isEditing && (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>Edit</Button>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-4 pt-4">
                <div className="grid gap-2">
                  <Label htmlFor="firstname">First Name</Label>
                  <Input id="firstname" value={editData.firstname} onChange={(e) => setEditData({...editData, firstname: e.target.value})} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="lastname">Last Name</Label>
                  <Input id="lastname" value={editData.lastname} onChange={(e) => setEditData({...editData, lastname: e.target.value})} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="lifecycle_stage">Lifecycle Stage</Label>
                  <select 
                    id="lifecycle_stage"
                    className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    value={editData.lifecycle_stage}
                    onChange={(e) => setEditData({...editData, lifecycle_stage: e.target.value})}
                  >
                    <option value="">None</option>
                    <option value="subscriber">Subscriber</option>
                    <option value="lead">Lead</option>
                    <option value="marketingqualifiedlead">Marketing Qualified Lead</option>
                    <option value="salesqualifiedlead">Sales Qualified Lead</option>
                    <option value="opportunity">Opportunity</option>
                    <option value="customer">Customer</option>
                    <option value="evangelist">Evangelist</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                  <Button onClick={handleSave} disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? "Saving..." : "Save"}
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
                    <Badge variant={contact.lifecycle_stage ? "default" : "outline"} className="capitalize">
                      {contact.lifecycle_stage || "None"}
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
                    <span className="text-sm font-medium">{contact.company_name || "None"}</span>
                  </div>
                </div>

                <Separator />

                <div className="pt-2">
                  <div className="flex items-center gap-2 mb-4">
                    <Briefcase className="h-5 w-5 text-primary" />
                    <h4 className="font-semibold text-lg tracking-tight">Associated Deals</h4>
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
                      <p className="text-sm text-muted-foreground font-medium">No deals associated with this contact.</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
