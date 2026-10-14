"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateOpportunity, updateContact } from "@/services/api";
import { mrpApi } from "@/services/mrpApi";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { 
  Building2, 
  UserCircle2, 
  Mail, 
  Phone, 
  MapPin, 
  CheckCircle2, 
  Loader2, 
  ShoppingBag,
  ArrowRight
} from "lucide-react";

interface GraduateCustomerDialogProps {
  opportunity: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (newCustomer: any) => void;
}

export default function GraduateCustomerDialog({
  opportunity,
  open,
  onOpenChange,
  onSuccess
}: GraduateCustomerDialogProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [companyName, setCompanyName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [createdCustomer, setCreatedCustomer] = useState<any | null>(null);

  useEffect(() => {
    if (opportunity && open) {
      setCompanyName(opportunity.company_name || opportunity.name || "");
      setFirstName(opportunity.contact_firstname || "");
      setLastName(opportunity.contact_lastname || "");
      setEmail(opportunity.contact_email || "");
      setPhone(opportunity.contact_phone || "");
      setAddress("");
      setCreatedCustomer(null);
    }
  }, [opportunity, open]);

  const graduateMutation = useMutation({
    mutationFn: async () => {
      if (!opportunity?.id) throw new Error("No opportunity selected");
      if (!companyName.trim()) throw new Error("Customer / Company Name is required");

      // 1. Create official MRPeasy Customer record
      const customerPayload = {
        name: companyName.trim(),
        first_name: firstName.trim() || null,
        last_name: lastName.trim() || null,
        email: email.trim() || null,
        phone: phone.trim() || null,
        address: address.trim() || null,
        status: "Active"
      };

      const custRes = await mrpApi.createCustomer(customerPayload);
      const newCust = custRes?.data;
      const customerNumber = newCust?.customer_number;

      // 2. If contact person exists, create entry in mrp_customer_contacts
      if (customerNumber && (firstName || lastName)) {
        try {
          await mrpApi.createCustomerContact(customerNumber, {
            name: `${firstName} ${lastName}`.trim(),
            phone: phone.trim() || null,
            email: email.trim() || null,
            position: "Primary Contact"
          });
        } catch (e) {
          console.error("Could not create customer contact:", e);
        }
      }

      // 3. Update Opportunity to closed_won
      await updateOpportunity(opportunity.id.toString(), {
        stage: "closed_won",
        probability: 100,
        actual_close_date: new Date().toISOString().split("T")[0],
        win_reason: "Proposal accepted - graduated to MRPeasy Customer Account"
      });

      // 4. Update Lead in contacts table to 'customer'
      if (opportunity.contact_id) {
        try {
          await updateContact(opportunity.contact_id.toString(), {
            lifecycle_stage: "customer"
          });
        } catch (e) {
          console.error("Could not update contact lifecycle stage:", e);
        }
      }

      return newCust;
    },
    onSuccess: (newCust) => {
      queryClient.invalidateQueries({ queryKey: ["mrpCustomers"] });
      queryClient.invalidateQueries({ queryKey: ["crm-opportunities"] });
      queryClient.invalidateQueries({ queryKey: ["crm-opportunity", opportunity?.id?.toString()] });
      queryClient.invalidateQueries({ queryKey: ["crm-contacts-leads"] });
      queryClient.invalidateQueries({ queryKey: ["crm-contacts"] });

      setCreatedCustomer(newCust);
      toast.success("Deal Won & Customer Account Created!", {
        description: `Customer ${newCust?.customer_number || ""} (${companyName}) is now an active MRPeasy account.`
      });
      onSuccess?.(newCust);
    },
    onError: (err: any) => {
      toast.error("Failed to graduate customer: " + (err.message || "Unknown error"));
    }
  });

  const handleGoToOrder = () => {
    onOpenChange(false);
    const cNum = createdCustomer?.customer_number || "";
    const params = new URLSearchParams();
    if (cNum) params.set("customerNumber", cNum);
    if (opportunity?.name) params.set("title", opportunity.name);
    if (opportunity?.expected_value) params.set("amount", opportunity.expected_value.toString());
    router.push(`/dashboard/mrp/crm/customer-orders/new?${params.toString()}`);
  };

  const handleGoToCustomer = () => {
    onOpenChange(false);
    const cNum = createdCustomer?.customer_number || "";
    router.push(`/dashboard/crm/contacts/${cNum}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px]">
        <DialogHeader>
          <div className="flex items-center gap-2 text-emerald-600 font-semibold text-xs tracking-wider uppercase">
            <CheckCircle2 className="h-4 w-4" />
            Deal Closed-Won
          </div>
          <DialogTitle className="text-xl">
            {createdCustomer ? "Customer Created Successfully!" : "Graduate Deal to MRPeasy Customer"}
          </DialogTitle>
          <DialogDescription>
            {createdCustomer
              ? `Account ${createdCustomer.customer_number} is ready in MRPeasy. You can now initiate manufacturing customer orders.`
              : `Convert "${opportunity?.name}" into an official customer account in the MRPeasy ERP database.`}
          </DialogDescription>
        </DialogHeader>

        {createdCustomer ? (
          <div className="space-y-4 py-2">
            <div className="p-4 rounded-xl border border-emerald-300 bg-emerald-50/70 dark:bg-emerald-950/20 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-emerald-900 dark:text-emerald-200">
                  {createdCustomer.customer_number} - {companyName}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold text-[11px]">
                  Active Customer
                </span>
              </div>
              <p className="text-emerald-700 dark:text-emerald-300">
                Contact status in CRM leads table updated to <strong>Customer</strong>. Opportunity marked as <strong>Closed-Won (100%)</strong>.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button
                type="button"
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 h-9 text-xs"
                onClick={handleGoToOrder}
              >
                <ShoppingBag className="h-4 w-4" />
                Create Customer Order
                <ArrowRight className="h-3.5 w-3.5 ml-auto" />
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-9 text-xs"
                onClick={handleGoToCustomer}
              >
                View Customer Record
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div className="grid gap-1.5">
              <Label htmlFor="grad-company" className="text-xs font-semibold">
                Customer / Company Name <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Building2 className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="grad-company"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Acme Construction Equipment"
                  className="pl-9 h-9 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="grad-first" className="text-xs font-semibold">First Name</Label>
                <Input
                  id="grad-first"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First name"
                  className="h-9 text-xs"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="grad-last" className="text-xs font-semibold">Last Name</Label>
                <Input
                  id="grad-last"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Last name"
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="grad-email" className="text-xs font-semibold">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="grad-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@company.com"
                    className="pl-9 h-9 text-xs"
                  />
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="grad-phone" className="text-xs font-semibold">Phone</Label>
                <div className="relative">
                  <Phone className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="grad-phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+61 400 000 000"
                    className="pl-9 h-9 text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="grad-address" className="text-xs font-semibold">Physical / Delivery Address</Label>
              <div className="relative">
                <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="grad-address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street address, City, State, Postcode"
                  className="pl-9 h-9 text-xs"
                />
              </div>
            </div>
          </div>
        )}

        {!createdCustomer && (
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={graduateMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
              onClick={() => graduateMutation.mutate()}
              disabled={graduateMutation.isPending || !companyName.trim()}
            >
              {graduateMutation.isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Creating Customer...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Graduate to Customer
                </>
              )}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
