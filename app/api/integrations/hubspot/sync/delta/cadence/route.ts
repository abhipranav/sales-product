import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getActorFromRequest } from "@/lib/auth/actor";
import { WorkspaceAccessDeniedError } from "@/lib/services/workspace";
import {
  HubspotExternalIdConflictError,
  HubspotSyncServiceUnavailableError,
  HubspotSyncWorkspaceError
} from "@/lib/services/integrations/hubspot-sync";
import {
  parseRunDeltaCadenceInput,
  runHubspotDeltaCadence
} from "@/lib/services/integrations/hubspot-delta-scheduler";

function isAuthorized(request: Request) {
  const secret = process.env.APP_CRON_SECRET?.trim();
  if (!secret) {
    return true;
  }

  const headerSecret = request.headers.get("x-cron-secret");
  const bearer = request.headers.get("authorization");
  return headerSecret === secret || bearer === `Bearer ${secret}`;
}

export async function POST(request: Request) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: "Unauthorized cron request." }, { status: 401 });
    }

    const actor = getActorFromRequest(request);
    const body = await request.json().catch(() => ({}));
    const payload = parseRunDeltaCadenceInput(body);
    const result = await runHubspotDeltaCadence(payload, actor);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Invalid delta cadence payload.", details: error.flatten() }, { status: 400 });
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

    console.error("HubSpot delta cadence failed", error);
    return NextResponse.json({ error: "Failed to run HubSpot delta cadence." }, { status: 500 });
  }
}
