"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { mrpApi } from "@/services/mrpApi";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import {
  ShoppingBag,
  FileText,
  Sparkles,
  Truck,
  Calendar,
  DollarSign,
  Clock,
  ArrowRight,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  Package,
  Building2,
  Mail,
  Phone,
  RefreshCw,
  HelpCircle,
  CalendarClock
} from "lucide-react";

interface Customer360HistoryProps {
  customerNumber: string;
}

export default function Customer360History({ customerNumber }: Customer360HistoryProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"orders" | "invoices" | "leads" | "shipments">("orders");

  const { data: historyData, isLoading, error, refetch } = useQuery({
    queryKey: ["customer-history", customerNumber],
    queryFn: () => mrpApi.getCustomerHistory(customerNumber),
    enabled: !!customerNumber && customerNumber !== "NEW",
  });

  if (!customerNumber || customerNumber === "NEW") {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8 bg-white rounded-md border text-sm text-muted-foreground gap-2">
        <RefreshCw className="h-4 w-4 animate-spin text-primary" />
        Loading customer purchase and lead history...
      </div>
    );
  }

  if (error || !historyData?.success) {
    return null;
  }

  const kpis = historyData.kpis || {};
  const orders = historyData.orders || [];
  const invoices = historyData.invoices || [];
  const quotations = historyData.quotations || [];
  const shipments = historyData.shipments || [];
  const leads = historyData.leads || [];

  const formatMoney = (amount: number | string) => {
    const val = Number(amount) || 0;
    return `$${val.toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return String(dateStr);
      return d.toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" });
    } catch {
      return String(dateStr);
    }
  };

  const getOrderStatusBadge = (status?: string, isFuture?: boolean) => {
    const s = (status || "").toLowerCase();
    if (s.includes("confirm")) {
      return <Badge className="bg-blue-600 text-white font-medium text-[10px]">Confirmed Order</Badge>;
    }
    if (s.includes("ready") || s.includes("ship")) {
      return <Badge className="bg-emerald-600 text-white font-medium text-[10px]">Ready for Shipment</Badge>;
    }
    if (s.includes("progress")) {
      return <Badge className="bg-amber-600 text-white font-medium text-[10px]">In Production</Badge>;
    }
    if (s.includes("deliver") || s.includes("complete") || s.includes("closed")) {
      return <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-300 text-[10px]">Delivered / Completed</Badge>;
    }
    if (s.includes("cancel") || s.includes("void")) {
      return <Badge variant="destructive" className="text-[10px]">Cancelled</Badge>;
    }
    return <Badge variant="outline" className="text-[10px]">{status || "Pending"}</Badge>;
  };

  const getInvoiceStatusBadge = (status?: string, unpaid?: string | number) => {
    const s = (status || "").toLowerCase();
    const unpaidNum = Number(unpaid) || 0;
    if (s === "paid" || unpaidNum === 0) {
      return <Badge className="bg-emerald-600 text-white text-[10px]">Paid in Full</Badge>;
    }
    if (unpaidNum > 0) {
      return <Badge variant="destructive" className="text-[10px]">Unpaid Balance</Badge>;
    }
    return <Badge variant="outline" className="text-[10px]">{status || "Open"}</Badge>;
  };

  return (
    <div className="space-y-6 mt-8 pb-10">
      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Total Spend */}
        <Card className="shadow-xs border-blue-100 bg-blue-50/20">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <DollarSign className="h-3.5 w-3.5 text-blue-600" />
              Total Purchases Value
            </span>
            <p className="text-xl font-bold text-foreground">
              {formatMoney(kpis.total_spent)}
            </p>
            <p className="text-[11px] text-muted-foreground">
              Across {kpis.total_orders_count || 0} customer orders
            </p>
          </CardContent>
        </Card>

        {/* Future / Active Orders */}
        <Card className={`shadow-xs ${kpis.active_orders_count > 0 ? "border-amber-200 bg-amber-50/20" : ""}`}>
          <CardContent className="p-4 space-y-1">
            <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <CalendarClock className="h-3.5 w-3.5 text-amber-600" />
              Active & Future Orders
            </span>
            <p className="text-xl font-bold text-foreground">
              {kpis.active_orders_count || 0}
            </p>
            <p className="text-[11px] text-muted-foreground">
              Confirmed or upcoming deliveries
            </p>
          </CardContent>
        </Card>

        {/* Outstanding Unpaid Invoices */}
        <Card className={`shadow-xs ${kpis.unpaid_balance > 0 ? "border-rose-200 bg-rose-50/20" : ""}`}>
          <CardContent className="p-4 space-y-1">
            <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <AlertCircle className={`h-3.5 w-3.5 ${kpis.unpaid_balance > 0 ? "text-rose-600" : "text-emerald-600"}`} />
              Outstanding Balance
            </span>
            <p className={`text-xl font-bold ${kpis.unpaid_balance > 0 ? "text-rose-600" : "text-foreground"}`}>
              {formatMoney(kpis.unpaid_balance)}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {kpis.invoices_count || 0} invoices issued
            </p>
          </CardContent>
        </Card>

        {/* Inbound Leads / Inquiries */}
        <Card className="shadow-xs border-indigo-100 bg-indigo-50/20">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
              Inbound CRM Inquiries
            </span>
            <p className="text-xl font-bold text-foreground">
              {leads.length}
            </p>
            <p className="text-[11px] text-muted-foreground">
              Matched website quote/demo inquiries
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabbed History Card */}
      <Card className="shadow-xs border">
        <CardHeader className="pb-3 border-b bg-muted/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-blue-600" />
                Customer 360: Order, Invoice & Lead History
              </CardTitle>
              <CardDescription className="text-xs">
                Comprehensive activity trail combining MRPeasy sales data, future deliveries, and inbound inquiries.
              </CardDescription>
            </div>

            {/* Sub-Tabs Button Bar */}
            <div className="flex items-center gap-1 bg-background p-1 rounded-lg border shadow-xs flex-wrap">
              <button
                type="button"
                onClick={() => setActiveTab("orders")}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                  activeTab === "orders" 
                    ? "bg-blue-600 text-white shadow-xs" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                <ShoppingBag className="h-3.5 w-3.5" />
                Orders ({orders.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("invoices")}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                  activeTab === "invoices" 
                    ? "bg-blue-600 text-white shadow-xs" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                <FileText className="h-3.5 w-3.5" />
                Invoices & Quotes ({invoices.length + quotations.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("leads")}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                  activeTab === "leads" 
                    ? "bg-blue-600 text-white shadow-xs" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                <Sparkles className="h-3.5 w-3.5" />
                Leads & Inquiries ({leads.length})
              </button>

              {shipments.length > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveTab("shipments")}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                    activeTab === "shipments" 
                      ? "bg-blue-600 text-white shadow-xs" 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  <Truck className="h-3.5 w-3.5" />
                  Shipments ({shipments.length})
                </button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0 pb-3">
          {/* TAB 1: CUSTOMER ORDERS (PAST & FUTURE) */}
          {activeTab === "orders" && (
            <div className="divide-y">
              {orders.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground space-y-1">
                  <ShoppingBag className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                  <p className="font-semibold text-foreground">No Customer Orders Found</p>
                  <p>This customer does not have any recorded orders in MRPeasy yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-muted/40 text-muted-foreground font-semibold border-b">
                      <tr>
                        <th className="px-4 py-2.5">Order #</th>
                        <th className="px-4 py-2.5">Date</th>
                        <th className="px-4 py-2.5">Scheduled Delivery / Due</th>
                        <th className="px-4 py-2.5">Customer PO #</th>
                        <th className="px-4 py-2.5">Status</th>
                        <th className="px-4 py-2.5 text-right">Amount (AUD)</th>
                        <th className="px-4 py-2.5 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {orders.map((ord: any) => {
                        const isFuture = ord.is_future_or_pending;
                        return (
                          <tr key={ord.id} className={`hover:bg-muted/40 transition-colors ${isFuture ? "bg-blue-50/10" : ""}`}>
                            <td className="px-4 py-3 font-semibold text-foreground">
                              <span 
                                onClick={() => router.push(`/dashboard/mrp/crm/customer-orders/${ord.order_number || ord.id}`)}
                                className="font-mono text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                                title="Open order details"
                              >
                                {ord.order_number}
                              </span>
                              {isFuture && (
                                <span className="ml-2 inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                  Upcoming
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {formatDate(ord.created_date || ord.created_at)}
                            </td>
                            <td className="px-4 py-3">
                              {ord.due_date ? (
                                <span className="font-medium text-foreground flex items-center gap-1">
                                  <Calendar className="h-3 w-3 text-muted-foreground" />
                                  {formatDate(ord.due_date)}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground font-mono">
                              {ord.po || ord.reference || "-"}
                            </td>
                            <td className="px-4 py-3">
                              {getOrderStatusBadge(ord.status, isFuture)}
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-foreground">
                              {formatMoney(ord.total_including_tax || ord.total)}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push(`/dashboard/mrp/crm/customer-orders/${ord.order_number || ord.id}`)}
                                className="h-7 px-2 text-[11px] text-blue-600 hover:text-blue-700 gap-1 cursor-pointer"
                              >
                                View Order
                                <ExternalLink className="h-3 w-3" />
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: INVOICES & QUOTATIONS */}
          {activeTab === "invoices" && (
            <div className="divide-y">
              {invoices.length === 0 && quotations.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground space-y-1">
                  <FileText className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                  <p className="font-semibold text-foreground">No Invoices or Quotations</p>
                  <p>No billing or quotation records have been generated for this account.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-muted/40 text-muted-foreground font-semibold border-b">
                      <tr>
                        <th className="px-4 py-2.5">Document #</th>
                        <th className="px-4 py-2.5">Type</th>
                        <th className="px-4 py-2.5">Date</th>
                        <th className="px-4 py-2.5">Payment Due</th>
                        <th className="px-4 py-2.5">Xero Sync</th>
                        <th className="px-4 py-2.5">Status</th>
                        <th className="px-4 py-2.5 text-right">Total</th>
                        <th className="px-4 py-2.5 text-right">Unpaid Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {[...quotations, ...invoices].map((inv: any) => (
                        <tr key={inv.id} className="hover:bg-muted/40 transition-colors">
                          <td className="px-4 py-3 font-semibold font-mono text-blue-600">
                            <span
                              onClick={() => router.push(`/dashboard/mrp/crm/invoices/${inv.invoice_number}`)}
                              className="hover:underline cursor-pointer"
                              title="Open invoice details"
                            >
                              {inv.invoice_number}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-[11px] font-medium text-muted-foreground">
                              {inv.type || "Invoice"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {formatDate(inv.created_date || inv.created_at)}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {formatDate(inv.due_date)}
                          </td>
                          <td className="px-4 py-3">
                            {inv.xero && inv.xero.toLowerCase() !== "no" ? (
                              <Badge className="bg-sky-50 text-sky-700 border-sky-200 text-[10px]">
                                Xero Synced
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-[11px]">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {getInvoiceStatusBadge(inv.status, inv.unpaid)}
                          </td>
                          <td className="px-4 py-3 text-right font-medium">
                            {formatMoney(inv.total_including_tax || inv.total)}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-foreground">
                            {Number(inv.unpaid) > 0 ? (
                              <span className="text-rose-600">{formatMoney(inv.unpaid)}</span>
                            ) : (
                              <span className="text-emerald-600">$0.00</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: INBOUND LEADS & CRM INQUIRIES */}
          {activeTab === "leads" && (
            <div className="p-4 space-y-4">
              {leads.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground space-y-1">
                  <Sparkles className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                  <p className="font-semibold text-foreground">No Matched Website Leads</p>
                  <p>No inbound inquiries found matching this customer&apos;s email ({historyData.customer?.email || "none"}) or company name.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {leads.map((lead: any) => (
                    <div key={lead.id} className="p-4 rounded-lg border bg-background hover:border-blue-300 transition-colors space-y-3">
                      {/* Top Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2.5">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-foreground">
                              {lead.firstname} {lead.lastname}
                            </span>
                            <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[10px]">
                              {lead.lifecycle_stage || "lead"}
                            </Badge>
                            {lead.source_website && (
                              <Badge variant="outline" className="text-[10px]">
                                {lead.source_website.toUpperCase()}
                              </Badge>
                            )}
                            {lead.form_type && (
                              <Badge variant="outline" className="bg-muted text-[10px]">
                                {lead.form_type}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
                            {lead.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {lead.email}</span>}
                            {lead.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {lead.phone}</span>}
                            {lead.company && <span className="flex items-center gap-1"><Building2 className="h-3 w-3" /> {lead.company}</span>}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(lead.createdate)}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => router.push(`/dashboard/crm/leads/${lead.id}`)}
                            className="h-7 text-xs px-2.5 gap-1 text-blue-600 border-blue-200 hover:bg-blue-50"
                          >
                            Open Lead
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      {/* Technical Lift Specifications if submitted */}
                      {(lead.product || lead.item_to_lift || lead.size_capacity || lead.preferred_power_source || lead.lifting_options) && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-2.5 rounded bg-muted/30 border text-xs">
                          {lead.product && (
                            <div>
                              <span className="text-muted-foreground text-[10px] block">Product Interest</span>
                              <span className="font-semibold text-foreground">{lead.product}</span>
                            </div>
                          )}
                          {lead.item_to_lift && (
                            <div>
                              <span className="text-muted-foreground text-[10px] block">Item to Lift</span>
                              <span className="font-semibold text-foreground">{lead.item_to_lift}</span>
                            </div>
                          )}
                          {lead.size_capacity && (
                            <div>
                              <span className="text-muted-foreground text-[10px] block">Capacity / Size</span>
                              <span className="font-semibold text-foreground">{lead.size_capacity}</span>
                            </div>
                          )}
                          {lead.preferred_power_source && (
                            <div>
                              <span className="text-muted-foreground text-[10px] block">Power Source</span>
                              <span className="font-semibold text-foreground">{lead.preferred_power_source}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Message / Inquiry Text */}
                      {lead.message && (
                        <div className="text-xs bg-muted/20 p-2.5 rounded border border-dashed">
                          <span className="text-muted-foreground font-semibold text-[10px] block mb-0.5">Inquiry Message:</span>
                          <p className="text-foreground whitespace-pre-wrap leading-relaxed">{lead.message}</p>
                        </div>
                      )}

                      {/* Lead Lifecycle Transition Audit Snippet */}
                      {lead.lifecycle_history && lead.lifecycle_history.length > 0 && (
                        <div className="pt-1">
                          <span className="text-[10px] font-semibold text-muted-foreground block mb-1.5">
                            Stage Progression History:
                          </span>
                          <div className="space-y-1">
                            {lead.lifecycle_history.slice(0, 3).map((lh: any) => (
                              <div key={lh.id} className="text-[11px] flex items-center gap-2 text-muted-foreground">
                                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                                <span>{formatDate(lh.created_at)}:</span>
                                {lh.old_stage && <span className="font-medium text-foreground">{lh.old_stage} &rarr;</span>}
                                <strong className="text-foreground">{lh.new_stage}</strong>
                                {lh.notes && <span className="italic text-muted-foreground">({lh.notes})</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: SHIPMENTS & DELIVERIES */}
          {activeTab === "shipments" && (
            <div className="divide-y">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/40 text-muted-foreground font-semibold border-b">
                    <tr>
                      <th className="px-4 py-2.5">Shipment #</th>
                      <th className="px-4 py-2.5">Order #</th>
                      <th className="px-4 py-2.5">Dispatch Date</th>
                      <th className="px-4 py-2.5">Delivery Date</th>
                      <th className="px-4 py-2.5">Tracking #</th>
                      <th className="px-4 py-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {shipments.map((shp: any) => (
                      <tr key={shp.id} className="hover:bg-muted/40 transition-colors">
                        <td className="px-4 py-3 font-semibold font-mono text-blue-600">
                          {shp.shipment_number}
                        </td>
                        <td className="px-4 py-3 font-mono text-muted-foreground">
                          {shp.order_number ? (
                            <span
                              onClick={() => router.push(`/dashboard/mrp/crm/customer-orders/${shp.order_number}`)}
                              className="text-blue-600 hover:underline cursor-pointer font-medium"
                              title="Open related customer order"
                            >
                              {shp.order_number}
                            </span>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {formatDate(shp.created_date)}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {formatDate(shp.delivery_date)}
                        </td>
                        <td className="px-4 py-3 font-mono">
                          {shp.tracking_number || "-"}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
                            {shp.status || "Shipped"}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
