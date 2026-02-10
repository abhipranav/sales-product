import { getPrismaClient } from "@/lib/db/prisma";
import { logAuditEvent } from "@/lib/services/audit";
import { resolveWorkspaceScope } from "@/lib/services/workspace";
import type { ActorIdentity } from "@/lib/auth/actor";
import { z } from "zod";

// ── Schemas ──────────────────────────────────────────────────────────

const createActivitySchema = z.object({
  dealId: z.string().min(1),
  type: z.enum(["call", "email", "meeting", "note"]),
  summary: z.string().min(1),
  happenedAt: z.string().datetime().optional(),
});

const updateActivitySchema = z
  .object({
    type: z.enum(["call", "email", "meeting", "note"]).optional(),
    summary: z.string().min(1).optional(),
    happenedAt: z.string().datetime().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, {
    message: "At least one field must be provided.",
  });

const typeMap = {
  call: "CALL",
  email: "EMAIL",
  meeting: "MEETING",
  note: "NOTE",
} as const;

const dbToUiTypeMap = {
  CALL: "call",
  EMAIL: "email",
  MEETING: "meeting",
  NOTE: "note",
} as const;

// ── Errors ───────────────────────────────────────────────────────────

export class ActivityServiceUnavailableError extends Error {
  constructor() {
    super("Activity service unavailable because database is not configured.");
    this.name = "ActivityServiceUnavailableError";
  }
}

export class ActivityNotFoundError extends Error {
  constructor(id: string) {
    super(`Activity not found: ${id}`);
    this.name = "ActivityNotFoundError";
  }
}

export class ActivityDealNotFoundError extends Error {
  constructor(dealId: string) {
    super(`Deal not found for activity: ${dealId}`);
    this.name = "ActivityDealNotFoundError";
  }
}

// ── Helpers ──────────────────────────────────────────────────────────

export function parseCreateActivityInput(payload: unknown) {
  return createActivitySchema.parse(payload);
}

export function parseUpdateActivityInput(payload: unknown) {
  return updateActivitySchema.parse(payload);
}

function toUi(row: {
  id: string;
  externalId: string | null;
  dealId: string;
  type: keyof typeof dbToUiTypeMap;
  summary: string;
  happenedAt: Date;
}) {
  return {
    id: row.externalId ?? row.id,
    dealId: row.dealId,
    type: dbToUiTypeMap[row.type],
    summary: row.summary,
    happenedAt: row.happenedAt.toISOString(),
  };
}

// ── Queries ──────────────────────────────────────────────────────────

export async function listActivitiesByDeal(
  dealId: string,
  limit = 50,
  actor?: ActorIdentity
) {
  const prisma = getPrismaClient();
  if (!prisma) throw new ActivityServiceUnavailableError();

  const ws = await resolveWorkspaceScope(prisma, actor);

  const deal = await prisma.deal.findFirst({
    where: {
      OR: [{ id: dealId }, { externalId: dealId }],
      ...(ws?.workspaceId ? { account: { workspaceId: ws.workspaceId } } : {}),
    },
    select: { id: true },
  });

  if (!deal) throw new ActivityDealNotFoundError(dealId);

  const rows = await prisma.activity.findMany({
    where: { dealId: deal.id },
    orderBy: { happenedAt: "desc" },
    take: limit,
  });

  return rows.map(toUi);
}

export async function listRecentActivities(
  limit = 25,
  actor?: ActorIdentity
) {
  const prisma = getPrismaClient();
  if (!prisma) throw new ActivityServiceUnavailableError();

  const ws = await resolveWorkspaceScope(prisma, actor);

  const rows = await prisma.activity.findMany({
    where: ws?.workspaceId
      ? { deal: { account: { workspaceId: ws.workspaceId } } }
      : {},
    orderBy: { happenedAt: "desc" },
    take: limit,
    include: {
      deal: {
        select: {
          id: true,
          externalId: true,
          name: true,
          account: { select: { id: true, name: true } },
        },
      },
    },
  });

  return rows.map((r) => ({
    ...toUi(r),
    dealName: r.deal.name,
    dealDisplayId: r.deal.externalId ?? r.deal.id,
    accountId: r.deal.account.id,
    accountName: r.deal.account.name,
  }));
}

// ── Mutations ────────────────────────────────────────────────────────

export async function createActivity(
  payload: z.infer<typeof createActivitySchema>,
  actor?: ActorIdentity
) {
  const prisma = getPrismaClient();
  if (!prisma) throw new ActivityServiceUnavailableError();

  const ws = await resolveWorkspaceScope(prisma, actor);

  const deal = await prisma.deal.findFirst({
    where: {
      OR: [{ id: payload.dealId }, { externalId: payload.dealId }],
      ...(ws?.workspaceId ? { account: { workspaceId: ws.workspaceId } } : {}),
    },
    select: { id: true },
  });

  if (!deal) throw new ActivityDealNotFoundError(payload.dealId);

  const row = await prisma.activity.create({
    data: {
      dealId: deal.id,
      type: typeMap[payload.type],
      summary: payload.summary,
      happenedAt: payload.happenedAt ? new Date(payload.happenedAt) : new Date(),
    },
  });

  await logAuditEvent({
    dealId: deal.id,
    entityType: "activity",
    entityId: row.externalId ?? row.id,
    action: "activity.created",
    actor: ws?.actorEmail ?? "rep",
    details: `${payload.type}: ${payload.summary.slice(0, 80)}`,
  });

  return toUi(row);
}

export async function deleteActivity(activityId: string, actor?: ActorIdentity) {
  const prisma = getPrismaClient();
  if (!prisma) throw new ActivityServiceUnavailableError();

  const ws = await resolveWorkspaceScope(prisma, actor);

  const row = await prisma.activity.findFirst({
    where: {
      OR: [{ id: activityId }, { externalId: activityId }],
      ...(ws?.workspaceId
        ? { deal: { account: { workspaceId: ws.workspaceId } } }
        : {}),
    },
  });

  if (!row) throw new ActivityNotFoundError(activityId);

  await logAuditEvent({
    dealId: row.dealId,
    entityType: "activity",
    entityId: row.externalId ?? row.id,
    action: "activity.deleted",
    actor: ws?.actorEmail ?? "rep",
    details: `Deleted activity: ${row.summary.slice(0, 80)}`,
  });

  await prisma.activity.delete({ where: { id: row.id } });

  return { id: row.externalId ?? row.id, deleted: true as const };
}
