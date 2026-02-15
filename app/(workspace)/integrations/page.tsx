import Link from "next/link";
import { CalendarIngest } from "@/components/cockpit/calendar-ingest";
import { CrmSyncPanel } from "@/components/cockpit/crm-sync-panel";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getActorFromServerContext } from "@/lib/auth/actor";
import { getCachedDashboardData } from "@/lib/services/dashboard-cache";

export default async function IntegrationsPage() {
  const actor = await getActorFromServerContext();
  const data = await getCachedDashboardData(actor, "/integrations");

  return (
    <section className="mx-auto max-w-7xl py-2 md:py-4">
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Integrations</p>
        <h2 className="font-['Sora',sans-serif] text-3xl font-bold text-zinc-900">Integration Hub</h2>
        <p className="mt-1 text-sm text-zinc-700">
          Control external data flows without leaving the workspace.{" · "}
          <Link
            href={`/pipeline/${data.deal.id}` as "/pipeline"}
            className="text-[hsl(var(--primary))] hover:underline"
          >
            {data.deal.name}
          </Link>
          {" · "}
          <Link
            href={`/accounts/${data.account.id}` as "/accounts"}
            className="text-[hsl(var(--primary))] hover:underline"
          >
            {data.account.name}
          </Link>
        </p>
      </header>

      <section className="mb-4 grid gap-4 md:grid-cols-3">
        <Link href="/workspace" className="block">
          <Card className="h-full transition-colors hover:border-[hsl(var(--primary)/0.3)] cursor-pointer">
            <CardHeader>
              <CardTitle className="text-base">Workspace</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Badge variant="secondary">{data.workspace.name}</Badge>
              <p className="text-sm text-zinc-700">{data.workspace.actorEmail}</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/accounts" className="block">
          <Card className="h-full transition-colors hover:border-[hsl(var(--primary)/0.3)] cursor-pointer">
            <CardHeader>
              <CardTitle className="text-base">CRM Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Badge variant="success">HubSpot Connected</Badge>
              <p className="text-sm text-zinc-600">Payload-based upsert is active for account, contact, and deal entities.</p>
            </CardContent>
          </Card>
        </Link>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Calendar Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Badge variant="warning">Manual Ingest Mode</Badge>
            <p className="text-sm text-zinc-600">Current mode uses manual ingest. Provider sync can be switched on later.</p>
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
