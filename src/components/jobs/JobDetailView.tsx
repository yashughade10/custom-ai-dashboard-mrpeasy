"use client";

import { useEffect, useState } from "react";
import { Job, jobsApi, JobStatus } from "@/lib/api/jobs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Clock, User, CheckCircle, Copy, ArrowRight, ArrowLeft, Trash2 } from "lucide-react";
import { JobActivityTimeline } from "./JobActivityTimeline";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function JobDetailView({ jobId }: { jobId: string }) {
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "forms" | "activity" | "docs">("overview");

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
              {job.status.replace("_", " ").toUpperCase()}
            </Badge>
            <Badge variant="secondary" className="text-sm">
              {job.priority.toUpperCase()}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1 text-lg">{job.title}</p>
          {job.customer_name && (
            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              {job.customer_name} ({job.customer_email})
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
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="py-4">
        {activeTab === "overview" && (
          <div className="grid gap-6 lg:gap-8 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Job Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <span className="font-semibold">Description:</span>
                  <p className="text-muted-foreground mt-1">{job.description || "No description provided."}</p>
                </div>
                <div>
                  <span className="font-semibold">Created:</span>
                  <p className="text-muted-foreground">
                    {new Date(job.created_at).toLocaleString()}
                  </p>
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
                      ) || job.status === step.id; // basic logic for UI mockup

                    return (
                      <div key={idx} className="flex items-center gap-3">
                        <div className={`rounded-full p-1 ${isDone ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"}`}>
                          <CheckCircle className="h-5 w-5" />
                        </div>
                        <span className={isDone ? "font-medium" : "text-muted-foreground"}>
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "forms" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Form Submissions</h2>
              {/* Add form submission button can go here */}
            </div>
            {job.form_submissions?.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No forms submitted yet.</p>
            ) : (
              <div className="grid gap-4">
                {job.form_submissions?.map((form) => (
                  <Card key={form.id}>
                    <CardContent className="p-4 flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <FileText className="h-8 w-8 text-blue-500" />
                        <div>
                          <p className="font-semibold">{form.template_name || form.template_code}</p>
                          <p className="text-sm text-muted-foreground">{form.submission_number}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant="outline">{form.stage.toUpperCase()}</Badge>
                        <Badge className={form.status === "signed" ? "bg-green-100 text-green-800" : ""}>
                          {form.status.toUpperCase()}
                        </Badge>
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "activity" && (
          <Card>
            <CardContent className="pt-6">
              <JobActivityTimeline activities={job.activity_log || []} />
            </CardContent>
          </Card>
        )}

        {activeTab === "docs" && (
          <div className="text-center py-12 text-muted-foreground border rounded-lg border-dashed">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Documents feature coming soon.</p>
          </div>
        )}
      </div>
    </div>
  );
}
