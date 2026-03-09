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
      <Card>
        <CardHeader>
          <CardTitle className="font-mono text-xs uppercase tracking-wider">HUBSPOT_HEALTH</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant={status?.hubspot?.connected ? "success" : "warning"}>
              {status?.hubspot?.connected ? "CONNECTED" : "DISCONNECTED"}
            </Badge>
            {status?.hubspot?.authMode && (
              <Badge variant="outline">
                {status.hubspot.authMode.toUpperCase()}
              </Badge>
            )}
          </div>
          {status?.hubspot?.error && (
            <p className="font-mono text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
              {status.hubspot.error}
            </p>
          )}
          {status?.hubspot?.scopeGranted?.length ? (
            <div className="flex flex-wrap gap-1">
              {status.hubspot.scopeGranted.map((scope) => (
                <Badge key={scope} variant="outline" className="text-[9px]">
                  {scope.split(".").pop()}
                </Badge>
              ))}
            </div>
          ) : null}
          <Button asChild variant="outline" size="sm" className="mt-2">
            <Link href="/setup">{status?.hubspot?.connected ? "Review CRM Setup" : "Open CRM Setup"}</Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-mono text-xs uppercase tracking-wider">CALENDAR_HEALTH</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant={status?.calendar?.connected ? "success" : "warning"}>
              {status?.calendar?.connected ? "CONNECTED" : "DISCONNECTED"}
            </Badge>
            {status?.calendar?.provider && status?.calendar?.provider !== "none" && (
              <Badge variant="outline">
                {status.calendar.provider.toUpperCase()}
              </Badge>
            )}
          </div>
          {status?.calendar?.error && (
            <p className="font-mono text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
              {status.calendar.error}
            </p>
          )}
          <Button asChild variant="outline" size="sm" className="mt-2">
            <Link href="/setup">{status?.calendar?.connected ? "Review Calendar Setup" : "Open Calendar Setup"}</Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-mono text-xs uppercase tracking-wider">LINKEDIN_COMPANION</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant="accent">READY</Badge>
            <Badge variant="outline">TAB-TO-CRM</Badge>
          </div>
          <p className="font-mono text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
            Companion install opens the current LinkedIn tab inside a guided capture workbench and saves editable CRM records.
          </p>
          <Button asChild variant="outline" size="sm" className="mt-2">
            <Link href={"/integrations/linkedin" as Route}>Open Companion</Link>
          </Button>
        </CardContent>
      </Card>

      {status?.checkedAt && (
        <p className="col-span-full font-mono text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
          Last checked: {new Date(status.checkedAt).toLocaleString()}
        </p>
      )}
    </div>
  );
}
