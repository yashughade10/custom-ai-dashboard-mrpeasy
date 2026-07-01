import OpportunitiesTable from "@/components/crm/OpportunitiesTable";

export default function OpportunitiesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Opportunities</h1>
        <p className="text-sm text-muted-foreground">
          Track your sales pipeline, manage deal stages, and monitor expected revenue.
        </p>
      </div>
      <OpportunitiesTable />
    </div>
  );
}
