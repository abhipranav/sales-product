import { Prisma, type PrismaClient } from "@prisma/client";

const roleMap = {
  OWNER: "owner",
  MANAGER: "manager",
  REP: "rep"
} as const;

let warnedMissingWorkspaceSchema = false;
const WORKSPACE_SCOPE_CACHE_TTL_MS = 30_000;
const workspaceScopeCache = new Map<string, { value: WorkspaceScope; expiresAt: number }>();
const workspaceScopeInFlight = new Map<string, Promise<WorkspaceScope | null>>();

export interface WorkspaceScope {
  workspaceId: string;
  workspaceSlug: string;
  workspaceName: string;
  actorEmail: string;
  actorName: string;
  actorRole: "owner" | "manager" | "rep";
}

interface WorkspaceActorInput {
  email?: string;
  name?: string;
}

export class WorkspaceAccessDeniedError extends Error {
  constructor(actorEmail: string, workspaceSlug: string) {
    super(`Actor ${actorEmail} is not a member of workspace ${workspaceSlug}.`);
    this.name = "WorkspaceAccessDeniedError";
  }
}

function getWorkspaceDefaults() {
  return {
    workspaceSlug: process.env.APP_WORKSPACE_SLUG?.trim() || "aurora-main",
    workspaceName: process.env.APP_WORKSPACE_NAME?.trim() || "Aurora Main Workspace",
    actorEmail: process.env.APP_ACTOR_EMAIL?.trim() || "rep@aurora.local",
    actorName: process.env.APP_ACTOR_NAME?.trim() || "Default Rep",
    autoProvisionMembers: process.env.APP_AUTO_PROVISION_MEMBERS !== "0"
  };
}

function getWorkspaceScopeCacheKey(actorEmail: string, workspaceSlug: string) {
  return `${workspaceSlug}:${actorEmail}`;
}

function normalizeEmail(value: string | undefined): string | null {
  if (!value) {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  if (!normalized || !normalized.includes("@")) {
    return null;
  }

  return normalized;
}

function normalizeName(value: string | undefined): string | null {
  if (!value) {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function isMissingWorkspaceSchemaError(error: unknown): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
    return false;
  }

  return error.code === "P2021" || error.code === "P2022";
}

export async function resolveWorkspaceScope(
  prisma: PrismaClient,
  actor?: WorkspaceActorInput
): Promise<WorkspaceScope | null> {
  const defaults = getWorkspaceDefaults();
  const defaultActorEmail = normalizeEmail(defaults.actorEmail) ?? "rep@aurora.local";
  const actorEmail = normalizeEmail(actor?.email) ?? defaultActorEmail;
  const actorName = normalizeName(actor?.name) ?? defaults.actorName;
  const cacheKey = getWorkspaceScopeCacheKey(actorEmail, defaults.workspaceSlug);
  const now = Date.now();
  const cached = workspaceScopeCache.get(cacheKey);

  if (cached && cached.expiresAt > now) {
    return cached.value;
  }

  const inFlight = workspaceScopeInFlight.get(cacheKey);
  if (inFlight) {
    return inFlight;
  }

  const promise = (async () => {
    try {
    let workspaceCreated = false;
    let workspace = await prisma.workspace.findUnique({
      where: {
        slug: defaults.workspaceSlug
      }
    });

    if (!workspace) {
      workspace = await prisma.workspace.create({
        data: {
          slug: defaults.workspaceSlug,
          name: defaults.workspaceName
        }
      });
      workspaceCreated = true;
    }

    let member = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_email: {
          workspaceId: workspace.id,
          email: actorEmail
        }
      }
    });

    if (!member) {
      const shouldAutoProvision = workspaceCreated || actorEmail === defaultActorEmail || defaults.autoProvisionMembers;
      if (shouldAutoProvision) {
        member = await prisma.workspaceMember.create({
          data: {
            workspaceId: workspace.id,
            email: actorEmail,
            fullName: actorName,
            role: workspaceCreated || actorEmail === defaultActorEmail ? "OWNER" : "REP"
          }
        });
      } else {
        throw new WorkspaceAccessDeniedError(actorEmail, workspace.slug);
      }
    }

    return {
      workspaceId: workspace.id,
      workspaceSlug: workspace.slug,
      workspaceName: workspace.name,
      actorEmail: member.email,
      actorName: member.fullName,
      actorRole: roleMap[member.role]
    };
    } catch (error) {
      if (isMissingWorkspaceSchemaError(error)) {
        if (!warnedMissingWorkspaceSchema) {
          console.warn("Workspace schema not available yet. Run `npm run db:push` before enabling tenancy features.");
          warnedMissingWorkspaceSchema = true;
        }

        return null;
      }

      throw error;
    }
  })()
    .then((scope) => {
      if (scope) {
        workspaceScopeCache.set(cacheKey, {
          value: scope,
          expiresAt: Date.now() + WORKSPACE_SCOPE_CACHE_TTL_MS
        });
      }

      return scope;
    })
    .finally(() => {
      workspaceScopeInFlight.delete(cacheKey);
    });

  workspaceScopeInFlight.set(cacheKey, promise);
  return promise;
}
