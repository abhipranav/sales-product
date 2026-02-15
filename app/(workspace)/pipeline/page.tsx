import { getActorFromServerContext } from "@/lib/auth/actor";
import { listDeals } from "@/lib/services/crm-records";
import { PipelineBoard } from "@/components/crm/pipeline-board";
import { Card, CardContent } from "@/components/ui/card";

export default async function PipelinePage() {
  const actor = await getActorFromServerContext();

  // Fetch all deals for pipeline view
  const { items: deals, total } = await listDeals(
    { stages: ["discovery", "evaluation", "proposal", "procurement", "closed-won", "closed-lost"] },
    { limit: 100 },
    { field: "createdAt", order: "desc" },
    actor
  ).catch(() => ({ items: [], total: 0, hasMore: false }));

  // Calculate pipeline metrics
  const openDeals = deals.filter((d) => !["closed-won", "closed-lost"].includes(d.stage));
  const totalPipelineValue = openDeals.reduce((sum, d) => sum + d.amount, 0);
  const weightedValue = openDeals.reduce((sum, d) => sum + d.amount * d.confidence, 0);
  const wonDeals = deals.filter((d) => d.stage === "closed-won");
  const wonValue = wonDeals.reduce((sum, d) => sum + d.amount, 0);

  return (
    <section className="mx-auto max-w-full py-2 md:py-4 px-4">
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))]">
          CRM
        </p>
        <h2 className="font-['Sora',sans-serif] text-3xl font-bold text-[hsl(var(--foreground))]">
          Pipeline
        </h2>
        <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
          Drag and drop deals between stages to update their status.
        </p>
      </header>

      {/* Metrics Strip */}
      <div className="mb-6 grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-[hsl(var(--foreground))]">{total}</p>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">Total Deals</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-[hsl(var(--foreground))]">
              ${totalPipelineValue.toLocaleString()}
            </p>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">Pipeline Value</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-[hsl(var(--foreground))]">
              ${Math.round(weightedValue).toLocaleString()}
            </p>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">Weighted Value</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-[hsl(var(--success))]">
              ${wonValue.toLocaleString()}
            </p>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">Won This Period</p>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Board */}
      {deals.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-[hsl(var(--muted-foreground))]">No deals in pipeline</p>
            <p className="text-sm text-[hsl(var(--muted-foreground))] mt-2">
              Create accounts and add deals to see them here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <PipelineBoard initialDeals={deals.map(d => ({
          ...d,
          closeDate: d.closeDate.toISOString()
        }))} />
      )}
    </section>
  );
}
