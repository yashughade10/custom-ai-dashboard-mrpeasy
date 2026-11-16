import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";

export default function LeadDetailLoading() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in-50 duration-300">
      {/* Top Banner Loader for slow network / backend wake-up */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-primary shrink-0" />
          <div>
            <p className="text-sm font-semibold text-foreground">Loading Lead Details...</p>
            <p className="text-xs text-muted-foreground">
              Connecting to cloud database. If the server is starting up, this may take a few moments.
            </p>
          </div>
        </div>
      </div>

      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-28" />
        </div>
      </div>

      {/* Main Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column */}
        <div className="lg:col-span-8 space-y-6">
          {/* Card 1: Inquiry Details */}
          <div className="border rounded-lg p-6 space-y-4 bg-card shadow-sm">
            <div className="space-y-2">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-72" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-28 w-full" />
          </div>

          {/* Card 2: Contact Info */}
          <div className="border rounded-lg p-6 space-y-4 bg-card shadow-sm">
            <div className="space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-60" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="lg:col-span-4 space-y-6">
          <div className="border rounded-lg p-6 space-y-4 bg-card shadow-sm">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>

          <div className="border rounded-lg p-6 space-y-4 bg-card shadow-sm">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-10 w-full" />
          </div>

          <div className="border rounded-lg p-6 space-y-4 bg-card shadow-sm">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

