"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { MeetingBrief } from "@/lib/domain/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MeetingBriefCardProps {
  dealId: string;
  brief: MeetingBrief;
}

export function MeetingBriefCard({ dealId, brief }: MeetingBriefCardProps) {
  const [currentBrief, setCurrentBrief] = useState(brief);
  const [isRegenerating, setIsRegenerating] = useState(false);

  async function handleRegenerate() {
    if (isRegenerating) {
      return;
    }

    setIsRegenerating(true);
    toast.loading("Generating meeting brief...", { id: `brief-${dealId}` });

    try {
      const response = await fetch(`/api/briefs/${dealId}/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({})
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.brief) {
        toast.error(payload?.error ?? "Failed to generate meeting brief.", { id: `brief-${dealId}` });
        return;
      }

      setCurrentBrief(payload.brief);
      toast.success(`Meeting brief regenerated (${payload.source ?? "rule-based"}).`, { id: `brief-${dealId}` });
    } catch {
      toast.error("Failed to generate meeting brief.", { id: `brief-${dealId}` });
    } finally {
      setIsRegenerating(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="font-['Sora',sans-serif]">Meeting Prep Brief</CardTitle>
        <Button type="button" size="sm" variant="outline" onClick={handleRegenerate} disabled={isRegenerating}>
          {isRegenerating ? "Generating..." : "Regenerate"}
        </Button>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">{currentBrief.primaryGoal}</p>

        <div className="mt-4 grid gap-4">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))]">Likely objections</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[hsl(var(--muted-foreground))]">
              {currentBrief.likelyObjections.map((objection) => (
                <li key={objection}>{objection}</li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))]">Narrative</h3>
            <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">{currentBrief.recommendedNarrative}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
