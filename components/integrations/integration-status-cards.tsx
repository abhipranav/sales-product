import type { Route } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { IntegrationStatusSnapshot } from "@/lib/services/integrations/status";

interface IntegrationStatusCardsProps {
  status: IntegrationStatusSnapshot;
}

export function IntegrationStatusCards({ status }: IntegrationStatusCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card className="border-[2px] border-[hsl(var(--border))] rounded-lg shadow-none bg-[hsl(var(--card))] relative overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="font-mono text-xs uppercase tracking-wider flex items-center justify-between">
            <span>HUBSPOT_HEALTH</span>
            <span className={`h-2.5 w-2.5 rounded-full ${status?.hubspot?.connected ? "bg-[hsl(var(--success))] animate-pulse" : "bg-[hsl(var(--warning))]"}`} />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant={status?.hubspot?.connected ? "success" : "warning"} className="font-mono text-[10px]">
              {status?.hubspot?.connected ? "CONNECTED" : "DISCONNECTED"}
            </Badge>
            {status?.hubspot?.authMode && (
              <Badge variant="outline" className="font-mono text-[10px]">
                {status.hubspot.authMode.toUpperCase()}
              </Badge>
            )}
          </div>
          {status?.hubspot?.error && (
            <p className="font-mono text-[10px] uppercase tracking-wider text-[hsl(var(--destructive))]">
              ERROR: {status.hubspot.error}
            </p>
          )}
          {status?.hubspot?.scopeGranted?.length ? (
            <div className="pt-1 space-y-1">
              <span className="font-mono text-[9px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider block">GRANTED SCOPES:</span>
              <div className="flex flex-wrap gap-1">
                {status.hubspot.scopeGranted.map((scope) => (
                  <Badge key={scope} variant="outline" className="text-[9px] font-mono py-0 px-1.5">
                    {scope.split(".").pop()?.toUpperCase()}
                  </Badge>
                ))}
              </div>
            </div>
          ) : null}
          <Button asChild variant="outline" size="sm" className="mt-2 w-full font-mono text-xs h-8 border-[2px]">
            <Link href="/setup">{status?.hubspot?.connected ? "REVIEW CRM SETUP" : "OPEN CRM SETUP"}</Link>
          </Button>
        </CardContent>
      </Card>

      <Card className="border-[2px] border-[hsl(var(--border))] rounded-lg shadow-none bg-[hsl(var(--card))] relative overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="font-mono text-xs uppercase tracking-wider flex items-center justify-between">
            <span>CALENDAR_HEALTH</span>
            <span className={`h-2.5 w-2.5 rounded-full ${status?.calendar?.connected ? "bg-[hsl(var(--success))] animate-pulse" : "bg-[hsl(var(--warning))]"}`} />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant={status?.calendar?.connected ? "success" : "warning"} className="font-mono text-[10px]">
              {status?.calendar?.connected ? "CONNECTED" : "DISCONNECTED"}
            </Badge>
            {status?.calendar?.provider && status?.calendar?.provider !== "none" && (
              <Badge variant="outline" className="font-mono text-[10px]">
                {status.calendar.provider.toUpperCase()}
              </Badge>
            )}
          </div>
          {status?.calendar?.error && (
            <p className="font-mono text-[10px] uppercase tracking-wider text-[hsl(var(--destructive))]">
              ERROR: {status.calendar.error}
            </p>
          )}
          <p className="font-mono text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
            SYNC METHOD: {status?.calendar?.provider && status?.calendar?.provider !== "none" ? "AUTOMATIC_INGEST" : "MANUAL_INGEST_ONLY"}
          </p>
          <Button asChild variant="outline" size="sm" className="mt-2 w-full font-mono text-xs h-8 border-[2px]">
            <Link href="/setup">{status?.calendar?.connected ? "REVIEW CALENDAR SETUP" : "OPEN CALENDAR SETUP"}</Link>
          </Button>
        </CardContent>
      </Card>

      <Card className="border-[2px] border-[hsl(var(--border))] rounded-lg shadow-none bg-[hsl(var(--card))] relative overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="font-mono text-xs uppercase tracking-wider flex items-center justify-between">
            <span>LINKEDIN_COMPANION</span>
            <span className="h-2.5 w-2.5 rounded-full bg-[hsl(var(--success))] animate-pulse" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant="accent" className="font-mono text-[10px]">READY</Badge>
            <Badge variant="outline" className="font-mono text-[10px]">TAB-TO-CRM</Badge>
          </div>
          <p className="font-mono text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))] leading-relaxed">
            COMPANION WORKBENCH CAPTURES CURRENT LINKEDIN TABS INTO GUIDED WORKSPACES AND SYNCS RECORDS TO CRM IN REAL-TIME.
          </p>
          <Button asChild variant="outline" size="sm" className="mt-2 w-full font-mono text-xs h-8 border-[2px]">
            <Link href={"/integrations/linkedin" as Route}>OPEN COMPANION</Link>
          </Button>
        </CardContent>
      </Card>

      {status?.checkedAt && (
        <p className="col-span-full font-mono text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))] mt-2">
          Last checked: {new Date(status.checkedAt).toLocaleString()}
        </p>
      )}
    </div>
  );
}
