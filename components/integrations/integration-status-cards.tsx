"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ConnectionStatus {
  connected: boolean;
  authMode?: string;
  provider?: string;
  lastSyncAt: string | null;
  scopeGranted: string[];
  error?: string;
}

interface IntegrationStatusData {
  hubspot: ConnectionStatus;
  calendar: ConnectionStatus;
  checkedAt: string;
}

export function IntegrationStatusCards() {
  const [status, setStatus] = useState<IntegrationStatusData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStatus() {
      try {
        const response = await fetch("/api/integrations/status");
        if (response.ok) {
          const data = await response.json();
          setStatus(data);
        }
      } catch {
        // Ignore fetch errors
      } finally {
        setLoading(false);
      }
    }

    fetchStatus();
  }, []);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="h-4 w-24 rounded bg-[hsl(var(--muted))]" />
          </CardContent>
        </Card>
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="h-4 w-24 rounded bg-[hsl(var(--muted))]" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
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
          <Button variant="outline" size="sm" disabled className="mt-2">
            {status?.hubspot?.connected ? "Reconnect" : "Connect HubSpot"}
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
          <Button variant="outline" size="sm" disabled className="mt-2">
            {status?.calendar?.connected ? "Reconnect" : "Connect Calendar"}
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
