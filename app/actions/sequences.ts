"use server";

import { revalidatePath } from "next/cache";
import { getActorFromServerContext } from "@/lib/auth/actor";
import { revalidateDashboardViews } from "@/lib/services/cache-invalidation";
import {
  SequenceRecordNotFoundError,
  SequenceServiceUnavailableError,
  createSequenceExecution,
  parseCreateSequenceInput,
  parseUpdateSequenceStepInput,
  updateSequenceStep
} from "@/lib/services/sequences";
import { WorkspaceAccessDeniedError } from "@/lib/services/workspace";
import { logger } from "@/lib/logger";

const log = logger.child({ module: "actions/sequences" });

function parseJsonArray(raw: string) {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

const allowedChannels = new Set(["email", "phone", "linkedin", "meeting"]);

function parseChannels(rawChannels: string, rawJsonChannels: string) {
  const fromJson = parseJsonArray(rawJsonChannels).filter((value): value is string => typeof value === "string");
  if (fromJson.length > 0) {
    return fromJson.filter((channel) => allowedChannels.has(channel));
  }

  return rawChannels
    .split(",")
    .map((channel) => channel.trim().toLowerCase())
    .filter((channel) => allowedChannels.has(channel));
}

function parseSteps(rawStepsJson: string, rawStepsText: string, channels: string[]) {
  const fromJson = parseJsonArray(rawStepsJson).filter(
    (value): value is { channel: string; instruction: string } =>
      typeof value === "object" &&
      value !== null &&
      typeof (value as { channel?: unknown }).channel === "string" &&
      typeof (value as { instruction?: unknown }).instruction === "string"
  );

  if (fromJson.length > 0) {
    return fromJson.filter((step) => allowedChannels.has(step.channel));
  }

  const lines = rawStepsText
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  return lines.map((instruction, index) => ({
    channel: channels[index % channels.length] ?? "email",
    instruction
  }));
}

export async function createSequenceExecutionAction(formData: FormData) {
  try {
    const actor = await getActorFromServerContext();
    const channels = parseChannels(
      String(formData.get("channels") ?? ""),
      String(formData.get("channelMix") ?? "[]")
    );
    const steps = parseSteps(
      String(formData.get("steps") ?? "[]"),
      String(formData.get("stepsText") ?? ""),
      channels.length > 0 ? channels : ["email", "phone", "linkedin"]
    );

    const payload = parseCreateSequenceInput({
      dealId: String(formData.get("dealId") ?? "").trim(),
      contactId: String(formData.get("contactId") ?? "").trim() || undefined,
      title: String(formData.get("title") ?? "").trim(),
      channelMix: channels.length > 0 ? channels : ["email", "phone", "linkedin"],
      steps
    });

    await createSequenceExecution(payload, actor);
    revalidateDashboardViews();
    revalidatePath("/intelligence");
    revalidatePath("/workflows");
  } catch (error) {
    if (
      error instanceof SequenceServiceUnavailableError ||
      error instanceof SequenceRecordNotFoundError ||
      error instanceof WorkspaceAccessDeniedError
    ) {
      log.warn("Sequence creation skipped", { action: "create" }, error);
      return;
    }
    log.error("Create sequence execution action failed", { action: "create" }, error);
  }
}

export async function updateSequenceStepAction(formData: FormData) {
  const stepId = String(formData.get("stepId") ?? "").trim();
  if (!stepId) {
    return;
  }

  try {
    const actor = await getActorFromServerContext();
    const payload = parseUpdateSequenceStepInput({
      status: String(formData.get("status") ?? "").trim() || undefined,
      outcome: String(formData.get("outcome") ?? "").trim() || undefined
    });

    await updateSequenceStep(stepId, payload, actor);
    revalidateDashboardViews();
    revalidatePath("/intelligence");
    revalidatePath("/workflows");
  } catch (error) {
    if (
      error instanceof SequenceServiceUnavailableError ||
      error instanceof SequenceRecordNotFoundError ||
      error instanceof WorkspaceAccessDeniedError
    ) {
      log.warn("Sequence step update skipped", { action: "updateStep" }, error);
      return;
    }
    log.error("Update sequence step action failed", { action: "updateStep" }, error);
  }
}
