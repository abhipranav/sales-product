import { getActorFromRequest } from "@/lib/auth/actor";
import {
  getHubspotSyncState,
  HubspotExternalIdConflictError,
  HubspotSyncServiceUnavailableError,
  HubspotSyncWorkspaceError,
  parseHubspotSyncPayload,
  syncHubspotData
} from "@/lib/services/integrations/hubspot-sync";
import { WorkspaceAccessDeniedError } from "@/lib/services/workspace";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

export async function GET(request: Request) {
  try {
    const actor = getActorFromRequest(request);
    const state = await getHubspotSyncState(actor);
    return NextResponse.json({ state });
  } catch (error) {
    if (error instanceof HubspotSyncServiceUnavailableError || error instanceof HubspotSyncWorkspaceError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }

    if (error instanceof WorkspaceAccessDeniedError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    console.error("HubSpot sync-state read failed", error);
    return NextResponse.json({ error: "Failed to read HubSpot sync state." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const actor = getActorFromRequest(request);
    const payload = parseHubspotSyncPayload(await request.json());
    const result = await syncHubspotData(payload, actor);

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "Invalid HubSpot sync payload.",
          details: error.flatten()
        },
        { status: 400 }
      );
    }

    if (error instanceof HubspotSyncServiceUnavailableError || error instanceof HubspotSyncWorkspaceError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }

    if (error instanceof HubspotExternalIdConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    if (error instanceof WorkspaceAccessDeniedError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    console.error("HubSpot sync failed", error);
    return NextResponse.json({ error: "Failed to sync CRM payload." }, { status: 500 });
  }
}
