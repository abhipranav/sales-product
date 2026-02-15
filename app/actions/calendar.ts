"use server";

import {
  CalendarDealNotFoundError,
  CalendarServiceUnavailableError,
  ingestCalendarEvent,
  parseCalendarIngestInput
} from "@/lib/services/calendar";
import { WorkspaceAccessDeniedError } from "@/lib/services/workspace";
import { getActorFromServerContext } from "@/lib/auth/actor";
import { revalidateDashboardViews } from "@/lib/services/cache-invalidation";
import { logger } from "@/lib/logger";

const log = logger.child({ module: "actions/calendar" });

export async function ingestCalendarEventAction(formData: FormData) {
  const startsAtInput = String(formData.get("startsAt") ?? "");
  const endsAtInput = String(formData.get("endsAt") ?? "");
  const startsAt = new Date(startsAtInput);
  const endsAt = new Date(endsAtInput);

  if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
    return;
  }

  try {
    const payload = parseCalendarIngestInput({
      externalId: String(formData.get("externalId") ?? "").trim() || undefined,
      dealId: String(formData.get("dealId") ?? "").trim(),
      title: String(formData.get("title") ?? "").trim(),
      summary: String(formData.get("summary") ?? "").trim() || undefined,
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
      organizerEmail: String(formData.get("organizerEmail") ?? "").trim() || undefined,
      attendees: String(formData.get("attendees") ?? "")
        .split(",")
        .map((email) => email.trim())
        .filter(Boolean),
      source: String(formData.get("source") ?? "calendar").trim()
    });

    const actor = await getActorFromServerContext();
    await ingestCalendarEvent(payload, actor);
    revalidateDashboardViews();
  } catch (error) {
    if (error instanceof CalendarServiceUnavailableError || error instanceof CalendarDealNotFoundError) {
      log.warn("Calendar ingest skipped", { action: "ingest" }, error);
      return;
    }

    if (error instanceof WorkspaceAccessDeniedError) {
      log.warn("Calendar ingest denied", { action: "ingest" }, error);
      return;
    }

    log.error("Calendar ingest action failed", { action: "ingest" }, error);
  }
}
