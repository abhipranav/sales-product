import type { PipelineMetrics } from "@/lib/domain/types";
import { Card, CardContent } from "@/components/ui/card";

interface PipelineMetricsProps {
  metrics: PipelineMetrics;
}

export function PipelineMetricsStrip({ metrics }: PipelineMetricsProps) {
  const cards = [
    {
      label: "Open deals",
      value: metrics.openDeals.toString()
    },
    {
      label: "Open pipeline",
      value: `$${metrics.openPipelineAmount.toLocaleString()}`
    },
    {
      label: "Weighted pipeline",
      value: `$${metrics.weightedPipelineAmount.toLocaleString()}`
    },
    {
      label: "Overdue tasks",
      value: metrics.overdueTasks.toString()
    },
    {
      label: "High-priority tasks",
      value: metrics.highPriorityTasks.toString()
    }
  ];

  return (
    <section className="reveal reveal-delay-1 grid gap-3 md:grid-cols-5">
      {cards.map((card) => (
        <Card key={card.label} className="rounded-xl">
          <CardContent className="p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">{card.label}</p>
            <p className="mt-1 text-lg font-semibold text-zinc-900">{card.value}</p>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}
