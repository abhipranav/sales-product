import type { Route } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getActorFromServerContext } from "@/lib/auth/actor";
import { getCachedDashboardData } from "@/lib/services/dashboard-cache";
import { QuickStartMilestones } from "@/components/onboarding/quick-start-milestones";


const modules = [
  {
    href: "/cockpit",
    id: "MOD_01",
    title: "REP COCKPIT",
    description: "Dynamic GTM execution hub with multi-channel sequence campaigns, CRM Command Center, and live outbound approvals."
  },
  {
    href: "/accounts",
    id: "MOD_02",
    title: "ACCOUNTS",
    description: "Strategic accounts, contact intelligence, and automated lead enrichment & duplicate detection with live intent signals."
  },
  {
    href: "/pipeline",
    id: "MOD_03",
    title: "PIPELINE",
    description: "Tactical revenue health, pipeline coverage, deal close dates, and stage pressure analytics with hazard indicators."
  },
  {
    href: "/contacts",
    id: "MOD_04",
    title: "CONTACTS",
    description: "Unified stakeholder hub, influence maps, engagement levels, and contact action profiles."
  },
  {
    href: "/integrations",
    id: "MOD_05",
    title: "INTEGRATIONS",
    description: "High-fidelity CRM synchronization and direct calendar ingestion telemetry controls."
  },
  {
    href: "/settings",
    id: "MOD_06",
    title: "SETTINGS",
    description: "Notification policies, compliance guardrails, and workspace operational preferences."
  }
] as const;

const feed = [
  "SIGNAL PRIORITY UPDATED",
  "PIPELINE CONFIDENCE REFRESHED",
  "FOLLOW-UP QUEUE SYNCED",
  "APPROVALS AWAITING REVIEW"
] as const;

export default async function HomePage() {
  const actor = await getActorFromServerContext();
  const data = await getCachedDashboardData(actor, "/workspace", { includeStrategyPlays: false });

  return (
    <section className="mx-auto max-w-7xl py-2 md:py-4">
      {/* Feed bar */}
      <div className="mb-4 border-[2px] border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-3 py-2">
        <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-[0.08em] text-[hsl(var(--muted-foreground))]">
          {feed.map((item) => (
            <span key={item} className="border-[2px] border-[hsl(var(--border))] bg-[hsl(var(--card))] px-2 py-1">
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* Gamified Onboarding Quick-Start Milestones */}
      <QuickStartMilestones />


      {/* Hero header */}
      <header className="mb-6 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="border-[2px] border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 md:p-6">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-[hsl(var(--muted-foreground))]">EXECUTION_HOME</p>
          <h2 className="mt-2 font-serif text-3xl font-bold tracking-[-0.02em] text-[hsl(var(--foreground))] md:text-4xl">
            Revenue Command Workspace
          </h2>
          <p className="mt-3 text-sm text-[hsl(var(--muted-foreground))]">
            {data.workspace.name} ·{" "}
            <Link href={`/accounts/${data.account.id}` as "/accounts"} className="text-[hsl(var(--foreground))] font-bold hover:underline">
              {data.account.name}
            </Link>
            {" · "}
            <Link href={`/pipeline/${data.deal.id}` as "/pipeline"} className="text-[hsl(var(--foreground))] font-bold hover:underline">
              {data.deal.name}
            </Link>
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge variant="accent">OPEN DEALS {data.pipelineMetrics.openDeals}</Badge>
            <Badge variant="outline">OVERDUE {data.pipelineMetrics.overdueTasks}</Badge>
            <Badge variant="outline">HIGH_PRI {data.pipelineMetrics.highPriorityTasks}</Badge>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild size="sm" variant="cta">
              <Link href={"/workspace/get-started" as Route}>GET STARTED</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href={"/integrations/linkedin" as Route}>LINKEDIN COMPANION</Link>
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="font-mono text-xs uppercase tracking-wider">LIVE_SNAPSHOT</CardTitle>
              <Badge variant="secondary">NOW</Badge>
            </div>
            <CardDescription>Current execution pressure and momentum.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            <div className="flex items-center justify-between border-[2px] border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-3 py-2 text-sm">
              <span className="font-mono text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]">OPEN_PIPELINE</span>
              <span className="font-bold text-[hsl(var(--foreground))]">${data.pipelineMetrics.openPipelineAmount.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between border-[2px] border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-3 py-2 text-sm">
              <span className="font-mono text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]">WEIGHTED</span>
              <span className="font-bold text-[hsl(var(--foreground))]">${data.pipelineMetrics.weightedPipelineAmount.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between border-[2px] border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-3 py-2 text-sm">
              <span className="font-mono text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]">CONFIDENCE</span>
              <span className="font-bold text-[hsl(var(--foreground))]">{Math.round(data.deal.confidence * 100)}%</span>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Button asChild variant="cta" size="sm">
                <Link href="/cockpit">OPEN COCKPIT</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/notifications">SIGNAL INBOX</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </header>

      {/* Operations Command Strip */}
      <section className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="h-2 w-2 rounded-full bg-yellow-400 animate-pulse" />
          <h3 className="font-mono text-xs font-bold uppercase tracking-[0.1em] text-[hsl(var(--foreground))]">
            OPERATIONS COMMAND STRIP
          </h3>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Link href="/activities" className="group block">
            <div className="border-[2px] border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 hover:border-[hsl(var(--foreground))] hover:bg-[hsl(var(--foreground))] transition-all duration-150 relative overflow-hidden h-full flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-mono text-[9px] text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--background))]/60">SYS_LOG_01</span>
                  <span className="text-xs group-hover:text-[hsl(var(--background))]">📋</span>
                </div>
                <h4 className="font-sans text-sm font-bold text-[hsl(var(--foreground))] group-hover:text-[hsl(var(--background))] uppercase">
                  Activities Log
                </h4>
                <p className="text-[11px] text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--background))]/70 mt-1 leading-normal font-mono">
                  Review call transcripts, emails, and audit-ready execution logs.
                </p>
              </div>
              <div className="mt-4 font-mono text-[9px] font-black text-[hsl(var(--foreground))] group-hover:text-[hsl(var(--background))] border-t border-[hsl(var(--border))] group-hover:border-[hsl(var(--background))]/30 pt-2">
                [ ACCESS_LOGS ]
              </div>
            </div>
          </Link>

          <Link href="/workflows" className="group block">
            <div className="border-[2px] border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 hover:border-[hsl(var(--foreground))] hover:bg-[hsl(var(--foreground))] transition-all duration-150 relative overflow-hidden h-full flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-mono text-[9px] text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--background))]/60">SYS_LOG_02</span>
                  <span className="text-xs group-hover:text-[hsl(var(--background))]">⚡</span>
                </div>
                <h4 className="font-sans text-sm font-bold text-[hsl(var(--foreground))] group-hover:text-[hsl(var(--background))] uppercase">
                  Workflows
                </h4>
                <p className="text-[11px] text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--background))]/70 mt-1 leading-normal font-mono">
                  Launch automated sales sequences and task execution trails.
                </p>
              </div>
              <div className="mt-4 font-mono text-[9px] font-black text-[hsl(var(--foreground))] group-hover:text-[hsl(var(--background))] border-t border-[hsl(var(--border))] group-hover:border-[hsl(var(--background))]/30 pt-2">
                [ LAUNCH_WORKFLOWS ]
              </div>
            </div>
          </Link>

          <Link href="/notifications" className="group block">
            <div className="border-[2px] border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 hover:border-[hsl(var(--foreground))] hover:bg-[hsl(var(--foreground))] transition-all duration-150 relative overflow-hidden h-full flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-mono text-[9px] text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--background))]/60">SYS_LOG_03</span>
                  <span className="text-xs group-hover:text-[hsl(var(--background))]">🎯</span>
                </div>
                <h4 className="font-sans text-sm font-bold text-[hsl(var(--foreground))] group-hover:text-[hsl(var(--background))] uppercase">
                  Signal Inbox
                </h4>
                <p className="text-[11px] text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--background))]/70 mt-1 leading-normal font-mono">
                  Monitor live B2B intent anomalies and high-impact buying triggers.
                </p>
              </div>
              <div className="mt-4 font-mono text-[9px] font-black text-[hsl(var(--foreground))] group-hover:text-[hsl(var(--background))] border-t border-[hsl(var(--border))] group-hover:border-[hsl(var(--background))]/30 pt-2">
                [ REFRESH_SIGNALS ]
              </div>
            </div>
          </Link>

          <Link href="/accounts" className="group block">
            <div className="border-[2px] border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 hover:border-[hsl(var(--foreground))] hover:bg-[hsl(var(--foreground))] transition-all duration-150 relative overflow-hidden h-full flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-mono text-[9px] text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--background))]/60">SYS_LOG_04</span>
                  <span className="text-xs group-hover:text-[hsl(var(--background))]">🏢</span>
                </div>
                <h4 className="font-sans text-sm font-bold text-[hsl(var(--foreground))] group-hover:text-[hsl(var(--background))] uppercase">
                  Strategic Accounts
                </h4>
                <p className="text-[11px] text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--background))]/70 mt-1 leading-normal font-mono">
                  Map stakeholder influence matrices and contact momentum graphs.
                </p>
              </div>
              <div className="mt-4 font-mono text-[9px] font-black text-[hsl(var(--foreground))] group-hover:text-[hsl(var(--background))] border-t border-[hsl(var(--border))] group-hover:border-[hsl(var(--background))]/30 pt-2">
                [ VIEW_ACCOUNTS ]
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* Module grid */}
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {modules.map((module) => (
          <Link key={module.href} href={module.href} className="group">
            <Card className="h-full transition-all duration-150 hover:bg-[hsl(var(--foreground))] hover:text-[hsl(var(--background))]">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[9px] text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--background))]/60">{module.id}</span>
                  <span className="font-mono text-[10px] text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--background))]/60">→</span>
                </div>
                <CardTitle className="text-lg group-hover:text-[hsl(var(--background))]">{module.title}</CardTitle>
                <CardDescription className="group-hover:text-[hsl(var(--background))]/60">{module.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </section>

      {/* Bottom data panels */}
      <section className="mt-6 grid gap-4 lg:grid-cols-3">
        <Link href="/pipeline" className="block">
          <Card className="h-full transition-all duration-150 hover:bg-[hsl(var(--foreground))] hover:text-[hsl(var(--background))]">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="font-mono text-xs uppercase tracking-wider group-hover:text-[hsl(var(--background))]">PIPELINE_PRESSURE</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-[hsl(var(--muted-foreground))]">
              <p>
                <span className="font-mono text-[10px] uppercase tracking-wider">OPEN:</span>{" "}
                <span className="font-bold text-[hsl(var(--foreground))]">${data.pipelineMetrics.openPipelineAmount.toLocaleString()}</span>
              </p>
              <p>
                <span className="font-mono text-[10px] uppercase tracking-wider">WEIGHTED:</span>{" "}
                <span className="font-bold text-[hsl(var(--foreground))]">${data.pipelineMetrics.weightedPipelineAmount.toLocaleString()}</span>
              </p>
              <p>
                <span className="font-mono text-[10px] uppercase tracking-wider">CONFIDENCE:</span>{" "}
                <span className="font-bold text-[hsl(var(--foreground))]">{Math.round(data.deal.confidence * 100)}%</span>
              </p>
            </CardContent>
          </Card>
        </Link>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="font-mono text-xs uppercase tracking-wider">IMMEDIATE_PRIORITIES</CardTitle>
            <Link href="/workflows" className="font-mono text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]">
              VIEW ALL →
            </Link>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-[hsl(var(--muted-foreground))]">
              {data.tasks.slice(0, 3).map((task) => (
                <li key={task.id} className="border-[2px] border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-2.5">
                  <p className="font-bold text-[hsl(var(--foreground))]">{task.title}</p>
                  <p className="font-mono text-[10px] uppercase tracking-wider mt-1">
                    {task.priority} · DUE {new Date(task.dueAt).toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="font-mono text-xs uppercase tracking-wider">ACCOUNT_MOMENTUM</CardTitle>
            <Link href={`/accounts/${data.account.id}` as "/accounts"} className="font-mono text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]">
              VIEW →
            </Link>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-[hsl(var(--muted-foreground))]">
              {data.account.signals.slice(0, 3).map((signal) => (
                <li key={signal.id} className="border-[2px] border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-2.5">
                  <p className="font-bold text-[hsl(var(--foreground))]">{signal.summary}</p>
                  <p className="font-mono text-[10px] uppercase tracking-wider mt-1">
                    SCORE {signal.score} · {new Date(signal.happenedAt).toLocaleDateString()}
                  </p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>
    </section>
  );
}
