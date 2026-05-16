"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

interface Profile {
  name: string;
  title: string;
  company: string;
  role: string;
}

export default function UserGuidePage() {
  const [activeSlide, setActiveSlide] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<"tour" | "sandbox" | "technical">("tour");
  
  // Sandbox states
  const [injectedLinkedIn, setInjectedLinkedIn] = useState<Profile | null>(null);
  const [isInjecting, setIsInjecting] = useState(false);
  const [isWiping, setIsWiping] = useState(false);

  // Stats from status API
  const [stats, setStats] = useState({ accounts: 0, contacts: 0, signals: 0, tasks: 0 });

  async function loadStats() {
    try {
      const res = await fetch("/api/onboarding/status");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch {
      // Ignore
    }
  }

  useEffect(() => {
    loadStats();
  }, []);

  async function handleWipeAndSeed() {
    if (isWiping) return;
    setIsWiping(true);
    toast.loading("Wiping and seeding SQLite database...", { id: "guide-wipe" });

    try {
      const res = await fetch("/api/setup/seed", { method: "POST" });
      if (res.ok) {
        toast.success("[DB_SUCCESS] Database restored to baseline seed state.", { id: "guide-wipe" });
        loadStats();
      } else {
        throw new Error("Failed to reset database");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to seed database.", { id: "guide-wipe" });
    } finally {
      setIsWiping(false);
    }
  }

  async function handleLinkedInSimulate(profile: Profile) {
    if (isInjecting) return;
    setIsInjecting(true);
    toast.loading(`Scraping profile: ${profile.name}...`, { id: "li-sim" });

    try {
      const res = await fetch("/api/integrations/linkedin/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceUrl: `https://linkedin.com/in/${profile.name.toLowerCase().replace(" ", "")}`,
          sourceTitle: `${profile.name} - ${profile.title} - ${profile.company} | LinkedIn`,
          parsedData: {
            fullName: profile.name,
            title: profile.title,
            companyName: profile.company,
            email: `${profile.name.toLowerCase().replace(" ", ".")}@${profile.company.toLowerCase().replace(" ", "")}.com`,
            role: profile.role
          }
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || "Failed to capture contact");
      }

      toast.success(`[CRM_CAPTURED] Added ${profile.name} to ${profile.company}!`, { id: "li-sim" });
      setInjectedLinkedIn(profile);
      loadStats();
    } catch (err: any) {
      toast.error(err.message || "Simulated scrape failed.", { id: "li-sim" });
    } finally {
      setIsInjecting(false);
    }
  }

  const slides = [
    {
      num: "[01]",
      tab: "GTM COCKPIT",
      title: "Rep Cockpit & AI Follow-Up Autopilot",
      desc: "The primary workspace for sales reps. It highlights urgent actions, overdue items, and provides deep contextual preparation for upcoming events. The follow-up assistant generates drafts with specific asks, time slots, and ROI calculations based on call logs.",
      interactive: (
        <div className="space-y-3 font-mono text-[11px]">
          <div className="border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3">
            <div className="flex justify-between border-b border-[hsl(var(--border))] pb-1.5 mb-2 text-[9px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
              <span>AI_GENERATION // PREVIEW</span>
              <span className="text-[hsl(var(--success))]">ACTIVE</span>
            </div>
            <p className="font-bold text-[hsl(var(--foreground))]">Subject: Quick recap & next steps - Aurora platform rollout</p>
            <div className="my-2 h-[1px] bg-[hsl(var(--border))]" />
            <p className="text-[hsl(var(--muted-foreground))] leading-normal">
              Thanks for walking me through your recruiting pipeline bottlenecks today, Maya. To support your Q1 ramp targets, sharing the ROI brief detailing our 35% time-to-hire reduction.
            </p>
            <p className="mt-2 text-yellow-400 font-bold">Ask: Can we align with Alex Rivera (CFO) this Thursday at 10:00 AM PST?</p>
          </div>
          <div className="flex justify-between items-center text-[10px] text-[hsl(var(--muted-foreground))]">
            <span>Enforces human-in-loop approval gates.</span>
            <Badge variant="outline" className="text-[9px] uppercase">Rule-based Fallback Ready</Badge>
          </div>
        </div>
      )
    },
    {
      num: "[02]",
      tab: "STAKEHOLDER MAP",
      title: "Multithreaded Stakeholder Influence Mapping",
      desc: "D deals fail when reps rely on a single champion. Velocity OS parses CRM contacts to render a live Influence Map. Categorize key players as Champions, Approvers, Blockers, or Influencers. Visually map who holds budget power and who poses a risk.",
      interactive: (
        <div className="space-y-3">
          <div className="border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3 rounded-md grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="border border-[hsl(var(--success))] bg-[hsl(var(--success))/0.03] p-2">
              <div className="flex items-center justify-between">
                <span className="font-bold">Maya Kim</span>
                <span className="text-[9px] bg-green-600 text-white px-1 font-bold">CHAMPION</span>
              </div>
              <p className="text-[10px] text-[hsl(var(--muted-foreground))] mt-1">VP Talent Ops. Pushing implementation schedule.</p>
            </div>
            <div className="border border-[hsl(var(--destructive))] bg-[hsl(var(--destructive))/0.03] p-2">
              <div className="flex items-center justify-between">
                <span className="font-bold">Neil Grant</span>
                <span className="text-[9px] bg-red-600 text-white px-1 font-bold">BLOCKER</span>
              </div>
              <p className="text-[10px] text-[hsl(var(--muted-foreground))] mt-1">Director Security. Holding up SOC 2 audit checks.</p>
            </div>
          </div>
          <p className="font-mono text-[10px] text-[hsl(var(--muted-foreground))] text-center leading-normal">
            Identify single-point champion risks instantly before contract review.
          </p>
        </div>
      )
    },
    {
      num: "[03]",
      tab: "PIPELINE PRESS",
      title: "Tactical Pipeline Stage Pressure & Hazards",
      desc: "Traditional views only track amount and close date. Velocity OS visualizes deal pressure, mapping risk indicators, close targets, and outstanding approvals. High-hazard flags are automatically generated if a deal sits in a single stage too long without recent activity.",
      interactive: (
        <div className="space-y-2">
          <div className="border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3 rounded font-mono text-xs">
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold uppercase text-[10px] tracking-wider">[ PIPELINE_STAGE // EVALUATION ]</span>
              <Badge variant="destructive" className="font-bold text-[8px] animate-pulse">STAGE_PRESSURE: HIGH</Badge>
            </div>
            <div className="w-full bg-[hsl(var(--muted))] h-3 border border-[hsl(var(--border))] relative overflow-hidden">
              <div className="h-full bg-red-500" style={{ width: "85%" }} />
            </div>
            <div className="flex justify-between text-[9px] text-[hsl(var(--muted-foreground))] mt-1">
              <span>85 Days in Evaluation (Limit: 45)</span>
              <span>Confidence: 68%</span>
            </div>
          </div>
        </div>
      )
    },
    {
      num: "[04]",
      tab: "LINKEDIN WORKBENCH",
      title: "LinkedIn Companion Capture Workbench",
      desc: "A browser-companion workflow. Reps scrape profile titles and company structures straight from LinkedIn tabs. The capture workbench normalizes the data, auto-resolves company matches inside the SQLite DB, and stages them for quick import.",
      interactive: (
        <div className="space-y-2">
          <div className="border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3 rounded text-center">
            <span className="font-mono text-[9px] font-bold bg-green-500 text-black px-1.5 py-0.5 border border-black animate-pulse uppercase">
              COMPANION_API_READY
            </span>
            <p className="font-mono text-[10px] text-[hsl(var(--muted-foreground))] mt-2 leading-relaxed">
              Stores tab URL dynamically, parses full name and title, and triggers a clean database commit without manual copy-paste overhead.
            </p>
          </div>
        </div>
      )
    },
    {
      num: "[05]",
      tab: "Q-KEY CAPTURE",
      title: "Global Hotkey Ingestion & Command Palette",
      desc: "Navigate at operational speed. Press 'CMD+K' from any screen to search across accounts, contacts, and deals. Press 'Q' from any screen to pop out the Quick Capture drawer, supporting instant action logs, meeting notes, or follow-ups.",
      interactive: (
        <div className="space-y-3 font-mono text-[11px]">
          <div className="border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3 rounded flex justify-between items-center gap-4">
            <div className="border border-[hsl(var(--border))] px-3 py-1.5 bg-[hsl(var(--muted))] text-center rounded font-black shadow-inner">
              CMD + K
            </div>
            <div className="text-[10px] text-[hsl(var(--muted-foreground))]">
              Globally index companies and contacts.
            </div>
          </div>
          <div className="border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3 rounded flex justify-between items-center gap-4">
            <div className="border border-[hsl(var(--border))] px-4 py-1.5 bg-yellow-400 text-black text-center rounded font-black shadow-inner">
              Q KEY
            </div>
            <div className="text-[10px] text-[hsl(var(--muted-foreground))]">
              Ingest quick-capture task drawer immediately.
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <section className="mx-auto max-w-7xl py-2 md:py-4">
      {/* Visual Header */}
      <header className="mb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-[hsl(var(--muted-foreground))]">
            REFERENCE_DOCS // PLATFORM_MANUAL
          </p>
          <h2 className="font-serif text-3xl font-bold text-[hsl(var(--foreground))] md:text-4xl">
            Interactive User Guide
          </h2>
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
            Deep dive into features, user journeys, developer schemas, and live interactive simulations.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={activeTab === "tour" ? "cta" : "outline"}
            size="sm"
            onClick={() => setActiveTab("tour")}
            className="font-mono text-[10px] font-bold"
          >
            [01] PRODUCT TOUR
          </Button>
          <Button
            variant={activeTab === "sandbox" ? "cta" : "outline"}
            size="sm"
            onClick={() => setActiveTab("sandbox")}
            className="font-mono text-[10px] font-bold"
          >
            [02] SIMULATOR SANDBOX
          </Button>
          <Button
            variant={activeTab === "technical" ? "cta" : "outline"}
            size="sm"
            onClick={() => setActiveTab("technical")}
            className="font-mono text-[10px] font-bold"
          >
            [03] DEVELOPER MANUAL
          </Button>
        </div>
      </header>

      {/* Main Tab Views */}
      <div className="space-y-6">
        
        {/* TAB 1: PRODUCT TOUR */}
        {activeTab === "tour" && (
          <div className="border-[2px] border-[hsl(var(--border))] rounded-xl bg-[hsl(var(--card))] overflow-hidden shadow-xl">
            <div className="caution-stripe-thin" />
            
            {/* Tab Deck Selector */}
            <div className="grid grid-cols-2 sm:grid-cols-5 border-b-[2px] border-[hsl(var(--border))] bg-[hsl(var(--muted))/0.3]">
              {slides.map((s, index) => (
                <button
                  key={s.num}
                  onClick={() => setActiveSlide(index)}
                  className={`py-3 px-2 border-r-[2px] border-[hsl(var(--border))] font-mono text-[10px] uppercase font-bold tracking-wider transition-all relative ${
                    activeSlide === index
                      ? "bg-[hsl(var(--foreground))] text-[hsl(var(--background))] border-b-[2px]"
                      : "hover:bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                  } last:border-r-0`}
                >
                  <div className="text-[8px] opacity-75 mb-0.5">{s.num}</div>
                  <div>{s.tab}</div>
                  {activeSlide === index && (
                    <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-yellow-400" />
                  )}
                </button>
              ))}
            </div>

            {/* Split Screen Tour Content */}
            <div className="grid lg:grid-cols-[1.1fr_0.9fr] divide-y lg:divide-y-0 lg:divide-x-[2px] lg:divide-[hsl(var(--border))] bg-[hsl(var(--card))]">
              <div className="p-6 md:p-8 flex flex-col justify-between min-h-[380px]">
                <div>
                  <Badge variant="accent" className="font-mono text-[9px] uppercase">{slides[activeSlide].num} MODULE_FOCUS</Badge>
                  <h3 className="font-serif text-2xl font-bold uppercase tracking-tight text-[hsl(var(--foreground))] mt-3 leading-tight">
                    {slides[activeSlide].title}
                  </h3>
                  <p className="mt-4 text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">
                    {slides[activeSlide].desc}
                  </p>
                </div>
                
                <div className="mt-8 pt-4 border-t border-[hsl(var(--border))]/50 flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={activeSlide === 0}
                    onClick={() => setActiveSlide((p) => p - 1)}
                    className="font-mono text-[10px] font-bold"
                  >
                    [ PREV_MODULE ]
                  </Button>
                  <span className="font-mono text-xs text-[hsl(var(--muted-foreground))]">
                    {activeSlide + 1} / {slides.length}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={activeSlide === slides.length - 1}
                    onClick={() => setActiveSlide((p) => p + 1)}
                    className="font-mono text-[10px] font-bold bg-yellow-400 text-black hover:bg-black hover:text-yellow-400 hover:border-black border-yellow-400"
                  >
                    [ NEXT_MODULE ]
                  </Button>
                </div>
              </div>
              
              <div className="p-6 md:p-8 bg-[hsl(var(--muted))/0.15] flex flex-col justify-center min-h-[380px]">
                <span className="font-mono text-[9px] uppercase tracking-wider text-[hsl(var(--muted-foreground))] mb-4 block">Interactive Feature Preview:</span>
                {slides[activeSlide].interactive}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SIMULATOR SANDBOX */}
        {activeTab === "sandbox" && (
          <div className="grid gap-6 md:grid-cols-2">
            
            {/* Seed Database Control */}
            <Card className="border-[2px] border-[hsl(var(--border))]">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Badge variant="destructive" className="font-mono text-[9px] uppercase">Database baseline Control</Badge>
                  <span className="font-mono text-[10px] text-[hsl(var(--muted-foreground))]">SQLITE // DIRECT_WRITE</span>
                </div>
                <CardTitle className="font-serif text-lg font-bold uppercase mt-2">Wipe & Seed Demo Baseline</CardTitle>
                <CardDescription className="text-xs">
                  Restore the database to the canonical sales dataset. This populates Accounts, Contacts, Deals, Tasks, Activities, and Signal records instantly.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-3.5 rounded font-mono text-[11px] space-y-1">
                  <div><span className="text-[hsl(var(--muted-foreground))]">Total Accounts:</span> <span className="font-bold">{stats.accounts}</span></div>
                  <div><span className="text-[hsl(var(--muted-foreground))]">Total Contacts:</span> <span className="font-bold">{stats.contacts}</span></div>
                  <div><span className="text-[hsl(var(--muted-foreground))]">Total Intent Signals:</span> <span className="font-bold">{stats.signals}</span></div>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    onClick={handleWipeAndSeed}
                    disabled={isWiping}
                    className="font-mono text-[10px] font-bold bg-red-600 hover:bg-red-700 text-white"
                  >
                    {isWiping ? "RESTORING baseline..." : "[ WIPE & SEED WORKSPACE ]"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* LinkedIn Scrape Simulator */}
            <Card className="border-[2px] border-[hsl(var(--border))]">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Badge variant="success" className="font-mono text-[9px] uppercase">LinkedIn Companion Scraper</Badge>
                  <span className="font-mono text-[10px] text-[hsl(var(--muted-foreground))]">EXTENSION // IN-APP SIM</span>
                </div>
                <CardTitle className="font-serif text-lg font-bold uppercase mt-2">LinkedIn Companion Simulator</CardTitle>
                <CardDescription className="text-xs">
                  Test the exact scraper behavior directly in the browser guide without installing the browser extension unpack bundle.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={() => handleLinkedInSimulate({
                      name: "Elon Musk",
                      title: "Chief Executive Officer",
                      company: "Bloom Dynamics",
                      role: "CHAMPION"
                    })}
                    disabled={isInjecting}
                    variant="outline"
                    className="font-mono text-[9px] font-bold"
                  >
                    [ SCRAPE: ELON MUSK ]
                  </Button>
                  <Button
                    onClick={() => handleLinkedInSimulate({
                      name: "Sundar Pichai",
                      title: "Chief Product Specialist",
                      company: "TechVenture Labs",
                      role: "APPROVER"
                    })}
                    disabled={isInjecting}
                    variant="outline"
                    className="font-mono text-[9px] font-bold"
                  >
                    [ SCRAPE: SUNDAR PICHAI ]
                  </Button>
                </div>

                {injectedLinkedIn && (
                  <div className="border-[2px] border-green-500 bg-[hsl(var(--success))/0.03] p-3 rounded font-mono text-[10px] space-y-1">
                    <div className="font-bold text-green-500">[SIMULATION_SUCCESS] SCRAPED PROFILE PERSISTED:</div>
                    <div>Name: <span className="text-[hsl(var(--foreground))]">{injectedLinkedIn.name}</span></div>
                    <div>Title: <span className="text-[hsl(var(--foreground))]">{injectedLinkedIn.title}</span></div>
                    <div>Company: <span className="text-[hsl(var(--foreground))]">{injectedLinkedIn.company}</span></div>
                    <div>Mapped Role: <span className="text-[hsl(var(--foreground))]">{injectedLinkedIn.role}</span></div>
                  </div>
                )}
              </CardContent>
            </Card>

          </div>
        )}

        {/* TAB 3: DEVELOPER MANUAL */}
        {activeTab === "technical" && (
          <Card className="border-[2px] border-[hsl(var(--border))]">
            <CardHeader>
              <CardTitle className="font-serif text-xl font-bold uppercase">Technical Operational Architecture</CardTitle>
              <CardDescription className="text-xs">
                Detailed specs of the data schema, AI guardrails, daily tokens, and Supabase integration workflows.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 font-sans text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">
              
              <section className="space-y-2">
                <h4 className="font-mono text-xs font-bold text-[hsl(var(--foreground))] uppercase tracking-wider">
                  1. Local SQLite Schema & Prisma Scopes
                </h4>
                <p className="text-xs">
                  Velocity OS maps operations to clean boundaries in `prisma/schema.prisma`. Direct writes resolve instantly inside local transactions, bypassing high latency hurdles. Scopes are scoped per `Workspace` and `WorkspaceMember` to safeguard multitenancy integrity.
                </p>
              </section>

              <Separator />

              <section className="space-y-2">
                <h4 className="font-mono text-xs font-bold text-[hsl(var(--foreground))] uppercase tracking-wider">
                  2. AI Model Limits & Token Caps
                </h4>
                <p className="text-xs">
                  Personal OpenAI API credentials can be stored encrypted per workspace member. Daily model token quotas are calculated dynamically on a rolling UTC basis:
                </p>
                <ul className="list-disc pl-4 text-xs font-mono">
                  <li>gpt-5-mini: 2,500,000 tokens/day</li>
                  <li>gpt-5: 250,000 tokens/day</li>
                </ul>
              </section>

              <Separator />

              <section className="space-y-2">
                <h4 className="font-mono text-xs font-bold text-[hsl(var(--foreground))] uppercase tracking-wider">
                  3. Production Migration to Supabase
                </h4>
                <p className="text-xs">
                  To host in production, configure pooled connection strings in your env configuration:
                </p>
                <pre className="border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-3 font-mono text-[10px] text-[hsl(var(--foreground))] overflow-x-auto rounded">
{`# .env configuration
DATABASE_URL="postgresql://postgres.pooler@aws-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1&sslmode=require"
DIRECT_URL="postgresql://postgres@aws-1.supabase.com:5432/postgres?sslmode=require"

# Apply prisma schema migration
npx prisma db push
npx prisma db seed`}
                </pre>
              </section>

            </CardContent>
          </Card>
        )}

      </div>
    </section>
  );
}
