import { DocumentationViewer } from "@/components/docs/DocumentationViewer";

export default function DocumentationPage() {
  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">System Documentation</h1>
        <p className="text-muted-foreground mt-2">
          Everything you need to know to navigate and manage your MRP dashboard.
        </p>
      </div>
      
      <DocumentationViewer />
    </div>
  );
}
