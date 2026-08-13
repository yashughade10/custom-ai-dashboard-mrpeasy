"use client";

import { ActivityLogEntry } from "@/lib/api/jobs";
import { CheckCircle, FileText, AlertCircle, Clock } from "lucide-react";

export function JobActivityTimeline({ activities }: { activities: ActivityLogEntry[] }) {
  if (activities.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">No activity recorded yet.</div>;
  }

  const getIcon = (action: string) => {
    if (action.includes("created")) return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (action.includes("form")) return <FileText className="h-4 w-4 text-blue-500" />;
    if (action.includes("status")) return <Clock className="h-4 w-4 text-orange-500" />;
    return <AlertCircle className="h-4 w-4 text-gray-500" />;
  };

  const getMessage = (activity: ActivityLogEntry) => {
    let details: any = {};
    try {
      details = activity.details_json ? JSON.parse(activity.details_json) : {};
    } catch (e) {}

    switch (activity.action) {
      case "job_created":
        return `Job ${details.job_number} created`;
      case "status_changed":
        return `Status changed from ${details.from} to ${details.to}`;
      case "form_submitted":
        return `Form ${details.template_name} (${details.submission_number}) submitted for ${details.stage} stage`;
      case "form_signed":
        return `Form ${details.template_name} (${details.submission_number}) signed off`;
      case "client_form_signed":
        return `Client signed form ${details.submission_number}`;
      case "client_notified":
        return `Client notified: ${details.message}`;
      default:
        return activity.action;
    }
  };

  return (
    <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
      {activities.map((activity, index) => (
        <div key={activity.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
          {/* Icon */}
          <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-100 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
            {getIcon(activity.action)}
          </div>
          
          {/* Content */}
          <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-card p-4 rounded border shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <div className="font-bold text-sm text-foreground capitalize">
                {activity.actor_name || "System"}
              </div>
              <time className="text-xs font-medium text-muted-foreground">
                {new Date(activity.created_at).toLocaleString()}
              </time>
            </div>
            <div className="text-sm text-muted-foreground">
              {getMessage(activity)}
            </div>
            {activity.reason && (
              <div className="mt-2 text-sm bg-muted p-2 rounded italic text-foreground/80">
                <span className="font-semibold not-italic">Reason: </span>
                {activity.reason}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
