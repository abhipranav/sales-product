import Link from "next/link";
import { ApprovalQueue } from "@/components/cockpit/approval-queue";
import { AuditTrail } from "@/components/cockpit/audit-trail";
import { NextActions } from "@/components/cockpit/next-actions";
import { SequenceExecutionBoard } from "@/components/cockpit/sequence-execution-board";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getActorFromServerContext } from "@/lib/auth/actor";
import { getCachedDashboardData } from "@/lib/services/dashboard-cache";
import { SequenceServiceUnavailableError, listSequenceExecutions } from "@/lib/services/sequences";
import { WorkspaceAccessDeniedError } from "@/lib/services/workspace";

export default async function WorkflowsPage() {
  const actor = await getActorFromServerContext();
  const data = await getCachedDashboardData(actor, "/workflows", { includeStrategyPlays: false });
  let sequenceExecutions: Awaited<ReturnType<typeof listSequenceExecutions>> = [];

  try {
    sequenceExecutions = await listSequenceExecutions({ dealId: data.deal.id, limit: 8 }, actor);
  } catch (error) {
    if (error instanceof SequenceServiceUnavailableError || error instanceof WorkspaceAccessDeniedError) {
      console.warn(error.message);
      sequenceExecutions = [];
    } else {
      console.error("Failed to list sequence executions", error);
      sequenceExecutions = [];
    }
  }

  const pendingApprovals = data.approvals.filter((approval) => approval.status === "pending").length;
  const openTasks = data.tasks.filter((task) => task.status !== "done").length;

  return (
    <section className="mx-auto max-w-7xl py-2 md:py-4">
      <header className="mb-6">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-[hsl(var(--muted-foreground))]">WORKFLOWS // ORCHESTRATOR</p>
        <h2 className="font-serif text-3xl font-bold text-[hsl(var(--foreground))]">Execution Orchestrator</h2>
        <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
          Task engine, human approvals, and auditability for every action.{" · "}
          <Link
            href={`/pipeline/${data.deal.id}` as "/pipeline"}
            className="text-[hsl(var(--foreground))] font-bold hover:underline"
          >
            {data.deal.name}
          </Link>
          {" · "}
          <Link
            href={`/accounts/${data.account.id}` as "/accounts"}
            className="text-[hsl(var(--foreground))] font-bold hover:underline"
          >
            {data.account.name}
          </Link>
        </p>
      </header>

      <section className="mb-4 grid gap-4 md:grid-cols-3">
        <Link href="/cockpit" className="block">
          <Card className="h-full transition-all duration-150 hover:bg-[hsl(var(--foreground))] hover:text-[hsl(var(--background))] cursor-pointer group">
            <CardHeader>
              <CardTitle className="font-mono text-xs uppercase tracking-wider group-hover:text-[hsl(var(--background))]">OPEN_TASKS</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-[hsl(var(--foreground))] group-hover:text-[hsl(var(--background))]">{openTasks}</p>
              <p className="font-mono text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--background))]/60">Across rep, manager, and system owners</p>
            </CardContent>
          </Card>
        </Link>
        <Card>
          <CardHeader>
            <CardTitle className="font-mono text-xs uppercase tracking-wider">PENDING_APPROVALS</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-[hsl(var(--foreground))]">{pendingApprovals}</p>
            <p className="font-mono text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Outbound communication waiting for review</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="font-mono text-xs uppercase tracking-wider">AUDIT_COVERAGE</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Badge variant="success">TRACKED</Badge>
            <p className="font-mono text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Every workflow action is written to execution audit logs.</p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <NextActions dealId={data.deal.id} tasks={data.tasks} />
          <SequenceExecutionBoard dealId={data.deal.id} contacts={data.contacts} sequences={sequenceExecutions} />
          <AuditTrail events={data.auditTrail} />
        </div>
        <ApprovalQueue approvals={data.approvals} />
      </section>
    </section>
  );
}
