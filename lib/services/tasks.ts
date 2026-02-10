import { getPrismaClient } from "@/lib/db/prisma";
import { logAuditEvent } from "@/lib/services/audit";
import { resolveWorkspaceScope } from "@/lib/services/workspace";
import type { ActorIdentity } from "@/lib/auth/actor";
import { z } from "zod";

const createTaskSchema = z.object({
  dealId: z.string().min(1),
  title: z.string().min(3),
  owner: z.enum(["rep", "manager", "system"]).default("rep"),
  dueAt: z.string().datetime(),
  priority: z.enum(["high", "medium", "low"]).default("medium"),
  suggestedChannel: z.enum(["email", "phone", "linkedin", "meeting"]).default("email")
});

const updateTaskSchema = z
  .object({
    title: z.string().min(3).optional(),
    dueAt: z.string().datetime().optional(),
    priority: z.enum(["high", "medium", "low"]).optional(),
    status: z.enum(["todo", "in-progress", "done"]).optional(),
    suggestedChannel: z.enum(["email", "phone", "linkedin", "meeting"]).optional()
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field must be provided."
  });

const ownerMap = {
  rep: "REP",
  manager: "MANAGER",
  system: "SYSTEM"
} as const;

const priorityMap = {
  high: "HIGH",
  medium: "MEDIUM",
  low: "LOW"
} as const;

const channelMap = {
  email: "EMAIL",
  phone: "PHONE",
  linkedin: "LINKEDIN",
  meeting: "MEETING"
} as const;

const statusMap = {
  todo: "TODO",
  "in-progress": "IN_PROGRESS",
  done: "DONE"
} as const;

const dbToUiStatusMap = {
  TODO: "todo",
  IN_PROGRESS: "in-progress",
  DONE: "done"
} as const;

export class TaskServiceUnavailableError extends Error {
  constructor() {
    super("Task service unavailable because database is not configured.");
    this.name = "TaskServiceUnavailableError";
  }
}

export class TaskNotFoundError extends Error {
  constructor(taskId: string) {
    super(`Task not found: ${taskId}`);
    this.name = "TaskNotFoundError";
  }
}

export class DealNotFoundError extends Error {
  constructor(dealId: string) {
    super(`Deal not found: ${dealId}`);
    this.name = "DealNotFoundError";
  }
}

export function parseCreateTaskInput(payload: unknown) {
  return createTaskSchema.parse(payload);
}

export function parseUpdateTaskInput(payload: unknown) {
  return updateTaskSchema.parse(payload);
}

async function resolveTask(
  prisma: NonNullable<ReturnType<typeof getPrismaClient>>,
  taskId: string,
  workspaceId?: string
) {
  return prisma.task.findFirst({
    where: {
      OR: [{ id: taskId }, { externalId: taskId }],
      ...(workspaceId
        ? {
            deal: {
              account: {
                workspaceId
              }
            }
          }
        : {})
    }
  });
}

export async function createTask(payload: z.infer<typeof createTaskSchema>, actor?: ActorIdentity) {
  const prisma = getPrismaClient();

  if (!prisma) {
    throw new TaskServiceUnavailableError();
  }

  const workspaceScope = await resolveWorkspaceScope(prisma, actor);

  const deal = await prisma.deal.findFirst({
    where: {
      OR: [{ id: payload.dealId }, { externalId: payload.dealId }],
      ...(workspaceScope?.workspaceId
        ? {
            account: {
              workspaceId: workspaceScope.workspaceId
            }
          }
        : {})
    },
    select: {
      id: true
    }
  });

  if (!deal) {
    throw new DealNotFoundError(payload.dealId);
  }

  const task = await prisma.task.create({
    data: {
      dealId: deal.id,
      title: payload.title,
      owner: ownerMap[payload.owner],
      dueAt: new Date(payload.dueAt),
      priority: priorityMap[payload.priority],
      status: "TODO",
      suggestedChannel: channelMap[payload.suggestedChannel]
    }
  });

  await logAuditEvent({
    dealId: task.dealId,
    taskId: task.id,
    entityType: "task",
    entityId: task.externalId ?? task.id,
    action: "task.created",
    actor: workspaceScope?.actorEmail ?? "rep",
    details: `Task created: ${task.title}`
  });

  return {
    id: task.externalId ?? task.id,
    dealId: payload.dealId,
    title: task.title,
    owner: payload.owner,
    dueAt: task.dueAt.toISOString(),
    priority: payload.priority,
    status: "todo" as const,
    suggestedChannel: payload.suggestedChannel
  };
}

export async function completeTask(taskId: string, actor?: ActorIdentity) {
  const prisma = getPrismaClient();

  if (!prisma) {
    throw new TaskServiceUnavailableError();
  }

  const workspaceScope = await resolveWorkspaceScope(prisma, actor);
  const existing = await resolveTask(prisma, taskId, workspaceScope?.workspaceId);

  if (!existing) {
    throw new TaskNotFoundError(taskId);
  }

  const updated = await prisma.task.update({
    where: {
      id: existing.id
    },
    data: {
      status: "DONE",
      completedAt: new Date()
    }
  });

  await logAuditEvent({
    dealId: updated.dealId,
    taskId: updated.id,
    entityType: "task",
    entityId: updated.externalId ?? updated.id,
    action: "task.completed",
    actor: workspaceScope?.actorEmail ?? "rep",
    details: `Task marked complete: ${updated.title}`
  });

  return {
    id: updated.externalId ?? updated.id,
    status: "done" as const,
    completedAt: updated.completedAt?.toISOString() ?? new Date().toISOString()
  };
}

export async function updateTask(taskId: string, payload: z.infer<typeof updateTaskSchema>, actor?: ActorIdentity) {
  const prisma = getPrismaClient();

  if (!prisma) {
    throw new TaskServiceUnavailableError();
  }

  const workspaceScope = await resolveWorkspaceScope(prisma, actor);
  const existing = await resolveTask(prisma, taskId, workspaceScope?.workspaceId);

  if (!existing) {
    throw new TaskNotFoundError(taskId);
  }

  const updated = await prisma.task.update({
    where: {
      id: existing.id
    },
    data: {
      title: payload.title,
      dueAt: payload.dueAt ? new Date(payload.dueAt) : undefined,
      priority: payload.priority ? priorityMap[payload.priority] : undefined,
      status: payload.status ? statusMap[payload.status] : undefined,
      completedAt: payload.status ? (payload.status === "done" ? new Date() : null) : undefined,
      suggestedChannel: payload.suggestedChannel ? channelMap[payload.suggestedChannel] : undefined
    }
  });

  await logAuditEvent({
    dealId: updated.dealId,
    taskId: updated.id,
    entityType: "task",
    entityId: updated.externalId ?? updated.id,
    action: "task.updated",
    actor: workspaceScope?.actorEmail ?? "rep",
    details: `Updated fields: ${Object.keys(payload).join(", ")}`
  });

  return {
    id: updated.externalId ?? updated.id,
    dealId: updated.dealId,
    title: updated.title,
    dueAt: updated.dueAt.toISOString(),
    priority: updated.priority.toLowerCase() as "high" | "medium" | "low",
    status: dbToUiStatusMap[updated.status],
    suggestedChannel: updated.suggestedChannel.toLowerCase() as "email" | "phone" | "linkedin" | "meeting"
  };
}

export async function deleteTask(taskId: string, actor?: ActorIdentity) {
  const prisma = getPrismaClient();

  if (!prisma) {
    throw new TaskServiceUnavailableError();
  }

  const workspaceScope = await resolveWorkspaceScope(prisma, actor);
  const existing = await resolveTask(prisma, taskId, workspaceScope?.workspaceId);

  if (!existing) {
    throw new TaskNotFoundError(taskId);
  }

  await logAuditEvent({
    dealId: existing.dealId,
    entityType: "task",
    entityId: existing.externalId ?? existing.id,
    action: "task.deleted",
    actor: workspaceScope?.actorEmail ?? "rep",
    details: `Task deleted: ${existing.title}`
  });

  await prisma.task.delete({
    where: {
      id: existing.id
    }
  });

  return {
    id: existing.externalId ?? existing.id,
    deleted: true as const
  };
}
