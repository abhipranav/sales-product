"use server";

import { getActorFromServerContext } from "@/lib/auth/actor";
import {
  ActivityDealNotFoundError,
  ActivityNotFoundError,
  ActivityServiceUnavailableError,
  createActivity,
  deleteActivity,
  parseCreateActivityInput,
} from "@/lib/services/activities";
import { WorkspaceAccessDeniedError } from "@/lib/services/workspace";
import { revalidateDashboardViews } from "@/lib/services/cache-invalidation";
import { logger } from "@/lib/logger";

const log = logger.child({ module: "actions/activities" });

export async function logActivityAction(formData: FormData) {
  try {
    const actor = await getActorFromServerContext();
    const payload = parseCreateActivityInput({
      dealId: String(formData.get("dealId") ?? "").trim(),
      type: String(formData.get("type") ?? "note"),
      summary: String(formData.get("summary") ?? "").trim(),
      happenedAt: formData.get("happenedAt")
        ? new Date(String(formData.get("happenedAt"))).toISOString()
        : undefined,
    });

    await createActivity(payload, actor);
    revalidateDashboardViews();
    log.info("Activity logged", { action: "create", dealId: payload.dealId });
  } catch (error) {
    if (
      error instanceof ActivityServiceUnavailableError ||
      error instanceof ActivityDealNotFoundError ||
      error instanceof WorkspaceAccessDeniedError
    ) {
      log.warn("Activity creation skipped", { action: "create" }, error);
      return;
    }
    log.error("Log activity action failed", { action: "create" }, error);
  }
}

export async function deleteActivityAction(formData: FormData) {
  const activityId = String(formData.get("activityId") ?? "").trim();
  if (!activityId) return;

  try {
    const actor = await getActorFromServerContext();
    await deleteActivity(activityId, actor);
    revalidateDashboardViews();
    log.info("Activity deleted", { action: "delete", activityId });
  } catch (error) {
    if (
      error instanceof ActivityServiceUnavailableError ||
      error instanceof ActivityNotFoundError ||
      error instanceof WorkspaceAccessDeniedError
    ) {
      log.warn("Activity deletion skipped", { action: "delete", activityId }, error);
      return;
    }
    log.error("Delete activity action failed", { action: "delete", activityId }, error);
  }
}
