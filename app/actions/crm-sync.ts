"use server";

import {
  HubspotExternalIdConflictError,
  HubspotSyncServiceUnavailableError,
  HubspotSyncWorkspaceError,
  parseHubspotSyncPayload,
  syncHubspotData
} from "@/lib/services/integrations/hubspot-sync";
import { WorkspaceAccessDeniedError } from "@/lib/services/workspace";
import { getActorFromServerContext } from "@/lib/auth/actor";
import { revalidateDashboardViews } from "@/lib/services/cache-invalidation";
import { logger } from "@/lib/logger";

const log = logger.child({ module: "actions/crm-sync" });

export async function syncHubspotAction(formData: FormData) {
  const payloadInput = String(formData.get("payload") ?? "").trim();

  if (!payloadInput) {
    return;
  }

  try {
    const payload = parseHubspotSyncPayload(JSON.parse(payloadInput));
    const actor = await getActorFromServerContext();
    await syncHubspotData(payload, actor);
    revalidateDashboardViews();
  } catch (error) {
    if (
      error instanceof SyntaxError ||
      error instanceof HubspotSyncServiceUnavailableError ||
      error instanceof HubspotSyncWorkspaceError ||
      error instanceof HubspotExternalIdConflictError ||
      error instanceof WorkspaceAccessDeniedError
    ) {
      log.warn("HubSpot sync skipped", { action: "sync" }, error);
      return;
    }

    log.error("HubSpot sync action failed", { action: "sync" }, error);
  }
}
