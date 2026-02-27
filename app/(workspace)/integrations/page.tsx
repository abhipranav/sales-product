import Link from "next/link";
import { CalendarIngest } from "@/components/cockpit/calendar-ingest";
import { CrmSyncPanel } from "@/components/cockpit/crm-sync-panel";
import { IntegrationStatusCards } from "@/components/integrations/integration-status-cards";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getActorFromServerContext } from "@/lib/auth/actor";
import { getCachedDashboardData } from "@/lib/services/dashboard-cache";

export default async function IntegrationsPage() {
  const actor = await getActorFromServerContext();
  const data = await getCachedDashboardData(actor, "/integrations", { includeStrategyPlays: false });

  return (
    <section className="mx-auto max-w-7xl py-2 md:py-4">
      <header className="mb-6">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-[hsl(var(--muted-foreground))]">INTEGRATIONS // DATA_FLOWS</p>
        <h2 className="font-serif text-3xl font-bold text-[hsl(var(--foreground))]">Integration Hub</h2>
        <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
          Control external data flows without leaving the workspace.{" · "}
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

      <section className="mb-6">
        <IntegrationStatusCards />
      </section>

      <section className="mb-4 grid gap-4 md:grid-cols-3">
        <Link href="/workspace" className="block">
          <Card className="h-full transition-all duration-150 hover:bg-[hsl(var(--foreground))] hover:text-[hsl(var(--background))] cursor-pointer group">
            <CardHeader>
              <CardTitle className="font-mono text-xs uppercase tracking-wider group-hover:text-[hsl(var(--background))]">WORKSPACE</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Badge variant="secondary">{data.workspace.name}</Badge>
              <p className="font-mono text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--background))]/60">{data.workspace.actorEmail}</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/accounts" className="block">
          <Card className="h-full transition-all duration-150 hover:bg-[hsl(var(--foreground))] hover:text-[hsl(var(--background))] cursor-pointer group">
            <CardHeader>
              <CardTitle className="font-mono text-xs uppercase tracking-wider group-hover:text-[hsl(var(--background))]">CRM_STATUS</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Badge variant="success">HUBSPOT CONNECTED</Badge>
              <p className="font-mono text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--background))]/60">Payload-based upsert is active for account, contact, and deal entities.</p>
            </CardContent>
          </Card>
        </Link>
        <Card>
          <CardHeader>
            <CardTitle className="font-mono text-xs uppercase tracking-wider">CALENDAR_STATUS</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Badge variant="warning">MANUAL INGEST MODE</Badge>
            <p className="font-mono text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Current mode uses manual ingest. Provider sync can be switched on later.</p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <CrmSyncPanel />
        <CalendarIngest dealId={data.deal.id} />
      </section>
    </section>
  );
}
