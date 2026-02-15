import Link from "next/link";
import { ApprovalQueue } from "@/components/cockpit/approval-queue";
import { AuditTrail } from "@/components/cockpit/audit-trail";
import { CalendarIngest } from "@/components/cockpit/calendar-ingest";
import { CrmSyncPanel } from "@/components/cockpit/crm-sync-panel";
import { DealHealth } from "@/components/cockpit/deal-health";
import { FollowUpComposer } from "@/components/cockpit/follow-up-composer";
import { MeetingBriefCard } from "@/components/cockpit/meeting-brief";
import { MeetingNotesCapture } from "@/components/cockpit/meeting-notes-capture";
import { NextActions } from "@/components/cockpit/next-actions";
import { PipelineMetricsStrip } from "@/components/cockpit/pipeline-metrics";
import { StrategyLab } from "@/components/cockpit/strategy-lab";
import { BuyingSignalAlerts } from "@/components/cockpit/buying-signal-alerts";
import { StakeholderMap } from "@/components/cockpit/stakeholder-map";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getActorFromServerContext } from "@/lib/auth/actor";
import { getCachedDashboardData } from "@/lib/services/dashboard-cache";

export default async function CockpitPage() {
  const actor = await getActorFromServerContext();
  const data = await getCachedDashboardData(actor, "/cockpit");

  return (
    <section className="mx-auto max-w-7xl py-2 md:py-4">
      <header className="reveal mb-8 flex flex-col gap-4 md:mb-10 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))]">Sales Execution System</p>
          <h2 className="font-['Sora',sans-serif] text-3xl font-bold text-[hsl(var(--foreground))] md:text-4xl">Rep Cockpit</h2>
          <p className="mt-1 text-sm">
            <Link
              href={`/accounts/${data.account.id}` as "/accounts"}
              className="text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))] hover:underline"
            >
              {data.account.name}
            </Link>
            <span className="text-[hsl(var(--muted-foreground))]"> · </span>
            <Link
              href={`/pipeline/${data.deal.id}` as "/pipeline"}
              className="text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))] hover:underline"
            >
              {data.deal.name}
            </Link>
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{data.workspace.name}</Badge>
            <Badge variant="outline">{data.workspace.actorRole}</Badge>
            <Badge variant="outline">{data.workspace.actorEmail}</Badge>
          </div>
        </div>
        <Link href={`/pipeline/${data.deal.id}` as "/pipeline"}>
          <Card className="border-[hsl(var(--border))] hover:border-[hsl(var(--primary))] transition-colors cursor-pointer">
            <CardContent className="space-y-2 p-4 text-sm">
              <p>
                <span className="font-semibold text-[hsl(var(--foreground))]">Deal size:</span> ${data.deal.amount.toLocaleString()}
              </p>
              <p>
                <span className="font-semibold text-[hsl(var(--foreground))]">Close target:</span> {new Date(data.deal.closeDate).toDateString()}
              </p>
            </CardContent>
          </Card>
        </Link>
      </header>

      <PipelineMetricsStrip metrics={data.pipelineMetrics} />

      <section className="mt-5 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-5">
          <div className="reveal reveal-delay-1">
            <NextActions dealId={data.deal.id} tasks={data.tasks} />
          </div>
          <div className="reveal reveal-delay-2">
            <MeetingBriefCard brief={data.meetingBrief} />
          </div>
          <div className="reveal reveal-delay-2">
            <FollowUpComposer dealId={data.deal.id} draft={data.followUpDraft} />
          </div>
          <div className="reveal reveal-delay-2">
            <MeetingNotesCapture dealId={data.deal.id} />
          </div>
          <div className="reveal reveal-delay-2">
            <ApprovalQueue approvals={data.approvals} />
          </div>
          <div className="reveal reveal-delay-2">
            <StrategyLab plays={data.strategyPlays} dealId={data.deal.id} />
          </div>
        </div>

        <div className="space-y-5">
          <div className="reveal reveal-delay-1">
            <DealHealth deal={data.deal} contacts={data.contacts} signals={data.account.signals} />
          </div>

          <div className="reveal reveal-delay-2">
            <BuyingSignalAlerts deal={data.deal} signals={data.account.signals} />
          </div>

          <div className="reveal reveal-delay-2">
            <StakeholderMap contacts={data.contacts} />
          </div>

          <Card className="reveal reveal-delay-2">
            <CardContent className="p-5">
              <h3 className="font-['Sora',sans-serif] text-lg font-semibold text-zinc-900">Recent Activity</h3>
              <ul className="mt-3 space-y-3">
                {data.recentActivities.map((activity) => (
                  <li key={activity.id} className="rounded-lg bg-zinc-50 p-3 text-sm text-zinc-700">
                    <p className="font-medium capitalize text-zinc-900">{activity.type}</p>
                    <p>{activity.summary}</p>
                    <p className="mt-1 text-xs text-zinc-500">{new Date(activity.happenedAt).toLocaleString()}</p>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <div className="reveal reveal-delay-2">
            <AuditTrail events={data.auditTrail} />
          </div>

          <div className="reveal reveal-delay-2">
            <CalendarIngest dealId={data.deal.id} />
          </div>

          <div className="reveal reveal-delay-2">
            <CrmSyncPanel />
          </div>
        </div>
      </section>
    </section>
  );
}
