"use client";

import { useEffect, useRef, useState } from "react";
import { Job, jobsApi, JobStatus, FormSubmission, JobDocument, documentsApi, formSubmissionsApi } from "@/lib/api/jobs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileText, Clock, User, CheckCircle, Copy, ArrowRight, ArrowLeft, Trash2,
  Upload, X, ImageIcon, Download, Link2, Link2Off, Eye, Loader2, ExternalLink
} from "lucide-react";
import { JobActivityTimeline } from "./JobActivityTimeline";
import { DynamicFormRenderer } from "./DynamicFormRenderer";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { listSalesOrders } from "@/lib/api/sales-orders";

// ─── Form Viewer Modal ──────────────────────────────────────────────────────
function FormViewModal({
  submission,
  onClose,
}: {
  submission: FormSubmission;
  onClose: () => void;
}) {
  const [detail, setDetail] = useState<FormSubmission | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    formSubmissionsApi.getById(submission.id).then((r) => {
      setDetail(r.data);
    }).catch(() => {
      // Fall back to what we already have
      setDetail(submission);
    }).finally(() => setLoading(false));
  }, [submission.id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-background rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b">
          <div>
            <h2 className="text-lg font-semibold">
              {submission.template_name || submission.template_code || "Form Submission"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {submission.submission_number} · {submission.stage?.toUpperCase()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={submission.status === "signed" ? "bg-green-100 text-green-800" : ""}>
              {submission.status?.toUpperCase()}
            </Badge>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-5">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : detail ? (
            <>
              {detail.template_schema ? (
                <DynamicFormRenderer
                  schema={detail.template_schema}
                  initialData={{
                    ...(detail.form_data_json || {}),
                    signature_data: detail.signature_data || undefined,
                  }}
                  onSubmit={() => {}}
                  readOnly={true}
                />
              ) : (
                <div className="space-y-4">
                  {Object.entries(detail.form_data_json || {}).map(([key, value]) => (
                    <div key={key} className="border rounded-lg p-4">
                      <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-1">{key.replace(/_/g, " ")}</p>
                      {typeof value === "string" && value.startsWith("data:image") ? (
                        <img src={value} alt={key} className="max-h-48 rounded border object-contain" />
                      ) : (
                        <p className="text-sm">{String(value)}</p>
                      )}
                    </div>
                  ))}
                  {detail.signature_data && (
                    <div className="border rounded-lg p-4">
                      <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-2">Signature</p>
                      <img src={detail.signature_data} alt="Signature" className="max-h-24 border rounded bg-white p-1" />
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <p className="text-muted-foreground text-center py-8">Could not load form details.</p>
          )}
        </div>

        <div className="border-t p-4 flex justify-end">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}

// ─── Documents / Image Gallery Tab ─────────────────────────────────────────
function DocsTab({ job, onRefresh }: { job: Job; onRefresh: () => void }) {
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const docs = job.documents || [];

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        await documentsApi.upload(job.id, file);
      }
      toast.success(`${files.length} file(s) uploaded successfully`);
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (docId: number) => {
    setDeleting(docId);
    try {
      await documentsApi.delete(job.id, docId);
      toast.success("Document removed");
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || "Delete failed");
    } finally {
      setDeleting(null);
    }
  };

  const images = docs.filter((d) => d.mime_type?.startsWith("image/"));
  const files = docs.filter((d) => !d.mime_type?.startsWith("image/"));

  return (
    <div className="space-y-6">
      {/* Lightbox */}
      {lightboxSrc && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setLightboxSrc(null)}
        >
          <img src={lightboxSrc} alt="Preview" className="max-h-[85vh] max-w-full rounded-lg shadow-2xl" />
          <button className="absolute top-4 right-4 text-white" onClick={() => setLightboxSrc(null)}>
            <X className="h-8 w-8" />
          </button>
        </div>
      )}

      {/* Upload */}
      <div className="flex items-center gap-3">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,.pdf,.doc,.docx"
          className="hidden"
          onChange={handleUpload}
        />
        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="gap-2"
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {uploading ? "Uploading..." : "Upload Documents"}
        </Button>
        <p className="text-sm text-muted-foreground">Images, PDFs, Word documents</p>
      </div>

      {docs.length === 0 ? (
        <div className="text-center py-16 border rounded-lg border-dashed text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No documents yet</p>
          <p className="text-sm mt-1">Upload files or submit the intake form with images.</p>
        </div>
      ) : (
        <>
          {/* Images Grid */}
          {images.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Images ({images.length})</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {images.map((doc) => (
                  <div key={doc.id} className="group relative rounded-lg overflow-hidden border shadow-sm bg-gray-50 aspect-square">
                    {doc.file_data ? (
                      <img
                        src={doc.file_data}
                        alt={doc.file_name}
                        className="w-full h-full object-cover cursor-pointer transition-transform group-hover:scale-105"
                        onClick={() => setLightboxSrc(doc.file_data!)}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="h-8 w-8 text-gray-300" />
                      </div>
                    )}
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                      {doc.file_data && (
                        <button
                          className="bg-white rounded-full p-1.5 shadow"
                          onClick={() => setLightboxSrc(doc.file_data!)}
                          title="View full size"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        className="bg-white rounded-full p-1.5 shadow text-red-500"
                        onClick={() => handleDelete(doc.id)}
                        title="Delete"
                        disabled={deleting === doc.id}
                      >
                        {deleting === doc.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      </button>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs px-2 py-1 truncate">
                      {doc.file_name}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Files List */}
          {files.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Files ({files.length})</h3>
              <div className="space-y-2">
                {files.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg bg-card">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="text-sm font-medium">{doc.file_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {doc.document_type} · {doc.file_size ? `${(doc.file_size / 1024).toFixed(1)} KB` : ""}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-400 hover:text-red-600"
                      onClick={() => handleDelete(doc.id)}
                      disabled={deleting === doc.id}
                    >
                      {deleting === doc.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Sales Order Linkage Card ───────────────────────────────────────────────
function SalesOrderLinkCard({ job, onJobUpdated }: { job: Job; onJobUpdated: (j: Job) => void }) {
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [soList, setSoList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [linking, setLinking] = useState(false);

  const handleOpenSearch = async () => {
    setSearchOpen(true);
    setLoading(true);
    try {
      const result = await listSalesOrders({ limit: 50 });
      setSoList(result.data || []);
    } catch {
      toast.error("Could not load sales orders");
    } finally {
      setLoading(false);
    }
  };

  const handleLink = async (soId: number) => {
    setLinking(true);
    try {
      const res = await jobsApi.linkSalesOrder(job.id, soId);
      onJobUpdated(res.data);
      setSearchOpen(false);
      toast.success("Sales order linked!");
    } catch (err: any) {
      toast.error(err.message || "Failed to link");
    } finally {
      setLinking(false);
    }
  };

  const handleUnlink = async () => {
    setLinking(true);
    try {
      const res = await jobsApi.linkSalesOrder(job.id, null);
      onJobUpdated(res.data);
      toast.success("Sales order unlinked");
    } catch (err: any) {
      toast.error(err.message || "Failed to unlink");
    } finally {
      setLinking(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Link2 className="h-4 w-4" /> Linked Sales Order
        </CardTitle>
      </CardHeader>
      <CardContent>
        {job.sales_order_id ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-blue-600">{job.sales_order_number}</p>
              <p className="text-xs text-muted-foreground mt-0.5">ID: {job.sales_order_id}</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-1"
                onClick={() => router.push(`/dashboard/_sales/orders?id=${job.sales_order_id}`)}
              >
                <ExternalLink className="h-3.5 w-3.5" /> View
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1 text-red-500 hover:text-red-700"
                disabled={linking}
                onClick={handleUnlink}
              >
                <Link2Off className="h-3.5 w-3.5" /> Unlink
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">No sales order linked to this job.</p>
            {!searchOpen ? (
              <Button variant="outline" size="sm" className="gap-1" onClick={handleOpenSearch}>
                <Link2 className="h-3.5 w-3.5" /> Link Sales Order
              </Button>
            ) : (
              <div className="border rounded-lg p-3 space-y-2 bg-muted/30">
                {loading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading orders...
                  </div>
                ) : soList.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No sales orders found.</p>
                ) : (
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {soList.map((so: any) => (
                      <button
                        key={so.id}
                        className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-accent flex justify-between items-center"
                        disabled={linking}
                        onClick={() => handleLink(so.id)}
                      >
                        <span className="font-medium">{so.order_number}</span>
                        <span className="text-muted-foreground text-xs">{so.status} · {so.contact?.first_name} {so.contact?.last_name}</span>
                      </button>
                    ))}
                  </div>
                )}
                <Button variant="ghost" size="sm" onClick={() => setSearchOpen(false)}>Cancel</Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────
export function JobDetailView({ jobId }: { jobId: string }) {
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "forms" | "activity" | "docs">("overview");
  const [viewingForm, setViewingForm] = useState<FormSubmission | null>(null);

  const fetchJob = async () => {
    setLoading(true);
    try {
      const res = await jobsApi.getById(jobId);
      setJob(res.data);
    } catch (error) {
      console.error("Failed to fetch job details", error);
      toast.error("Failed to fetch job details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJob();
  }, [jobId]);

  const handleStatusChange = async (newStatus: JobStatus) => {
    try {
      await jobsApi.updateStatus(jobId, newStatus);
      toast.success(`Job status updated to ${newStatus}`);
      fetchJob();
    } catch (error: any) {
      toast.error(error.message || "Failed to update status");
    }
  };

  const handleSendIntake = async () => {
    try {
      const res = await jobsApi.sendIntakeForm(jobId);
      navigator.clipboard.writeText(res.data.form_url);
      toast.success("Intake form link generated and copied to clipboard!");
      fetchJob();
    } catch (error: any) {
      toast.error(error.message || "Failed to send intake form");
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await jobsApi.delete(jobId);
      toast.success("Job deleted successfully");
      router.push("/dashboard/mrp/jobs");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete job");
      setIsDeleting(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading job details...</div>;
  if (!job) return <div className="p-8 text-center text-red-500">Job not found</div>;

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
      {/* Form Viewer Modal */}
      {viewingForm && (
        <FormViewModal submission={viewingForm} onClose={() => setViewingForm(null)} />
      )}

      <ConfirmDialog
        isOpen={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Job"
        description={`Are you sure you want to delete job ${job.job_number}? This action cannot be undone.`}
        onConfirm={handleDelete}
        confirmText="Delete"
      />

      {/* Back Button */}
      <div>
        <Button variant="ghost" className="pl-0 gap-2 text-muted-foreground hover:text-foreground" onClick={() => window.history.back()}>
          <ArrowLeft className="h-4 w-4" /> Back to Jobs
        </Button>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-6 rounded-lg border shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">{job.job_number}</h1>
            <Badge variant="outline" className="text-sm">
              {job.status.replace(/_/g, " ").toUpperCase()}
            </Badge>
            <Badge variant="secondary" className="text-sm">
              {job.priority.toUpperCase()}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1 text-lg">{job.title}</p>
          {job.customer_name && (
            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              {job.customer_name} {job.customer_email ? `(${job.customer_email})` : ""}
            </div>
          )}
          {job.sales_order_number && (
            <div className="flex items-center gap-1 mt-1 text-xs text-blue-600">
              <Link2 className="h-3 w-3" /> Linked to {job.sales_order_number}
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {job.status === "draft" && (
            <Button onClick={handleSendIntake}>
              <Copy className="mr-2 h-4 w-4" /> Send Intake Form
            </Button>
          )}
          {job.status === "intake_signed" && (
            <Button onClick={() => handleStatusChange("in_production")}>
              Start Production <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
          {job.status === "qa_pending" && (
            <Button onClick={() => handleStatusChange("qa_complete")}>
              Complete QA <CheckCircle className="ml-2 h-4 w-4" />
            </Button>
          )}
          {job.status === "qa_complete" && (
            <Button onClick={() => handleStatusChange("shipped")}>
              Mark as Shipped <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
          <Button variant="destructive" disabled={isDeleting} onClick={() => setShowDeleteDialog(true)}>
            <Trash2 className="mr-2 h-4 w-4" /> {isDeleting ? "Deleting..." : "Delete Job"}
          </Button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b">
        {(["overview", "forms", "activity", "docs"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300"
            }`}
          >
            {tab === "docs"
              ? `Docs${job.documents && job.documents.length > 0 ? ` (${job.documents.length})` : ""}`
              : tab === "forms"
              ? `Forms${job.form_submissions && job.form_submissions.length > 0 ? ` (${job.form_submissions.length})` : ""}`
              : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="py-4">
        {/* ── Overview ── */}
        {activeTab === "overview" && (
          <div className="grid gap-6 lg:gap-8 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Job Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <span className="font-semibold">Description:</span>
                  <p className="text-muted-foreground mt-1">{job.description || "No description provided."}</p>
                </div>
                <div>
                  <span className="font-semibold">Created:</span>
                  <p className="text-muted-foreground">{new Date(job.created_at).toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Status Tracker</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { id: "intake_signed", label: "Intake Signed" },
                    { id: "in_production", label: "Production Started" },
                    { id: "qa_complete", label: "QA Completed" },
                    { id: "shipped", label: "Shipped" },
                  ].map((step, idx) => {
                    const isDone =
                      job.activity_log?.some(
                        (a) => a.action === "status_changed" && JSON.parse(a.details_json || "{}").to === step.id
                      ) || job.status === step.id;

                    return (
                      <div key={idx} className="flex items-center gap-3">
                        <div className={`rounded-full p-1 ${isDone ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"}`}>
                          <CheckCircle className="h-5 w-5" />
                        </div>
                        <span className={isDone ? "font-medium" : "text-muted-foreground"}>{step.label}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Sales Order Link */}
            <div className="md:col-span-2">
              <SalesOrderLinkCard job={job} onJobUpdated={(updated) => setJob(updated)} />
            </div>
          </div>
        )}

        {/* ── Forms ── */}
        {activeTab === "forms" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Form Submissions</h2>
            </div>
            {!job.form_submissions || job.form_submissions.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No forms submitted yet.</p>
            ) : (
              <div className="grid gap-4">
                {job.form_submissions.map((form) => (
                  <Card key={form.id}>
                    <CardContent className="p-4 flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <FileText className="h-8 w-8 text-blue-500" />
                        <div>
                          <p className="font-semibold">{form.template_name || form.template_code}</p>
                          <p className="text-sm text-muted-foreground">{form.submission_number}</p>
                          {form.submitted_at && (
                            <p className="text-xs text-muted-foreground">
                              Submitted {new Date(form.submitted_at).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">{form.stage?.toUpperCase()}</Badge>
                        <Badge className={form.status === "signed" ? "bg-green-100 text-green-800" : ""}>
                          {form.status?.toUpperCase()}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1"
                          onClick={() => setViewingForm(form)}
                        >
                          <Eye className="h-3.5 w-3.5" /> View
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Activity ── */}
        {activeTab === "activity" && (
          <Card>
            <CardContent className="pt-6">
              <JobActivityTimeline activities={job.activity_log || []} />
            </CardContent>
          </Card>
        )}

        {/* ── Docs ── */}
        {activeTab === "docs" && (
          <DocsTab job={job} onRefresh={fetchJob} />
        )}
      </div>
    </div>
  );
}
