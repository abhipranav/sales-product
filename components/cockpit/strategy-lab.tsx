"use client";

import type { StrategyPlay } from "@/lib/domain/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { executeStrategyPlayAction } from "@/app/actions/strategy";
import { toast } from "sonner";
import { useState } from "react";

interface StrategyLabProps {
  plays: StrategyPlay[];
  dealId: string;
}

export function StrategyLab({ plays, dealId }: StrategyLabProps) {
  const [executingId, setExecutingId] = useState<string | null>(null);

  async function handleExecute(playId: string, playTitle: string) {
    setExecutingId(playId);
    toast.loading(`Executing "${playTitle}"...`, { id: playId });

    try {
      const result = await executeStrategyPlayAction(playId, dealId);

      if (result.success) {
        toast.success(
          `Play executed. Created ${result.tasksCreated} tasks${result.approvalsCreated > 0 ? ` and ${result.approvalsCreated} approval` : ""}.`,
          { id: playId }
        );
      } else {
        toast.error(result.error ?? "Failed to execute play", { id: playId });
      }
    } catch {
      toast.error("Failed to execute play", { id: playId });
    } finally {
      setExecutingId(null);
    }
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>AI Strategy Lab</CardTitle>
        <Badge variant="accent">Intelligence</Badge>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {plays.map((play) => (
            <li key={play.id} className="rounded-md border border-[hsl(var(--border))] p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1">
                  <h4 className="font-semibold text-[hsl(var(--foreground))]">{play.title}</h4>
                  <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">{play.thesis}</p>
                </div>
                <Badge variant={play.confidence >= 0.75 ? "success" : play.confidence >= 0.5 ? "warning" : "destructive"}>
                  {Math.round(play.confidence * 100)}%
                </Badge>
              </div>
              
              <p className="text-xs text-[hsl(var(--muted-foreground))] mb-3">
                <span className="font-medium">Trigger:</span> {play.trigger}
              </p>

              <ul className="space-y-1 mb-3">
                {play.steps.map((step, idx) => (
                  <li key={idx} className="text-sm text-[hsl(var(--muted-foreground))] flex gap-2">
                    <span className="font-medium text-[hsl(var(--foreground))]">{idx + 1}.</span>
                    {step}
                  </li>
                ))}
              </ul>

              <div className="flex items-center justify-between border-t border-[hsl(var(--border))] pt-3">
                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                  <span className="font-medium">Impact:</span> {play.expectedImpact}
                </p>
                <Button
                  size="sm"
                  onClick={() => handleExecute(play.id, play.title)}
                  disabled={executingId !== null}
                >
                  {executingId === play.id ? "Executing..." : "Execute Play"}
                </Button>
              </div>
            </li>
          ))}
        </ul>

        {plays.length === 0 && (
          <p className="text-sm text-[hsl(var(--muted-foreground))] text-center py-6">
            No strategy plays available for this deal.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
