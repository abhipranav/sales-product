"use client";

import { useState } from "react";
import { toast } from "sonner";
import { analyzeReadability } from "@/lib/utils/readability-helper";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface CopilotPanelProps {
  subject: string;
  body: string;
  onUpdateSubject: (subject: string) => void;
  onUpdateBody: (body: string) => void;
}

export function LavenderCopilotPanel({
  subject,
  body,
  onUpdateSubject,
  onUpdateBody,
}: CopilotPanelProps) {
  const [isRefining, setIsRefining] = useState(false);

  // Compute live local metrics with 0ms latency
  const metrics = analyzeReadability(body);

  // Calculate high-fidelity Lavender score (10 to 100)
  let score = 100;
  if (metrics.wordCount > 100) score -= 20;
  if (metrics.gradeLevel > 8) score -= 20;
  if (!metrics.checklist.hasClearCta) score -= 20;
  if (metrics.readingEase < 60) score -= 15;
  score = Math.max(10, score);

  async function handleRefinement(instruction: "shorten" | "punchier" | "executive" | "simplify") {
    setIsRefining(true);
    const toastId = toast.loading(`Lavender Co-Pilot: Refining draft...`, { id: "lavender-refine" });

    try {
      const response = await fetch("/api/followups/refine", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subject,
          body,
          instruction,
        }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        toast.error(payload?.error || "Failed to refine draft.", { id: "lavender-refine" });
        return;
      }

      onUpdateSubject(payload.subject);
      onUpdateBody(payload.body);
      toast.success(`Draft successfully optimized: ${payload.explanation}`, { id: "lavender-refine" });
    } catch {
      toast.error("Network error during draft optimization.", { id: "lavender-refine" });
    } finally {
      setIsRefining(false);
    }
  }

  // Helper color for score
  let scoreColorClass = "text-emerald-500 border-emerald-500/30 bg-emerald-500/10";
  if (score < 80 && score >= 60) {
    scoreColorClass = "text-yellow-500 border-yellow-500/30 bg-yellow-500/10";
  } else if (score < 60) {
    scoreColorClass = "text-rose-500 border-rose-500/30 bg-rose-500/10";
  }

  return (
    <div className="space-y-5 h-full flex flex-col">
      {/* 1. Header & Live Score */}
      <div className="flex items-center justify-between border-b border-[hsl(var(--border))] pb-3">
        <div>
          <h3 className="font-['Sora',sans-serif] font-bold text-sm flex items-center gap-1.5">
            🪻 Lavender Co-Pilot
          </h3>
          <p className="text-[11px] text-[hsl(var(--muted-foreground))]">
            Real-time readability & impact scoring
          </p>
        </div>
        <div className={`border-[2px] font-mono font-black text-lg px-2.5 py-1 ${scoreColorClass}`}>
          {score}/100
        </div>
      </div>

      {/* 2. Micro-Refiners */}
      <div className="space-y-2">
        <span className="text-[10px] font-mono uppercase tracking-wider text-[hsl(var(--muted-foreground))] block">
          ⚡ AI Micro-Refiners (gpt-5.4-mini)
        </span>
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleRefinement("shorten")}
            disabled={isRefining || !body.trim()}
            className="text-xs h-8"
          >
            ✂️ Shorten Draft
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleRefinement("punchier")}
            disabled={isRefining || !body.trim()}
            className="text-xs h-8"
          >
            🔥 Make Punchier
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleRefinement("executive")}
            disabled={isRefining || !body.trim()}
            className="text-xs h-8"
          >
            👔 Executive Tone
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleRefinement("simplify")}
            disabled={isRefining || !body.trim()}
            className="text-xs h-8"
          >
            🧸 5th Grade Read
          </Button>
        </div>
      </div>

      {/* 3. Live Checklist */}
      <Card className="border-[2px] bg-[hsl(var(--muted))]">
        <CardContent className="p-3.5 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 font-medium">
              {metrics.checklist.underWordLimit ? "🟢" : "🔴"}{" "}
              Length: {metrics.wordCount} words
            </span>
            <span className="text-[10px] text-[hsl(var(--muted-foreground))]">Goal: &lt; 100</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 font-medium">
              {metrics.checklist.readableGrade ? "🟢" : "🔴"}{" "}
              Readability: Grade {metrics.gradeLevel}
            </span>
            <span className="text-[10px] text-[hsl(var(--muted-foreground))]">Goal: Grade 5-7</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 font-medium">
              {metrics.checklist.hasClearCta ? "🟢" : "🔴"}{" "}
              CTA Checklist: {body.includes("?") ? "1 clear question" : "No questions"}
            </span>
            <span className="text-[10px] text-[hsl(var(--muted-foreground))]">Goal: Exactly 1 ask</span>
          </div>

          <div className="border-t border-[hsl(var(--border))] pt-2.5 mt-1 flex justify-between text-[11px] text-[hsl(var(--muted-foreground))]">
            <span>Ease: {metrics.readingEase}/100</span>
            <span>Est. Reading Time: {metrics.readingTimeMinutes}m</span>
          </div>
        </CardContent>
      </Card>

      {/* 4. Responsive Mobile Preview */}
      <div className="flex-1 flex flex-col min-h-[220px]">
        <span className="text-[10px] font-mono uppercase tracking-wider text-[hsl(var(--muted-foreground))] block mb-1.5">
          📱 Responsive Mobile Preview
        </span>
        <div className="flex-1 border-[3px] border-neutral-700 bg-neutral-900 rounded-2xl p-3 text-neutral-200 font-sans shadow-inner overflow-y-auto max-h-[260px] relative select-none">
          {/* Top phone bar mimic */}
          <div className="flex justify-between items-center text-[9px] text-neutral-400 font-semibold mb-2 px-1">
            <span>9:41</span>
            <div className="h-3 w-12 bg-black rounded-full" />
            <div className="flex gap-1">
              <span>📶</span>
              <span>🔋</span>
            </div>
          </div>

          <div className="bg-neutral-800 p-2.5 rounded-lg border border-neutral-700/50 space-y-1.5">
            <div className="text-[10px] text-neutral-400 border-b border-neutral-700/50 pb-1.5">
              <span className="font-bold text-neutral-300">Subject:</span> {subject || "(No Subject)"}
            </div>
            <div className="text-xs leading-relaxed text-neutral-100 whitespace-pre-wrap font-sans tracking-wide">
              {body || "Start typing your email body on the left..."}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
