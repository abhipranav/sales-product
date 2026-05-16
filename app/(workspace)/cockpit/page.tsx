import Link from "next/link";
import { PipelineMetricsStrip } from "@/components/cockpit/pipeline-metrics";
import { CockpitWorkspace } from "@/components/cockpit/cockpit-workspace";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getActorFromServerContext } from "@/lib/auth/actor";
import { getPilotMetricsSnapshot } from "@/lib/mock/pilot-metrics";
import { getCachedDashboardData } from "@/lib/services/dashboard-cache";
import { getCachedPilotMetrics } from "@/lib/services/pilot-metrics-cache";
import { PilotMetricsServiceUnavailableError } from "@/lib/services/pilot-metrics";
import { WorkspaceAccessDeniedError } from "@/lib/services/workspace";
import { SequenceServiceUnavailableError, listSequenceExecutions } from "@/lib/services/sequences";

export default async function CockpitPage() {
  const actor = await getActorFromServerContext();
  const [data, pilotMetricsResult] = await Promise.all([
    getCachedDashboardData(actor, "/cockpit"),
    getCachedPilotMetrics(actor, "/cockpit")
      .then((metrics) => ({
        metrics,
        mode: "live" as const
      }))
      .catch((error) => {
        if (error instanceof PilotMetricsServiceUnavailableError || error instanceof WorkspaceAccessDeniedError) {
          return {
            metrics: getPilotMetricsSnapshot(),
            mode: "mock" as const
          };
        }

        return {
          metrics: getPilotMetricsSnapshot(),
          mode: "mock" as const
        };
      })
  ]);
  const pilotMetrics = pilotMetricsResult.metrics;
  const pilotMetricsMode = pilotMetricsResult.mode;

  let sequenceExecutions: any[] = [];
  try {
    sequenceExecutions = await listSequenceExecutions({ dealId: data.deal.id, limit: 8 }, actor);
  } catch (error) {
    if (error instanceof SequenceServiceUnavailableError || error instanceof WorkspaceAccessDeniedError) {
      sequenceExecutions = [];
    } else {
      sequenceExecutions = [];
    }
  }

  return (
    <section className="mx-auto max-w-7xl py-2 md:py-4">
      <header className="reveal mb-8 flex flex-col gap-4 md:mb-10 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-[hsl(var(--muted-foreground))]">SALES_EXECUTION // REP_SURFACE</p>
          <h2 className="font-serif text-3xl font-bold text-[hsl(var(--foreground))] md:text-4xl">Rep Cockpit</h2>
          <p className="mt-1 text-sm">
            <Link
              href={`/accounts/${data.account.id}` as "/accounts"}
              className="text-[hsl(var(--foreground))] font-bold hover:underline"
            >
              {data.account.name}
            </Link>
            <span className="text-[hsl(var(--muted-foreground))]"> · </span>
            <Link
              href={`/pipeline/${data.deal.id}` as "/pipeline"}
              className="text-[hsl(var(--foreground))] font-bold hover:underline"
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
          <Card className="hover:bg-[hsl(var(--foreground))] hover:text-[hsl(var(--background))] transition-all duration-150 cursor-pointer">
            <CardContent className="space-y-2 p-4 text-sm">
              <p>
                <span className="font-mono text-[10px] uppercase tracking-wider">DEAL_SIZE:</span>{" "}
                <span className="font-bold">${data.deal.amount.toLocaleString()}</span>
              </p>
              <p>
                <span className="font-mono text-[10px] uppercase tracking-wider">CLOSE_TARGET:</span>{" "}
                <span className="font-bold">{new Date(data.deal.closeDate).toDateString()}</span>
              </p>
            </CardContent>
          </Card>
        </Link>
      </header>

      <PipelineMetricsStrip metrics={data.pipelineMetrics} />

      <div className="mt-6">
        <CockpitWorkspace
          data={data}
          pilotMetrics={pilotMetrics}
          pilotMetricsMode={pilotMetricsMode}
          sequences={sequenceExecutions}
        />
      </div>
    </section>
  );
}
