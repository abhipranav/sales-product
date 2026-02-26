import type { PilotMetricsSnapshot } from "@/lib/domain/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PilotMetricsPanelProps {
  metrics: PilotMetricsSnapshot;
  mode?: "live" | "mock";
}

function formatHours(hours: number) {
  if (!Number.isFinite(hours) || hours <= 0) {
    return "0h";
  }

  if (hours >= 24) {
    return `${(hours / 24).toFixed(1)}d`;
  }

  return `${hours.toFixed(1)}h`;
}

export function PilotMetricsPanel({ metrics, mode = "live" }: PilotMetricsPanelProps) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Pilot Metrics</CardTitle>
        <Badge variant={mode === "live" ? "success" : "warning"}>{mode === "live" ? "Live" : "Snapshot"}</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-3">
            <p className="font-mono text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
              RECOMMENDATION_ACCEPTANCE
            </p>
            <p className="text-2xl font-bold text-[hsl(var(--foreground))]">
              {metrics.recommendationSignals.approvalAcceptanceRate.toFixed(1)}%
            </p>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              {metrics.recommendationSignals.approvedApprovals7d} approved ·{" "}
              {metrics.recommendationSignals.rejectedApprovals7d} rejected (last {metrics.windowDays}d)
            </p>
          </div>

          <div className="border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-3">
            <p className="font-mono text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
              ACTION_LATENCY
            </p>
            <p className="text-2xl font-bold text-[hsl(var(--foreground))]">
              {formatHours(metrics.actionLatency.medianTaskCompletionHours30d)}
            </p>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              Median completion · Avg {formatHours(metrics.actionLatency.avgTaskCompletionHours30d)}
            </p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-3">
            <p className="font-mono text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]">STRATEGY_EXECUTED_7D</p>
            <p className="mt-1 text-xl font-bold text-[hsl(var(--foreground))]">{metrics.recommendationSignals.strategyExecutions7d}</p>
          </div>
          <div className="border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-3">
            <p className="font-mono text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]">TASKS_COMPLETED_7D</p>
            <p className="mt-1 text-xl font-bold text-[hsl(var(--foreground))]">{metrics.actionLatency.completedTasks7d}</p>
          </div>
          <div className="border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-3">
            <p className="font-mono text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]">SLA_REMINDERS_24H</p>
            <p className="mt-1 text-xl font-bold text-[hsl(var(--foreground))]">{metrics.operations.reminderEvents24h}</p>
          </div>
        </div>

        <p className="text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
          Generated {new Date(metrics.generatedAt).toLocaleString()}
        </p>
      </CardContent>
    </Card>
  );
}
