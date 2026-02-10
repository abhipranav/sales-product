import type { ActorIdentity } from "@/lib/auth/actor";
import { getPrismaClient } from "@/lib/db/prisma";
import { logAuditEvent } from "@/lib/services/audit";
import { resolveWorkspaceScope } from "@/lib/services/workspace";
import { z } from "zod";

const createApprovalSchema = z.object({
  dealId: z.string().min(1),
  channel: z.enum(["email", "phone", "linkedin", "meeting"]).default("email"),
  subject: z.string().min(3).max(180),
  body: z.string().min(10).max(6000)
});

const reviewApprovalSchema = z
  .object({
    decision: z.enum(["approved", "rejected"]),
    rejectionReason: z.string().min(3).max(400).optional()
  })
  .superRefine((value, context) => {
    if (value.decision === "rejected" && !value.rejectionReason) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Rejection reason is required when rejecting an approval."
      });
    }
  });

const channelMap = {
  email: "EMAIL",
  phone: "PHONE",
  linkedin: "LINKEDIN",
  meeting: "MEETING"
} as const;

const dbChannelToUi = {
  EMAIL: "email",
  PHONE: "phone",
  LINKEDIN: "linkedin",
  MEETING: "meeting"
} as const;

const statusMap = {
  approved: "APPROVED",
  rejected: "REJECTED"
} as const;

const dbStatusToUi = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected"
} as const;

export class ApprovalServiceUnavailableError extends Error {
  constructor() {
    super("Approval service unavailable because database is not configured.");
    this.name = "ApprovalServiceUnavailableError";
  }
}

export class ApprovalDealNotFoundError extends Error {
  constructor(dealId: string) {
    super(`Deal not found: ${dealId}`);
    this.name = "ApprovalDealNotFoundError";
  }
}

export class ApprovalNotFoundError extends Error {
  constructor(approvalId: string) {
    super(`Approval not found: ${approvalId}`);
    this.name = "ApprovalNotFoundError";
  }
}

export function parseCreateApprovalInput(payload: unknown) {
  return createApprovalSchema.parse(payload);
}

export function parseReviewApprovalInput(payload: unknown) {
  return reviewApprovalSchema.parse(payload);
}

function mapApproval(
  approval: {
    id: string;
    dealId: string;
    channel: keyof typeof dbChannelToUi;
    subject: string;
    body: string;
    status: keyof typeof dbStatusToUi;
    requestedBy: string;
    reviewedBy: string | null;
    reviewedAt: Date | null;
    rejectionReason: string | null;
    createdAt: Date;
  },
  externalDealId?: string | null
) {
  return {
    id: approval.id,
    dealId: externalDealId ?? approval.dealId,
    channel: dbChannelToUi[approval.channel],
    subject: approval.subject,
    body: approval.body,
    status: dbStatusToUi[approval.status],
    requestedBy: approval.requestedBy,
    reviewedBy: approval.reviewedBy ?? undefined,
    reviewedAt: approval.reviewedAt?.toISOString(),
    rejectionReason: approval.rejectionReason ?? undefined,
    createdAt: approval.createdAt.toISOString()
  };
}

export async function createApprovalRequest(payload: z.infer<typeof createApprovalSchema>, actor?: ActorIdentity) {
  const prisma = getPrismaClient();

  if (!prisma) {
    throw new ApprovalServiceUnavailableError();
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
      id: true,
      externalId: true
    }
  });

  if (!deal) {
    throw new ApprovalDealNotFoundError(payload.dealId);
  }

  const approval = await prisma.outboundApproval.create({
    data: {
      dealId: deal.id,
      channel: channelMap[payload.channel],
      subject: payload.subject,
      body: payload.body,
      requestedBy: workspaceScope?.actorEmail ?? "system"
    }
  });

  await logAuditEvent({
    dealId: deal.id,
    entityType: "activity",
    entityId: approval.id,
    action: "approval.requested",
    actor: workspaceScope?.actorEmail ?? "system",
    details: `Outbound approval requested via ${payload.channel}: ${payload.subject}`
  });

  return mapApproval(approval, deal.externalId);
}

export async function reviewApprovalRequest(
  approvalId: string,
  payload: z.infer<typeof reviewApprovalSchema>,
  actor?: ActorIdentity
) {
  const prisma = getPrismaClient();

  if (!prisma) {
    throw new ApprovalServiceUnavailableError();
  }

  const workspaceScope = await resolveWorkspaceScope(prisma, actor);

  const approval = await prisma.outboundApproval.findFirst({
    where: {
      id: approvalId,
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
          externalId: true
        }
      }
    }
  });

  if (!approval) {
    throw new ApprovalNotFoundError(approvalId);
  }

  const updated = await prisma.outboundApproval.update({
    where: {
      id: approval.id
    },
    data: {
      status: statusMap[payload.decision],
      reviewedBy: workspaceScope?.actorEmail ?? "system",
      reviewedAt: new Date(),
      rejectionReason: payload.decision === "rejected" ? payload.rejectionReason ?? null : null
    }
  });

  await logAuditEvent({
    dealId: approval.deal.id,
    entityType: "activity",
    entityId: updated.id,
    action: `approval.${payload.decision}`,
    actor: workspaceScope?.actorEmail ?? "system",
    details:
      payload.decision === "rejected"
        ? `Outbound approval rejected: ${payload.rejectionReason ?? "No reason provided."}`
        : "Outbound approval approved."
  });

  return mapApproval(updated, approval.deal.externalId);
}

export async function listApprovalRequests(
  params: { dealId?: string; status?: "pending" | "approved" | "rejected"; limit?: number },
  actor?: ActorIdentity
) {
  const prisma = getPrismaClient();

  if (!prisma) {
    throw new ApprovalServiceUnavailableError();
  }

  const workspaceScope = await resolveWorkspaceScope(prisma, actor);
  const limit = params.limit ? Math.min(Math.max(params.limit, 1), 50) : 20;

  let resolvedDealId: string | undefined;
  let resolvedExternalDealId: string | undefined;

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
        id: true,
        externalId: true
      }
    });

    if (!deal) {
      throw new ApprovalDealNotFoundError(params.dealId);
    }

    resolvedDealId = deal.id;
    resolvedExternalDealId = deal.externalId ?? undefined;
  }

  const rows = await prisma.outboundApproval.findMany({
    where: {
      ...(resolvedDealId ? { dealId: resolvedDealId } : {}),
      ...(params.status ? { status: params.status.toUpperCase() as "PENDING" | "APPROVED" | "REJECTED" } : {}),
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
    orderBy: {
      createdAt: "desc"
    },
    take: limit
  });

  return rows.map((row) => mapApproval(row, resolvedExternalDealId));
}
