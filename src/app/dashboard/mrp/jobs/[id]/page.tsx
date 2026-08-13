"use client";

import { JobDetailView } from "@/components/jobs/JobDetailView";
import { useParams } from "next/navigation";

export default function JobDetailPage() {
  const params = useParams();
  const id = params.id as string;

  return (
    <div className="flex flex-col bg-[#f4f7fb] min-h-[calc(100vh-4rem)] p-4 -m-4 sm:-m-6 lg:-m-8">
      <div className="bg-white rounded-md shadow-sm flex-1 p-6 sm:p-8">
        <JobDetailView jobId={id} />
      </div>
    </div>
  );
}
