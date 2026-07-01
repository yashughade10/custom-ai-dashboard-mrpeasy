"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchActivities } from "@/services/api";
import { Badge } from "@/components/ui/badge";
import { Calendar, PhoneCall, CheckSquare, MessageCircle, Clock } from "lucide-react";
import { format, isPast, isToday } from "date-fns";

export default function ActivitiesTimeline() {
  const [page, setPage] = useState(1);
  const [type, setType] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["crm-activities", { page, type }],
    queryFn: () => fetchActivities({ page, type }),
    placeholderData: (previousData) => previousData,
  });

  const activities = data?.data || [];

  const getActivityIcon = (actType: string) => {
    switch (actType) {
      case 'call': return <PhoneCall className="h-4 w-4" />;
      case 'meeting': return <Calendar className="h-4 w-4" />;
      case 'task': return <CheckSquare className="h-4 w-4" />;
      case 'follow_up': return <MessageCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getActivityColor = (actType: string) => {
    switch (actType) {
      case 'call': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200';
      case 'meeting': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200';
      case 'task': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200';
      case 'follow_up': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <select 
          className="flex h-9 w-full max-w-[200px] items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          value={type}
          onChange={(e) => {
            setType(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Types</option>
          <option value="call">Calls</option>
          <option value="meeting">Meetings</option>
          <option value="task">Tasks</option>
          <option value="follow_up">Follow-ups</option>
        </select>
      </div>

      {isLoading ? (
        <div className="py-8 text-center text-muted-foreground">Loading activities...</div>
      ) : activities.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground">No activities found.</div>
      ) : (
        <div className="relative border-l border-muted ml-3 space-y-8 pb-4">
          {activities.map((activity: any) => {
            const dateStr = activity.due_date || activity.created_at;
            const date = new Date(dateStr);
            const past = isPast(date) && !isToday(date) && activity.status !== 'completed';
            
            return (
              <div key={activity.id} className="relative pl-6">
                <div className={`absolute -left-3.5 mt-1.5 flex h-7 w-7 items-center justify-center rounded-full border bg-background shadow-sm ${past ? 'text-destructive border-destructive/50' : 'text-muted-foreground'}`}>
                  {getActivityIcon(activity.activity_type)}
                </div>
                
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${getActivityColor(activity.activity_type)}`}>
                        {activity.activity_type.replace('_', ' ')}
                      </span>
                      <h4 className="text-sm font-semibold">{activity.subject}</h4>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs">
                      <Badge variant={
                        activity.status === 'completed' ? 'default' : 
                        activity.status === 'cancelled' ? 'secondary' : 'outline'
                      }>
                        {activity.status}
                      </Badge>
                      <span className={`text-muted-foreground ${past ? 'text-destructive font-medium' : ''}`}>
                        {format(date, 'MMM d, yyyy h:mm a')}
                      </span>
                    </div>
                  </div>
                  
                  {activity.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {activity.description}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    {activity.contact_firstname && (
                      <span>Contact: <span className="font-medium text-foreground">{activity.contact_firstname} {activity.contact_lastname}</span></span>
                    )}
                    {activity.company_name && (
                      <span>Company: <span className="font-medium text-foreground">{activity.company_name}</span></span>
                    )}
                    {activity.deal_name && (
                      <span>Deal: <span className="font-medium text-foreground">{activity.deal_name}</span></span>
                    )}
                    {activity.assigned_name && (
                      <span>Assigned to: <span className="font-medium text-foreground">{activity.assigned_name}</span></span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  );
}
