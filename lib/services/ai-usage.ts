import { Prisma, type PrismaClient } from "@prisma/client";
import type { ActorIdentity } from "@/lib/auth/actor";
import { getPrismaClient } from "@/lib/db/prisma";
import { resolveWorkspaceScope } from "@/lib/services/workspace";

const DEFAULT_MODEL = "gpt-5-mini";
const MODEL_CAPS = {
  "gpt-5-mini": 2_500_000,
  "gpt-5": 250_000
} as const;

let usageSchemaUnavailable = false;

export interface AITokenUsage {
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
}

export interface AIModelUsageSummary {
  model: string;
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
  requestCount: number;
  dailyLimit: number | null;
  remaining: number | null;
  percentUsed: number | null;
}

export interface AIDailyUsageSummary {
  date: string;
  timezone: "UTC";
  resetAt: string;
  selectedModel: string;
  selectedModelTokens: number;
  selectedModelDailyLimit: number | null;
  selectedModelRemaining: number | null;
  selectedModelPercentUsed: number | null;
  models: AIModelUsageSummary[];
}

export class AITokenLimitExceededError extends Error {
  constructor(
    public readonly model: string,
    public readonly used: number,
    public readonly limit: number
  ) {
    super(`Daily token limit reached for ${model} (${used.toLocaleString()}/${limit.toLocaleString()}).`);
    this.name = "AITokenLimitExceededError";
  }
}

function isMissingUsageSchemaError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && (error.code === "P2021" || error.code === "P2022");
}

function getUtcDayStart(date = new Date()): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function getUtcDayLabel(dayStart: Date): string {
  return dayStart.toISOString().slice(0, 10);
}

function normalizeModel(model: string | undefined): string {
  const normalized = model?.trim().toLowerCase();
  return normalized && normalized.length > 0 ? normalized : DEFAULT_MODEL;
}

export function getDailyTokenLimitForModel(model: string): number | null {
  const normalized = normalizeModel(model);

  if (normalized.startsWith("gpt-5-mini")) {
    return MODEL_CAPS["gpt-5-mini"];
  }

  if (
    normalized === "gpt-5" ||
    (normalized.startsWith("gpt-5-") &&
      !normalized.startsWith("gpt-5-mini") &&
      !normalized.startsWith("gpt-5-nano") &&
      !normalized.startsWith("gpt-5-codex"))
  ) {
    return MODEL_CAPS["gpt-5"];
  }

  return null;
}

function buildModelSummary(row: {
  model: string;
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
  requestCount: number;
}): AIModelUsageSummary {
  const dailyLimit = getDailyTokenLimitForModel(row.model);
  const remaining = dailyLimit === null ? null : Math.max(0, dailyLimit - row.totalTokens);
  const percentUsed = dailyLimit === null ? null : Math.min(100, Math.round((row.totalTokens / dailyLimit) * 100));

  return {
    model: row.model,
    totalTokens: row.totalTokens,
    promptTokens: row.promptTokens,
    completionTokens: row.completionTokens,
    requestCount: row.requestCount,
    dailyLimit,
    remaining,
    percentUsed
  };
}

function createEmptySummary(selectedModel: string, dayStart: Date): AIDailyUsageSummary {
  const normalizedSelectedModel = normalizeModel(selectedModel);
  const baselineModels = Array.from(new Set([normalizedSelectedModel, "gpt-5-mini", "gpt-5"]));
  const modelSummaries = baselineModels.map((model) =>
    buildModelSummary({
      model,
      totalTokens: 0,
      promptTokens: 0,
      completionTokens: 0,
      requestCount: 0
    })
  );

  const selectedModelSummary =
    modelSummaries.find((model) => model.model === normalizedSelectedModel) ?? modelSummaries[0];
  const resetAt = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

  return {
    date: getUtcDayLabel(dayStart),
    timezone: "UTC",
    resetAt: resetAt.toISOString(),
    selectedModel: normalizedSelectedModel,
    selectedModelTokens: selectedModelSummary?.totalTokens ?? 0,
    selectedModelDailyLimit: selectedModelSummary?.dailyLimit ?? null,
    selectedModelRemaining: selectedModelSummary?.remaining ?? null,
    selectedModelPercentUsed: selectedModelSummary?.percentUsed ?? null,
    models: modelSummaries
  };
}

async function resolveUsageMemberContext(actor?: ActorIdentity): Promise<{
  prisma: PrismaClient;
  workspaceMemberId: string;
} | null> {
  if (!actor?.email || usageSchemaUnavailable) {
    return null;
  }

  const prisma = getPrismaClient();
  if (!prisma) {
    return null;
  }

  try {
    const workspaceScope = await resolveWorkspaceScope(prisma, actor);
    if (!workspaceScope?.workspaceId) {
      return null;
    }

    const member = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_email: {
          workspaceId: workspaceScope.workspaceId,
          email: workspaceScope.actorEmail
        }
      },
      select: { id: true }
    });

    if (!member) {
      return null;
    }

    return {
      prisma,
      workspaceMemberId: member.id
    };
  } catch (error) {
    if (isMissingUsageSchemaError(error)) {
      usageSchemaUnavailable = true;
      return null;
    }

    return null;
  }
}

export async function enforceDailyTokenCap(
  actor: ActorIdentity | undefined,
  model: string,
  expectedRequestTokens?: number
): Promise<void> {
  const normalizedModel = normalizeModel(model);
  const cap = getDailyTokenLimitForModel(normalizedModel);
  if (cap === null) {
    return;
  }

  const context = await resolveUsageMemberContext(actor);
  if (!context) {
    return;
  }

  const dayStart = getUtcDayStart();

  try {
    const existing = await context.prisma.aiUsageDaily.findUnique({
      where: {
        workspaceMemberId_date_model: {
          workspaceMemberId: context.workspaceMemberId,
          date: dayStart,
          model: normalizedModel
        }
      },
      select: { totalTokens: true }
    });

    const used = existing?.totalTokens ?? 0;
    if (used >= cap) {
      throw new AITokenLimitExceededError(normalizedModel, used, cap);
    }

    if (expectedRequestTokens !== undefined && expectedRequestTokens > 0 && used + expectedRequestTokens > cap) {
      throw new AITokenLimitExceededError(normalizedModel, used, cap);
    }
  } catch (error) {
    if (error instanceof AITokenLimitExceededError) {
      throw error;
    }

    if (isMissingUsageSchemaError(error)) {
      usageSchemaUnavailable = true;
      return;
    }

    return;
  }
}

export async function recordDailyTokenUsage(
  actor: ActorIdentity | undefined,
  model: string,
  usage: Partial<AITokenUsage> | null | undefined
): Promise<void> {
  const totalTokens = Math.max(0, Math.floor(usage?.totalTokens ?? 0));
  const promptTokens = Math.max(0, Math.floor(usage?.promptTokens ?? 0));
  const completionTokens = Math.max(0, Math.floor(usage?.completionTokens ?? 0));
  if (totalTokens <= 0) {
    return;
  }

  const context = await resolveUsageMemberContext(actor);
  if (!context) {
    return;
  }

  const normalizedModel = normalizeModel(model);
  const dayStart = getUtcDayStart();

  try {
    await context.prisma.aiUsageDaily.upsert({
      where: {
        workspaceMemberId_date_model: {
          workspaceMemberId: context.workspaceMemberId,
          date: dayStart,
          model: normalizedModel
        }
      },
      create: {
        workspaceMemberId: context.workspaceMemberId,
        date: dayStart,
        model: normalizedModel,
        totalTokens,
        promptTokens,
        completionTokens,
        requestCount: 1
      },
      update: {
        totalTokens: { increment: totalTokens },
        promptTokens: { increment: promptTokens },
        completionTokens: { increment: completionTokens },
        requestCount: { increment: 1 }
      }
    });
  } catch (error) {
    if (isMissingUsageSchemaError(error)) {
      usageSchemaUnavailable = true;
    }
  }
}

export async function getDailyUsageSummaryForMember(
  prisma: PrismaClient,
  workspaceMemberId: string,
  selectedModel: string
): Promise<AIDailyUsageSummary> {
  const normalizedSelectedModel = normalizeModel(selectedModel);
  const dayStart = getUtcDayStart();
  const emptySummary = createEmptySummary(normalizedSelectedModel, dayStart);

  if (usageSchemaUnavailable) {
    return emptySummary;
  }

  try {
    const rows = await prisma.aiUsageDaily.findMany({
      where: {
        workspaceMemberId,
        date: dayStart
      },
      select: {
        model: true,
        totalTokens: true,
        promptTokens: true,
        completionTokens: true,
        requestCount: true
      },
      orderBy: {
        totalTokens: "desc"
      }
    });

    if (rows.length === 0) {
      return emptySummary;
    }

    const merged = new Map<string, AIModelUsageSummary>();
    for (const base of emptySummary.models) {
      merged.set(base.model, base);
    }

    for (const row of rows) {
      merged.set(row.model, buildModelSummary(row));
    }

    const models = Array.from(merged.values()).sort((left, right) => {
      if (right.totalTokens !== left.totalTokens) {
        return right.totalTokens - left.totalTokens;
      }

      return left.model.localeCompare(right.model);
    });
    const selected = models.find((model) => model.model === normalizedSelectedModel) ?? models[0];

    return {
      date: emptySummary.date,
      timezone: "UTC",
      resetAt: emptySummary.resetAt,
      selectedModel: normalizedSelectedModel,
      selectedModelTokens: selected?.totalTokens ?? 0,
      selectedModelDailyLimit: selected?.dailyLimit ?? null,
      selectedModelRemaining: selected?.remaining ?? null,
      selectedModelPercentUsed: selected?.percentUsed ?? null,
      models
    };
  } catch (error) {
    if (isMissingUsageSchemaError(error)) {
      usageSchemaUnavailable = true;
      return emptySummary;
    }

    return emptySummary;
  }
}

export function createDefaultDailyUsageSummary(selectedModel: string): AIDailyUsageSummary {
  return createEmptySummary(selectedModel, getUtcDayStart());
}
