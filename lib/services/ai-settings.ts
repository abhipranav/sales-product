import { z } from "zod";
import type { ActorIdentity } from "@/lib/auth/actor";
import { getPrismaClient } from "@/lib/db/prisma";
import { resolveWorkspaceScope } from "@/lib/services/workspace";
import { encrypt, decrypt, maskApiKey } from "@/lib/auth/crypto";
import {
  createDefaultDailyUsageSummary,
  getDailyUsageSummaryForMember,
  type AIDailyUsageSummary
} from "@/lib/services/ai-usage";
import { getRuntimeSecretStatus } from "@/lib/services/runtime-config";

const DEFAULT_MODEL = "gpt-5-mini";
const STRATEGY_AI_ENABLED = process.env.APP_ENABLE_AI_STRATEGY_PLAYS === "1";

function getAIWorkflowLabels(strategyMode: "ai-enabled" | "rule-based") {
  return strategyMode === "ai-enabled"
    ? ["Follow-up Draft regeneration", "Meeting Prep Brief regeneration", "Strategy Lab AI generation"]
    : ["Follow-up Draft regeneration", "Meeting Prep Brief regeneration"];
}

function buildAIStatusNote(input: {
  source: "user" | "system" | "none";
  systemKeyStatus: "active" | "pending-restart" | "missing";
  strategyMode: "ai-enabled" | "rule-based";
  model: string;
}) {
  if (input.source === "user") {
    return input.strategyMode === "ai-enabled"
      ? `Personal OpenAI key is active on ${input.model}. It powers follow-ups, meeting briefs, and Strategy Lab generation.`
      : `Personal OpenAI key is active on ${input.model}. It powers follow-ups and meeting briefs. Strategy Lab remains rule-based until APP_ENABLE_AI_STRATEGY_PLAYS=1.`;
  }

  if (input.source === "system") {
    return input.strategyMode === "ai-enabled"
      ? `Workspace/system OpenAI key is active on ${input.model}. It powers follow-ups, meeting briefs, and Strategy Lab generation.`
      : `Workspace/system OpenAI key is active on ${input.model}. It powers follow-ups and meeting briefs. Strategy Lab remains rule-based until APP_ENABLE_AI_STRATEGY_PLAYS=1.`;
  }

  if (input.systemKeyStatus === "pending-restart") {
    return "OPENAI_API_KEY is present in your env file, but the running server has not loaded it yet. Restart the app process to activate AI workflows.";
  }

  return "No active OpenAI key is loaded. Follow-ups and meeting briefs will fall back to rule-based generation.";
}

const updateAISettingsSchema = z
  .object({
    apiKey: z
      .string()
      .min(1)
      .max(500)
      .optional()
      .nullable(),
    model: z
      .string()
      .min(1)
      .max(120)
      .optional()
  })
  .refine((value) => value.apiKey !== undefined || value.model !== undefined, {
    message: "At least one of apiKey or model must be provided."
  });

export type UpdateAISettingsInput = z.infer<typeof updateAISettingsSchema>;

export function parseUpdateAISettingsInput(payload: unknown): UpdateAISettingsInput {
  return updateAISettingsSchema.parse(payload);
}

export interface AISettingsResponse {
  hasApiKey: boolean;
  maskedKey: string | null;
  model: string;
  source: "user" | "system" | "none";
  systemKeyStatus: "active" | "pending-restart" | "missing";
  strategyMode: "ai-enabled" | "rule-based";
  workflowLabels: string[];
  statusNote: string;
  dailyUsage: AIDailyUsageSummary;
}

export interface AIConfig {
  apiKey: string | null;
  model: string;
}

export class AISettingsServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AISettingsServiceError";
  }
}

function normalizeModel(model: string | undefined | null): string {
  const normalized = model?.trim().toLowerCase();
  return normalized && normalized.length > 0 ? normalized : DEFAULT_MODEL;
}

async function resolveMember(actor?: ActorIdentity) {
  const prisma = getPrismaClient();
  if (!prisma) {
    throw new AISettingsServiceError("Database is not configured.");
  }

  const workspaceScope = await resolveWorkspaceScope(prisma, actor);
  if (!workspaceScope?.workspaceId) {
    throw new AISettingsServiceError("Workspace not found.");
  }

  const member = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_email: {
        workspaceId: workspaceScope.workspaceId,
        email: workspaceScope.actorEmail
      }
    }
  });

  if (!member) {
    throw new AISettingsServiceError("Workspace member not found.");
  }

  return { prisma, member };
}

export async function getUserAISettings(actor?: ActorIdentity): Promise<AISettingsResponse> {
  const systemKeyStatus = getRuntimeSecretStatus("OPENAI_API_KEY").state;
  const strategyMode: AISettingsResponse["strategyMode"] = STRATEGY_AI_ENABLED ? "ai-enabled" : "rule-based";

  try {
    const { prisma, member } = await resolveMember(actor);

    const preference = await prisma.userPreference.findUnique({
      where: { workspaceMemberId: member.id },
      select: { aiApiKey: true, aiModel: true }
    });
    const selectedModel = normalizeModel(preference?.aiModel);

    const hasUserKey = Boolean(preference?.aiApiKey);
    const hasSystemKey = systemKeyStatus === "active";
    const dailyUsage = await getDailyUsageSummaryForMember(prisma, member.id, selectedModel);

    let maskedKey: string | null = null;
    if (hasUserKey && preference?.aiApiKey) {
      try {
        const decrypted = decrypt(preference.aiApiKey);
        maskedKey = maskApiKey(decrypted);
      } catch {
        maskedKey = "••••••••";
      }
    }

    let source: AISettingsResponse["source"] = "none";
    if (hasUserKey) {
      source = "user";
    } else if (hasSystemKey) {
      source = "system";
    }

    return {
      hasApiKey: hasUserKey || hasSystemKey,
      maskedKey,
      model: selectedModel,
      source,
      systemKeyStatus,
      strategyMode,
      workflowLabels: getAIWorkflowLabels(strategyMode),
      statusNote: buildAIStatusNote({
        source,
        systemKeyStatus,
        strategyMode,
        model: selectedModel
      }),
      dailyUsage
    };
  } catch (error) {
    if (error instanceof AISettingsServiceError) throw error;

    // If the table doesn't exist yet, return a safe fallback
    return {
      hasApiKey: systemKeyStatus === "active",
      maskedKey: null,
      model: DEFAULT_MODEL,
      source: systemKeyStatus === "active" ? "system" : "none",
      systemKeyStatus,
      strategyMode,
      workflowLabels: getAIWorkflowLabels(strategyMode),
      statusNote: buildAIStatusNote({
        source: systemKeyStatus === "active" ? "system" : "none",
        systemKeyStatus,
        strategyMode,
        model: DEFAULT_MODEL
      }),
      dailyUsage: createDefaultDailyUsageSummary(DEFAULT_MODEL)
    };
  }
}

export async function updateUserAISettings(
  input: UpdateAISettingsInput,
  actor?: ActorIdentity
): Promise<AISettingsResponse> {
  const { prisma, member } = await resolveMember(actor);

  const updateData: Record<string, unknown> = {};

  if (input.apiKey !== undefined) {
    if (input.apiKey === null || input.apiKey === "") {
      updateData.aiApiKey = null;
    } else {
      updateData.aiApiKey = encrypt(input.apiKey);
    }
  }

  if (input.model !== undefined) {
    updateData.aiModel = normalizeModel(input.model);
  }

  await prisma.userPreference.upsert({
    where: { workspaceMemberId: member.id },
    create: {
      workspaceMemberId: member.id,
      ...(updateData as { aiApiKey?: string | null; aiModel?: string })
    },
    update: updateData
  });

  return getUserAISettings(actor);
}

/**
 * Internal helper for the AI provider layer.
 * Returns the decrypted API key and model for the given actor.
 * Falls back to the system-level env var if no user key is set.
 */
export async function getUserAIConfig(actor?: ActorIdentity): Promise<AIConfig> {
  try {
    const { prisma, member } = await resolveMember(actor);

    const preference = await prisma.userPreference.findUnique({
      where: { workspaceMemberId: member.id },
      select: { aiApiKey: true, aiModel: true }
    });

    let apiKey: string | null = null;
    if (preference?.aiApiKey) {
      try {
        apiKey = decrypt(preference.aiApiKey);
      } catch {
        // Decryption failed — fall through to system key
      }
    }

    if (!apiKey) {
      apiKey = process.env.OPENAI_API_KEY ?? null;
    }

    return {
      apiKey,
      model: normalizeModel(preference?.aiModel)
    };
  } catch {
    return {
      apiKey: process.env.OPENAI_API_KEY ?? null,
      model: DEFAULT_MODEL
    };
  }
}
