"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface OnboardingStatus {
  accounts: number;
  contacts: number;
  signals: number;
  tasks: number;
  approvals: number;
  hasApiKey: boolean;
}

export function QuickStartMilestones() {
  const [status, setStatus] = useState<OnboardingStatus>({
    accounts: 0,
    contacts: 0,
    signals: 0,
    tasks: 0,
    approvals: 0,
    hasApiKey: false,
  });
  const [loading, setLoading] = useState(true);
  const [isSimulating, setIsSimulating] = useState(false);

  async function fetchStatus() {
    try {
      const res = await fetch("/api/onboarding/status");
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (err) {
      console.error("Failed to load onboarding status", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStatus();
    // Poll status every 4 seconds to update checkmarks dynamically as they perform actions
    const interval = setInterval(fetchStatus, 4000);
    return () => clearInterval(interval);
  }, []);

  async function handleSimulateSignal() {
    if (isSimulating) return;
    setIsSimulating(true);
    toast.loading("Injecting buying signal anomaly...", { id: "onboarding-sim" });

    try {
      const res = await fetch("/api/setup/simulate-signal", { method: "POST" });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || "Failed to inject signal.");
      }

      toast.success(`[SIGNAL_INJECTED] ${data.signal.summary}`, { id: "onboarding-sim" });
      fetchStatus();
    } catch (err: any) {
      toast.error(err.message || "Failed to simulate signal.", { id: "onboarding-sim" });
    } finally {
      setIsSimulating(false);
    }
  }

  const milestones = [
    {
      id: "seed",
      label: "WIPE & SEED WORKSPACE",
      description: "Database initialized with Aurora Logistics, Bloom Dynamics, and other starter assets.",
      isDone: status.accounts > 0,
      action: (
        <Link href="/showcase" className="mt-1 block">
          <Button size="sm" className="h-7 font-mono text-[9px] font-bold">
            [ RESET & SEED DB ]
          </Button>
        </Link>
      ),
    },
    {
      id: "capture",
      label: "PERFORM QUICK CAPTURE",
      description: "Press 'Q' on any screen to launch the global drawer and log your first deal task.",
      isDone: status.tasks > 0,
      action: (
        <button
          onClick={() => window.dispatchEvent(new CustomEvent("open-quick-ingest"))}
          className="mt-1 flex items-center justify-between border-[2px] border-[hsl(var(--border))] hover:border-[hsl(var(--foreground))] bg-[hsl(var(--card))] hover:bg-yellow-400 hover:text-black py-0.5 px-2 font-mono text-[9px] font-black uppercase text-left transition-all duration-150 relative cursor-pointer"
        >
          [ LAUNCH Q DRAWER ]
        </button>
      ),
    },
    {
      id: "signal",
      label: "INJECT INTENT SIGNAL",
      description: "Simulate a live funding, hiring, or tooling alert via the telemetry gateway.",
      isDone: status.signals > 0,
      action: (
        <Button
          onClick={handleSimulateSignal}
          disabled={isSimulating}
          size="sm"
          className="h-7 mt-1 font-mono text-[9px] font-bold bg-yellow-400 text-black hover:bg-black hover:text-yellow-400 border-yellow-400"
        >
          [ TRIGGER ANOMALY ]
        </Button>
      ),
    },
    {
      id: "approval",
      label: "QUEUE OUTBOUND SEQUENCE",
      description: "Trigger outbound campaigns and review steps in the Sequence Execution Board.",
      isDone: status.approvals > 0 || status.tasks > 2, // Seeding includes tasks/approvals
      action: (
        <Link href="/cockpit" className="mt-1 block">
          <Button size="sm" variant="outline" className="h-7 font-mono text-[9px] font-bold">
            [ GO TO COCKPIT ]
          </Button>
        </Link>
      ),
    },
    {
      id: "ai",
      label: "CONFIGURE PERSONAL AI KEY",
      description: "Add your personal OpenAI credentials in Settings to swap local deterministic templates for AI models.",
      isDone: status.hasApiKey,
      action: (
        <Link href="/settings" className="mt-1 block">
          <Button size="sm" variant="outline" className="h-7 font-mono text-[9px] font-bold">
            [ VIEW SETTINGS ]
          </Button>
        </Link>
      ),
    },
  ];

  const completedCount = milestones.filter((m) => m.isDone).length;
  const percentComplete = Math.round((completedCount / milestones.length) * 100);

  if (loading) {
    return (
      <Card className="reveal mb-6 animate-pulse">
        <CardContent className="h-40 flex items-center justify-center font-mono text-xs uppercase tracking-wider">
          Retrieving onboarding milestones...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="reveal mb-6 border-[2px] border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden shadow-lg">
      <div className="caution-stripe-thin" />
      <CardHeader className="pb-3 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <Badge variant="accent" className="font-mono text-[9px] uppercase tracking-wider mb-1">Onboarding Milestones</Badge>
          <CardTitle className="font-serif text-xl font-bold tracking-tight text-[hsl(var(--foreground))]">
            Quick-Start Playbook Progress
          </CardTitle>
          <CardDescription className="text-xs">
            Complete the core user journeys of Velocity OS to transition from a clean slate to high-momentum sales execution.
          </CardDescription>
        </div>
        <div className="flex flex-col items-end shrink-0">
          <span className="font-mono text-xs font-black uppercase text-[hsl(var(--foreground))]">
            {completedCount} / {milestones.length} COMPLETED
          </span>
          <div className="mt-1.5 w-36 h-2 border border-[hsl(var(--border))] bg-[hsl(var(--muted))] overflow-hidden relative">
            <div
              className="h-full bg-yellow-400 transition-all duration-300"
              style={{ width: `${percentComplete}%` }}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="grid md:grid-cols-5 gap-3 mt-1">
          {milestones.map((m, index) => (
            <div
              key={m.id}
              className={`p-3 border-[2px] rounded-md transition-all flex flex-col justify-between ${
                m.isDone
                  ? "border-[hsl(var(--success))] bg-[hsl(var(--success))/0.03] text-[hsl(var(--foreground))]"
                  : "border-[hsl(var(--border))] bg-[hsl(var(--muted))/0.2]"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono text-[9px] text-[hsl(var(--muted-foreground))]">[0{index + 1}]</span>
                  {m.isDone ? (
                    <Badge variant="success" className="font-bold text-[8px] px-1 py-0 h-4 uppercase">
                      READY
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="font-bold text-[8px] px-1 py-0 h-4 uppercase">
                      TODO
                    </Badge>
                  )}
                </div>
                <h4 className="font-mono text-[10px] font-black uppercase tracking-wider leading-tight">
                  {m.label}
                </h4>
                <p className="text-[10px] text-[hsl(var(--muted-foreground))] mt-1 leading-normal">
                  {m.description}
                </p>
              </div>
              <div className="mt-3.5 pt-2 border-t border-[hsl(var(--border))]/40 flex justify-end">
                {m.isDone ? (
                  <span className="font-mono text-[9px] text-[hsl(var(--success))] font-bold flex items-center gap-1">
                    ✓ VALIDATED
                  </span>
                ) : (
                  m.action
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
