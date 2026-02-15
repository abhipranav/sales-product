import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getActorFromServerContext } from "@/lib/auth/actor";
import { getCachedDashboardData } from "@/lib/services/dashboard-cache";

const modules = [
  {
    href: "/cockpit",
    title: "Rep Cockpit",
    description: "Run the day: tasks, approvals, drafting, and execution telemetry."
  },
  {
    href: "/accounts",
    title: "Accounts",
    description: "Account + stakeholder context with live buying signals."
  },
  {
    href: "/pipeline",
    title: "Pipeline",
    description: "Revenue health, stage pressure, and close-risk visibility."
  },
  {
    href: "/intelligence",
    title: "Intelligence",
    description: "Meeting briefing, strategy plays, and notes-to-actions workflows."
  },
  {
    href: "/notifications",
    title: "Notifications",
    description: "Buying-signal inbox with acknowledgment and response cues."
  },
  {
    href: "/integrations",
    title: "Integrations",
    description: "CRM and calendar ingestion controls with sync observability."
  },
  {
    href: "/workflows",
    title: "Workflows",
    description: "Task orchestration, approval queue, and operational audit trail."
  }
] as const;

export default async function HomePage() {
  const actor = await getActorFromServerContext();
  const data = await getCachedDashboardData(actor, "/workspace");

  return (
    <section className="mx-auto max-w-7xl py-2 md:py-4">
      <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">AI-Native Revenue OS</p>
          <h2 className="font-['Sora',sans-serif] text-3xl font-bold text-zinc-900 md:text-4xl">Super App Home</h2>
          <p className="mt-1 text-sm text-zinc-700">
            {data.workspace.name} ·{" "}
            <Link
              href={`/accounts/${data.account.id}` as "/accounts"}
              className="text-[hsl(var(--primary))] hover:underline"
            >
              {data.account.name}
            </Link>
            {" · "}
            <Link
              href={`/pipeline/${data.deal.id}` as "/pipeline"}
              className="text-[hsl(var(--primary))] hover:underline"
            >
              {data.deal.name}
            </Link>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/pipeline">
            <Badge variant="secondary" className="cursor-pointer hover:bg-zinc-200 transition-colors">
              Open Deals {data.pipelineMetrics.openDeals}
            </Badge>
          </Link>
          <Link href="/workflows">
            <Badge variant="outline" className="cursor-pointer hover:bg-zinc-100 transition-colors">
              Overdue Tasks {data.pipelineMetrics.overdueTasks}
            </Badge>
          </Link>
          <Link href="/notifications">
            <Badge variant="outline" className="cursor-pointer hover:bg-zinc-100 transition-colors">
              High Priority {data.pipelineMetrics.highPriorityTasks}
            </Badge>
          </Link>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {modules.map((module) => (
          <Link key={module.href} href={module.href} className="block">
            <Card className="h-full transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-[hsl(var(--primary)/0.3)] cursor-pointer">
              <CardHeader>
                <CardTitle className="font-['Sora',sans-serif]">{module.title}</CardTitle>
                <CardDescription>{module.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <span className="text-sm font-medium text-[hsl(var(--primary))]">Open {module.title} →</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-3">
        <Link href="/pipeline" className="block">
          <Card className="h-full transition-colors hover:border-[hsl(var(--primary)/0.3)] cursor-pointer">
            <CardHeader>
              <CardTitle className="text-base">Pipeline at a glance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-zinc-700">
              <p>
                <span className="font-semibold text-zinc-900">Open pipeline:</span> $
                {data.pipelineMetrics.openPipelineAmount.toLocaleString()}
              </p>
              <p>
                <span className="font-semibold text-zinc-900">Weighted pipeline:</span> $
                {data.pipelineMetrics.weightedPipelineAmount.toLocaleString()}
              </p>
              <p>
                <span className="font-semibold text-zinc-900">Current confidence:</span> {Math.round(data.deal.confidence * 100)}%
              </p>
            </CardContent>
          </Card>
        </Link>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Immediate priorities</CardTitle>
            <Link href="/workflows" className="text-xs text-[hsl(var(--primary))] hover:underline">
              View All
            </Link>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-zinc-700">
              {data.tasks.slice(0, 3).map((task) => (
                <li key={task.id} className="rounded-md bg-zinc-50 p-2 transition-colors hover:bg-zinc-100">
                  <Link href="/cockpit" className="block">
                    <p className="font-medium text-zinc-900">{task.title}</p>
                    <p className="text-xs text-zinc-500">
                      {task.priority} · due {new Date(task.dueAt).toLocaleString()}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Recent account momentum</CardTitle>
            <Link
              href={`/accounts/${data.account.id}` as "/accounts"}
              className="text-xs text-[hsl(var(--primary))] hover:underline"
            >
              View Account
            </Link>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-zinc-700">
              {data.account.signals.slice(0, 3).map((signal) => (
                <li key={signal.id} className="rounded-md bg-zinc-50 p-2 transition-colors hover:bg-zinc-100">
                  <Link href="/intelligence" className="block">
                    <p className="font-medium text-zinc-900">{signal.summary}</p>
                    <p className="text-xs text-zinc-500">
                      score {signal.score} · {new Date(signal.happenedAt).toLocaleDateString()}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>
    </section>
  );
}
