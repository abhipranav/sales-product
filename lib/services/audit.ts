import type { AuditEvent } from "@/lib/domain/types";
import { getPrismaClient } from "@/lib/db/prisma";

interface LogAuditEventInput {
  dealId: string;
  entityType: "task" | "calendar-event" | "activity";
  entityId: string;
  action: string;
  actor: string;
  details: string;
  taskId?: string;
}

export async function logAuditEvent(input: LogAuditEventInput): Promise<void> {
  const prisma = getPrismaClient();

  if (!prisma) {
    return;
  }

  await prisma.auditLog.create({
    data: {
      dealId: input.dealId,
      taskId: input.taskId,
      entityType: input.entityType,
      entityId: input.entityId,
      action: input.action,
      actor: input.actor,
      details: input.details
    }
  });
}

export async function getRecentAuditEvents(dealId: string, limit = 12, workspaceId?: string): Promise<AuditEvent[]> {
  const prisma = getPrismaClient();

  if (!prisma) {
    return [];
  }

  const deal = await prisma.deal.findFirst({
    where: {
      OR: [{ id: dealId }, { externalId: dealId }],
      ...(workspaceId
        ? {
            account: {
              workspaceId
            }
          }
        : {})
    },
    select: {
      id: true
    }
  });

  if (!deal) {
    return [];
  }

  const rows = await prisma.auditLog.findMany({
    where: {
      dealId: deal.id
    },
    orderBy: {
      createdAt: "desc"
    },
    take: limit
  });

  return rows.map((row) => ({
    id: row.id,
    entityType: row.entityType as AuditEvent["entityType"],
    entityId: row.entityId,
    action: row.action,
    actor: row.actor,
    details: row.details,
    happenedAt: row.createdAt.toISOString()
  }));
}
