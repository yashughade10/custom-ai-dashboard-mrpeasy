import CompaniesTable from "@/components/crm/CompaniesTable";

export default function CompaniesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Companies</h1>
        <p className="text-sm text-muted-foreground">
          View your B2B customers, partners, and key accounts.
        </p>
      </div>
      <CompaniesTable />
    </div>
  );
}
