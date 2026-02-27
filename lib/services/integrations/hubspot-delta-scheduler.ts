import { z } from "zod";
import type { ActorIdentity } from "@/lib/auth/actor";
import { hubspotDeltaFeed, type HubspotDeltaBatch } from "@/lib/mock/hubspot-delta-feed";
import {
  type HubspotSyncPayload,
  getHubspotSyncStateSnapshot,
  parseHubspotSyncPayload,
  syncHubspotData
} from "@/lib/services/integrations/hubspot-sync";

const runDeltaSyncInputSchema = z.object({
  dryRun: z.coerce.boolean().default(false),
  syncReason: z.string().min(2).max(120).default("scheduled-delta")
});

const runDeltaCadenceInputSchema = z.object({
  maxBatches: z.coerce.number().int().min(1).max(25).default(5),
  syncReason: z.string().min(2).max(120).default("scheduled-cadence")
});

export function parseRunDeltaSyncInput(payload: unknown) {
  return runDeltaSyncInputSchema.parse(payload);
}

export function parseRunDeltaCadenceInput(payload: unknown) {
  return runDeltaCadenceInputSchema.parse(payload);
}

function getNextBatchFromMock(currentCursor: string | null) {
  if (!currentCursor) {
    return hubspotDeltaFeed[0] ?? null;
  }

  const index = hubspotDeltaFeed.findIndex((batch) => batch.cursor === currentCursor);
  if (index === -1) {
    return hubspotDeltaFeed[0] ?? null;
  }

  return hubspotDeltaFeed[index + 1] ?? null;
}

async function getNextBatchFromExternal(
  currentCursor: string | null,
  syncReason: string
): Promise<HubspotDeltaBatch | null> {
  const endpoint = process.env.APP_HUBSPOT_DELTA_URL?.trim();
  if (!endpoint) return null;
  const url = new URL(endpoint);
  if (currentCursor) {
    url.searchParams.set("cursor", currentCursor);
  }
  url.searchParams.set("syncReason", syncReason);

  const headers: Record<string, string> = {
    Accept: "application/json"
  };
  const token = process.env.HUBSPOT_PRIVATE_APP_TOKEN?.trim();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url.toString(), {
    method: "GET",
    headers,
    cache: "no-store"
  });

  if (response.status === 204) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`External HubSpot delta fetch failed (${response.status}).`);
  }

  const raw = await response.json().catch(() => null);
  const candidate = raw?.batch ?? raw;
  if (!candidate) {
    return null;
  }

  const parsed = parseHubspotSyncPayload({
    source: "hubspot",
    syncReason,
    cursor: currentCursor ?? undefined,
    nextCursor: String(candidate.cursor ?? ""),
    account: candidate.account,
    contacts: Array.isArray(candidate.contacts) ? candidate.contacts : [],
    deals: Array.isArray(candidate.deals) ? candidate.deals : []
  });

  const cursor = parsed.nextCursor ?? parsed.cursor;
  if (!cursor) {
    throw new Error("External HubSpot delta source returned a batch without cursor.");
  }

  return {
    cursor,
    account: parsed.account,
    contacts: parsed.contacts,
    deals: parsed.deals
  };
}

async function getNextBatch(currentCursor: string | null, syncReason: string): Promise<HubspotDeltaBatch | null> {
  if (process.env.APP_HUBSPOT_DELTA_URL?.trim()) {
    return getNextBatchFromExternal(currentCursor, syncReason);
  }

  return getNextBatchFromMock(currentCursor);
}

function buildPayload(batch: HubspotDeltaBatch, currentCursor: string | null, syncReason: string): HubspotSyncPayload {
  return parseHubspotSyncPayload({
    source: "hubspot",
    syncReason,
    cursor: currentCursor ?? undefined,
    nextCursor: batch.cursor,
    account: batch.account,
    contacts: batch.contacts,
    deals: batch.deals
  });
}

export async function runHubspotDeltaScheduler(
  payload: z.infer<typeof runDeltaSyncInputSchema>,
  actor?: ActorIdentity
) {
  const snapshot = await getHubspotSyncStateSnapshot(actor);
  const currentCursor = snapshot.cursor;
  const nextBatch = await getNextBatch(currentCursor, payload.syncReason);

  if (!nextBatch) {
    return {
      mode: payload.dryRun ? ("dry-run" as const) : ("apply" as const),
      status: "no-op" as const,
      currentCursor,
      nextCursor: null,
      reason: "No new delta batches in feed."
    };
  }

  const syncPayload = buildPayload(nextBatch, currentCursor, payload.syncReason);
  if (payload.dryRun) {
    return {
      mode: "dry-run" as const,
      status: "preview" as const,
      currentCursor,
      nextCursor: nextBatch.cursor,
      syncReason: payload.syncReason,
      candidate: {
        accountExternalId: syncPayload.account.externalId,
        contacts: syncPayload.contacts.length,
        deals: syncPayload.deals.length
      }
    };
  }

  const result = await syncHubspotData(syncPayload, actor);
  return {
    mode: "apply" as const,
    status: "synced" as const,
    currentCursor,
    nextCursor: nextBatch.cursor,
    syncReason: payload.syncReason,
    result
  };
}

export async function runHubspotDeltaCadence(
  payload: z.infer<typeof runDeltaCadenceInputSchema>,
  actor?: ActorIdentity
) {
  const runs: Array<{
    index: number;
    status: "synced" | "no-op" | "preview";
    currentCursor: string | null;
    nextCursor: string | null;
  }> = [];

  let totalSyncedBatches = 0;
  let finalCursor: string | null = null;
  let stoppedReason = "max-batches-reached";

  for (let index = 1; index <= payload.maxBatches; index += 1) {
    const result = await runHubspotDeltaScheduler(
      {
        dryRun: false,
        syncReason: payload.syncReason
      },
      actor
    );

    runs.push({
      index,
      status: result.status,
      currentCursor: result.currentCursor,
      nextCursor: result.nextCursor
    });

    finalCursor = result.nextCursor;

    if (result.status === "synced") {
      totalSyncedBatches += 1;
      if (result.nextCursor === result.currentCursor) {
        stoppedReason = "cursor-not-advanced";
        break;
      }
      continue;
    }

    if (result.status === "no-op") {
      stoppedReason = "no-new-delta";
      break;
    }

    stoppedReason = "preview-only";
    break;
  }

  if (runs.length < payload.maxBatches && stoppedReason === "max-batches-reached") {
    stoppedReason = "completed";
  }

  return {
    trigger: "cadence",
    syncReason: payload.syncReason,
    totalRuns: runs.length,
    totalSyncedBatches,
    finalCursor,
    stoppedReason,
    runs
  };
}
