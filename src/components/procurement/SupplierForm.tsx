import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

export default function SupplierForm({
  isOpen,
  onClose,
  initialData,
  onSubmit,
  isSubmitting,
}: {
  isOpen: boolean;
  onClose: () => void;
  initialData?: any;
  onSubmit: (data: any) => void;
  isSubmitting?: boolean;
}) {
  const [form, setForm] = useState({
    name: initialData?.name || "",
    contact_person: initialData?.contact_person || "",
    email: initialData?.email || "",
    phone: initialData?.phone || "",
    address: initialData?.address || "",
    city: initialData?.city || "",
    country: initialData?.country || "",
    payment_terms: initialData?.payment_terms || "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const newErrors: Record<string, string> = {};

    if (!form.name || !/^[a-zA-Z0-9\s\-\.,&']+$/.test(form.name.trim())) {
      newErrors.name = "Valid company name is required";
    }

    if (form.contact_person && !/^[a-zA-Z\s\-\.']+$/.test(form.contact_person.trim())) {
      newErrors.contact_person = "Invalid contact person name";
    }

    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      newErrors.email = "Invalid email address";
    }

    if (form.phone && !/^\+?[0-9\s\-\(\)]+$/.test(form.phone.trim())) {
      newErrors.phone = "Invalid phone number";
    }

    if (form.city && !/^[a-zA-Z\s\-\.']+$/.test(form.city.trim())) {
      newErrors.city = "Invalid city name";
    }

    if (form.country && !/^[a-zA-Z\s\-\.']+$/.test(form.country.trim())) {
      newErrors.country = "Invalid country name";
    }

    if (form.payment_terms && !/^[a-zA-Z0-9\s\-\.,]+$/.test(form.payment_terms.trim())) {
      newErrors.payment_terms = "Invalid payment terms";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit(form);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Supplier" : "New Supplier"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Company Name *</label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={errors.name ? "border-red-500 focus-visible:ring-red-500" : ""}
            />
            {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Contact Person</label>
              <Input
                value={form.contact_person}
                onChange={(e) => setForm({ ...form, contact_person: e.target.value })}
                className={errors.contact_person ? "border-red-500 focus-visible:ring-red-500" : ""}
              />
              {errors.contact_person && <p className="text-xs text-red-500">{errors.contact_person}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Phone</label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className={errors.phone ? "border-red-500 focus-visible:ring-red-500" : ""}
              />
              {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
            </div>
          </div>
          
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Email</label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className={errors.email ? "border-red-500 focus-visible:ring-red-500" : ""}
            />
            {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Address</label>
            <Input
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">City</label>
              <Input
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className={errors.city ? "border-red-500 focus-visible:ring-red-500" : ""}
              />
              {errors.city && <p className="text-xs text-red-500">{errors.city}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Country</label>
              <Input
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
                className={errors.country ? "border-red-500 focus-visible:ring-red-500" : ""}
              />
              {errors.country && <p className="text-xs text-red-500">{errors.country}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Payment Terms</label>
            <Input
              value={form.payment_terms}
              placeholder="e.g. Net 30, Due on Receipt"
              onChange={(e) => setForm({ ...form, payment_terms: e.target.value })}
              className={errors.payment_terms ? "border-red-500 focus-visible:ring-red-500" : ""}
            />
            {errors.payment_terms && <p className="text-xs text-red-500">{errors.payment_terms}</p>}
          </div>
          
          <div className="flex justify-end pt-2 gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Supplier
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
