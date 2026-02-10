import { z } from "zod";
import { getPrismaClient } from "@/lib/db/prisma";
import type { ActorIdentity } from "@/lib/auth/actor";
import { resolveWorkspaceScope } from "@/lib/services/workspace";

const notificationStatusMap = {
  UNREAD: "unread",
  ACKNOWLEDGED: "acknowledged"
} as const;

const priorityMap = {
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "low"
} as const;

const acknowledgeSchema = z.object({
  notificationId: z.string().min(1)
});

export class NotificationServiceUnavailableError extends Error {
  constructor() {
    super("Notification service unavailable because database is not configured.");
    this.name = "NotificationServiceUnavailableError";
  }
}

export class NotificationNotFoundError extends Error {
  constructor(notificationId: string) {
    super(`Notification not found: ${notificationId}`);
    this.name = "NotificationNotFoundError";
  }
}

export function parseAcknowledgeInput(payload: unknown) {
  return acknowledgeSchema.parse(payload);
}

function recommendedActionForType(type: "HIRING" | "FUNDING" | "TOOLING" | "ENGAGEMENT") {
  if (type === "HIRING") {
    return "Trigger a champion check-in focused on hiring urgency and onboarding speed.";
  }
  if (type === "FUNDING") {
    return "Escalate commercial proposal while budget momentum is active.";
  }
  if (type === "TOOLING") {
    return "Send migration and deployment proof points within 24 hours.";
  }
  return "Run a high-touch sequence to convert engagement into next-step commitment.";
}

function priorityFromScore(score: number): "HIGH" | "MEDIUM" | "LOW" {
  if (score >= 78) {
    return "HIGH";
  }
  if (score >= 60) {
    return "MEDIUM";
  }
  return "LOW";
}

export async function listSignalNotifications(limit = 30, actor?: ActorIdentity) {
  const prisma = getPrismaClient();
  if (!prisma) {
    throw new NotificationServiceUnavailableError();
  }

  const workspaceScope = await resolveWorkspaceScope(prisma, actor);
  if (!workspaceScope?.workspaceId) {
    throw new NotificationServiceUnavailableError();
  }

  const boundedLimit = Math.max(1, Math.min(limit, 100));

  const signals = await prisma.signal.findMany({
    where: {
      account: {
        workspaceId: workspaceScope.workspaceId
      }
    },
    orderBy: {
      happenedAt: "desc"
    },
    take: 50
  });

  const accountIds = [...new Set(signals.map((signal) => signal.accountId))];
  const openDeals = await prisma.deal.findMany({
    where: {
      accountId: {
        in: accountIds
      },
      stage: {
        notIn: ["CLOSED_WON", "CLOSED_LOST"]
      }
    },
    orderBy: {
      updatedAt: "desc"
    },
    select: {
      id: true,
      accountId: true
    }
  });

  const dealByAccount = new Map<string, string>();
  for (const deal of openDeals) {
    if (!dealByAccount.has(deal.accountId)) {
      dealByAccount.set(deal.accountId, deal.id);
    }
  }

  await Promise.all(
    signals.map((signal) =>
      prisma.signalNotification.upsert({
        where: {
          workspaceId_signalId: {
            workspaceId: workspaceScope.workspaceId,
            signalId: signal.id
          }
        },
        create: {
          workspaceId: workspaceScope.workspaceId,
          signalId: signal.id,
          dealId: dealByAccount.get(signal.accountId),
          priority: priorityFromScore(signal.score),
          summary: signal.summary,
          recommendedAction: recommendedActionForType(signal.type)
        },
        update: {
          dealId: dealByAccount.get(signal.accountId),
          priority: priorityFromScore(signal.score),
          summary: signal.summary,
          recommendedAction: recommendedActionForType(signal.type)
        }
      })
    )
  );

  const rows = await prisma.signalNotification.findMany({
    where: {
      workspaceId: workspaceScope.workspaceId
    },
    orderBy: {
      createdAt: "desc"
    },
    include: {
      signal: true,
      deal: {
        select: {
          id: true,
          externalId: true,
          name: true
        }
      }
    },
    take: boundedLimit
  });

  return rows.map((row) => ({
    id: row.id,
    signalId: row.signalId,
    dealId: row.deal?.externalId ?? row.deal?.id ?? null,
    dealName: row.deal?.name ?? null,
    summary: row.summary,
    recommendedAction: row.recommendedAction,
    priority: priorityMap[row.priority],
    status: notificationStatusMap[row.status],
    score: row.signal.score,
    signalType: row.signal.type.toLowerCase(),
    happenedAt: row.signal.happenedAt.toISOString(),
    acknowledgedAt: row.acknowledgedAt?.toISOString() ?? null,
    acknowledgedBy: row.acknowledgedBy ?? null
  }));
}

export async function acknowledgeSignalNotification(notificationId: string, actor?: ActorIdentity) {
  const prisma = getPrismaClient();
  if (!prisma) {
    throw new NotificationServiceUnavailableError();
  }

  const workspaceScope = await resolveWorkspaceScope(prisma, actor);
  const existing = await prisma.signalNotification.findFirst({
    where: {
      id: notificationId,
      ...(workspaceScope?.workspaceId ? { workspaceId: workspaceScope.workspaceId } : {})
    }
  });

  if (!existing) {
    throw new NotificationNotFoundError(notificationId);
  }

  const updated = await prisma.signalNotification.update({
    where: {
      id: existing.id
    },
    data: {
      status: "ACKNOWLEDGED",
      acknowledgedAt: new Date(),
      acknowledgedBy: workspaceScope?.actorEmail ?? "system"
    }
  });

  return {
    id: updated.id,
    status: notificationStatusMap[updated.status],
    acknowledgedAt: updated.acknowledgedAt?.toISOString() ?? null
  };
}
