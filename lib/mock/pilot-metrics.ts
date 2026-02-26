import type { PilotMetricsSnapshot } from "@/lib/domain/types";

export function getPilotMetricsSnapshot(): PilotMetricsSnapshot {
  return {
    generatedAt: new Date().toISOString(),
    windowDays: 7,
    recommendationSignals: {
      strategyExecutions7d: 6,
      approvedApprovals7d: 9,
      rejectedApprovals7d: 2,
      approvalAcceptanceRate: 81.8
    },
    actionLatency: {
      completedTasks7d: 14,
      avgTaskCompletionHours30d: 18.4,
      medianTaskCompletionHours30d: 11.2
    },
    operations: {
      meetingNotesProcessed7d: 7,
      reminderEvents24h: 3
    }
  };
}
