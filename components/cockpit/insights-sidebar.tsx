"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface InsightsSidebarProps {
  dealId: string;
  onSuccess?: () => void;
}

interface IntelResult {
  brief: {
    primaryGoal: string;
    likelyObjections: string[];
    recommendedNarrative: string;
    proofPoints: string[];
  };
  competitors: string[];
  sentiment: string;
  tasksCreatedCount: number;
}

export function GongCallInsights({ dealId, onSuccess }: InsightsSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [intelReport, setIntelReport] = useState<IntelResult | null>(null);

  async function handleAudioUpload() {
    setIsUploading(true);
    toast.loading("Gong AI: Processing call audio & generating conversation intelligence...", { id: `gong-${dealId}` });

    try {
      const response = await fetch("/api/intelligence/transcribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dealId,
          audioFileName: "q2-alignment-call.mp3",
        }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        toast.error(payload?.error || "Failed to process call audio.", { id: `gong-${dealId}` });
        return;
      }

      setIntelReport(payload);
      toast.success(`Success! Extracted strategic prep and auto-created ${payload.tasksCreatedCount} next action items on your deal board.`, { id: `gong-${dealId}` });
      if (onSuccess) onSuccess();
    } catch (error) {
      toast.error("Network error processing call recording.", { id: `gong-${dealId}` });
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        onClick={() => setIsOpen(true)}
        className="font-semibold flex items-center gap-1.5 bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] hover:bg-[hsl(var(--accent)/0.9)]"
      >
        <span aria-hidden>🎙️</span> Gong Call Insights
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="h-full w-full max-w-lg border-l border-[hsl(var(--border))] bg-[hsl(var(--background))] p-6 shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-200"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between border-b border-[hsl(var(--border))] pb-4">
              <div>
                <h2 className="font-['Sora',sans-serif] text-lg font-bold flex items-center gap-2">
                  🎙️ Gong Conversation Intelligence
                </h2>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                  Analyze voice transcripts & extract real-time strategic alignment
                </p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => setIsOpen(false)}>
                Close
              </Button>
            </div>

            <div className="mt-6 space-y-6">
              {!intelReport && (
                <div className="grid gap-4">
                  <div className="border-[2px] border-dashed border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-8 text-center flex flex-col items-center justify-center gap-3">
                    <span className="text-3xl" aria-hidden>📤</span>
                    <div>
                      <p className="text-sm font-semibold">Drag & Drop Sales Call Recording</p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                        Supports MP3, WAV, or M4A (Max 50MB)
                      </p>
                    </div>
                    <Button
                      type="button"
                      onClick={handleAudioUpload}
                      disabled={isUploading}
                      className="mt-2 bg-[hsl(var(--foreground))] text-[hsl(var(--background))]"
                    >
                      {isUploading ? "Transcribing Call..." : "Upload & Analyze Call"}
                    </Button>
                  </div>

                  {isUploading && (
                    <div className="space-y-3 p-4 border border-[hsl(var(--border))] bg-[hsl(var(--muted))]">
                      <div className="flex justify-between text-xs font-mono">
                        <span>Local Whisper / Deepgram WASM pipeline</span>
                        <span className="animate-pulse">Active</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden border border-[hsl(var(--border))] bg-[hsl(var(--background))]">
                        <div className="h-full w-2/3 bg-[hsl(var(--accent))] animate-pulse" />
                      </div>
                      <p className="text-[11px] text-[hsl(var(--muted-foreground))] text-center">
                        Transcribing dialogue and syncing structured goals...
                      </p>
                    </div>
                  )}
                </div>
              )}

              {intelReport && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  <div className="flex flex-wrap gap-2 items-center justify-between bg-[hsl(var(--muted))] p-3 border border-[hsl(var(--border))]">
                    <div>
                      <span className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider block">
                        Buyer Sentiment
                      </span>
                      <span className="text-sm font-semibold flex items-center gap-1.5 mt-0.5">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
                        {intelReport.sentiment}
                      </span>
                    </div>
                    <Badge variant="success">
                      +{intelReport.tasksCreatedCount} CRM Tasks Added
                    </Badge>
                  </div>

                  {intelReport.competitors.length > 0 && (
                    <div className="space-y-1.5">
                      <h4 className="text-xs font-semibold uppercase tracking-[0.12em] text-[hsl(var(--muted-foreground))]">
                        Competitors Mentioned
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {intelReport.competitors.map((comp) => (
                          <Badge key={comp} variant="destructive">
                            ⚠️ {comp}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <Card className="border-[2px]">
                    <CardContent className="pt-4 space-y-4">
                      <div>
                        <h4 className="text-xs font-semibold uppercase tracking-[0.12em] text-[hsl(var(--muted-foreground))]">
                          Extracted Primary Goal
                        </h4>
                        <p className="text-sm mt-1 text-[hsl(var(--foreground))]">
                          {intelReport.brief.primaryGoal}
                        </p>
                      </div>

                      <div className="border-t border-[hsl(var(--border))] pt-3">
                        <h4 className="text-xs font-semibold uppercase tracking-[0.12em] text-[hsl(var(--muted-foreground))]">
                          Identified Objections
                        </h4>
                        <ul className="list-disc pl-4 text-sm mt-1.5 space-y-1 text-[hsl(var(--muted-foreground))]">
                          {intelReport.brief.likelyObjections.map((obj) => (
                            <li key={obj}>{obj}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="border-t border-[hsl(var(--border))] pt-3">
                        <h4 className="text-xs font-semibold uppercase tracking-[0.12em] text-[hsl(var(--muted-foreground))]">
                          Recommended Narrative
                        </h4>
                        <p className="text-sm mt-1 text-[hsl(var(--muted-foreground))]">
                          {intelReport.brief.recommendedNarrative}
                        </p>
                      </div>

                      <div className="border-t border-[hsl(var(--border))] pt-3">
                        <h4 className="text-xs font-semibold uppercase tracking-[0.12em] text-[hsl(var(--muted-foreground))]">
                          Extracted Proof Points
                        </h4>
                        <ul className="list-decimal pl-4 text-sm mt-1.5 space-y-1 text-[hsl(var(--muted-foreground))]">
                          {intelReport.brief.proofPoints.map((pt) => (
                            <li key={pt}>{pt}</li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="p-3 border border-emerald-600/30 bg-emerald-950/20 text-emerald-300 text-xs">
                    <p className="font-semibold flex items-center gap-1.5">
                      <span aria-hidden>⚡</span> Action Items Activated
                    </p>
                    <p className="mt-1 text-[11px]">
                      {"The discovered tasks and deadlines have been synced directly to your \"Next Actions\" checklist and pipeline board. Let's execute!"}
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full text-xs"
                    onClick={() => setIntelReport(null)}
                  >
                    Reset & Upload Another Call
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
