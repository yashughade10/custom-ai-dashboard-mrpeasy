"use client";

import { useEffect, useState } from "react";
import { jobsApi, Job, JobStatus, JobPriority } from "@/lib/api/jobs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, Filter, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";

export function JobsTable() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<JobStatus | "">("");

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const filters: any = { search };
      if (statusFilter) filters.status = statusFilter;
      const res = await jobsApi.list(filters);
      setJobs(res.data);
    } catch (error) {
      console.error("Failed to fetch jobs", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [search, statusFilter]);

  const getStatusBadge = (status: JobStatus) => {
    const colors = {
      draft: "bg-gray-100 text-gray-800",
      intake_pending: "bg-yellow-100 text-yellow-800",
      intake_signed: "bg-blue-100 text-blue-800",
      in_production: "bg-indigo-100 text-indigo-800",
      qa_pending: "bg-orange-100 text-orange-800",
      qa_complete: "bg-green-100 text-green-800",
      shipped: "bg-purple-100 text-purple-800",
      cancelled: "bg-red-100 text-red-800",
    };
    const label = status.replace("_", " ").toUpperCase();
    return <Badge className={colors[status] || "bg-gray-100"}>{label}</Badge>;
  };

  const getPriorityBadge = (priority: JobPriority) => {
    const colors = {
      low: "bg-gray-100 text-gray-800",
      medium: "bg-blue-100 text-blue-800",
      high: "bg-orange-100 text-orange-800",
      urgent: "bg-red-100 text-red-800",
    };
    return <Badge className={colors[priority] || "bg-gray-100"}>{priority.toUpperCase()}</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex gap-2">
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search jobs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          <select
            className="flex h-10 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
          >
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="intake_pending">Intake Pending</option>
            <option value="intake_signed">Intake Signed</option>
            <option value="in_production">In Production</option>
            <option value="qa_pending">QA Pending</option>
            <option value="qa_complete">QA Complete</option>
            <option value="shipped">Shipped</option>
          </select>
        </div>
        <Button onClick={() => router.push("/dashboard/mrp/jobs/new")}>
          <Plus className="mr-2 h-4 w-4" /> New Job
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Job Number</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Loading jobs...
                </TableCell>
              </TableRow>
            ) : jobs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No jobs found.
                </TableCell>
              </TableRow>
            ) : (
              jobs.map((job) => (
                <TableRow
                  key={job.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => router.push(`/dashboard/mrp/jobs/${job.id}`)}
                >
                  <TableCell className="font-medium text-blue-600">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      {job.job_number}
                    </div>
                  </TableCell>
                  <TableCell>{job.title}</TableCell>
                  <TableCell>{job.customer_name || "—"}</TableCell>
                  <TableCell>{getStatusBadge(job.status)}</TableCell>
                  <TableCell>{getPriorityBadge(job.priority)}</TableCell>
                  <TableCell>{new Date(job.created_at).toLocaleDateString()}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
