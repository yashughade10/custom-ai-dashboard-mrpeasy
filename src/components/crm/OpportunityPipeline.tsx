"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchOpportunities, updateOpportunityStage } from "@/services/api";
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
import { Badge } from "@/components/ui/badge";

const STAGES = ['prospecting', 'qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost'];

function SortableOpportunityCard({ opp }: { opp: any }) {
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: opp.id.toString(),
    data: {
      type: "Opportunity",
      opp,
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
      <div className="font-semibold text-sm">{opp.name}</div>
      {opp.company_name && (
        <div className="text-xs text-muted-foreground mt-1">{opp.company_name}</div>
      )}
      <div className="flex justify-between items-center mt-3">
        <span className="text-xs font-medium text-green-600 dark:text-green-400">
          ${parseFloat(opp.expected_value).toLocaleString(undefined, {minimumFractionDigits: 0})}
        </span>
        <Badge variant="secondary" className="text-[10px] h-5">{opp.probability}%</Badge>
      </div>
    </div>
  );
}

function PipelineColumn({ stage, opps }: { stage: string, opps: any[] }) {
  const { setNodeRef } = useSortable({
    id: stage,
    data: {
      type: "Column",
      stage,
    },
  });

  const totalValue = opps.reduce((sum, o) => sum + parseFloat(o.expected_value || 0), 0);

  return (
    <div className="flex flex-col bg-muted/30 rounded-lg w-[280px] flex-shrink-0">
      <div className="p-3 border-b">
        <div className="font-semibold capitalize flex justify-between items-center mb-1">
          {stage.replace('_', ' ')}
          <Badge variant="secondary" className="rounded-full w-6 h-6 p-0 flex items-center justify-center">
            {opps.length}
          </Badge>
        </div>
        <div className="text-xs text-muted-foreground">
          ${totalValue.toLocaleString(undefined, {minimumFractionDigits: 0})}
        </div>
      </div>
      <div 
        ref={setNodeRef}
        className="p-2 flex-1 min-h-[150px]"
      >
        <SortableContext items={opps.map(o => o.id.toString())} strategy={verticalListSortingStrategy}>
          {opps.map((opp) => (
            <SortableOpportunityCard key={opp.id} opp={opp} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}

export default function OpportunityPipeline() {
  const queryClient = useQueryClient();
  
  const { data, isLoading } = useQuery({
    queryKey: ["crm-opportunities", { limit: 1000 }],
    queryFn: () => fetchOpportunities({ page: 1 }),
  });

  const [activeOpp, setActiveOpp] = useState<any | null>(null);

  const mutation = useMutation({
    mutationFn: ({ id, stage }: { id: string, stage: string }) => updateOpportunityStage(id, stage),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-opportunities"] });
    }
  });

  const opportunities = data?.data || [];

  const columns = useMemo(() => {
    return STAGES.map(stage => ({
      stage,
      opps: opportunities.filter((o: any) => o.stage === stage)
    }));
  }, [opportunities]);

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
    if (event.active.data.current?.type === "Opportunity") {
      setActiveOpp(event.active.data.current.opp);
    }
  };

  const onDragOver = (event: DragOverEvent) => {};

  const onDragEnd = (event: DragEndEvent) => {
    setActiveOpp(null);
    const { active, over } = event;
    if (!over) return;

    const isActiveOpp = active.data.current?.type === "Opportunity";
    if (!isActiveOpp) return;

    const oppId = active.id.toString();
    let targetStage = "";

    if (over.data.current?.type === "Opportunity") {
      targetStage = over.data.current.opp.stage;
    } 
    else if (over.data.current?.type === "Column") {
      targetStage = over.data.current.stage;
    }

    const currentStage = active.data.current?.opp?.stage;
    
    if (targetStage && currentStage !== targetStage) {
      // Optimistic update
      queryClient.setQueryData(["crm-opportunities", { limit: 1000 }], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          data: old.data.map((o: any) => o.id.toString() === oppId ? { ...o, stage: targetStage } : o)
        };
      });
      
      mutation.mutate({ id: oppId, stage: targetStage });
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading pipeline...</div>;
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
          <PipelineColumn key={col.stage} stage={col.stage} opps={col.opps} />
        ))}
      </div>

      <DragOverlay>
        {activeOpp ? (
          <div className="bg-card border-2 border-primary rounded-md p-3 shadow-lg opacity-80 cursor-grabbing w-[260px]">
            <div className="font-semibold text-sm">{activeOpp.name}</div>
            <div className="text-xs text-muted-foreground mt-1">{activeOpp.company_name}</div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
