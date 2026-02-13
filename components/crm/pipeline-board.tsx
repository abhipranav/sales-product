"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import {
  DndContext,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors
} from "@dnd-kit/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const STAGES = [
  { id: "discovery", label: "Discovery", color: "hsl(var(--muted))" },
  { id: "evaluation", label: "Evaluation", color: "hsl(210, 70%, 50%)" },
  { id: "proposal", label: "Proposal", color: "hsl(280, 60%, 50%)" },
  { id: "procurement", label: "Procurement", color: "hsl(45, 80%, 45%)" },
  { id: "closed-won", label: "Closed Won", color: "hsl(var(--success))" },
  { id: "closed-lost", label: "Closed Lost", color: "hsl(var(--destructive))" }
] as const;

type Stage = typeof STAGES[number]["id"];

interface Deal {
  id: string;
  name: string;
  stage: Stage;
  amount: number;
  confidence: number;
  closeDate: string;
  accountId: string;
  accountName: string;
  taskCount: number;
  activityCount: number;
}

interface PipelineBoardProps {
  initialDeals: Deal[];
}

export function PipelineBoard({ initialDeals }: PipelineBoardProps) {
  const [deals, setDeals] = useState<Deal[]>(initialDeals);
  const [activeDeal, setActiveDeal] = useState<Deal | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8
      }
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const deal = deals.find((d) => d.id === event.active.id);
    if (deal) {
      setActiveDeal(deal);
    }
  }, [deals]);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDeal(null);

    if (!over) return;

    const dealId = active.id as string;
    const newStage = over.id as Stage;

    const deal = deals.find((d) => d.id === dealId);
    if (!deal || deal.stage === newStage) return;

    // Optimistically update
    setDeals((prev) =>
      prev.map((d) => (d.id === dealId ? { ...d, stage: newStage } : d))
    );

    try {
      const res = await fetch(`/api/deals/${dealId}/stage`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: newStage })
      });

      if (res.ok) {
        const result = await res.json();
        toast.success(`${result.name} moved to ${newStage.replace("-", " ")}`);
      } else {
        // Revert on error
        setDeals((prev) =>
          prev.map((d) => (d.id === dealId ? { ...d, stage: deal.stage } : d))
        );
        const error = await res.json();
        toast.error(error.error ?? "Failed to update deal stage");
      }
    } catch (error) {
      // Revert on error
      setDeals((prev) =>
        prev.map((d) => (d.id === dealId ? { ...d, stage: deal.stage } : d))
      );
      console.error("Error updating deal stage:", error);
      toast.error("Failed to update deal stage");
    }
  }, [deals]);

  const getDealsForStage = (stage: Stage) => deals.filter((d) => d.stage === stage);

  const getTotalForStage = (stage: Stage) =>
    deals
      .filter((d) => d.stage === stage)
      .reduce((sum, d) => sum + d.amount, 0);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {STAGES.map((stage) => (
          <StageColumn
            key={stage.id}
            stage={stage}
            deals={getDealsForStage(stage.id)}
            total={getTotalForStage(stage.id)}
          />
        ))}
      </div>

      <DragOverlay>
        {activeDeal ? <DealCard deal={activeDeal} isDragging /> : null}
      </DragOverlay>
    </DndContext>
  );
}

interface StageColumnProps {
  stage: typeof STAGES[number];
  deals: Deal[];
  total: number;
}

import { useDroppable } from "@dnd-kit/core";

function StageColumn({ stage, deals, total }: StageColumnProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: stage.id
  });

  return (
    <div
      ref={setNodeRef}
      className={`
        flex-shrink-0 w-72 rounded-lg border transition-colors
        ${isOver ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.05)]" : "border-[hsl(var(--border))] bg-[hsl(var(--card))]"}
      `}
    >
      <div className="p-3 border-b border-[hsl(var(--border))]">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-[hsl(var(--foreground))]">{stage.label}</h3>
          <Badge variant="secondary">{deals.length}</Badge>
        </div>
        <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
          ${total.toLocaleString()}
        </p>
      </div>

      <div className="p-2 space-y-2 min-h-[200px]">
        {deals.map((deal) => (
          <DraggableDealCard key={deal.id} deal={deal} />
        ))}
        {deals.length === 0 && (
          <p className="text-sm text-[hsl(var(--muted-foreground))] text-center py-8">
            No deals
          </p>
        )}
      </div>
    </div>
  );
}

import { useDraggable } from "@dnd-kit/core";

interface DraggableDealCardProps {
  deal: Deal;
}

function DraggableDealCard({ deal }: DraggableDealCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: deal.id
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={isDragging ? "opacity-50" : ""}
    >
      <DealCard deal={deal} />
    </div>
  );
}

interface DealCardProps {
  deal: Deal;
  isDragging?: boolean;
}

function DealCard({ deal, isDragging }: DealCardProps) {
  const isOverdue = new Date(deal.closeDate) < new Date();
  const daysUntilClose = Math.ceil(
    (new Date(deal.closeDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  return (
    <Card
      className={`
        cursor-grab active:cursor-grabbing transition-shadow
        ${isDragging ? "shadow-lg ring-2 ring-[hsl(var(--primary))]" : "hover:shadow-md"}
      `}
    >
      <CardContent className="p-3 space-y-2">
        <Link
          href={`/pipeline/${deal.id}` as "/pipeline"}
          className="font-medium text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))] hover:underline block"
          onClick={(e) => e.stopPropagation()}
        >
          {deal.name}
        </Link>

        <Link
          href={`/accounts/${deal.accountId}` as "/accounts"}
          className="text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] block"
          onClick={(e) => e.stopPropagation()}
        >
          {deal.accountName}
        </Link>

        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-[hsl(var(--foreground))]">
            ${deal.amount.toLocaleString()}
          </span>
          <Badge
            variant={deal.confidence >= 0.7 ? "success" : deal.confidence >= 0.4 ? "warning" : "destructive"}
          >
            {Math.round(deal.confidence * 100)}%
          </Badge>
        </div>

        <div className="flex items-center justify-between text-xs text-[hsl(var(--muted-foreground))]">
          <span className={isOverdue ? "text-[hsl(var(--destructive))]" : ""}>
            {isOverdue
              ? "Overdue"
              : daysUntilClose === 0
              ? "Today"
              : `${daysUntilClose}d left`}
          </span>
          <span>{deal.taskCount} tasks</span>
        </div>
      </CardContent>
    </Card>
  );
}
