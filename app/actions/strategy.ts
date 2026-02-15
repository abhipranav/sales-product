"use server";

import { revalidateDashboardViews } from "@/lib/services/cache-invalidation";
import { getActorFromServerContext } from "@/lib/auth/actor";
import { executeStrategyPlay, StrategyExecutionError, StrategyPlayNotFoundError } from "@/lib/services/strategy-execution";
import { logger } from "@/lib/logger";

const log = logger.child({ module: "actions/strategy" });

export interface ExecutePlayResult {
  success: boolean;
  tasksCreated: number;
  approvalsCreated: number;
  error?: string;
}

export async function executeStrategyPlayAction(playId: string, dealId: string): Promise<ExecutePlayResult> {
  if (!playId || !dealId) {
    return { success: false, tasksCreated: 0, approvalsCreated: 0, error: "Missing playId or dealId" };
  }

  try {
    const actor = await getActorFromServerContext();
    const result = await executeStrategyPlay(playId, dealId, actor);
    revalidateDashboardViews();
    return {
      success: true,
      tasksCreated: result.tasksCreated,
      approvalsCreated: result.approvalsCreated
    };
  } catch (error) {
    if (error instanceof StrategyPlayNotFoundError) {
      return { success: false, tasksCreated: 0, approvalsCreated: 0, error: "Strategy play not found" };
    }
    if (error instanceof StrategyExecutionError) {
      return { success: false, tasksCreated: 0, approvalsCreated: 0, error: error.message };
    }
    log.error("Failed to execute strategy play", { action: "execute", playId, dealId }, error);
    return { success: false, tasksCreated: 0, approvalsCreated: 0, error: "Unknown error" };
  }
}
