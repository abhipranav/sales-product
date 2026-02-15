import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getActorFromServerContext } from "@/lib/auth/actor";
import { CrmRecordNotFoundError, CrmServiceUnavailableError, getDeal } from "@/lib/services/crm-records";
import { ActivityTimeline } from "@/components/crm/activity-timeline";
import { DealDetailClient } from "./client";

interface PageProps {
  params: Promise<{ dealId: string }>;
}

export default async function DealDetailPage({ params }: PageProps) {
  const { dealId } = await params;
  const actor = await getActorFromServerContext();

  let deal: Awaited<ReturnType<typeof getDeal>>;

  try {
    deal = await getDeal(dealId, actor);
  } catch (error) {
    if (error instanceof CrmRecordNotFoundError) {
      notFound();
    }
    if (error instanceof CrmServiceUnavailableError) {
      return (
        <section className="mx-auto max-w-7xl py-8">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-[hsl(var(--muted-foreground))]">Database not configured. Please set up the database to view deals.</p>
            </CardContent>
          </Card>
        </section>
      );
    }
    throw error;
  }

  const stageColors: Record<string, string> = {
    discovery: "hsl(var(--muted))",
    evaluation: "hsl(210, 70%, 50%)",
    proposal: "hsl(280, 60%, 50%)",
    procurement: "hsl(45, 80%, 45%)",
    "closed-won": "hsl(var(--success))",
    "closed-lost": "hsl(var(--destructive))"
  };

  const isOverdue = new Date(deal.closeDate) < new Date();
  const daysUntilClose = Math.ceil(
    (new Date(deal.closeDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  return (
    <section className="mx-auto max-w-7xl py-4 md:py-6">
      {/* Header */}
      <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link
              href="/pipeline"
              className="text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
            >
              ← Back to Pipeline
            </Link>
          </div>
          <h1 className="font-['Sora',sans-serif] text-3xl font-bold text-[hsl(var(--foreground))]">
            {deal.name}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Link
              href={`/accounts/${deal.account.id}` as "/accounts"}
              className="text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:underline"
            >
              {deal.account.name}
            </Link>
            <span className="text-[hsl(var(--border))]">•</span>
            <Badge variant="outline">{deal.account.segment}</Badge>
          </div>
        </div>
        <DealDetailClient deal={deal} />
      </header>

      {/* Key Metrics */}
      <section className="mb-6 grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Stage</p>
            <Badge
              className="mt-2"
              style={{ backgroundColor: stageColors[deal.stage], color: "white" }}
            >
              {deal.stage.replace("-", " ")}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Amount</p>
            <p className="mt-2 text-2xl font-bold text-[hsl(var(--foreground))]">
              ${deal.amount.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Confidence</p>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-2xl font-bold text-[hsl(var(--foreground))]">
                {Math.round(deal.confidence * 100)}%
              </span>
              <Badge variant={deal.confidence >= 0.7 ? "success" : deal.confidence >= 0.4 ? "warning" : "destructive"}>
                {deal.confidence >= 0.7 ? "High" : deal.confidence >= 0.4 ? "Medium" : "Low"}
              </Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Close Date</p>
            <p className={`mt-2 text-lg font-semibold ${isOverdue ? "text-[hsl(var(--destructive))]" : "text-[hsl(var(--foreground))]"}`}>
              {new Date(deal.closeDate).toLocaleDateString()}
            </p>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              {isOverdue ? "Overdue" : daysUntilClose === 0 ? "Today" : `${daysUntilClose} days left`}
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Risk Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Risk Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-[hsl(var(--foreground))]">{deal.riskSummary}</p>
            </CardContent>
          </Card>

          {/* Tasks */}
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-base">Tasks ({deal.counts.tasks})</CardTitle>
              <Link href="/workflows">
                <Button variant="outline" size="sm">Manage Tasks</Button>
              </Link>
            </CardHeader>
            <CardContent>
              {deal.tasks.length === 0 ? (
                <p className="text-sm text-[hsl(var(--muted-foreground))]">No tasks yet.</p>
              ) : (
                <ul className="space-y-3">
                  {deal.tasks.map((task) => (
                    <li key={task.id} className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-[hsl(var(--foreground))]">{task.title}</p>
                        <Badge variant={task.priority === "high" ? "destructive" : task.priority === "low" ? "success" : "warning"}>
                          {task.priority}
                        </Badge>
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]">
                        <Badge variant={task.status === "done" ? "success" : "outline"} className="text-xs">
                          {task.status}
                        </Badge>
                        <span>Due {new Date(task.dueAt).toLocaleDateString()}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Meeting Brief */}
          {deal.meetingBrief && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Meeting Brief</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Primary Goal</p>
                  <p className="mt-1 text-sm text-[hsl(var(--foreground))]">{deal.meetingBrief.primaryGoal}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Likely Objections</p>
                  <ul className="mt-1 list-disc list-inside text-sm text-[hsl(var(--foreground))]">
                    {deal.meetingBrief.likelyObjections.map((obj, i) => (
                      <li key={i}>{obj}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Recommended Narrative</p>
                  <p className="mt-1 text-sm text-[hsl(var(--foreground))]">{deal.meetingBrief.recommendedNarrative}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Activity Timeline */}
          <ActivityTimeline
            activities={deal.activities}
            dealId={dealId}
            showLogForm
          />

          {/* Follow-up Draft */}
          {deal.followUp && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Follow-up Draft</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Subject</p>
                  <p className="mt-1 text-sm font-medium text-[hsl(var(--foreground))]">{deal.followUp.subject}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Body</p>
                  <p className="mt-1 text-sm text-[hsl(var(--foreground))] whitespace-pre-wrap">{deal.followUp.body}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Ask</p>
                  <p className="mt-1 text-sm text-[hsl(var(--foreground))]">{deal.followUp.ask}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Best Time</p>
                  <Badge variant="outline">{deal.followUp.ctaTimeWindow}</Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Deal Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Deal Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-[hsl(var(--foreground))]">{deal.counts.tasks}</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">Tasks</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-[hsl(var(--foreground))]">{deal.counts.activities}</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">Activities</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-[hsl(var(--foreground))]">{deal.counts.calendarEvents}</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">Meetings</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-[hsl(var(--foreground))]">{deal.counts.auditLogs}</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">Audit Logs</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
