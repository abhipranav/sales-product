import { Prisma, type PrismaClient } from "@prisma/client";
import type { ActorIdentity } from "@/lib/auth/actor";
import { getPrismaClient } from "@/lib/db/prisma";
import { getUserAISettings, type AISettingsResponse } from "@/lib/services/ai-settings";
import {
  getHubspotSyncStateSnapshot,
  HubspotSyncServiceUnavailableError,
  HubspotSyncWorkspaceError
} from "@/lib/services/integrations/hubspot-sync";
import { getRuntimeSecretStatus } from "@/lib/services/runtime-config";
import { resolveWorkspaceScope, WorkspaceAccessDeniedError } from "@/lib/services/workspace";

export type ReadinessLevel = "ready" | "needs-action" | "warning";

export interface ReadinessAction {
  label: string;
  command?: string;
  href?: string;
}

export interface ReadinessCheck {
  id: string;
  label: string;
  level: ReadinessLevel;
  detail: string;
  action?: ReadinessAction;
}

export interface SystemReadiness {
  mode: "live" | "demo";
  summary: string;
  checks: ReadinessCheck[];
  stats: {
    accounts: number;
    contacts: number;
    deals: number;
  };
  hubspot: {
    status: string | null;
    lastRunAt: string | null;
    cursor: string | null;
  };
  publicUrl: string | null;
  ai: {
    hasApiKey: boolean;
    source: AISettingsResponse["source"];
    systemKeyStatus: AISettingsResponse["systemKeyStatus"];
    strategyMode: AISettingsResponse["strategyMode"];
    model: string;
    workflowLabels: string[];
    statusNote: string;
  };
}

const READINESS_CACHE_TTL_MS = 5_000;
const DB_REACHABILITY_TIMEOUT_MS = 450;

type ReadinessCacheEntry = {
  value: SystemReadiness;
  expiresAt: number;
};

const readinessCache = new Map<string, ReadinessCacheEntry>();
const readinessInFlight = new Map<string, Promise<SystemReadiness>>();

function resolvePublicUrl(): string | null {
  const raw = process.env.APP_BASE_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? null;
  if (!raw) {
    return null;
  }

  const normalized = raw.trim();
  return normalized.length > 0 ? normalized : null;
}

function isPublicShareUrl(url: string | null): boolean {
  if (!url) {
    return false;
  }

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") {
      return false;
    }

    const host = parsed.hostname.toLowerCase();
    if (host === "localhost" || host.startsWith("127.") || host.endsWith(".local")) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

function isMissingSchemaError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && (error.code === "P2021" || error.code === "P2022");
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, fallback: T): Promise<T> {
  let timeoutHandle: ReturnType<typeof setTimeout> | null = null;

  try {
    return await Promise.race([
      promise,
      new Promise<T>((resolve) => {
        timeoutHandle = setTimeout(() => resolve(fallback), timeoutMs);
      })
    ]);
  } finally {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
    }
  }
}

async function isDatabaseReachable(prisma: PrismaClient): Promise<boolean> {
  return withTimeout(
    prisma
      .$queryRaw`SELECT 1`
      .then(() => true)
      .catch(() => false),
    DB_REACHABILITY_TIMEOUT_MS,
    false
  );
}

function pushShareCheck(checks: ReadinessCheck[], publicUrl: string | null) {
  checks.push({
    id: "public-url",
    label: "Public URL for sharing",
    level: isPublicShareUrl(publicUrl) ? "ready" : "needs-action",
    detail: isPublicShareUrl(publicUrl)
      ? `Share previews should work from ${publicUrl}.`
      : "Set APP_BASE_URL to a public https URL. LinkedIn cannot crawl localhost URLs.",
    action: {
      label: "Set base URL",
      command: 'APP_BASE_URL="https://your-domain.com"'
    }
  });
}

function buildReadinessResult(input: {
  mode: "live" | "demo";
  summary: string;
  checks: ReadinessCheck[];
  stats: { accounts: number; contacts: number; deals: number };
  hubspot: { status: string | null; lastRunAt: string | null; cursor: string | null };
  publicUrl: string | null;
  ai: SystemReadiness["ai"];
}): SystemReadiness {
  return {
    mode: input.mode,
    summary: input.summary,
    checks: input.checks,
    stats: input.stats,
    hubspot: input.hubspot,
    publicUrl: input.publicUrl,
    ai: input.ai
  };
}

async function buildAIReadiness(actor?: ActorIdentity) {
  let ai: AISettingsResponse;

  try {
    ai = await getUserAISettings(actor);
  } catch {
    const systemKeyStatus = getRuntimeSecretStatus("OPENAI_API_KEY").state;
    const strategyMode: AISettingsResponse["strategyMode"] =
      process.env.APP_ENABLE_AI_STRATEGY_PLAYS === "1" ? "ai-enabled" : "rule-based";

    ai = {
      hasApiKey: systemKeyStatus === "active",
      maskedKey: null,
      model: "gpt-5-mini",
      source: systemKeyStatus === "active" ? "system" : "none",
      systemKeyStatus,
      strategyMode,
      workflowLabels:
        strategyMode === "ai-enabled"
          ? ["Follow-up Draft regeneration", "Meeting Prep Brief regeneration", "Strategy Lab AI generation"]
          : ["Follow-up Draft regeneration", "Meeting Prep Brief regeneration"],
      statusNote:
        systemKeyStatus === "pending-restart"
          ? "OPENAI_API_KEY is present in your env file, but the running server has not loaded it yet. Restart the app process to activate AI workflows."
          : systemKeyStatus === "active"
            ? strategyMode === "ai-enabled"
              ? "Workspace/system OpenAI key is active on gpt-5-mini. It powers follow-ups, meeting briefs, and Strategy Lab generation."
              : "Workspace/system OpenAI key is active on gpt-5-mini. It powers follow-ups and meeting briefs. Strategy Lab remains rule-based until APP_ENABLE_AI_STRATEGY_PLAYS=1."
            : "No active OpenAI key is loaded. Follow-ups and meeting briefs will fall back to rule-based generation.",
      dailyUsage: {
        date: new Date().toISOString().slice(0, 10),
        timezone: "UTC",
        resetAt: new Date(new Date().setUTCHours(24, 0, 0, 0)).toISOString(),
        selectedModel: "gpt-5-mini",
        selectedModelTokens: 0,
        selectedModelDailyLimit: 2_500_000,
        selectedModelRemaining: 2_500_000,
        selectedModelPercentUsed: 0,
        models: []
      }
    };
  }

  const level: ReadinessLevel = ai.hasApiKey ? "ready" : ai.systemKeyStatus === "pending-restart" ? "warning" : "warning";

  const action =
    ai.systemKeyStatus === "pending-restart"
      ? {
          label: "Restart app",
          command: "Restart the running Next.js server after editing .env"
        }
      : !ai.hasApiKey
        ? {
            label: "Open AI settings",
            href: "/settings"
          }
        : undefined;

  return {
    ai: {
      hasApiKey: ai.hasApiKey,
      source: ai.source,
      systemKeyStatus: ai.systemKeyStatus,
      strategyMode: ai.strategyMode,
      model: ai.model,
      workflowLabels: ai.workflowLabels,
      statusNote: ai.statusNote
    },
    check: {
      id: "ai-provider",
      label: "AI Workflows",
      level,
      detail: ai.statusNote,
      action
    } satisfies ReadinessCheck
  };
}

function getCacheKey(actor?: ActorIdentity): string {
  const actorEmail = actor?.email?.toLowerCase() ?? process.env.APP_ACTOR_EMAIL?.toLowerCase() ?? "default";
  const workspaceSlug = process.env.APP_WORKSPACE_SLUG ?? "default";
  const shareUrl = process.env.APP_BASE_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "none";
  const dbConfigured = process.env.DATABASE_URL ? "db" : "no-db";
  const aiConfigured = process.env.OPENAI_API_KEY ? "ai" : "no-ai";

  return `${actorEmail}|${workspaceSlug}|${shareUrl}|${dbConfigured}|${aiConfigured}`;
}

export function invalidateSystemReadiness(actor?: ActorIdentity) {
  if (!actor?.email) {
    readinessCache.clear();
    readinessInFlight.clear();
    return;
  }

  const actorPrefix = `${actor.email.toLowerCase()}|`;
  for (const key of readinessCache.keys()) {
    if (key.startsWith(actorPrefix)) {
      readinessCache.delete(key);
    }
  }

  for (const key of readinessInFlight.keys()) {
    if (key.startsWith(actorPrefix)) {
      readinessInFlight.delete(key);
    }
  }
}

async function computeSystemReadiness(actor?: ActorIdentity): Promise<SystemReadiness> {
  const checks: ReadinessCheck[] = [];
  const aiReadiness = await buildAIReadiness(actor);
  const publicUrl = resolvePublicUrl();
  let accounts = 0;
  let contacts = 0;
  let deals = 0;
  let mode: "live" | "demo" = "demo";
  let summary = "Demo mode: data reads can fall back to snapshots, but write workflows require live DB setup.";
  let hubspot: SystemReadiness["hubspot"] = {
    status: null,
    lastRunAt: null,
    cursor: null
  };

  checks.push(aiReadiness.check);

  const hasDatabaseUrl = Boolean(process.env.DATABASE_URL?.trim());
  checks.push({
    id: "database-url",
    label: "Database URL",
    level: hasDatabaseUrl ? "ready" : "needs-action",
    detail: hasDatabaseUrl
      ? "DATABASE_URL is configured."
      : "Set DATABASE_URL (and DIRECT_URL) so route handlers can persist data.",
    action: hasDatabaseUrl
      ? undefined
      : {
          label: "Add DB env vars",
          command: "cp .env.example .env"
        }
  });

  const prisma = getPrismaClient();
  if (!prisma || !hasDatabaseUrl) {
    checks.push({
      id: "database-connection",
      label: "Database Connection",
      level: "needs-action",
      detail: "Prisma client is unavailable. App is running in read-only demo fallback mode.",
      action: {
        label: "Initialize schema",
        command: "npm run db:push && npm run db:seed"
      }
    });

    pushShareCheck(checks, publicUrl);

    return buildReadinessResult({
      mode,
      summary,
      checks,
      stats: { accounts, contacts, deals },
      hubspot,
      publicUrl,
      ai: aiReadiness.ai
    });
  }

  if (await isDatabaseReachable(prisma)) {
    checks.push({
      id: "database-connection",
      label: "Database Connection",
      level: "ready",
      detail: "Database is reachable from the app runtime."
    });
  } else {
    checks.push({
      id: "database-connection",
      label: "Database Connection",
      level: "needs-action",
      detail: "Could not reach database quickly. App remains in demo fallback mode.",
      action: {
        label: "Check DB access",
        command: "npm run db:push && npm run db:seed"
      }
    });

    pushShareCheck(checks, publicUrl);

    return buildReadinessResult({
      mode,
      summary,
      checks,
      stats: { accounts, contacts, deals },
      hubspot,
      publicUrl,
      ai: aiReadiness.ai
    });
  }

  try {
    const workspaceScope = await resolveWorkspaceScope(prisma, actor);
    if (!workspaceScope) {
      checks.push({
        id: "workspace-scope",
        label: "Workspace Scope",
        level: "needs-action",
        detail: "Workspace tables are not available yet.",
        action: {
          label: "Apply schema",
          command: "npm run db:push"
        }
      });
    } else {
      checks.push({
        id: "workspace-scope",
        label: "Workspace Scope",
        level: "ready",
        detail: `${workspaceScope.workspaceName} loaded for ${workspaceScope.actorEmail}.`
      });

      try {
        [accounts, contacts, deals] = await Promise.all([
          prisma.account.count({ where: { workspaceId: workspaceScope.workspaceId } }),
          prisma.contact.count({ where: { account: { workspaceId: workspaceScope.workspaceId } } }),
          prisma.deal.count({ where: { account: { workspaceId: workspaceScope.workspaceId } } })
        ]);
      } catch (error) {
        if (isMissingSchemaError(error)) {
          checks.push({
            id: "schema-version",
            label: "Schema Version",
            level: "needs-action",
            detail: "Database schema is outdated for current app version.",
            action: {
              label: "Apply latest schema",
              command: "npm run db:push"
            }
          });
          pushShareCheck(checks, publicUrl);

          return buildReadinessResult({
            mode,
            summary,
            checks,
            stats: { accounts, contacts, deals },
            hubspot,
            publicUrl,
            ai: aiReadiness.ai
          });
        }

        throw error;
      }

      checks.push({
        id: "seed-data",
        label: "Seed / Live Data",
        level: deals > 0 ? "ready" : "needs-action",
        detail:
          deals > 0
            ? `Loaded ${deals} deals across ${accounts} accounts.`
            : "No deals found. Add CRM records or run seed for an immediate working dataset.",
        action:
          deals > 0
            ? undefined
            : {
                label: "Seed workspace",
                command: "npm run db:seed"
              }
      });

      try {
        const syncState = await getHubspotSyncStateSnapshot(actor);
        hubspot = {
          status: syncState.status,
          lastRunAt: syncState.lastRunAt ?? null,
          cursor: syncState.cursor
        };

        checks.push({
          id: "hubspot-sync",
          label: "HubSpot Sync State",
          level: syncState.status === "ok" ? "ready" : "warning",
          detail:
            syncState.status === "ok"
              ? `HubSpot sync healthy${syncState.lastRunAt ? ` (last run ${new Date(syncState.lastRunAt).toLocaleString()})` : ""}.`
              : "HubSpot sync exists but is not healthy yet.",
          action:
            syncState.status === "ok"
              ? undefined
              : {
                  label: "Open integrations",
                  href: "/integrations"
                }
        });
      } catch (error) {
        if (error instanceof HubspotSyncServiceUnavailableError || error instanceof HubspotSyncWorkspaceError) {
          checks.push({
            id: "hubspot-sync",
            label: "HubSpot Sync State",
            level: "warning",
            detail: "HubSpot sync state is unavailable in current mode."
          });
        } else {
          checks.push({
            id: "hubspot-sync",
            label: "HubSpot Sync State",
            level: "warning",
            detail: "Could not load HubSpot sync state."
          });
        }
      }

      mode = "live";
      summary = "Live mode: reads and writes are connected to workspace-scoped database records.";
    }
  } catch (error) {
    if (error instanceof WorkspaceAccessDeniedError) {
      checks.push({
        id: "workspace-scope",
        label: "Workspace Scope",
        level: "needs-action",
        detail: error.message
      });
    } else {
      checks.push({
        id: "workspace-scope",
        label: "Workspace Scope",
        level: "warning",
        detail: "Workspace status could not be resolved."
      });
    }
  }

  pushShareCheck(checks, publicUrl);

  return buildReadinessResult({
    mode,
    summary,
    checks,
    stats: { accounts, contacts, deals },
    hubspot,
    publicUrl,
    ai: aiReadiness.ai
  });
}

export async function getSystemReadiness(actor?: ActorIdentity): Promise<SystemReadiness> {
  const cacheKey = getCacheKey(actor);
  const now = Date.now();
  const cached = readinessCache.get(cacheKey);

  if (cached && cached.expiresAt > now) {
    return cached.value;
  }

  const inFlight = readinessInFlight.get(cacheKey);
  if (inFlight) {
    return inFlight;
  }

  const promise = computeSystemReadiness(actor)
    .then((value) => {
      readinessCache.set(cacheKey, { value, expiresAt: Date.now() + READINESS_CACHE_TTL_MS });
      return value;
    })
    .finally(() => {
      readinessInFlight.delete(cacheKey);
    });

  readinessInFlight.set(cacheKey, promise);
  return promise;
}
