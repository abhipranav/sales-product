import type { Route } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getActorFromServerContext } from "@/lib/auth/actor";
import { getCachedDashboardData } from "@/lib/services/dashboard-cache";

const modules = [
  {
    href: "/cockpit",
    id: "MOD_01",
    title: "REP COCKPIT",
    description: "Run the day: tasks, approvals, drafting, and execution telemetry."
  },
  {
    href: "/accounts",
    id: "MOD_02",
    title: "ACCOUNTS",
    description: "Account and stakeholder context with live buying signals."
  },
  {
    href: "/pipeline",
    id: "MOD_03",
    title: "PIPELINE",
    description: "Revenue health, stage pressure, and close-risk visibility."
  },
  {
    href: "/intelligence",
    id: "MOD_04",
    title: "INTELLIGENCE",
    description: "Meeting briefing, strategy plays, and notes-to-actions workflows."
  },
  {
    href: "/notifications",
    id: "MOD_05",
    title: "NOTIFICATIONS",
    description: "Buying-signal inbox with acknowledgment and response cues."
  },
  {
    href: "/integrations",
    id: "MOD_06",
    title: "INTEGRATIONS",
    description: "CRM and calendar ingestion controls with sync observability."
  },
  {
    href: "/workflows",
    id: "MOD_07",
    title: "WORKFLOWS",
    description: "Task orchestration, approval queue, and operational audit trail."
  },
  {
    href: "/settings",
    id: "MOD_08",
    title: "SETTINGS",
    description: "Profile, notification policy, and workspace operating preferences."
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
