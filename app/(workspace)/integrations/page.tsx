import type { Route } from "next";
import Link from "next/link";
import { CalendarIngest } from "@/components/cockpit/calendar-ingest";
import { CrmSyncPanel } from "@/components/cockpit/crm-sync-panel";
import { IntegrationStatusCards } from "@/components/integrations/integration-status-cards";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getActorFromServerContext } from "@/lib/auth/actor";
import { getIntegrationStatus } from "@/lib/services/integrations/status";
import { getCachedWorkspaceSummary } from "@/lib/services/workspace-summary-cache";

export default async function IntegrationsPage() {
  const actor = await getActorFromServerContext();
  const [summary, integrationStatus] = await Promise.all([
    getCachedWorkspaceSummary(actor, "/integrations"),
    getIntegrationStatus()
  ]);

  return (
    <section className="mx-auto max-w-7xl py-2 md:py-4">
      <header className="mb-6">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-[hsl(var(--muted-foreground))]">INTEGRATIONS // DATA_FLOWS</p>
        <h2 className="font-serif text-3xl font-bold text-[hsl(var(--foreground))]">Integration Hub</h2>
        <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
          Control external data flows without leaving the workspace.{" · "}
          <Link
            href={`/pipeline/${summary.deal.id}` as "/pipeline"}
            className="text-[hsl(var(--foreground))] font-bold hover:underline"
          >
            {summary.deal.name}
          </Link>
          {" · "}
          <Link
            href={`/accounts/${summary.account.id}` as "/accounts"}
            className="text-[hsl(var(--foreground))] font-bold hover:underline"
          >
            {summary.account.name}
          </Link>
        </p>
      </header>

      <section className="mb-6">
        <IntegrationStatusCards status={integrationStatus} />
      </section>

      <section className="mb-4 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/workspace" className="block">
          <Card className="h-full transition-all duration-200 border-[2px] border-[hsl(var(--border))] hover:border-[hsl(var(--warning))] hover:bg-[hsl(var(--muted)/0.15)] rounded-lg shadow-none bg-[hsl(var(--card))] cursor-pointer group">
            <CardHeader className="pb-2">
              <CardTitle className="font-mono text-xs uppercase tracking-wider flex items-center justify-between">
                <span>WORKSPACE</span>
                <span className="font-mono text-[9px] text-[hsl(var(--success))] font-bold">[ ACTIVE ]</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs font-mono">
              <div className="space-y-1">
                <p className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase">WORKSPACE_ID</p>
                <p className="font-bold text-[hsl(var(--foreground))] truncate">{summary.workspace.name}</p>
              </div>
              <div className="space-y-1 pt-1 border-t border-[hsl(var(--border))] border-dashed">
                <p className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase">OPERATOR</p>
                <p className="text-[10px] text-[hsl(var(--foreground))] truncate">{summary.workspace.actorEmail}</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/accounts" className="block">
          <Card className="h-full transition-all duration-200 border-[2px] border-[hsl(var(--border))] hover:border-[hsl(var(--warning))] hover:bg-[hsl(var(--muted)/0.15)] rounded-lg shadow-none bg-[hsl(var(--card))] cursor-pointer group">
            <CardHeader className="pb-2">
              <CardTitle className="font-mono text-xs uppercase tracking-wider flex items-center justify-between">
                <span>CRM_STATUS</span>
                <span className="font-mono text-[9px] text-[hsl(var(--success))] font-bold">[ HUBSPOT_ONLINE ]</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs font-mono">
              <div className="space-y-1">
                <p className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase">DATA_UPSERT</p>
                <p className="text-[10px] text-[hsl(var(--foreground))] uppercase font-bold">PAYLOAD ACTIVE</p>
              </div>
              <div className="space-y-1 pt-1 border-t border-[hsl(var(--border))] border-dashed">
                <p className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase">ENTITIES_TRACKED</p>
                <p className="text-[10px] text-[hsl(var(--foreground))] uppercase truncate">ACCOUNTS / CONTACTS / DEALS</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href={"/integrations/linkedin" as Route} className="block">
          <Card className="h-full transition-all duration-200 border-[2px] border-[hsl(var(--border))] hover:border-[hsl(var(--warning))] hover:bg-[hsl(var(--muted)/0.15)] rounded-lg shadow-none bg-[hsl(var(--card))] cursor-pointer group">
            <CardHeader className="pb-2">
              <CardTitle className="font-mono text-xs uppercase tracking-wider flex items-center justify-between">
                <span>LINKEDIN_COMP</span>
                <span className="font-mono text-[9px] text-[hsl(var(--warning))] font-bold">[ CAPTURE_READY ]</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs font-mono">
              <div className="space-y-1">
                <p className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase">companion method</p>
                <p className="text-[10px] text-[hsl(var(--foreground))] uppercase font-bold">tab-to-crm workbench</p>
              </div>
              <div className="space-y-1 pt-1 border-t border-[hsl(var(--border))] border-dashed">
                <p className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase">Operator flow</p>
                <p className="text-[10px] text-[hsl(var(--foreground))] truncate">Capture active tab details & sync to crm</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Card className="h-full border-[2px] border-[hsl(var(--border))] rounded-lg shadow-none bg-[hsl(var(--card))]">
          <CardHeader className="pb-2">
            <CardTitle className="font-mono text-xs uppercase tracking-wider flex items-center justify-between">
              <span>CALENDAR_STATUS</span>
              <span className="font-mono text-[9px] text-[hsl(var(--warning))] font-bold">[ STANDBY ]</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs font-mono">
            <div className="space-y-1">
              <p className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase">INGESTION MODE</p>
              <p className="text-[10px] text-[hsl(var(--foreground))] uppercase font-bold">MANUAL INGEST ACTIVE</p>
            </div>
            <div className="space-y-1 pt-1 border-t border-[hsl(var(--border))] border-dashed">
              <p className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase">PROVIDER_SYNC</p>
              <p className="text-[10px] text-[hsl(var(--foreground))] uppercase">INACTIVE (STANDBY)</p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <CrmSyncPanel />
        <CalendarIngest dealId={summary.deal.id} />
      </section>
    </section>
  );
}
