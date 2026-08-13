import { JobForm } from "@/components/jobs/JobForm";

export default function NewJobPage() {
  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create New Job</h1>
        <p className="text-muted-foreground">
          Enter the details to create a new production job.
        </p>
      </div>

      <div className="bg-card rounded-lg border p-6 shadow-sm">
        <JobForm />
      </div>
    </div>
  );
}
