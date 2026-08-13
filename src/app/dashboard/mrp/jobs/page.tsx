import { JobsTable } from "@/components/jobs/JobsTable";

export default function JobsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Job Tracking</h1>
        <p className="text-muted-foreground text-lg">
          Manage job lifecycles from intake to shipment.
        </p>
      </div>

      <JobsTable />
    </div>
  );
}
