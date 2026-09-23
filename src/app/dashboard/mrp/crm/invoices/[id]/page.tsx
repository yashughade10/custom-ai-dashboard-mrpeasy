"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Download, Cloud, Mail, CheckCircle, AlertCircle, Loader2, X } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "/api";

function formatDate(d: string | null | undefined) {
  if (!d) return "";
  const date = new Date(d);
  if (isNaN(date.getTime())) return String(d);
  return date.toLocaleDateString("en-AU", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function toInputDate(d: string | null | undefined) {
  if (!d) return "";
  return new Date(d).toISOString().split("T")[0];
}

function fmtMoney(n: any) {
  return Number(n || 0).toFixed(2);
}

// ─── Email Modal ──────────────────────────────────────────────────────────────
function EmailModal({ invoice, onClose, onSent }: { invoice: any; onClose: () => void; onSent: () => void }) {
  const [to, setTo] = useState(invoice?.customer_email || "");
  const [subject, setSubject] = useState(`Invoice ${invoice?.invoice_number} from Blue Water Engineering`);
  const [message, setMessage] = useState(
    `Dear ${invoice?.customer_name || "Customer"},\n\nPlease find your invoice ${invoice?.invoice_number} attached. The amount due is $${fmtMoney(invoice?.unpaid)}.\n\nKind regards,\nBlue Water Engineering`
  );
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const handleSend = async () => {
    if (!to) return setError("Recipient email is required");
    setSending(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/mrp/crm/invoices/${invoice.invoice_number}/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, subject, message }),
      });
      const data = await res.json();
      if (data.success) { onSent(); onClose(); }
      else setError(data.error || "Failed to send email");
    } catch (e: any) {
      setError(e.message || "Failed to send email");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg mx-4">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-semibold text-gray-900">Send Invoice Email</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-4 space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase">To *</label>
            <Input value={to} onChange={e => setTo(e.target.value)} placeholder="customer@example.com" className="h-8 text-sm mt-1" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase">Subject</label>
            <Input value={subject} onChange={e => setSubject(e.target.value)} className="h-8 text-sm mt-1" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase">Message</label>
            <Textarea value={message} onChange={e => setMessage(e.target.value)} rows={5} className="text-sm mt-1 resize-none" />
          </div>
          {error && <div className="text-red-600 text-xs bg-red-50 p-2 rounded">{error}</div>}
        </div>
        <div className="flex justify-end gap-2 px-4 pb-4">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={handleSend} disabled={sending} className="bg-blue-600 hover:bg-blue-700 text-white">
            {sending ? <><Loader2 className="w-3 h-3 mr-1 animate-spin" />Sending...</> : <><Mail className="w-3 h-3 mr-1" />Send</>}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ message, type, onClose }: { message: string; type: "success" | "error"; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium text-white transition-all ${type === "success" ? "bg-green-600" : "bg-red-600"}`}>
      {type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
      {message}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function InvoiceDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const invoiceId = params?.id as string;

  const [invoice, setInvoice] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pushingXero, setPushingXero] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Editable invoice fields
  const [form, setForm] = useState<any>({});

  const showToast = (message: string, type: "success" | "error") => setToast({ message, type });

  // ─── Fetch invoice from API ────────────────────────────────────────────────
  useEffect(() => {
    if (!invoiceId) return;
    setLoading(true);
    fetch(`${API_BASE}/mrp/crm/invoices/${invoiceId}`)
      .then(r => r.json())
      .then(data => {
        if (data.success && data.data) {
          const inv = data.data;
          setInvoice(inv);
          setItems(inv.items || []);
          setForm({
            customer_number: inv.customer_number || "",
            customer_name: inv.customer_name || "",
            order_number: inv.order_number || "",
            type: inv.type || "Invoice",
            status: inv.status || "Unpaid",
            po: inv.po || "",
            payment_terms: inv.payment_terms || "",
            notes: inv.notes || "",
            invoice_free_text: inv.invoice_free_text || "",
            created_date: toInputDate(inv.created_date),
            due_date: toInputDate(inv.due_date),
            currency: inv.currency || "AUD",
            total: inv.total || 0,
            tax: inv.tax || 0,
            tax_rate: inv.tax_rate || 10,
            total_including_tax: inv.total_including_tax || 0,
            paid: inv.paid || 0,
            unpaid: inv.unpaid || 0,
          });
        } else {
          showToast("Invoice not found", "error");
        }
      })
      .catch(e => showToast(e.message, "error"))
      .finally(() => setLoading(false));
  }, [invoiceId]);

  // ─── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/mrp/crm/invoices/${invoiceId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) showToast("Invoice saved successfully", "success");
      else showToast(data.error || "Save failed", "error");
    } catch (e: any) {
      showToast(e.message, "error");
    } finally {
      setSaving(false);
    }
  };

  // ─── PDF Download ──────────────────────────────────────────────────────────
  const handlePDF = () => {
    window.open(`${API_BASE}/mrp/crm/invoices/${invoiceId}/pdf`, "_blank");
  };

  // ─── Excel Download ────────────────────────────────────────────────────────
  const handleExcel = () => {
    window.open(`${API_BASE}/mrp/crm/invoices/${invoiceId}/excel`, "_blank");
  };

  // ─── Push to Xero ─────────────────────────────────────────────────────────
  const handlePushToXero = async () => {
    if (!invoice) return;
    setPushingXero(true);
    try {
      const res = await fetch(`${API_BASE}/xero/push/invoice/${invoiceId}`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        showToast("Pushed to Xero successfully!", "success");
        // Refresh invoice to update xero badge
        const refreshed = await fetch(`${API_BASE}/mrp/crm/invoices/${invoiceId}`).then(r => r.json());
        if (refreshed.success) setInvoice(refreshed.data);
      } else {
        showToast(data.error || "Failed to push to Xero", "error");
      }
    } catch (e: any) {
      showToast(e.message || "Failed to push to Xero", "error");
    } finally {
      setPushingXero(false);
    }
  };

  const setField = (key: string, value: any) => setForm((prev: any) => ({ ...prev, [key]: value }));

  const sym = invoice?.currency === "AUD" || !invoice?.currency ? "$" : invoice?.currency + " ";
  const isXeroSynced = invoice?.xero === "Yes" || !!invoice?.xero_id;

  // ─── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-2" />
        <span className="text-gray-500">Loading invoice...</span>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <AlertCircle className="w-8 h-8 text-red-400" />
        <p className="text-gray-600">Invoice not found: {invoiceId}</p>
        <Button variant="outline" size="sm" onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  return (
    <>
      {showEmailModal && (
        <EmailModal
          invoice={{ ...invoice, customer_email: "" }}
          onClose={() => setShowEmailModal(false)}
          onSent={() => showToast("Email sent successfully", "success")}
        />
      )}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex flex-col h-full bg-[#f4f7fb] min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8">
        <div className="max-w-[1200px] w-full mx-auto">

          {/* Header & Action Buttons */}
          <div className="flex flex-wrap justify-between items-center mb-6 gap-3">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">Invoice {invoice.invoice_number} details</h1>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                isXeroSynced ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
              }`}>
                {isXeroSynced ? <><CheckCircle className="w-3 h-3" /> Synced to Xero</> : "Not Synced to Xero"}
              </span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                invoice.status === "Paid" ? "bg-green-100 text-green-700" :
                invoice.status === "Partially paid" ? "bg-yellow-100 text-yellow-700" :
                invoice.status === "Voided" ? "bg-gray-100 text-gray-500" :
                "bg-red-100 text-red-700"
              }`}>
                {invoice.status || "Unpaid"}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline" size="sm"
                className="h-8 px-4 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 border-gray-200 flex items-center gap-1"
                onClick={() => setShowEmailModal(true)}
              >
                <Mail className="w-3.5 h-3.5" /> Send e-mail
              </Button>
              <Button
                variant="outline" size="sm"
                className="h-8 px-4 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 border-gray-200 flex items-center gap-1"
                onClick={handlePDF}
              >
                <Download className="w-3.5 h-3.5" /> PDF
              </Button>
              <Button
                variant="outline" size="sm"
                className="h-8 px-4 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 border-gray-200 flex items-center gap-1"
                onClick={handleExcel}
              >
                <Download className="w-3.5 h-3.5" /> Excel
              </Button>
              <Button
                size="sm"
                className="h-8 px-4 text-xs font-medium bg-[#13B5EA] hover:bg-[#10a1d1] text-white flex items-center gap-1"
                onClick={handlePushToXero}
                disabled={pushingXero}
              >
                {pushingXero ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Cloud className="w-3.5 h-3.5" />}
                {pushingXero ? "Pushing..." : "Push to Xero"}
              </Button>
            </div>
          </div>

          {/* Top Toolbar */}
          <div className="flex gap-2 mb-8">
            <Button variant="outline" size="sm" onClick={() => router.back()} className="h-8 px-6 text-sm font-medium text-blue-600 border-blue-100 bg-blue-50/50 hover:bg-blue-100">Back</Button>
            <Button size="sm" className="h-8 px-6 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white" onClick={handleSave} disabled={saving}>
              {saving ? <><Loader2 className="w-3 h-3 mr-1 animate-spin" />Saving...</> : "Save"}
            </Button>
          </div>

          {/* Form Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-16 gap-y-4 mb-8">
            {/* Left Column */}
            <div className="space-y-3">
              <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                <label className="text-[11px] text-right text-gray-500 font-medium uppercase">Number</label>
                <Input value={invoice.invoice_number} readOnly className="h-7 text-xs bg-gray-100/50 border-gray-200 cursor-default" />
              </div>
              <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                <label className="text-[11px] text-right text-gray-500 font-medium uppercase">Customer</label>
                <Input value={form.customer_name} onChange={e => setField("customer_name", e.target.value)} className="h-7 text-xs bg-gray-100/50 border-gray-200" />
              </div>
              <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                <label className="text-[11px] text-right text-gray-500 font-medium uppercase">Customer No.</label>
                <Input value={form.customer_number} onChange={e => setField("customer_number", e.target.value)} className="h-7 text-xs bg-gray-100/50 border-gray-200" />
              </div>
              <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                <label className="text-[11px] text-right text-gray-500 font-medium uppercase">Customer Order</label>
                <Input value={form.order_number} onChange={e => setField("order_number", e.target.value)} className="h-7 text-xs bg-gray-100/50 border-gray-200" />
              </div>
              <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                <label className="text-[11px] text-right text-gray-500 font-medium uppercase">Type</label>
                <Select value={form.type} onValueChange={v => setField("type", v)}>
                  <SelectTrigger className="h-7 text-xs bg-gray-100/50 border-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Invoice">Invoice</SelectItem>
                    <SelectItem value="Quotation">Quotation</SelectItem>
                    <SelectItem value="Credit note">Credit note</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                <label className="text-[11px] text-right text-gray-500 font-medium uppercase">Status</label>
                <Select value={form.status} onValueChange={v => setField("status", v)}>
                  <SelectTrigger className="h-7 text-xs bg-gray-100/50 border-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Unpaid">Unpaid</SelectItem>
                    <SelectItem value="Paid">Paid</SelectItem>
                    <SelectItem value="Partially paid">Partially paid</SelectItem>
                    <SelectItem value="Voided">Voided</SelectItem>
                    <SelectItem value="Overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                <label className="text-[11px] text-right text-gray-500 font-medium uppercase">P.O.</label>
                <Input value={form.po} onChange={e => setField("po", e.target.value)} className="h-7 text-xs bg-gray-100/50 border-gray-200" />
              </div>
              <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                <label className="text-[11px] text-right text-gray-500 font-medium uppercase">Payment Terms</label>
                <Input value={form.payment_terms} onChange={e => setField("payment_terms", e.target.value)} className="h-7 text-xs bg-gray-100/50 border-gray-200" />
              </div>
              <div className="grid grid-cols-[140px_1fr] items-start gap-4">
                <label className="text-[11px] text-right text-gray-500 font-medium uppercase leading-tight pt-1">Notes</label>
                <Textarea value={form.notes} onChange={e => setField("notes", e.target.value)} className="h-16 bg-gray-100/50 border-gray-200 text-xs resize-none" />
              </div>
              <div className="grid grid-cols-[140px_1fr] items-start gap-4">
                <label className="text-[11px] text-right text-gray-500 font-medium uppercase pt-1">Free Text</label>
                <Textarea value={form.invoice_free_text} onChange={e => setField("invoice_free_text", e.target.value)} className="h-16 bg-gray-100/50 border-gray-200 text-xs resize-none" />
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-3">
              <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                <label className="text-[11px] text-right text-gray-500 font-medium uppercase">Created</label>
                <Input type="date" value={form.created_date} onChange={e => setField("created_date", e.target.value)} className="h-7 text-xs bg-blue-50/50 border-blue-200" />
              </div>
              <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                <label className="text-[11px] text-right text-gray-500 font-medium uppercase">Due date</label>
                <Input type="date" value={form.due_date} onChange={e => setField("due_date", e.target.value)} className="h-7 text-xs bg-blue-50/50 border-blue-200" />
              </div>
              <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                <label className="text-[11px] text-right text-gray-500 font-medium uppercase">Currency</label>
                <Select value={form.currency} onValueChange={v => setField("currency", v)}>
                  <SelectTrigger className="h-7 text-xs bg-gray-100/50 border-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AUD">AUD</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="NZD">NZD</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Totals summary card */}
              <div className="mt-4 bg-gray-50 border border-gray-200 rounded-md p-4 space-y-1.5 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-medium">{sym}{fmtMoney(invoice.total)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Tax ({invoice.tax_rate || 0}%)</span>
                  <span className="font-medium">{sym}{fmtMoney(invoice.tax)}</span>
                </div>
                <div className="flex justify-between text-gray-700 border-t border-gray-200 pt-1.5">
                  <span className="font-semibold">Total incl. Tax</span>
                  <span className="font-semibold">{sym}{fmtMoney(invoice.total_including_tax)}</span>
                </div>
                <div className="flex justify-between text-green-700">
                  <span>Paid</span>
                  <span className="font-medium">{sym}{fmtMoney(invoice.paid)}</span>
                </div>
                <div className="flex justify-between text-blue-700 border-t border-gray-200 pt-1.5">
                  <span className="font-bold text-sm">Amount Due</span>
                  <span className="font-bold text-sm">{sym}{fmtMoney(invoice.unpaid)}</span>
                </div>
              </div>

              {/* Account manager / created by */}
              {invoice.account_manager && (
                <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                  <label className="text-[11px] text-right text-gray-500 font-medium uppercase">Account Manager</label>
                  <Input value={invoice.account_manager} readOnly className="h-7 text-xs bg-gray-100/50 border-gray-200" />
                </div>
              )}
              {invoice.created_by && (
                <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                  <label className="text-[11px] text-right text-gray-500 font-medium uppercase">Created By</label>
                  <Input value={invoice.created_by} readOnly className="h-7 text-xs bg-gray-100/50 border-gray-200" />
                </div>
              )}
              {invoice.last_payment && (
                <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                  <label className="text-[11px] text-right text-gray-500 font-medium uppercase">Last Payment</label>
                  <Input value={formatDate(invoice.last_payment)} readOnly className="h-7 text-xs bg-gray-100/50 border-gray-200" />
                </div>
              )}
            </div>
          </div>

          {/* Line Items Table */}
          <div className="mb-8 w-full overflow-x-auto border border-gray-200 rounded-sm shadow-sm">
            <table className="w-full text-[11px] text-left border-collapse min-w-[800px]">
              <thead className="bg-[#f1f5f9] text-gray-600 border-b border-gray-200">
                <tr>
                  <th className="px-2 py-2 font-medium w-8 text-center">#</th>
                  <th className="px-2 py-2 font-medium w-32">Part No.</th>
                  <th className="px-2 py-2 font-medium">Description</th>
                  <th className="px-2 py-2 font-medium w-28">Group</th>
                  <th className="px-2 py-2 font-medium w-20">Quantity</th>
                  <th className="px-2 py-2 font-medium w-32">Delivery Date</th>
                  <th className="px-2 py-2 font-medium w-40">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {items.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-6 text-center text-gray-400">No line items recorded for this invoice.</td></tr>
                ) : (
                  items.map((line: any, idx: number) => (
                    <tr key={line.id || idx} className="hover:bg-[#f0f7ff]">
                      <td className="px-2 py-2 text-center text-gray-400">{idx + 1}</td>
                      <td className="px-2 py-2 font-mono text-gray-700">{line.part_no}</td>
                      <td className="px-2 py-2">
                        <div className="font-medium text-gray-800">{line.part_description}</div>
                        {line.free_text && <div className="text-gray-500 mt-0.5">{line.free_text}</div>}
                      </td>
                      <td className="px-2 py-2 text-gray-500">{line.group_name || line.group_number}</td>
                      <td className="px-2 py-2 text-right font-medium">{Number(line.quantity || 0)}</td>
                      <td className="px-2 py-2 text-gray-500">{line.delivery_date ? formatDate(line.delivery_date) : ""}</td>
                      <td className="px-2 py-2 text-gray-500 max-w-[160px] truncate">{line.notes}</td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                <tr>
                  <td colSpan={4} className="px-2 py-2 font-bold text-gray-700">Totals:</td>
                  <td className="px-2 py-2 text-right font-bold">
                    {items.reduce((s: number, l: any) => s + Number(l.quantity || 0), 0)}
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Bottom Toolbar */}
          <div className="flex gap-2 mb-8">
            <Button variant="outline" size="sm" onClick={() => router.back()} className="h-8 px-6 text-sm font-medium text-blue-600 border-blue-100 bg-blue-50/50 hover:bg-blue-100">Back</Button>
            <Button size="sm" className="h-8 px-6 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>

        </div>
      </div>
    </>
  );
}
