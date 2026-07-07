import { SalesReport } from "@/components/reports/SalesReport";

export default function SalesReportsPage() {
  return (
    <div className="p-6 w-full max-w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Sales Reports</h1>
        <p className="text-muted-foreground">Detailed revenue, product, and customer analytics.</p>
      </div>
      <SalesReport />
    </div>
  );
}
