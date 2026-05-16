"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface SignalLog {
  id: string;
  summary: string;
  score: number;
  happenedAt: string;
}

export function ShowcaseClient() {
  const [activeSlide, setActiveSlide] = useState<number>(0);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulatedSignals, setSimulatedSignals] = useState<SignalLog[]>([]);

  // Load initial simulated signals or local logs to show on slide 5
  useEffect(() => {
    async function loadLogs() {
      try {
        const response = await fetch("/api/notifications?limit=5");
        if (response.ok) {
          const data = await response.json();
          if (data && data.notifications) {
            setSimulatedSignals(
              data.notifications.map((n: any) => ({
                id: n.id,
                summary: n.summary,
                score: n.score,
                happenedAt: n.happenedAt,
              }))
            );
          }
        }
      } catch {
        // Silently ignore
      }
    }
    loadLogs();
  }, []);

  async function handleSimulateSignal() {
    if (isSimulating) return;
    setIsSimulating(true);
    toast.loading("Simulating new high-impact buying signal...", { id: "sim-showcase" });

    try {
      const res = await fetch("/api/setup/simulate-signal", {
        method: "POST",
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || "Failed to simulate signal.");
      }

      toast.success(`[SIGNAL_INJECTED] ${data.signal.summary}`, { id: "sim-showcase" });
      
      // Prepend to simulated log
      setSimulatedSignals((prev) => [
        {
          id: data.signal.id,
          summary: data.signal.summary,
          score: data.signal.score,
          happenedAt: new Date().toISOString(),
        },
        ...prev.slice(0, 4),
      ]);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to simulate signal.", { id: "sim-showcase" });
    } finally {
      setIsSimulating(false);
    }
  }

  const slides = [
    {
      id: "slide-01",
      num: "[01]",
      tabLabel: "VISION // MANIFESTO",
      title: "Reimagining Sales Operations with Velocity OS",
      description:
        "Velocity OS represents the next paradigm of B2B Go-To-Market interfaces. By replacing slow, tabular Salesforce and HubSpot navigation with a single consolidated command layer, reps capture and execute actions with zero latency.",
      content: (
        <div className="space-y-4">
          <div className="border-[2px] border-[hsl(var(--border))] rounded-lg overflow-hidden relative bg-[hsl(var(--muted)/0.3)]">
            <div className="caution-stripe-thin" />
            <div className="p-2 border-b border-[hsl(var(--border))] bg-[hsl(var(--card))] flex items-center justify-between">
              <span className="font-mono text-[9px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                IMAGE_PREVIEW // GTM_OPERATOR_CONSOLE
              </span>
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            </div>
            <div className="p-3 bg-[hsl(var(--background))] flex justify-center">
              <Image
                src="/gtm_dashboard_mockup.png"
                alt="Velocity OS Dashboard Mockup"
                width={700}
                height={400}
                className="border-[2px] border-[hsl(var(--border))] rounded-md object-contain shadow-2xl"
              />
            </div>
          </div>
          <p className="font-mono text-xs text-[hsl(var(--muted-foreground))] text-center leading-normal">
            Figure 1.0: Real-time cockpit summarizing active deals, buying signals, and Outbound Approval telemetry.
          </p>
        </div>
      ),
    },
    {
      id: "slide-02",
      num: "[02]",
      tabLabel: "ONE-CLICK SETUP",
      title: "Solving the Cold Start Blank Canvas",
      description:
        "Traditional CRM integrations require hours of configuration, staging, and manual entry. Velocity OS introduces a premium, one-click programmatic setup feature that wipes and seeds realistic B2B sales data instantly.",
      content: (
        <div className="space-y-4">
          <div className="border-[2px] border-yellow-400 bg-[hsl(var(--card))] rounded-lg overflow-hidden">
            <div className="caution-stripe-thin" />
            <div className="p-5">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[9px] font-bold bg-yellow-400 text-black px-1.5 py-0.5 border border-black animate-pulse">
                      DANGER_ZONE
                    </span>
                    <span className="font-mono text-[10px] font-bold text-[hsl(var(--muted-foreground))]">
                      SYS_DATABASE_RESET
                    </span>
                  </div>
                  <h4 className="font-serif text-lg font-bold uppercase mt-2">
                    One-Click Demo Workspace Reset
                  </h4>
                  <p className="font-mono text-xs text-[hsl(var(--muted-foreground))] mt-1 leading-normal">
                    [ ACTION // RESTORE_SYSTEM_SEED_STATE ]
                    <br />
                    Resets the local SQLite database to load Aurora Logistics, Bloom Dynamics, and other high-value seed assets.
                  </p>
                </div>
                <Button variant="destructive" size="sm" className="font-mono text-[10px] font-bold bg-red-600 text-white hover:bg-red-700">
                  WIPE & SEED WORKSPACE
                </Button>
              </div>
            </div>
          </div>
          <div className="border-[2px] border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-4 rounded-lg">
            <h5 className="font-mono text-xs font-bold text-[hsl(var(--foreground))]">TECHNICAL SPECIFICATION // OFFLINE SQLITE</h5>
            <p className="font-mono text-[11px] text-[hsl(var(--muted-foreground))] mt-2 leading-relaxed">
              Every write triggers local schema transactions immediately, mapped safely at boundary points to bypass any remote database latency. Zero spinner delay.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "slide-03",
      num: "[03]",
      tabLabel: "SPEED CAPTURE",
      title: "Global Hotkey Ingestion Drawer",
      description:
        "High-velocity reps shouldn't navigate away to log actions. In Velocity OS, pressing 'Q' on any screen launches the global quick-capture drawer, supporting deal opportunities, meetings, contact roles, and task logs.",
      content: (
        <div className="space-y-4">
          <div className="border-[2px] border-[hsl(var(--border))] rounded-lg overflow-hidden bg-[hsl(var(--card))]">
            <div className="p-4 border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))] flex items-center justify-between">
              <span className="font-mono text-xs font-bold uppercase tracking-wider">
                [01] LOG_TASK // QUICK_INGEST
              </span>
              <span className="font-mono text-[9px] bg-[hsl(var(--foreground))] text-[hsl(var(--background))] px-1.5 py-0.5 font-bold uppercase">
                HOTKEY Q ACTIVE
              </span>
            </div>
            <div className="p-4 space-y-3 font-mono text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-[hsl(var(--muted-foreground))]">[SELECT_DEAL]</span>
                  <div className="border border-[hsl(var(--border))] px-2 py-1.5 bg-[hsl(var(--background))]">
                    Aurora Logistics Enterprise Expansion
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-[hsl(var(--muted-foreground))]">[PRIORITY]</span>
                  <div className="border border-[hsl(var(--border))] px-2 py-1.5 bg-[hsl(var(--background))]">
                    HIGH
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-[hsl(var(--muted-foreground))]">[TASK_TITLE]</span>
                <div className="border border-[hsl(var(--border))] px-2 py-1.5 bg-[hsl(var(--background))]">
                  Prepare executive briefing document for CFO review
                </div>
              </div>
              <div className="pt-2">
                <Button size="sm" variant="success" className="font-mono text-[10px] w-full font-bold">
                  CREATE TASK LOG
                </Button>
              </div>
            </div>
          </div>
          <p className="font-mono text-xs text-[hsl(var(--muted-foreground))] leading-normal">
            * Drawer ignores key triggers when focused inside active edit fields, preventing accidental popups.
          </p>
        </div>
      ),
    },
    {
      id: "slide-04",
      num: "[04]",
      tabLabel: "AI DIAGNOSTICS",
      title: "Unresolved API Key Telemetry",
      description:
        "Silent AI failure breeds confusion. When an active OpenAI key is not configured, Velocity OS instantly surfaces a highly polished warning box, making it explicit that the workspace is running rule-based fallback templates.",
      content: (
        <div className="space-y-4">
          <div className="border-[2px] border-yellow-400 bg-[hsl(var(--card))] overflow-hidden rounded-lg">
            <div className="caution-stripe-thin" />
            <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[9px] font-bold bg-yellow-400 text-black px-1.5 py-0.5 border border-black animate-pulse">
                    AI_FALLBACK
                  </span>
                  <span className="font-mono text-[10px] uppercase font-bold text-[hsl(var(--muted-foreground))]">
                    RULE_BASED_TEMPLATES_ACTIVE
                  </span>
                </div>
                <p className="text-xs text-[hsl(var(--muted-foreground))] font-mono leading-normal mt-1">
                  OpenAI credentials are not configured. The workspace is defaulting to deterministic rule-based templates for follow-up and meeting prep generations.
                </p>
              </div>
              <div className="flex-shrink-0">
                <Button variant="cta" size="sm" className="font-mono text-[9px] font-bold">
                  [ CONFIGURE OPENAI KEY ]
                </Button>
              </div>
            </div>
          </div>
          <p className="font-mono text-[11px] text-[hsl(var(--muted-foreground))] leading-relaxed">
            Rendered inside both the **Follow-Up Composer** and **Meeting Brief** cards, ensuring reps never confuse rule-based defaults with state-of-the-art AI outputs.
          </p>
        </div>
      ),
    },
    {
      id: "slide-05",
      num: "[05]",
      tabLabel: "LIVE PLAYGROUND",
      title: "Interactive Sandbox Control Deck",
      description:
        "Experience Velocity OS in real-time. Use the button below to inject a simulated high-impact buying signal directly into the active local database. Watch how the notifications stack is populated.",
      content: (
        <div className="space-y-4">
          <div className="border-[2px] border-[hsl(var(--border))] rounded-lg bg-[hsl(var(--card))] overflow-hidden p-5">
            <div className="flex flex-wrap justify-between items-center gap-4">
              <div>
                <span className="font-mono text-[9px] font-bold bg-green-500 text-black px-1.5 py-0.5 border border-black animate-pulse">
                  SIMULATION_READY
                </span>
                <h4 className="font-serif text-lg font-bold mt-2 uppercase">Signal Telemetry Sandbox</h4>
                <p className="font-mono text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                  Inject Funding, Hiring, or Engagement surges dynamically.
                </p>
              </div>
              <Button
                type="button"
                variant="cta"
                disabled={isSimulating}
                onClick={handleSimulateSignal}
                className="font-mono font-bold text-[10px] h-10 px-4"
              >
                {isSimulating ? "INJECTING_TELEMETRY..." : "[ TRIGGER SIGNAL ANOMALY ]"}
              </Button>
            </div>

            <div className="mt-5 border-[2px] border-[hsl(var(--border))] rounded-md overflow-hidden bg-[hsl(var(--background))]">
              <div className="p-2 border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))] flex items-center justify-between">
                <span className="font-mono text-[9px] uppercase font-bold text-[hsl(var(--muted-foreground))]">
                  ACTIVE_INCOMING_TELEMETRY_LOGS
                </span>
                <span className="font-mono text-[9px] text-[hsl(var(--success))] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping" />
                  SOCKET_ACTIVE
                </span>
              </div>
              <div className="p-3 space-y-2 font-mono text-[11px] max-h-[160px] overflow-y-auto">
                {simulatedSignals.length === 0 ? (
                  <p className="text-[hsl(var(--muted-foreground))] text-center py-4">No signals found. Click anomaly button to simulate.</p>
                ) : (
                  simulatedSignals.map((sig) => (
                    <div key={sig.id} className="border-b border-[hsl(var(--border))]/50 pb-2 last:border-0 last:pb-0 flex justify-between items-start gap-3">
                      <div>
                        <span className="text-[hsl(var(--success))] font-bold">[INCOMING]</span>{" "}
                        <span className="text-[hsl(var(--foreground))]">{sig.summary}</span>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <Badge variant="destructive" className="font-bold text-[8px] px-1 py-0 h-4">
                          {sig.score} SCORE
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          <p className="font-mono text-xs text-[hsl(var(--muted-foreground))] text-center">
            * Injected signals propagate instantly across all client Cockpit Focus Boards and pipeline alerts.
          </p>
        </div>
      ),
    },
  ];

  return (
    <main className="min-h-screen ind-grid-bg pb-20">
      {/* Navigation Header */}
      <header className="sticky top-0 z-30 border-b-[2px] border-[hsl(var(--border))] bg-[hsl(var(--background))]/95 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-2.5 md:px-8">
          <Link href="/" className="flex items-center gap-0">
            <span className="font-mono text-base font-bold tracking-tight text-[hsl(var(--foreground))]">
              VELOCITY_OS
            </span>
            <span className="font-mono text-[10px] font-bold text-[hsl(var(--muted-foreground))] ml-0.5">®</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link href="/" className="ind-btn-outline text-xs py-1.5 px-3">
              ← HOME
            </Link>
            <Link href="/workspace" className="ind-btn text-xs py-1.5 px-3 bg-yellow-400 text-black border-black hover:bg-black hover:text-yellow-400">
              OPEN COCKPIT
            </Link>
          </div>
        </div>
      </header>

      {/* Main Showcase Deck Container */}
      <div className="mx-auto mt-10 w-full max-w-5xl px-5 md:px-8">
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="ind-badge-black font-mono">PRODUCT TOUR</span>
            <h1 className="font-serif text-3xl md:text-4xl font-bold tracking-tight mt-2 text-[hsl(var(--foreground))]">
              Touring the Revenue Command Center
            </h1>
            <p className="font-mono text-xs text-[hsl(var(--muted-foreground))] mt-1">
              Interactive slides exploring the vision and technical capabilities of Velocity OS.
            </p>
          </div>
          <div className="flex items-center gap-2 border-[2px] border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-1.5 rounded-lg">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="font-mono text-[10px] font-bold text-[hsl(var(--foreground))]">
              SYSTEM_LIVE_SANDBOX
            </span>
          </div>
        </div>

        {/* Slide Window Layout */}
        <div className="border-[2px] border-[hsl(var(--border))] rounded-xl bg-[hsl(var(--card))] overflow-hidden shadow-2xl">
          {/* Header caution strip */}
          <div className="caution-stripe-thin" />

          {/* Slide Tab Deck */}
          <div className="grid grid-cols-2 sm:grid-cols-5 border-b-[2px] border-[hsl(var(--border))] bg-[hsl(var(--muted))/0.5]">
            {slides.map((slide, index) => {
              const isSelected = activeSlide === index;
              return (
                <button
                  key={slide.id}
                  onClick={() => setActiveSlide(index)}
                  className={`py-3.5 px-2 text-center border-r-[2px] border-[hsl(var(--border))] font-mono text-[10px] uppercase font-bold tracking-wider transition-all relative ${
                    isSelected
                      ? "bg-[hsl(var(--foreground))] text-[hsl(var(--background))] border-b-[2px] border-b-[hsl(var(--foreground))]"
                      : "hover:bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                  } last:border-r-0`}
                >
                  <div className="text-[8px] opacity-75 mb-0.5">{slide.num}</div>
                  <div>{slide.tabLabel}</div>
                  {isSelected && (
                    <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-yellow-400" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Active Slide Body */}
          <div className="grid lg:grid-cols-[1.1fr_0.9fr] divide-y lg:divide-y-0 lg:divide-x-[2px] lg:divide-[hsl(var(--border))] bg-[hsl(var(--card))]">
            {/* Slide Details */}
            <div className="p-6 md:p-8 flex flex-col justify-between min-h-[400px]">
              <div>
                <span className="font-mono text-[10px] bg-yellow-400 text-black px-1.5 py-0.5 border border-black font-bold">
                  SLIDE_{slides[activeSlide].num}
                </span>
                <h2 className="font-serif text-2xl md:text-3xl font-bold uppercase tracking-tight text-[hsl(var(--foreground))] mt-4 leading-tight">
                  {slides[activeSlide].title}
                </h2>
                <p className="mt-4 text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">
                  {slides[activeSlide].description}
                </p>
              </div>

              {/* Slider Controller buttons */}
              <div className="mt-8 pt-6 border-t border-[hsl(var(--border))]/60 flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={activeSlide === 0}
                  onClick={() => setActiveSlide((prev) => prev - 1)}
                  className="font-mono text-[10px] font-bold"
                >
                  [ PREVIOUS_SLIDE ]
                </Button>
                <span className="font-mono text-xs text-[hsl(var(--muted-foreground))]">
                  {activeSlide + 1} / {slides.length}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={activeSlide === slides.length - 1}
                  onClick={() => setActiveSlide((prev) => prev + 1)}
                  className="font-mono text-[10px] font-bold bg-yellow-400 text-black hover:bg-black hover:text-yellow-400 hover:border-black border-yellow-400"
                >
                  [ NEXT_SLIDE ]
                </Button>
              </div>
            </div>

            {/* Slide Action Content (Replicas / Interactive Previews) */}
            <div className="p-6 md:p-8 bg-[hsl(var(--muted))/0.2] flex flex-col justify-center min-h-[400px]">
              {slides[activeSlide].content}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
