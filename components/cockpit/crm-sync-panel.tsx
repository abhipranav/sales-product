"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

const samplePayload = JSON.stringify(
  {
    source: "hubspot",
    syncReason: "manual-import",
    cursor: "batch-42",
    nextCursor: "batch-43",
    account: {
      externalId: "hs_acc_aurora",
      name: "Aurora Logistics",
      segment: "mid-market",
      website: "https://auroralogistics.example",
      employeeBand: "201-500"
    },
    contacts: [
      {
        externalId: "hs_cnt_maya",
        fullName: "Maya Kim",
        title: "Head of Talent Operations",
        email: "maya.kim@auroralogistics.example",
        role: "champion"
      }
    ],
    deals: [
      {
        externalId: "hs_deal_q1",
        name: "AI Interview Platform Rollout",
        stage: "evaluation",
        amount: 76000,
        confidence: 0.64,
        closeDate: "2026-03-14T00:00:00.000Z",
        riskSummary: "Security review owner still pending."
      }
    ]
  },
  null,
  2
);

interface SyncStateResponse {
  state: {
    cursor: string | null;
    status: string;
    lastRunAt?: string;
    lastError?: string | null;
  };
}

export function CrmSyncPanel() {
  const router = useRouter();
  const [payload, setPayload] = useState(samplePayload);
  const [isManualSyncing, setIsManualSyncing] = useState(false);
  const [isDeltaSyncing, setIsDeltaSyncing] = useState(false);
  const [isCadenceSyncing, setIsCadenceSyncing] = useState(false);
  const [syncState, setSyncState] = useState<SyncStateResponse["state"] | null>(null);

  useEffect(() => {
    async function loadState() {
      try {
        const response = await fetch("/api/integrations/hubspot/sync");
        const data = (await response.json()) as SyncStateResponse;
        if (response.ok && data?.state) {
          setSyncState(data.state);
        }
      } catch {
        // State load is best-effort in UI.
      }
    }
    loadState();
  }, []);

  async function handleManualSync() {
    if (isManualSyncing) {
      return;
    }

    setIsManualSyncing(true);
    toast.loading("Running manual HubSpot sync...", { id: "hubspot-manual-sync" });

    try {
      const parsed = JSON.parse(payload);
      const response = await fetch("/api/integrations/hubspot/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(parsed)
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        toast.error(data?.error ?? "Manual sync failed.", { id: "hubspot-manual-sync" });
        return;
      }

      toast.success("Manual sync completed.", { id: "hubspot-manual-sync" });
      router.refresh();
    } catch {
      toast.error("Invalid JSON payload or sync error.", { id: "hubspot-manual-sync" });
    } finally {
      setIsManualSyncing(false);
    }
  }

  async function handleDeltaSync() {
    if (isDeltaSyncing) {
      return;
    }

    setIsDeltaSyncing(true);
    toast.loading("Running delta sync batch...", { id: "hubspot-delta-sync" });

    try {
      const response = await fetch("/api/integrations/hubspot/sync/delta", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          dryRun: false,
          syncReason: "scheduled-delta-manual-trigger"
        })
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        toast.error(data?.error ?? "Delta sync failed.", { id: "hubspot-delta-sync" });
        return;
      }

      if (data.status === "no-op") {
        toast.message("No new delta batch available.", { id: "hubspot-delta-sync" });
      } else {
        toast.success(`Delta sync complete. Cursor advanced to ${data.nextCursor}.`, { id: "hubspot-delta-sync" });
      }

      const stateResponse = await fetch("/api/integrations/hubspot/sync");
      const stateData = (await stateResponse.json()) as SyncStateResponse;
      if (stateResponse.ok && stateData?.state) {
        setSyncState(stateData.state);
      }
      router.refresh();
    } catch {
      toast.error("Delta sync failed.", { id: "hubspot-delta-sync" });
    } finally {
      setIsDeltaSyncing(false);
    }
  }

  async function handleCadenceSync() {
    if (isCadenceSyncing) {
      return;
    }

    setIsCadenceSyncing(true);
    toast.loading("Running delta cadence...", { id: "hubspot-delta-cadence" });

    try {
      const response = await fetch("/api/integrations/hubspot/sync/delta/cadence", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          maxBatches: 5,
          syncReason: "scheduled-cadence-manual-trigger"
        })
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        toast.error(data?.error ?? "Delta cadence failed.", { id: "hubspot-delta-cadence" });
        return;
      }

      toast.success(
        `Cadence finished: ${data.totalSyncedBatches ?? 0} batch(es), stop=${data.stoppedReason ?? "unknown"}.`,
        {
          id: "hubspot-delta-cadence"
        }
      );

      const stateResponse = await fetch("/api/integrations/hubspot/sync");
      const stateData = (await stateResponse.json()) as SyncStateResponse;
      if (stateResponse.ok && stateData?.state) {
        setSyncState(stateData.state);
      }
      router.refresh();
    } catch {
      toast.error("Delta cadence failed.", { id: "hubspot-delta-cadence" });
    } finally {
      setIsCadenceSyncing(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-['Sora',sans-serif]">CRM Sync (HubSpot)</CardTitle>
        <CardDescription>
          Manual payload sync plus incremental delta batch runner backed by `IntegrationSyncState` cursor checkpoints.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        <div className="rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-3 text-xs">
          <p>
            <span className="font-semibold">Cursor:</span> {syncState?.cursor ?? "none"}
          </p>
          <p>
            <span className="font-semibold">Status:</span> {syncState?.status ?? "unknown"}
          </p>
          <p>
            <span className="font-semibold">Last run:</span> {syncState?.lastRunAt ? new Date(syncState.lastRunAt).toLocaleString() : "n/a"}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={handleDeltaSync} disabled={isDeltaSyncing}>
            {isDeltaSyncing ? "Running Delta..." : "Run Delta Batch"}
          </Button>
          <Button type="button" onClick={handleCadenceSync} disabled={isCadenceSyncing}>
            {isCadenceSyncing ? "Running Cadence..." : "Run Delta Cadence"}
          </Button>
          <Button type="button" variant="outline" onClick={handleManualSync} disabled={isManualSyncing}>
            {isManualSyncing ? "Syncing..." : "Run Manual Payload Sync"}
          </Button>
        </div>

        <Textarea
          name="payload"
          required
          rows={12}
          value={payload}
          onChange={(event) => setPayload(event.target.value)}
          className="font-mono text-xs"
        />
      </CardContent>
    </Card>
  );
}
