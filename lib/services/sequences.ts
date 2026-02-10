import { z } from "zod";
import { getPrismaClient } from "@/lib/db/prisma";
import type { ActorIdentity } from "@/lib/auth/actor";
import { resolveWorkspaceScope } from "@/lib/services/workspace";

const channelMap = {
  email: "EMAIL",
  phone: "PHONE",
  linkedin: "LINKEDIN",
  meeting: "MEETING"
} as const;

const statusMap = {
  todo: "TODO",
  "in-progress": "IN_PROGRESS",
  done: "DONE",
  skipped: "SKIPPED"
} as const;

const dbStatusToUi = {
  TODO: "todo",
  IN_PROGRESS: "in-progress",
  DONE: "done",
  SKIPPED: "skipped"
} as const;

const dbExecutionStatusToUi = {
  ACTIVE: "active",
  COMPLETED: "completed"
} as const;

const createSequenceSchema = z.object({
  dealId: z.string().min(1),
  contactId: z.string().min(1).optional(),
  title: z.string().min(3).max(180),
  channelMix: z.array(z.enum(["email", "phone", "linkedin", "meeting"])).min(1).max(4),
  steps: z
    .array(
      z.object({
        channel: z.enum(["email", "phone", "linkedin", "meeting"]),
        instruction: z.string().min(5).max(400)
      })
    )
    .min(1)
    .max(12)
});

const updateSequenceStepSchema = z
  .object({
    status: z.enum(["todo", "in-progress", "done", "skipped"]).optional(),
    outcome: z.string().min(3).max(600).optional()
  })
  .refine((value) => Object.keys(value).length > 0, { message: "At least one field must be provided." });

export class SequenceServiceUnavailableError extends Error {
  constructor() {
    super("Sequence service unavailable because database is not configured.");
    this.name = "SequenceServiceUnavailableError";
  }
}

export class SequenceRecordNotFoundError extends Error {
  constructor(entity: "deal" | "contact" | "step", id: string) {
    super(`${entity} not found: ${id}`);
    this.name = "SequenceRecordNotFoundError";
  }
}

export function parseCreateSequenceInput(payload: unknown) {
  return createSequenceSchema.parse(payload);
}

export function parseUpdateSequenceStepInput(payload: unknown) {
  return updateSequenceStepSchema.parse(payload);
}

export async function createSequenceExecution(payload: z.infer<typeof createSequenceSchema>, actor?: ActorIdentity) {
  const prisma = getPrismaClient();
  if (!prisma) {
    throw new SequenceServiceUnavailableError();
  }

  const workspaceScope = await resolveWorkspaceScope(prisma, actor);
  if (!workspaceScope?.workspaceId) {
    throw new SequenceServiceUnavailableError();
  }

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
    throw new SequenceRecordNotFoundError("deal", payload.dealId);
  }

  let resolvedContactId: string | undefined;
  if (payload.contactId) {
    const contact = await prisma.contact.findFirst({
      where: {
        OR: [{ id: payload.contactId }, { externalId: payload.contactId }],
        account: {
          workspaceId: workspaceScope?.workspaceId
        }
      },
      select: {
        id: true
      }
    });

    if (!contact) {
      throw new SequenceRecordNotFoundError("contact", payload.contactId);
    }

    resolvedContactId = contact.id;
  }

  const execution = await prisma.sequenceExecution.create({
    data: {
      workspaceId: workspaceScope.workspaceId,
      dealId: deal.id,
      contactId: resolvedContactId,
      title: payload.title,
      channelMix: payload.channelMix.map((channel) => channelMap[channel]),
      createdBy: workspaceScope?.actorEmail ?? "system",
      steps: {
        create: payload.steps.map((step, index) => ({
          order: index + 1,
          channel: channelMap[step.channel],
          instruction: step.instruction
        }))
      }
    },
    include: {
      steps: {
        orderBy: {
          order: "asc"
        }
      }
    }
  });

  return {
    id: execution.id,
    title: execution.title,
    status: dbExecutionStatusToUi[execution.status],
    stepCount: execution.steps.length
  };
}

export async function updateSequenceStep(stepId: string, payload: z.infer<typeof updateSequenceStepSchema>, actor?: ActorIdentity) {
  const prisma = getPrismaClient();
  if (!prisma) {
    throw new SequenceServiceUnavailableError();
  }

  const workspaceScope = await resolveWorkspaceScope(prisma, actor);
  if (!workspaceScope?.workspaceId) {
    throw new SequenceServiceUnavailableError();
  }
  const step = await prisma.sequenceStep.findFirst({
    where: {
      id: stepId,
      execution: {
        workspaceId: workspaceScope.workspaceId
      }
    },
    include: {
      execution: {
        select: {
          id: true
        }
      }
    }
  });

  if (!step) {
    throw new SequenceRecordNotFoundError("step", stepId);
  }

  const updated = await prisma.sequenceStep.update({
    where: {
      id: step.id
    },
    data: {
      status: payload.status ? statusMap[payload.status] : undefined,
      outcome: payload.outcome === undefined ? undefined : payload.outcome || null,
      completedAt: payload.status ? (payload.status === "done" ? new Date() : null) : undefined
    }
  });

  const pendingCount = await prisma.sequenceStep.count({
    where: {
      executionId: step.execution.id,
      status: {
        in: ["TODO", "IN_PROGRESS"]
      }
    }
  });

  await prisma.sequenceExecution.update({
    where: {
      id: step.execution.id
    },
    data: {
      status: pendingCount === 0 ? "COMPLETED" : "ACTIVE"
    }
  });

  return {
    id: updated.id,
    status: dbStatusToUi[updated.status],
    outcome: updated.outcome ?? null
  };
}

export async function listSequenceExecutions(params: { dealId?: string; limit?: number }, actor?: ActorIdentity) {
  const prisma = getPrismaClient();
  if (!prisma) {
    throw new SequenceServiceUnavailableError();
  }

  const workspaceScope = await resolveWorkspaceScope(prisma, actor);
  if (!workspaceScope?.workspaceId) {
    throw new SequenceServiceUnavailableError();
  }
  const limit = params.limit ? Math.min(Math.max(params.limit, 1), 50) : 20;

  let resolvedDealId: string | undefined;
  if (params.dealId) {
    const deal = await prisma.deal.findFirst({
      where: {
        OR: [{ id: params.dealId }, { externalId: params.dealId }],
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
      throw new SequenceRecordNotFoundError("deal", params.dealId);
    }
    resolvedDealId = deal.id;
  }

  const rows = await prisma.sequenceExecution.findMany({
    where: {
      workspaceId: workspaceScope.workspaceId,
      ...(resolvedDealId ? { dealId: resolvedDealId } : {})
    },
    include: {
      contact: {
        select: {
          id: true,
          fullName: true
        }
      },
      deal: {
        select: {
          id: true,
          externalId: true,
          name: true
        }
      },
      steps: {
        orderBy: {
          order: "asc"
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    },
    take: limit
  });

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    status: dbExecutionStatusToUi[row.status],
    dealId: row.deal.externalId ?? row.deal.id,
    dealName: row.deal.name,
    contactId: row.contact?.id ?? null,
    contactName: row.contact?.fullName ?? null,
    channelMix: row.channelMix.map((channel) => channel.toLowerCase()),
    createdBy: row.createdBy,
    createdAt: row.createdAt.toISOString(),
    steps: row.steps.map((step) => ({
      id: step.id,
      order: step.order,
      channel: step.channel.toLowerCase(),
      instruction: step.instruction,
      status: dbStatusToUi[step.status],
      outcome: step.outcome ?? null,
      completedAt: step.completedAt?.toISOString() ?? null
    }))
  }));
}
