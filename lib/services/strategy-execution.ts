import { getPrismaClient } from "@/lib/db/prisma";
import { resolveWorkspaceScope, WorkspaceAccessDeniedError } from "@/lib/services/workspace";
import type { ActorIdentity } from "@/lib/auth/actor";
import type { StrategyPlay } from "@/lib/domain/types";
import { buildStrategyPlays } from "@/lib/services/strategy";

export class StrategyPlayNotFoundError extends Error {
  constructor(playId: string) {
    super(`Strategy play not found: ${playId}`);
    this.name = "StrategyPlayNotFoundError";
  }
}

export class StrategyExecutionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StrategyExecutionError";
  }
}

interface ExecutionResult {
  tasksCreated: number;
  approvalsCreated: number;
}

const priorityMap = {
  urgent: "HIGH",
  high: "HIGH",
  medium: "MEDIUM",
  low: "LOW"
} as const;

function getPriorityFromStep(step: string): "HIGH" | "MEDIUM" | "LOW" {
  const lower = step.toLowerCase();
  if (lower.includes("immediate") || lower.includes("24 hour") || lower.includes("today")) {
    return "HIGH";
  }
  if (lower.includes("week") || lower.includes("follow")) {
    return "MEDIUM";
  }
  return "LOW";
}

function getChannelFromStep(step: string): "EMAIL" | "PHONE" | "LINKEDIN" | "MEETING" {
  const lower = step.toLowerCase();
  if (lower.includes("call") || lower.includes("phone")) {
    return "PHONE";
  }
  if (lower.includes("meeting") || lower.includes("book") || lower.includes("schedule")) {
    return "MEETING";
  }
  if (lower.includes("linkedin")) {
    return "LINKEDIN";
  }
  return "EMAIL";
}

function addHours(base: Date, hours: number): Date {
  return new Date(base.getTime() + hours * 60 * 60 * 1000);
}

export async function executeStrategyPlay(
  playId: string,
  dealId: string,
  actor?: ActorIdentity
): Promise<ExecutionResult> {
  const prisma = getPrismaClient();

  if (!prisma) {
    throw new StrategyExecutionError("Database is not configured");
  }

  const workspaceScope = await resolveWorkspaceScope(prisma, actor);
  const actorEmail = workspaceScope?.actorEmail ?? actor?.email ?? "system";

  // Find the deal
  const deal = await prisma.deal.findFirst({
    where: {
      OR: [{ id: dealId }, { externalId: dealId }],
      ...(workspaceScope?.workspaceId
        ? {
            account: {
              workspaceId: workspaceScope.workspaceId
            }
          }
        : {})
    },
    include: {
      account: {
        include: {
          signals: { take: 5, orderBy: { happenedAt: "desc" } }
        }
      },
      tasks: { where: { status: { not: "DONE" } }, take: 10 },
      activities: { take: 10, orderBy: { happenedAt: "desc" } },
      outboundApprovals: { take: 10, orderBy: { createdAt: "desc" } }
    }
  });

  if (!deal) {
    throw new StrategyExecutionError(`Deal not found: ${dealId}`);
  }

  // Get current strategy plays to find the one to execute
  const enumMap = {
    dealStage: {
      DISCOVERY: "discovery",
      EVALUATION: "evaluation",
      PROPOSAL: "proposal",
      PROCUREMENT: "procurement",
      CLOSED_WON: "closed-won",
      CLOSED_LOST: "closed-lost"
    },
    signalType: {
      HIRING: "hiring",
      FUNDING: "funding",
      TOOLING: "tooling",
      ENGAGEMENT: "engagement"
    },
    taskOwner: {
      REP: "rep",
      MANAGER: "manager",
      SYSTEM: "system"
    },
    taskPriority: {
      HIGH: "high",
      MEDIUM: "medium",
      LOW: "low"
    },
    taskStatus: {
      TODO: "todo",
      IN_PROGRESS: "in-progress",
      DONE: "done"
    },
    channel: {
      EMAIL: "email",
      PHONE: "phone",
      LINKEDIN: "linkedin",
      MEETING: "meeting"
    },
    activityType: {
      CALL: "call",
      EMAIL: "email",
      MEETING: "meeting",
      NOTE: "note"
    },
    approvalStatus: {
      PENDING: "pending",
      APPROVED: "approved",
      REJECTED: "rejected"
    }
  } as const;

  const plays = await buildStrategyPlays({
    deal: {
      id: deal.externalId ?? deal.id,
      accountId: deal.accountId,
      name: deal.name,
      stage: enumMap.dealStage[deal.stage],
      amount: deal.amount,
      confidence: deal.confidence,
      closeDate: deal.closeDate.toISOString(),
      riskSummary: deal.riskSummary
    },
    signals: deal.account.signals.map((s) => ({
      id: s.externalId ?? s.id,
      accountId: s.accountId,
      type: enumMap.signalType[s.type],
      summary: s.summary,
      happenedAt: s.happenedAt.toISOString(),
      score: s.score
    })),
    tasks: deal.tasks.map((t) => ({
      id: t.externalId ?? t.id,
      dealId: t.dealId,
      title: t.title,
      owner: enumMap.taskOwner[t.owner],
      dueAt: t.dueAt.toISOString(),
      priority: enumMap.taskPriority[t.priority],
      status: enumMap.taskStatus[t.status],
      suggestedChannel: enumMap.channel[t.suggestedChannel]
    })),
    approvals: deal.outboundApprovals.map((a) => ({
      id: a.id,
      dealId: deal.externalId ?? deal.id,
      channel: enumMap.channel[a.channel],
      subject: a.subject,
      body: a.body,
      status: enumMap.approvalStatus[a.status],
      requestedBy: a.requestedBy,
      reviewedBy: a.reviewedBy ?? undefined,
      reviewedAt: a.reviewedAt?.toISOString(),
      rejectionReason: a.rejectionReason ?? undefined,
      createdAt: a.createdAt.toISOString()
    })),
    recentActivities: deal.activities.map((a) => ({
      id: a.externalId ?? a.id,
      dealId: a.dealId,
      type: enumMap.activityType[a.type],
      happenedAt: a.happenedAt.toISOString(),
      summary: a.summary
    }))
  });

  const play = plays.find((p) => p.id === playId);
  if (!play) {
    throw new StrategyPlayNotFoundError(playId);
  }

  // Create tasks from play steps
  const now = new Date();
  const tasksToCreate = play.steps.map((step, index) => ({
    dealId: deal.id,
    title: step,
    owner: "REP" as const,
    dueAt: addHours(now, 24 * (index + 1)),
    priority: getPriorityFromStep(step),
    status: "TODO" as const,
    suggestedChannel: getChannelFromStep(step)
  }));

  const createdTasks = await prisma.$transaction(
    tasksToCreate.map((task) =>
      prisma.task.create({
        data: task
      })
    )
  );

  // Create approval for outbound communications (first step that looks like sending something)
  let approvalsCreated = 0;
  const outboundStep = play.steps.find(
    (step) =>
      step.toLowerCase().includes("send") ||
      step.toLowerCase().includes("share") ||
      step.toLowerCase().includes("email")
  );

  if (outboundStep) {
    await prisma.outboundApproval.create({
      data: {
        dealId: deal.id,
        channel: getChannelFromStep(outboundStep),
        subject: `[${play.title}] ${outboundStep.slice(0, 50)}`,
        body: `Executing strategy play: ${play.title}\n\nStep: ${outboundStep}\n\nThesis: ${play.thesis}`,
        status: "PENDING",
        requestedBy: actorEmail
      }
    });
    approvalsCreated = 1;
  }

  // Create audit log
  await prisma.auditLog.create({
    data: {
      dealId: deal.id,
      entityType: "strategy-play",
      entityId: playId,
      action: "strategy.executed",
      actor: actorEmail,
      details: `Executed play "${play.title}": created ${createdTasks.length} tasks, ${approvalsCreated} approvals`
    }
  });

  return {
    tasksCreated: createdTasks.length,
    approvalsCreated
  };
}
