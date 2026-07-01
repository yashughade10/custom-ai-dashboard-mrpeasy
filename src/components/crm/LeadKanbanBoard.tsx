"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchLeads, updateLeadStatus } from "@/services/api";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const STATUSES = ['new', 'contacted', 'qualified', 'unqualified', 'converted'];

function SortableLeadCard({ lead }: { lead: any }) {
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: lead.id.toString(),
    data: {
      type: "Lead",
      lead,
    },
  });

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  };

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="opacity-30 border-2 border-primary rounded-md h-[100px]"
      />
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-card border rounded-md p-3 mb-2 shadow-sm cursor-grab active:cursor-grabbing hover:border-primary/50"
    >
      <div className="font-semibold text-sm">{lead.first_name} {lead.last_name}</div>
      {lead.company_name && (
        <div className="text-xs text-muted-foreground mt-1">{lead.company_name}</div>
      )}
      <div className="flex justify-between items-center mt-3">
        <Badge variant="outline" className="text-[10px] h-5">{lead.score || 0} pts</Badge>
        <span className="text-[10px] text-muted-foreground">{lead.assigned_name || 'Unassigned'}</span>
      </div>
    </div>
  );
}

function KanbanColumn({ status, leads }: { status: string, leads: any[] }) {
  const { setNodeRef } = useSortable({
    id: status,
    data: {
      type: "Column",
      status,
    },
  });

  return (
    <div className="flex flex-col bg-muted/30 rounded-lg w-[280px] flex-shrink-0">
      <div className="p-3 font-semibold capitalize border-b flex justify-between items-center">
        {status}
        <Badge variant="secondary" className="rounded-full w-6 h-6 p-0 flex items-center justify-center">
          {leads.length}
        </Badge>
      </div>
      <div 
        ref={setNodeRef}
        className="p-2 flex-1 min-h-[150px]"
      >
        <SortableContext items={leads.map(l => l.id.toString())} strategy={verticalListSortingStrategy}>
          {leads.map((lead) => (
            <SortableLeadCard key={lead.id} lead={lead} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}

export default function LeadKanbanBoard() {
  const queryClient = useQueryClient();
  
  // Fetch all leads (for kanban we might want a high limit or specific filtering)
  const { data, isLoading } = useQuery({
    queryKey: ["crm-leads", { limit: 1000 }],
    queryFn: () => fetchLeads({ page: 1 }),
  });

  const [activeLead, setActiveLead] = useState<any | null>(null);

  const mutation = useMutation({
    mutationFn: ({ id, status }: { id: string, status: string }) => updateLeadStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-leads"] });
    }
  });

  const leads = data?.data || [];

  // Group leads by status
  const columns = useMemo(() => {
    const cols = STATUSES.map(status => ({
      status,
      leads: leads.filter((l: any) => l.status === status)
    }));
    return cols;
  }, [leads]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const onDragStart = (event: DragStartEvent) => {
    if (event.active.data.current?.type === "Lead") {
      setActiveLead(event.active.data.current.lead);
    }
  };

  const onDragOver = (event: DragOverEvent) => {
    // Handling UI optimistically could go here, but for simplicity we rely on React Query invalidation in DragEnd
  };

  const onDragEnd = (event: DragEndEvent) => {
    setActiveLead(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id.toString();
    const overId = over.id.toString();

    const isActiveLead = active.data.current?.type === "Lead";
    
    if (!isActiveLead) return;

    const leadId = activeId;
    let targetStatus = "";

    // If dragged over another lead
    if (over.data.current?.type === "Lead") {
      targetStatus = over.data.current.lead.status;
    } 
    // If dragged over an empty column
    else if (over.data.current?.type === "Column") {
      targetStatus = over.data.current.status;
    }

    const currentStatus = active.data.current?.lead?.status;
    
    if (targetStatus && currentStatus !== targetStatus) {
      // Optimistic update
      queryClient.setQueryData(["crm-leads", { limit: 1000 }], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          data: old.data.map((l: any) => l.id.toString() === leadId ? { ...l, status: targetStatus } : l)
        };
      });
      
      mutation.mutate({ id: leadId, status: targetStatus });
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading board...</div>;
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 pt-2 px-1">
        {columns.map((col) => (
          <KanbanColumn key={col.status} status={col.status} leads={col.leads} />
        ))}
      </div>

      <DragOverlay>
        {activeLead ? (
          <div className="bg-card border-2 border-primary rounded-md p-3 shadow-lg opacity-80 cursor-grabbing w-[260px]">
            <div className="font-semibold text-sm">{activeLead.first_name} {activeLead.last_name}</div>
            <div className="text-xs text-muted-foreground mt-1">{activeLead.company_name}</div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
