"use server";

import {
  MeetingNotesDealNotFoundError,
  MeetingNotesServiceUnavailableError,
  parseMeetingNotesInput,
  processMeetingNotes
} from "@/lib/services/meeting-notes";
import { WorkspaceAccessDeniedError } from "@/lib/services/workspace";
import { getActorFromServerContext } from "@/lib/auth/actor";
import { revalidateDashboardViews } from "@/lib/services/cache-invalidation";
import { logger } from "@/lib/logger";

const log = logger.child({ module: "actions/meeting-notes" });

export async function processMeetingNotesAction(formData: FormData) {
  const happenedAtInput = String(formData.get("happenedAt") ?? "").trim();
  const happenedAtDate = happenedAtInput ? new Date(happenedAtInput) : null;

  if (happenedAtDate && Number.isNaN(happenedAtDate.getTime())) {
    return;
  }

  try {
    const payload = parseMeetingNotesInput({
      dealId: String(formData.get("dealId") ?? "").trim(),
      notes: String(formData.get("notes") ?? "").trim(),
      happenedAt: happenedAtDate ? happenedAtDate.toISOString() : undefined,
      actor: "rep",
      source: "cockpit-notes"
    });

    const actor = await getActorFromServerContext();
    await processMeetingNotes(payload, actor);
    revalidateDashboardViews();
  } catch (error) {
    if (error instanceof MeetingNotesServiceUnavailableError || error instanceof MeetingNotesDealNotFoundError) {
      log.warn("Meeting notes skipped", { action: "process" }, error);
      return;
    }

    if (error instanceof WorkspaceAccessDeniedError) {
      log.warn("Meeting notes denied", { action: "process" }, error);
      return;
    }

    log.error("Meeting notes action failed", { action: "process" }, error);
  }
}
