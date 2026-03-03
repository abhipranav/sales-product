import { z } from "zod";
import { getPrismaClient } from "@/lib/db/prisma";
import type { ActorIdentity } from "@/lib/auth/actor";
import { resolveWorkspaceScope } from "@/lib/services/workspace";

const runReminderSchema = z.object({
  windowHours: z.coerce.number().int().min(1).max(168).default(24),
  includeOverdue: z.coerce.boolean().default(true)
});

export class TaskReminderServiceUnavailableError extends Error {
  constructor() {
    super("Task reminder service unavailable because database is not configured.");
    this.name = "TaskReminderServiceUnavailableError";
  }
}

export function parseRunReminderInput(payload: unknown) {
  return runReminderSchema.parse(payload);
}

function startOfDay(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

export async function runTaskSlaReminders(
  payload: z.infer<typeof runReminderSchema>,
  actor?: ActorIdentity
) {
  const prisma = getPrismaClient();
  if (!prisma) {
    throw new TaskReminderServiceUnavailableError();
  }

  const workspaceScope = await resolveWorkspaceScope(prisma, actor);
  const actorEmail = workspaceScope?.actorEmail ?? actor?.email ?? "system";
  const now = new Date();
  const cutoff = new Date(now.getTime() + payload.windowHours * 60 * 60 * 1000);
  const dayStart = startOfDay(now);

  const tasks = await prisma.task.findMany({
    where: {
      status: {
        not: "DONE"
      },
      dueAt: {
        lte: cutoff
      },
      ...(workspaceScope?.workspaceId
        ? {
            deal: {
              account: {
                workspaceId: workspaceScope.workspaceId
              }
            }
          }
        : {})
    },
    include: {
      deal: {
        select: {
          id: true,
          externalId: true,
          name: true
        }
      }
    },
    orderBy: {
      dueAt: "asc"
    }
  });

  const reminders = await prisma.$transaction(async (tx) => {
    const created: Array<{
      taskId: string;
      dealId: string;
      dealName: string;
      title: string;
      dueAt: string;
      priority: "high" | "medium" | "low";
      reminderType: "overdue" | "upcoming";
    }> = [];

    for (const task of tasks) {
      const reminderType = task.dueAt < now ? "overdue" : "upcoming";
      if (reminderType === "overdue" && !payload.includeOverdue) {
        continue;
      }

      const existing = await tx.auditLog.findFirst({
        where: {
          taskId: task.id,
          action: "task.reminder.sent",
          createdAt: {
            gte: dayStart
          }
        },
        select: {
          id: true
        }
      });

      if (existing) {
        continue;
      }

      await tx.auditLog.create({
        data: {
          dealId: task.dealId,
          taskId: task.id,
          entityType: "task",
          entityId: task.externalId ?? task.id,
          action: "task.reminder.sent",
          actor: actorEmail,
          details: JSON.stringify({
            reminderType,
            dueAt: task.dueAt.toISOString(),
            priority: task.priority
          })
        }
      });

      created.push({
        taskId: task.externalId ?? task.id,
        dealId: task.deal.externalId ?? task.deal.id,
        dealName: task.deal.name,
        title: task.title,
        dueAt: task.dueAt.toISOString(),
        priority: task.priority.toLowerCase() as "high" | "medium" | "low",
        reminderType
      });
    }

    return created;
  });

  return {
    triggeredAt: now.toISOString(),
    windowHours: payload.windowHours,
    remindersCreated: reminders.length,
    reminders
  };
}
