import type { ActorIdentity } from "@/lib/auth/actor";
import { getPrismaClient } from "@/lib/db/prisma";
import type { PilotMetricsSnapshot } from "@/lib/domain/types";
import { resolveWorkspaceScope } from "@/lib/services/workspace";

export class PilotMetricsServiceUnavailableError extends Error {
  constructor() {
    super("Pilot metrics service unavailable because database is not configured.");
    this.name = "PilotMetricsServiceUnavailableError";
  }
}

function hoursBetween(start: Date, end: Date) {
  return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
}

function avg(values: number[]) {
  if (values.length === 0) {
    return 0;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function median(values: number[]) {
  if (values.length === 0) {
    return 0;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }
  return sorted[middle];
}

export async function getPilotMetrics(actor?: ActorIdentity): Promise<PilotMetricsSnapshot> {
  const prisma = getPrismaClient();
  if (!prisma) {
    throw new PilotMetricsServiceUnavailableError();
  }

  const workspaceScope = await resolveWorkspaceScope(prisma, actor);
  const scopeFilter = workspaceScope?.workspaceId
    ? {
        deal: {
          account: {
            workspaceId: workspaceScope.workspaceId
          }
        }
      }
    : {};

  const now = new Date();
  const since24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const since7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const since30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    strategyExecutions7d,
    meetingNotesProcessed7d,
    reminderEvents24h,
    approvedApprovals7d,
    rejectedApprovals7d,
    completedTasks7d,
    completedTasksForLatency
  ] = await Promise.all([
    prisma.auditLog.count({
      where: {
        ...scopeFilter,
        action: "strategy.executed",
        createdAt: {
          gte: since7d
        }
      }
    }),
    prisma.auditLog.count({
      where: {
        ...scopeFilter,
        action: "meeting-notes.processed",
        createdAt: {
          gte: since7d
        }
      }
    }),
    prisma.auditLog.count({
      where: {
        ...scopeFilter,
        action: "task.reminder.sent",
        createdAt: {
          gte: since24h
        }
      }
    }),
    prisma.outboundApproval.count({
      where: {
        status: "APPROVED",
        updatedAt: {
          gte: since7d
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
      }
    }),
    prisma.outboundApproval.count({
      where: {
        status: "REJECTED",
        updatedAt: {
          gte: since7d
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
      }
    }),
    prisma.task.count({
      where: {
        status: "DONE",
        completedAt: {
          gte: since7d
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
      }
    }),
    prisma.task.findMany({
      where: {
        status: "DONE",
        completedAt: {
          gte: since30d
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
      select: {
        createdAt: true,
        completedAt: true
      }
    })
  ]);

  const completionHours = completedTasksForLatency
    .filter((task) => task.completedAt)
    .map((task) => hoursBetween(task.createdAt, task.completedAt as Date))
    .filter((hours) => Number.isFinite(hours) && hours >= 0);

  const decidedApprovals = approvedApprovals7d + rejectedApprovals7d;
  const approvalAcceptanceRate = decidedApprovals === 0 ? 0 : (approvedApprovals7d / decidedApprovals) * 100;

  return {
    generatedAt: now.toISOString(),
    windowDays: 7,
    recommendationSignals: {
      strategyExecutions7d,
      approvedApprovals7d,
      rejectedApprovals7d,
      approvalAcceptanceRate: Number(approvalAcceptanceRate.toFixed(1))
    },
    actionLatency: {
      completedTasks7d,
      avgTaskCompletionHours30d: Number(avg(completionHours).toFixed(1)),
      medianTaskCompletionHours30d: Number(median(completionHours).toFixed(1))
    },
    operations: {
      meetingNotesProcessed7d,
      reminderEvents24h
    }
  };
}
