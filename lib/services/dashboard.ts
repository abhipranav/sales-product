import type { DashboardData, Task } from "@/lib/domain/types";
import { disablePrismaClient, getPrismaClient, isPrismaConnectionError } from "@/lib/db/prisma";
import { getDashboardSnapshot } from "@/lib/mock/dashboard";
import { getRecentAuditEvents } from "@/lib/services/audit";
import { resolveWorkspaceScope, WorkspaceAccessDeniedError } from "@/lib/services/workspace";
import type { ActorIdentity } from "@/lib/auth/actor";
import { buildStrategyPlays } from "@/lib/services/strategy";

const enumMap = {
  segment: {
    STARTUP: "startup",
    MID_MARKET: "mid-market",
    ENTERPRISE: "enterprise"
  },
  contactRole: {
    CHAMPION: "champion",
    APPROVER: "approver",
    BLOCKER: "blocker",
    INFLUENCER: "influencer"
  },
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
  activityType: {
    CALL: "call",
    EMAIL: "email",
    MEETING: "meeting",
    NOTE: "note"
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
  approvalStatus: {
    PENDING: "pending",
    APPROVED: "approved",
    REJECTED: "rejected"
  }
} as const;

const priorityRank: Record<Task["priority"], number> = {
  high: 0,
  medium: 1,
  low: 2
};

export async function getDashboardData(actor?: ActorIdentity): Promise<DashboardData> {
  const prisma = getPrismaClient();

  if (!prisma) {
    return getDashboardSnapshot();
  }

  try {
    const workspaceScope = await resolveWorkspaceScope(prisma, actor);
    const workspaceDealFilter = workspaceScope?.workspaceId
      ? {
          account: {
            workspaceId: workspaceScope.workspaceId
          }
        }
      : {};

    const deal = await prisma.deal.findFirst({
      where: {
        ...workspaceDealFilter,
        stage: {
          notIn: ["CLOSED_WON", "CLOSED_LOST"]
        }
      },
      include: {
        account: {
          include: {
            contacts: true,
            signals: {
              orderBy: {
                happenedAt: "desc"
              },
              take: 5
            }
          }
        },
        tasks: {
          where: {
            status: {
              not: "DONE"
            }
          },
          orderBy: {
            dueAt: "asc"
          },
          take: 12
        },
        activities: {
          orderBy: {
            happenedAt: "desc"
          },
          take: 10
        },
        meetingBrief: true,
        followUp: true,
        outboundApprovals: {
          orderBy: {
            createdAt: "desc"
          },
          take: 12
        }
      },
      orderBy: {
        updatedAt: "desc"
      }
    });

    if (!deal) {
      return getDashboardSnapshot();
    }

    const [openDeals, overdueTasks, highPriorityTasks, auditTrail] = await Promise.all([
      prisma.deal.findMany({
        where: {
          ...workspaceDealFilter,
          stage: {
            notIn: ["CLOSED_WON", "CLOSED_LOST"]
          }
        },
        select: {
          amount: true,
          confidence: true
        }
      }),
      prisma.task.count({
        where: {
          ...(workspaceScope?.workspaceId
            ? {
                deal: {
                  account: {
                    workspaceId: workspaceScope.workspaceId
                  }
                }
              }
            : {}),
          status: {
            not: "DONE"
          },
          dueAt: {
            lt: new Date()
          }
        }
      }),
      prisma.task.count({
        where: {
          ...(workspaceScope?.workspaceId
            ? {
                deal: {
                  account: {
                    workspaceId: workspaceScope.workspaceId
                  }
                }
              }
            : {}),
          status: {
            not: "DONE"
          },
          priority: "HIGH"
        }
      }),
      getRecentAuditEvents(deal.id, 10, workspaceScope?.workspaceId)
    ]);

    const openPipelineAmount = openDeals.reduce((sum, row) => sum + row.amount, 0);
    const weightedPipelineAmount = Math.round(openDeals.reduce((sum, row) => sum + row.amount * row.confidence, 0));

    const mappedTasks = deal.tasks
      .map((task) => ({
        id: task.externalId ?? task.id,
        dealId: task.dealId,
        title: task.title,
        owner: enumMap.taskOwner[task.owner],
        dueAt: task.dueAt.toISOString(),
        priority: enumMap.taskPriority[task.priority],
        status: enumMap.taskStatus[task.status],
        suggestedChannel: enumMap.channel[task.suggestedChannel]
      }))
      .sort((a, b) => {
        const priorityDelta = priorityRank[a.priority] - priorityRank[b.priority];
        if (priorityDelta !== 0) {
          return priorityDelta;
        }

        return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
      });

    return {
      workspace: {
        slug: workspaceScope?.workspaceSlug ?? "legacy",
        name: workspaceScope?.workspaceName ?? "Legacy Workspace",
        actorEmail: workspaceScope?.actorEmail ?? "rep@local",
        actorName: workspaceScope?.actorName ?? "Default Rep",
        actorRole: workspaceScope?.actorRole ?? "rep"
      },
      account: {
        id: deal.account.externalId ?? deal.account.id,
        name: deal.account.name,
        segment: enumMap.segment[deal.account.segment],
        website: deal.account.website ?? undefined,
        employeeBand: deal.account.employeeBand ?? undefined,
        signals: deal.account.signals.map((signal) => ({
          id: signal.externalId ?? signal.id,
          accountId: signal.accountId,
          type: enumMap.signalType[signal.type],
          summary: signal.summary,
          happenedAt: signal.happenedAt.toISOString(),
          score: signal.score
        }))
      },
      contacts: deal.account.contacts.map((contact) => ({
        id: contact.externalId ?? contact.id,
        accountId: contact.accountId,
        fullName: contact.fullName,
        title: contact.title,
        email: contact.email ?? undefined,
        linkedInUrl: contact.linkedIn ?? undefined,
        role: enumMap.contactRole[contact.role]
      })),
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
      pipelineMetrics: {
        openDeals: openDeals.length,
        openPipelineAmount,
        weightedPipelineAmount,
        overdueTasks,
        highPriorityTasks
      },
      tasks: mappedTasks,
      recentActivities: deal.activities.map((activity) => ({
        id: activity.externalId ?? activity.id,
        dealId: activity.dealId,
        type: enumMap.activityType[activity.type],
        happenedAt: activity.happenedAt.toISOString(),
        summary: activity.summary
      })),
      auditTrail,
      approvals: deal.outboundApprovals.map((approval) => ({
        id: approval.id,
        dealId: deal.externalId ?? deal.id,
        channel: enumMap.channel[approval.channel],
        subject: approval.subject,
        body: approval.body,
        status: enumMap.approvalStatus[approval.status],
        requestedBy: approval.requestedBy,
        reviewedBy: approval.reviewedBy ?? undefined,
        reviewedAt: approval.reviewedAt?.toISOString(),
        rejectionReason: approval.rejectionReason ?? undefined,
        createdAt: approval.createdAt.toISOString()
      })),
      strategyPlays: await buildStrategyPlays({
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
        signals: deal.account.signals.map((signal) => ({
          id: signal.externalId ?? signal.id,
          accountId: signal.accountId,
          type: enumMap.signalType[signal.type],
          summary: signal.summary,
          happenedAt: signal.happenedAt.toISOString(),
          score: signal.score
        })),
        tasks: mappedTasks,
        approvals: deal.outboundApprovals.map((approval) => ({
          id: approval.id,
          dealId: deal.externalId ?? deal.id,
          channel: enumMap.channel[approval.channel],
          subject: approval.subject,
          body: approval.body,
          status: enumMap.approvalStatus[approval.status],
          requestedBy: approval.requestedBy,
          reviewedBy: approval.reviewedBy ?? undefined,
          reviewedAt: approval.reviewedAt?.toISOString(),
          rejectionReason: approval.rejectionReason ?? undefined,
          createdAt: approval.createdAt.toISOString()
        })),
        recentActivities: deal.activities.map((activity) => ({
          id: activity.externalId ?? activity.id,
          dealId: activity.dealId,
          type: enumMap.activityType[activity.type],
          happenedAt: activity.happenedAt.toISOString(),
          summary: activity.summary
        }))
      }),
      meetingBrief: {
        accountName: deal.account.name,
        primaryGoal: deal.meetingBrief?.primaryGoal ?? "Align all stakeholders on next best action.",
        likelyObjections: deal.meetingBrief?.likelyObjections ?? ["Budget uncertainty", "Security and legal review"],
        recommendedNarrative:
          deal.meetingBrief?.recommendedNarrative ??
          "Anchor on measurable business outcomes, then walk through risk-control evidence.",
        proofPoints: deal.meetingBrief?.proofPoints ?? ["Cycle time reduction benchmark", "SOC 2 control mapping"]
      },
      followUpDraft: {
        subject: deal.followUp?.subject ?? "Recap and next steps",
        body:
          deal.followUp?.body ??
          "Thanks for the discussion today. Sharing a concise recap with proposed next steps and materials.",
        ask: deal.followUp?.ask ?? "Can we confirm a 20-minute alignment call this week?",
        ctaTimeWindow: deal.followUp?.ctaTimeWindow ?? "This week, 10:00-14:00 local time"
      }
    };
  } catch (error) {
    if (error instanceof WorkspaceAccessDeniedError) {
      throw error;
    }

    if (isPrismaConnectionError(error)) {
      await disablePrismaClient(
        "Database is unreachable from this network. Falling back to mock dashboard until app restart."
      );
      return getDashboardSnapshot();
    }

    console.error("Database lookup failed. Falling back to mock dashboard.", error);
    return getDashboardSnapshot();
  }
}
