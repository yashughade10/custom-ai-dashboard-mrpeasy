"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchContact, updateContact, fetchOwners, fetchActivities } from "@/services/api";
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
import LeadLifecycleHistoryTimeline from "@/components/crm/LeadLifecycleHistoryTimeline";
import { 
  ArrowLeft, 
  Building2, 
  Mail, 
  Phone, 
  PhoneCall,
  UserCircle2, 
  MapPin, 
  Briefcase, 
  Sparkles, 
  Ban, 
  RotateCcw,
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
  Info,
  Loader2,
  AlertTriangle,
  AlertCircle
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import LogCallDialog from "@/components/crm/LogCallDialog";

function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const leadId = params.id as string;

  const [convertOpen, setConvertOpen] = useState(false);
  const [disqualifyOpen, setDisqualifyOpen] = useState(false);
  const [callDialogOpen, setCallDialogOpen] = useState(false);
  const [loadingSeconds, setLoadingSeconds] = useState(0);

  const { data: contact, isLoading, error } = useQuery({
    queryKey: ["crm-contact", leadId],
    queryFn: () => fetchContact(leadId),
    enabled: !!leadId,
  });

  const { data: owners } = useQuery({
    queryKey: ["crm-owners"],
    queryFn: fetchOwners,
  });

  const { data: callHistoryData, isLoading: isLoadingCalls } = useQuery({
    queryKey: ["crm-contact-call-history", leadId],
    queryFn: () => fetchActivities({ contact_id: leadId, type: "call" }),
    enabled: !!leadId,
    staleTime: 5 * 1000
  });
  const callHistory = Array.isArray(callHistoryData?.data)
    ? callHistoryData.data
    : Array.isArray(callHistoryData?.activities)
    ? callHistoryData.activities
    : [];

  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    email: "",
    phone: "",
    company: "",
    lifecycle_stage: "lead",
    lead_status: "New",
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
    let interval: NodeJS.Timeout | null = null;
    if (isLoading) {
      interval = setInterval(() => {
        setLoadingSeconds((s) => s + 1);
      }, 1000);
    } else {
      setLoadingSeconds(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLoading]);

  useEffect(() => {
    if (contact) {
      setFormData({
        firstname: contact.firstname || "",
        lastname: contact.lastname || "",
        email: contact.email || "",
        phone: contact.phone || "",
        company: contact.company_name || contact.company || "",
        lifecycle_stage: contact.lifecycle_stage || "lead",
        lead_status: contact.lead_status || "New",
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
        item_to_lift: contact.item_to_lift || contact.itemToLift || "",
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
  const isLost = formData.lifecycle_stage === "other" || formData.lifecycle_stage === "lost" || formData.lifecycle_stage === "disqualified" || formData.lifecycle_stage === "spam" || formData.lead_status === "Spam" || formData.lead_status === "Disqualified";
  const isQualified = formData.lifecycle_stage === "salesqualifiedlead" || formData.lifecycle_stage === "marketingqualifiedlead";
  const isUnactioned = !isCustomer && !isLost && !isOpportunity && !isQualified;

  const leadDate = contact?.createdate || contact?.lastmodifieddate;
  const leadCreatedTime = leadDate ? new Date(leadDate).getTime() : 0;
  const leadIdleHours = leadCreatedTime ? (Date.now() - leadCreatedTime) / (1000 * 60 * 60) : 0;
  const leadIdleDays = Math.floor(leadIdleHours / 24);

  const qualifyMutation = useMutation({
    mutationFn: (toQualified: boolean) =>
      updateContact(leadId, {
        lifecycle_stage: toQualified ? "salesqualifiedlead" : "lead",
        lead_status: toQualified ? "Qualified" : "New",
        change_reason: toQualified ? "Marked lead as Qualified (SQL)" : "Reverted lead to Inbound Lead"
      }),
    onSuccess: (_, toQualified) => {
      queryClient.invalidateQueries({ queryKey: ["crm-contact", leadId] });
      queryClient.invalidateQueries({ queryKey: ["crm-contacts-leads"] });
      queryClient.invalidateQueries({ queryKey: ["crm-contacts"] });
      setFormData(prev => ({
        ...prev,
        lifecycle_stage: toQualified ? "salesqualifiedlead" : "lead"
      }));
      toast.success(
        toQualified 
          ? "Lead marked as Qualified! Automated acknowledgment sent & CC'd to sales." 
          : "Lead moved back to Inbound Lead"
      );
    },
    onError: (err: any) => {
      toast.error("Failed to update lead: " + (err.message || "Unknown error"));
    }
  });

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
    if (isLost) return <Badge variant="destructive">Spam / Disqualified</Badge>;
    if (formData.lifecycle_stage === "salesqualifiedlead") return <Badge className="bg-indigo-600 text-white">Sales Qualified (SQL)</Badge>;
    if (formData.lifecycle_stage === "marketingqualifiedlead") return <Badge className="bg-blue-600 text-white">Marketing Qualified (MQL)</Badge>;
    return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Inbound Lead</Badge>;
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in-50 duration-300">
        {/* Top Banner Loader for slow network / backend wake-up */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-primary shrink-0" />
            <div>
              <p className="text-sm font-semibold text-foreground">
                {loadingSeconds > 10
                  ? "Cloud server is spinning up & querying database..."
                  : loadingSeconds > 3
                  ? "Retrieving lead record from database..."
                  : "Loading Lead Details..."}
              </p>
              <p className="text-xs text-muted-foreground">
                {loadingSeconds > 10
                  ? "The backend is on cloud hosting (Render) and initializing connection. Thank you for your patience."
                  : "Connecting to CRM database. Please wait a moment."}
              </p>
            </div>
          </div>
          {loadingSeconds > 2 && (
            <Badge variant="outline" className="text-xs font-mono bg-background">
              {loadingSeconds}s
            </Badge>
          )}
        </div>

        {/* Header skeleton */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-9 w-28" />
          </div>
        </div>

        {/* Main Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left column */}
          <div className="lg:col-span-8 space-y-6">
            <div className="border rounded-lg p-6 space-y-4 bg-card shadow-sm">
              <div className="space-y-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-72" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
              <Skeleton className="h-28 w-full" />
            </div>

            <div className="border rounded-lg p-6 space-y-4 bg-card shadow-sm">
              <div className="space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-60" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="lg:col-span-4 space-y-6">
            <div className="border rounded-lg p-6 space-y-4 bg-card shadow-sm">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-9 w-full" />
            </div>

            <div className="border rounded-lg p-6 space-y-4 bg-card shadow-sm">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-10 w-full" />
            </div>

            <div className="border rounded-lg p-6 space-y-4 bg-card shadow-sm">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          </div>
        </div>
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

        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          {/* Call button */}
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs font-semibold gap-1.5 text-emerald-700 bg-emerald-50/70 hover:bg-emerald-100 hover:text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300 flex-1 sm:flex-initial justify-center shadow-sm"
            onClick={() => setCallDialogOpen(true)}
            title={contact?.phone ? `Call ${contact.phone}` : "Log Phone Call"}
          >
            <PhoneCall className="h-3.5 w-3.5 text-emerald-600" />
            Call
          </Button>

          {!isCustomer && !isLost && !isOpportunity && (
            <Button
              size="sm"
              variant="outline"
              className={cn(
                "h-8 text-xs font-medium gap-1.5 transition-colors flex-1 sm:flex-initial justify-center",
                isQualified
                  ? "text-indigo-700 bg-indigo-50/70 hover:bg-indigo-100 border-indigo-300 dark:bg-indigo-950/40 dark:border-indigo-800"
                  : "text-indigo-700 hover:bg-indigo-50 border-indigo-200 dark:border-indigo-800"
              )}
              disabled={qualifyMutation.isPending}
              onClick={() => qualifyMutation.mutate(!isQualified)}
            >
              <ShieldCheck className="h-3.5 w-3.5 text-indigo-600" />
              {isQualified ? "Qualified" : "Mark Qualified"}
            </Button>
          )}

          {!isCustomer && !isLost && (
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5 h-8 text-xs font-medium shadow-sm flex-1 sm:flex-initial justify-center"
              onClick={() => setConvertOpen(true)}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Convert
            </Button>
          )}

          {isLost ? (
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs text-emerald-700 bg-emerald-50/70 hover:bg-emerald-100 border-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300 flex-1 sm:flex-initial justify-center"
              onClick={() => {
                updateContact(leadId, {
                  lifecycle_stage: "lead",
                  lead_status: "New",
                  change_reason: "Marked as Not Spam / Restored to Lead"
                }).then(() => {
                  queryClient.invalidateQueries({ queryKey: ["crm-contact", leadId] });
                  queryClient.invalidateQueries({ queryKey: ["crm-contacts-leads"] });
                  queryClient.invalidateQueries({ queryKey: ["crm-contacts"] });
                  setFormData(prev => ({ ...prev, lifecycle_stage: "lead", lead_status: "New" }));
                  toast.success("Lead marked as Not Spam and restored to Leads!");
                }).catch(err => {
                  toast.error("Failed to restore lead: " + (err.message || "Unknown error"));
                });
              }}
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1" />
              Not Spam
            </Button>
          ) : !isCustomer && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs text-rose-600 hover:bg-rose-50 border-rose-200 flex-1 sm:flex-initial justify-center"
              onClick={() => setDisqualifyOpen(true)}
              title="Mark Lead as Spam"
            >
              <Ban className="h-3.5 w-3.5 mr-1" />
              Spam
            </Button>
          )}

          <Button
            size="sm"
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="h-8 gap-1.5 text-xs font-medium flex-1 sm:flex-initial justify-center"
          >
            <Save className="h-3.5 w-3.5" />
            {updateMutation.isPending ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      {/* Un-actioned Lead Alert Banner */}
      {isUnactioned && (
        <div
          className={cn(
            "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-lg border shadow-sm transition-all",
            leadIdleDays >= 3
              ? "bg-rose-500/10 border-rose-500/30 text-rose-950 dark:text-rose-200"
              : leadIdleDays >= 1
              ? "bg-amber-500/10 border-amber-500/30 text-amber-950 dark:text-amber-200"
              : "bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-200"
          )}
        >
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2 rounded-full bg-background/80 shadow-xs shrink-0">
              {leadIdleDays >= 3 ? (
                <AlertCircle className="h-5 w-5 text-rose-600 dark:text-rose-400" />
              ) : leadIdleDays >= 1 ? (
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              ) : (
                <Clock className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              )}
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold flex items-center gap-2">
                <span>
                  {leadIdleDays >= 3
                    ? `🚨 Overdue Attention Required — Idle for ${leadIdleDays} days with no action taken`
                    : leadIdleDays >= 1
                    ? `⚠️ Action Needed — Lead received ${leadIdleDays} day${leadIdleDays > 1 ? "s" : ""} ago and is awaiting qualification`
                    : "✨ New Inbound Lead — Received today and ready for qualification"}
                </span>
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Take action on this inquiry: mark as qualified, convert into an opportunity deal, or disqualify if invalid.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-start sm:justify-end pt-1 sm:pt-0">
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs bg-background/80 hover:bg-background border-border/80 font-medium text-indigo-700 dark:text-indigo-300 flex-1 sm:flex-initial justify-center"
              disabled={qualifyMutation.isPending}
              onClick={() => qualifyMutation.mutate(true)}
            >
              <ShieldCheck className="h-3.5 w-3.5 mr-1 text-indigo-600" />
              Qualify Lead
            </Button>
            <Button
              size="sm"
              className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm flex-1 sm:flex-initial justify-center"
              onClick={() => setConvertOpen(true)}
            >
              <Sparkles className="h-3.5 w-3.5 mr-1" />
              Convert
            </Button>
          </div>
        </div>
      )}

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
              {/* Subject & Inbound Message / Description */}
              {(formData.subject || formData.message || formData.item_to_lift) && (
                <div className="space-y-3 p-3.5 rounded-lg bg-muted/40 border text-xs">
                  {formData.subject && (
                    <div>
                      <span className="font-semibold text-foreground">Inquiry Subject: </span>
                      <span className="text-foreground">{formData.subject}</span>
                    </div>
                  )}
                  {formData.item_to_lift && (
                    <div>
                      <span className="font-semibold text-foreground">Item to Lift / Requirement Description: </span>
                      <span className="text-foreground font-medium bg-background px-2 py-0.5 rounded border border-border/60">
                        {formData.item_to_lift}
                      </span>
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

                <div className="grid gap-1.5">
                  <Label htmlFor="item_to_lift" className="text-xs font-semibold">Item To Lift / Material Description</Label>
                  <Input
                    id="item_to_lift"
                    value={formData.item_to_lift}
                    onChange={(e) => setFormData({ ...formData, item_to_lift: e.target.value })}
                    className="h-9 text-xs"
                    placeholder="e.g. Glass, Steel Plates"
                  />
                </div>

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
                        {o.name || `${o.firstname || ''} ${o.lastname || ''}`.trim()} {o.email ? `(${o.email})` : ''}
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

          {/* Lead Lifecycle History & Audit Timeline */}
          <LeadLifecycleHistoryTimeline
            contactId={leadId}
            history={contact?.lifecycle_history}
            createdDate={contact?.createdate}
            sourceWebsite={formData.source_website || contact?.source_website}
            currentStage={formData.lifecycle_stage}
            onHistoryUpdated={() => {
              queryClient.invalidateQueries({ queryKey: ["crm-contact", leadId] });
            }}
          />

          {/* Phone Outreach & Call History Card */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
                  <PhoneCall className="h-4 w-4 text-emerald-600" />
                  Call Outreach History
                  {callHistory.length > 0 && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-semibold">
                      {callHistory.length} call{callHistory.length === 1 ? "" : "s"} logged
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-0.5">
                  Complete permanent log of all phone calls, outcomes, and customer discussions.
                </CardDescription>
              </div>

              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-7 text-xs font-semibold gap-1 text-emerald-700 bg-emerald-50/70 hover:bg-emerald-100 border-emerald-300"
                onClick={() => setCallDialogOpen(true)}
              >
                <PhoneCall className="h-3 w-3 text-emerald-600" />
                Log Call
              </Button>
            </CardHeader>

            <CardContent className="p-4">
              {isLoadingCalls ? (
                <div className="py-6 text-center text-muted-foreground flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-xs">Loading call history...</span>
                </div>
              ) : callHistory.length === 0 ? (
                <div className="py-6 text-center text-muted-foreground space-y-2">
                  <Phone className="h-7 w-7 mx-auto text-muted-foreground/40" />
                  <p className="text-xs font-medium">No calls logged for this lead yet.</p>
                  <p className="text-[11px] text-muted-foreground max-w-xs mx-auto">
                    Click &quot;Log Call&quot; to dial, choose an outcome, and record discussion notes.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {callHistory.map((call: any) => {
                    const oc = (call.outcome || "").toLowerCase();
                    const isPicked = oc.includes("pick") || oc.includes("connect");
                    const isRang = oc.includes("ring");
                    const isInvalid = oc.includes("invalid") || oc.includes("not a valid");

                    return (
                      <div
                        key={call.id}
                        className="p-3 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors space-y-1.5 text-xs"
                      >
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <Badge
                              className={cn(
                                "text-[10px] font-semibold border",
                                isPicked
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : isInvalid
                                  ? "bg-rose-50 text-rose-700 border-rose-200"
                                  : isRang
                                  ? "bg-amber-50 text-amber-700 border-amber-200"
                                  : "bg-slate-50 text-slate-700 border-slate-200"
                              )}
                            >
                              <PhoneCall className="h-3 w-3 mr-1" />
                              {call.outcome || "Call"}
                            </Badge>
                            {call.duration_minutes && (
                              <span className="text-[10px] text-muted-foreground font-medium">
                                {call.duration_minutes}m
                              </span>
                            )}
                          </div>

                          <span className="text-[11px] text-muted-foreground">
                            {call.created_at
                              ? new Date(call.created_at).toLocaleDateString("en-AU", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit"
                                })
                              : ""}
                          </span>
                        </div>

                        {call.description && (
                          <div className="p-2 rounded bg-card border text-[11px] text-foreground leading-relaxed">
                            <span className="font-semibold text-[10px] text-muted-foreground uppercase block mb-0.5">
                              Call Notes:
                            </span>
                            {call.description}
                          </div>
                        )}

                        <div className="text-[10px] text-muted-foreground pt-0.5">
                          Logged by: <strong>{call.assigned_name || "Sales Team"}</strong>
                        </div>
                      </div>
                    );
                  })}
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
                  <div className="flex items-center justify-between gap-2 p-2 rounded bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900">
                    <div className="flex items-center gap-1.5 text-xs text-indigo-900 dark:text-indigo-200 font-medium">
                      <ShieldCheck className="h-3.5 w-3.5 text-indigo-600" />
                      Status: {isQualified ? "Sales Qualified (SQL)" : "Inbound Lead"}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-[11px] text-indigo-700 hover:bg-indigo-100 dark:hover:bg-indigo-900/50"
                      disabled={qualifyMutation.isPending}
                      onClick={() => qualifyMutation.mutate(!isQualified)}
                    >
                      {isQualified ? "Revert" : "Qualify"}
                    </Button>
                  </div>
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

      {/* Log phone call dialog */}
      <LogCallDialog
        contact={contact}
        open={callDialogOpen}
        onOpenChange={setCallDialogOpen}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["crm-contact-call-history", leadId] });
          queryClient.invalidateQueries({ queryKey: ["crm-contact", leadId] });
        }}
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
