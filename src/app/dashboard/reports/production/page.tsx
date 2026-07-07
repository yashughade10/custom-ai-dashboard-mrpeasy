import { ProductionReport } from "@/components/reports/ProductionReport";

export default function ProductionReportsPage() {
  return (
    <div className="p-6 w-full max-w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Production Reports</h1>
        <p className="text-muted-foreground">Order statuses, manufacturing lead times, and efficiency metrics.</p>
      </div>
      <ProductionReport />
    </div>
  );
}
