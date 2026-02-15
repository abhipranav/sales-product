"use server";

import { getActorFromServerContext } from "@/lib/auth/actor";
import { revalidateDashboardViews } from "@/lib/services/cache-invalidation";
import {
  NotificationNotFoundError,
  NotificationServiceUnavailableError,
  acknowledgeSignalNotification
} from "@/lib/services/notifications";
import { WorkspaceAccessDeniedError } from "@/lib/services/workspace";
import { revalidatePath } from "next/cache";
import { logger } from "@/lib/logger";

const log = logger.child({ module: "actions/notifications" });

export async function acknowledgeNotificationAction(formData: FormData) {
  const notificationId = String(formData.get("notificationId") ?? "").trim();
  if (!notificationId) {
    return;
  }

  try {
    const actor = await getActorFromServerContext();
    await acknowledgeSignalNotification(notificationId, actor);
    revalidateDashboardViews();
    revalidatePath("/notifications");
  } catch (error) {
    if (
      error instanceof NotificationServiceUnavailableError ||
      error instanceof NotificationNotFoundError ||
      error instanceof WorkspaceAccessDeniedError
    ) {
      log.warn("Notification ack skipped", { action: "acknowledge" }, error);
      return;
    }
    log.error("Acknowledge notification action failed", { action: "acknowledge" }, error);
  }
}
