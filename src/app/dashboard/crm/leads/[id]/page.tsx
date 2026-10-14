"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchContact, updateContact, fetchOwners } from "@/services/api";
import { RouteGuard } from "@/components/auth/RouteGuard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import ConvertLeadDialog from "@/components/crm/ConvertLeadDialog";
import DisqualifyLeadDialog from "@/components/crm/DisqualifyLeadDialog";
import { 
  ArrowLeft, 
  Building2, 
  Mail, 
  Phone, 
  UserCircle2, 
  MapPin, 
  Briefcase, 
  Sparkles, 
  Ban, 
  Save, 
  RefreshCw, 
  CheckCircle2, 
  TrendingUp,
  Clock,
  ShieldCheck,
  Globe,
  Tag,
  Wrench,
  CalendarCheck,
  FileText,
  Info
} from "lucide-react";

function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const leadId = params.id as string;

  const [convertOpen, setConvertOpen] = useState(false);
  const [disqualifyOpen, setDisqualifyOpen] = useState(false);

  const { data: contact, isLoading, error } = useQuery({
    queryKey: ["crm-contact", leadId],
    queryFn: () => fetchContact(leadId),
    enabled: !!leadId,
  });

  const { data: owners } = useQuery({
    queryKey: ["crm-owners"],
    queryFn: fetchOwners,
  });

  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    email: "",
    phone: "",
    company: "",
    lifecycle_stage: "lead",
    owner_id: "",
    source_website: "",
    form_type: "",
    subject: "",
    message: "",
    heard_from: "",
    location: "",
    city: "",
    country: "",
    product: "",
    quantity: 1,
    item_to_lift: "",
    size_capacity: "",
    preferred_power_source: "",
    lifting_options: "",
    demo_date: "",
    demo_time: "",
    serial_number: "",
    issue_description: "",
    preferred_repair_location: "",
    preferred_service_date: "",
    preferred_contact_time: "",
  });

  useEffect(() => {
    if (contact) {
      setFormData({
        firstname: contact.firstname || "",
        lastname: contact.lastname || "",
        email: contact.email || "",
        phone: contact.phone || "",
        company: contact.company_name || contact.company || "",
        lifecycle_stage: contact.lifecycle_stage || "lead",
        owner_id: contact.owner_id ? contact.owner_id.toString() : "",
        source_website: contact.source_website || "",
        form_type: contact.form_type || "",
        subject: contact.subject || "",
        message: contact.message || "",
        heard_from: contact.heard_from || "",
        location: contact.location || "",
        city: contact.city || "",
        country: contact.country || "",
        product: contact.product || "",
        quantity: contact.quantity || 1,
        item_to_lift: contact.item_to_lift || "",
        size_capacity: contact.size_capacity || "",
        preferred_power_source: contact.preferred_power_source || "",
        lifting_options: contact.lifting_options || "",
        demo_date: contact.demo_date ? String(contact.demo_date).substring(0, 10) : "",
        demo_time: contact.demo_time || "",
        serial_number: contact.serial_number || "",
        issue_description: contact.issue_description || "",
        preferred_repair_location: contact.preferred_repair_location || "",
        preferred_service_date: contact.preferred_service_date || "",
        preferred_contact_time: contact.preferred_contact_time || "",
      });
    }
  }, [contact]);

  const updateMutation = useMutation({
    mutationFn: (data: typeof formData) => updateContact(leadId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-contact", leadId] });
      queryClient.invalidateQueries({ queryKey: ["crm-contacts-leads"] });
      queryClient.invalidateQueries({ queryKey: ["crm-contacts"] });
      toast.success("Lead details saved successfully");
    },
    onError: (err: any) => {
      toast.error("Failed to save changes: " + (err.message || "Unknown error"));
    }
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const fullName = contact 
    ? `${contact.firstname || ""} ${contact.lastname || ""}`.trim() || contact.email || "Lead Details"
    : "Lead Details";

  const isCustomer = formData.lifecycle_stage === "customer";
  const isOpportunity = formData.lifecycle_stage === "opportunity";
  const isLost = formData.lifecycle_stage === "other" || formData.lifecycle_stage === "lost" || formData.lifecycle_stage === "disqualified";

  const getSourceBadge = () => {
    const s = (formData.source_website || "").toLowerCase();
    switch (s) {
      case "pipeboss":
        return <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30">Pipeboss Website</Badge>;
      case "vaclift":
        return <Badge className="bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/30">Vaclift Website</Badge>;
      case "blue_water":
        return <Badge className="bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/30">Blue Water Engineering</Badge>;
      case "digital_marketing":
        return <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30">Marketing</Badge>;
      default:
        return formData.source_website ? <Badge variant="outline">{formData.source_website}</Badge> : null;
    }
  };

  const getFormTypeBadge = () => {
    const ft = (formData.form_type || "").toLowerCase();
    switch (ft) {
      case "quote_request":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Quote Request</Badge>;
      case "demo_request":
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Demo Request</Badge>;
      case "book_repair":
        return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">Book Repair / Service</Badge>;
      case "contact_form":
        return <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-200">Contact Inquiry</Badge>;
      case "csv_import":
        return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Marketing Lead</Badge>;
      default:
        return formData.form_type ? <Badge variant="outline">{formData.form_type}</Badge> : null;
    }
  };

  const getBadge = () => {
    if (isCustomer) return <Badge className="bg-emerald-600 text-white font-medium">Customer</Badge>;
    if (isOpportunity) return <Badge className="bg-amber-600 text-white font-medium">In Pipeline (Deal)</Badge>;
    if (isLost) return <Badge variant="destructive">Disqualified / Lost</Badge>;
    if (formData.lifecycle_stage === "salesqualifiedlead") return <Badge className="bg-indigo-600 text-white">Sales Qualified (SQL)</Badge>;
    if (formData.lifecycle_stage === "marketingqualifiedlead") return <Badge className="bg-blue-600 text-white">Marketing Qualified (MQL)</Badge>;
    return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Inbound Lead</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <RefreshCw className="h-6 w-6 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground">Loading lead details...</span>
      </div>
    );
  }

  if (error || !contact) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-red-500 font-medium">Lead not found or error loading record.</p>
        <Button variant="outline" onClick={() => router.push("/dashboard/crm/leads")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Leads
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Navigation & Action Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard/crm/leads")}
            className="h-8 px-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Leads
          </Button>
          <Separator orientation="vertical" className="h-4" />
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold tracking-tight text-foreground">{fullName}</h1>
              {getBadge()}
              {getSourceBadge()}
              {getFormTypeBadge()}
            </div>
            {formData.company && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
                <Building2 className="h-3 w-3 text-muted-foreground" />
                {formData.company}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap self-end sm:self-auto">
          {!isCustomer && !isLost && (
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5 h-8 text-xs font-medium shadow-sm"
              onClick={() => setConvertOpen(true)}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Convert to Opportunity
            </Button>
          )}

          {!isLost && !isCustomer && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs text-rose-600 hover:bg-rose-50 border-rose-200"
              onClick={() => setDisqualifyOpen(true)}
            >
              <Ban className="h-3.5 w-3.5 mr-1" />
              Disqualify
            </Button>
          )}

          <Button
            size="sm"
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="h-8 gap-1.5 text-xs font-medium"
          >
            <Save className="h-3.5 w-3.5" />
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Main Content Form */}
      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">

          {/* Card 1: Website Inquiry & Technical Specifications (Unified from Website Form) */}
          <Card className="border-primary/20 shadow-sm">
            <CardHeader className="pb-3 bg-muted/20 border-b">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Globe className="h-4 w-4 text-primary" />
                  Website Inquiry & Specifications
                </CardTitle>
                <div className="flex items-center gap-1.5">
                  {getSourceBadge()}
                  {getFormTypeBadge()}
                </div>
              </div>
              <CardDescription className="text-xs">
                Inbound requirements and equipment specs submitted through website forms or digital marketing.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              {/* Subject & Inbound Message */}
              {(formData.subject || formData.message) && (
                <div className="space-y-3 p-3.5 rounded-lg bg-muted/40 border text-xs">
                  {formData.subject && (
                    <div>
                      <span className="font-semibold text-foreground">Inquiry Subject: </span>
                      <span className="text-foreground">{formData.subject}</span>
                    </div>
                  )}
                  {formData.message && (
                    <div>
                      <span className="font-semibold text-foreground block mb-1">Customer Message / Requirements:</span>
                      <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed bg-background p-2.5 rounded border">
                        {formData.message}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Inquiry Specification Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <Label htmlFor="product" className="text-xs font-semibold">Product / Equipment Interest</Label>
                  <Input
                    id="product"
                    value={formData.product}
                    onChange={(e) => setFormData({ ...formData, product: e.target.value })}
                    className="h-9 text-xs"
                    placeholder="e.g. VacLift 500, Waterjet, Pipeboss"
                  />
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="quantity" className="text-xs font-semibold">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                    className="h-9 text-xs"
                    placeholder="1"
                  />
                </div>

                {formData.item_to_lift && (
                  <div className="grid gap-1.5">
                    <Label htmlFor="item_to_lift" className="text-xs font-semibold">Item To Lift / Material</Label>
                    <Input
                      id="item_to_lift"
                      value={formData.item_to_lift}
                      onChange={(e) => setFormData({ ...formData, item_to_lift: e.target.value })}
                      className="h-9 text-xs"
                      placeholder="e.g. Glass, Steel Plates"
                    />
                  </div>
                )}

                {formData.size_capacity && (
                  <div className="grid gap-1.5">
                    <Label htmlFor="size_capacity" className="text-xs font-semibold">Size / Lifting Capacity</Label>
                    <Input
                      id="size_capacity"
                      value={formData.size_capacity}
                      onChange={(e) => setFormData({ ...formData, size_capacity: e.target.value })}
                      className="h-9 text-xs"
                      placeholder="e.g. 500kg, 1000kg"
                    />
                  </div>
                )}

                {formData.preferred_power_source && (
                  <div className="grid gap-1.5">
                    <Label htmlFor="power_source" className="text-xs font-semibold">Preferred Power Source</Label>
                    <Input
                      id="power_source"
                      value={formData.preferred_power_source}
                      onChange={(e) => setFormData({ ...formData, preferred_power_source: e.target.value })}
                      className="h-9 text-xs"
                    />
                  </div>
                )}

                {formData.lifting_options && (
                  <div className="grid gap-1.5">
                    <Label htmlFor="lifting_options" className="text-xs font-semibold">Lifting Options</Label>
                    <Input
                      id="lifting_options"
                      value={formData.lifting_options}
                      onChange={(e) => setFormData({ ...formData, lifting_options: e.target.value })}
                      className="h-9 text-xs"
                    />
                  </div>
                )}
              </div>

              {/* Demo / Repair Details if present */}
              {(formData.demo_date || formData.serial_number || formData.preferred_service_date || formData.location) && (
                <div className="pt-2 border-t space-y-3">
                  <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <CalendarCheck className="h-3.5 w-3.5 text-primary" />
                    Demo & Service Logistics
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    {formData.demo_date && (
                      <div className="grid gap-1.5">
                        <Label htmlFor="demo_date" className="text-xs font-semibold">Requested Demo Date</Label>
                        <Input
                          id="demo_date"
                          type="date"
                          value={formData.demo_date}
                          onChange={(e) => setFormData({ ...formData, demo_date: e.target.value })}
                          className="h-9 text-xs"
                        />
                      </div>
                    )}
                    {formData.demo_time && (
                      <div className="grid gap-1.5">
                        <Label htmlFor="demo_time" className="text-xs font-semibold">Preferred Time</Label>
                        <Input
                          id="demo_time"
                          value={formData.demo_time}
                          onChange={(e) => setFormData({ ...formData, demo_time: e.target.value })}
                          className="h-9 text-xs"
                        />
                      </div>
                    )}
                    {formData.serial_number && (
                      <div className="grid gap-1.5">
                        <Label htmlFor="serial_number" className="text-xs font-semibold">Equipment Serial #</Label>
                        <Input
                          id="serial_number"
                          value={formData.serial_number}
                          onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                          className="h-9 text-xs"
                        />
                      </div>
                    )}
                    {formData.preferred_service_date && (
                      <div className="grid gap-1.5">
                        <Label htmlFor="service_date" className="text-xs font-semibold">Preferred Service Date</Label>
                        <Input
                          id="service_date"
                          value={formData.preferred_service_date}
                          onChange={(e) => setFormData({ ...formData, preferred_service_date: e.target.value })}
                          className="h-9 text-xs"
                        />
                      </div>
                    )}
                    {formData.location && (
                      <div className="grid gap-1.5 sm:col-span-2">
                        <Label htmlFor="location" className="text-xs font-semibold">Location / Site Address</Label>
                        <Input
                          id="location"
                          value={formData.location}
                          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                          className="h-9 text-xs"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card 2: Contact Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <UserCircle2 className="h-4 w-4 text-blue-600" />
                Contact Profile
              </CardTitle>
              <CardDescription className="text-xs">
                Essential contact credentials captured from inbound interaction.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <Label htmlFor="firstname" className="text-xs font-semibold">First Name</Label>
                  <Input
                    id="firstname"
                    value={formData.firstname}
                    onChange={(e) => setFormData({ ...formData, firstname: e.target.value })}
                    className="h-9 text-xs"
                    placeholder="First name"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="lastname" className="text-xs font-semibold">Last Name</Label>
                  <Input
                    id="lastname"
                    value={formData.lastname}
                    onChange={(e) => setFormData({ ...formData, lastname: e.target.value })}
                    className="h-9 text-xs"
                    placeholder="Last name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <Label htmlFor="email" className="text-xs font-semibold">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="pl-9 h-9 text-xs"
                      placeholder="email@example.com"
                    />
                  </div>
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="phone" className="text-xs font-semibold">Phone / Mobile</Label>
                  <div className="relative">
                    <Phone className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="pl-9 h-9 text-xs"
                      placeholder="+61 400 000 000"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Company & Business Details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                Company & Business Information
              </CardTitle>
              <CardDescription className="text-xs">
                Business details that will graduate into MRPeasy ERP customer records once won.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-1.5">
                <Label htmlFor="company" className="text-xs font-semibold">Company / Trading Name</Label>
                <div className="relative">
                  <Building2 className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="company"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="pl-9 h-9 text-xs"
                    placeholder="e.g. Acme Construction Supplies Pty Ltd"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 4: Lead Qualification & Lifecycle Stage */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Sales Qualification & Lifecycle Stage
              </CardTitle>
              <CardDescription className="text-xs">
                Manage lead status, qualification progression, and sales ownership.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <Label htmlFor="stage" className="text-xs font-semibold">Current Lifecycle Stage</Label>
                  <select
                    id="stage"
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-primary font-medium"
                    value={formData.lifecycle_stage}
                    onChange={(e) => setFormData({ ...formData, lifecycle_stage: e.target.value })}
                  >
                    <option value="lead">Inbound Lead (New Inquiry)</option>
                    <option value="marketingqualifiedlead">Marketing Qualified Lead (MQL)</option>
                    <option value="salesqualifiedlead">Sales Qualified Lead (SQL - Ready to Quote)</option>
                    <option value="opportunity">In Pipeline (Active Deal)</option>
                    <option value="customer">Customer (Won & Active)</option>
                    <option value="other">Disqualified / Lost</option>
                  </select>
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="owner" className="text-xs font-semibold">Assigned Sales Rep</Label>
                  <select
                    id="owner"
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    value={formData.owner_id}
                    onChange={(e) => setFormData({ ...formData, owner_id: e.target.value })}
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

              {isLost && (
                <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 text-xs text-rose-700 dark:text-rose-300 space-y-1">
                  <p className="font-semibold flex items-center gap-1.5">
                    <Ban className="h-3.5 w-3.5 text-rose-600" />
                    This lead is currently flagged as Disqualified / Lost.
                  </p>
                  <p className="text-[11px] text-rose-600 dark:text-rose-400">
                    You can change the lifecycle stage above at any time if the client re-engages.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Actions, Timeline & Pipeline Records */}
        <div className="space-y-6">
          {/* Conversion Action Widget */}
          <Card className="border-blue-200/80 bg-blue-50/30 dark:bg-blue-950/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-1.5 text-blue-700 dark:text-blue-300">
                <Sparkles className="h-4 w-4 text-blue-600" />
                Pipeline Progression
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              {isCustomer ? (
                <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 text-emerald-800 dark:text-emerald-300 space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-sm">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    Official Customer Account
                  </div>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                    This lead won a deal and graduated to an active MRPeasy customer account.
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8"
                    onClick={() => router.push("/dashboard/crm/contacts")}
                  >
                    View in Customer Accounts
                  </Button>
                </div>
              ) : isOpportunity ? (
                <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 text-amber-800 dark:text-amber-300 space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-sm">
                    <TrendingUp className="h-4 w-4 text-amber-600" />
                    Active in Sales Pipeline
                  </div>
                  <p className="text-[11px] text-amber-700 dark:text-amber-400">
                    This lead is being actively negotiated as an opportunity in your pipeline.
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white text-xs h-8"
                    onClick={() => router.push("/dashboard/crm/opportunities")}
                  >
                    Open Opportunity Pipeline
                  </Button>
                </div>
              ) : isLost ? (
                <div className="p-3 rounded-lg bg-muted text-muted-foreground space-y-2">
                  <p className="font-semibold text-foreground">Lead Disqualified</p>
                  <p className="text-[11px]">
                    To reopen, set stage to "Inbound Lead" or "Sales Qualified" and click "Convert to Opportunity".
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-muted-foreground text-[11px] leading-relaxed">
                    Convert this lead when initial interest is qualified and ready for quotation or pipeline management.
                  </p>
                  <Button
                    type="button"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold h-8 shadow-sm"
                    onClick={() => setConvertOpen(true)}
                  >
                    <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                    Convert to Opportunity
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Info & Audit Details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Audit Trail & Origin
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-1 border-b">
                <span className="text-muted-foreground">Source Website</span>
                <span className="font-medium text-foreground">{formData.source_website || "Direct"}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b">
                <span className="text-muted-foreground">Form Type</span>
                <span className="font-medium text-foreground">{formData.form_type || "Contact"}</span>
              </div>
              {formData.heard_from && (
                <div className="flex justify-between items-center py-1 border-b">
                  <span className="text-muted-foreground">Discovered From</span>
                  <span className="font-medium text-foreground">{formData.heard_from}</span>
                </div>
              )}
              {formData.city && (
                <div className="flex justify-between items-center py-1 border-b">
                  <span className="text-muted-foreground">City / Country</span>
                  <span className="font-medium text-foreground">{formData.city} {formData.country ? `(${formData.country})` : ''}</span>
                </div>
              )}
              <div className="flex justify-between items-center py-1 border-b">
                <span className="text-muted-foreground">Contact Record ID</span>
                <span className="font-mono text-xs">{contact.id}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b">
                <span className="text-muted-foreground">Created On</span>
                <span>{contact.createdate ? new Date(contact.createdate).toLocaleDateString() : "-"}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-muted-foreground">Last Modified</span>
                <span>{contact.lastmodifieddate ? new Date(contact.lastmodifieddate).toLocaleDateString() : "-"}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>

      {/* Convert lead to opportunity dialog */}
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
    </div>
  );
}

export default function LeadDetailPageGuarded() {
  return (
    <RouteGuard module="crm">
      <LeadDetailPage />
    </RouteGuard>
  );
}
