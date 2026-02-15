"use server";

import {
  DealNotFoundError,
  TaskNotFoundError,
  TaskServiceUnavailableError,
  completeTask,
  createTask,
  deleteTask,
  parseCreateTaskInput,
  parseUpdateTaskInput,
  updateTask
} from "@/lib/services/tasks";
import { WorkspaceAccessDeniedError } from "@/lib/services/workspace";
import { getActorFromServerContext } from "@/lib/auth/actor";
import { revalidateDashboardViews } from "@/lib/services/cache-invalidation";
import { logger } from "@/lib/logger";

const log = logger.child({ module: "actions/tasks" });

export async function completeTaskAction(formData: FormData) {
  const taskId = String(formData.get("taskId") ?? "").trim();

  if (!taskId) {
    return;
  }

  try {
    const actor = await getActorFromServerContext();
    await completeTask(taskId, actor);
    revalidateDashboardViews();
    log.info("Task completed", { action: "complete", taskId });
  } catch (error) {
    if (error instanceof TaskServiceUnavailableError) {
      log.warn("Task completion skipped — database not configured", { action: "complete", taskId }, error);
      return;
    }

    if (error instanceof WorkspaceAccessDeniedError) {
      log.warn("Task completion denied", { action: "complete", taskId }, error);
      return;
    }

    log.error("Failed to complete task", { action: "complete", taskId }, error);
  }
}

export async function createTaskAction(formData: FormData) {
  const dueAtRaw = String(formData.get("dueAt") ?? "").trim();
  const dueAtDate = new Date(dueAtRaw);

  if (Number.isNaN(dueAtDate.getTime())) {
    return;
  }

  try {
    const payload = parseCreateTaskInput({
      dealId: String(formData.get("dealId") ?? "").trim(),
      title: String(formData.get("title") ?? "").trim(),
      owner: String(formData.get("owner") ?? "rep"),
      dueAt: dueAtDate.toISOString(),
      priority: String(formData.get("priority") ?? "medium"),
      suggestedChannel: String(formData.get("suggestedChannel") ?? "email")
    });

    const actor = await getActorFromServerContext();
    await createTask(payload, actor);
    revalidateDashboardViews();
    log.info("Task created", { action: "create", dealId: payload.dealId });
  } catch (error) {
    if (error instanceof TaskServiceUnavailableError) {
      log.warn("Task creation skipped — database not configured", { action: "create" }, error);
      return;
    }

    if (error instanceof DealNotFoundError) {
      log.warn("Task creation failed — deal not found", { action: "create" }, error);
      return;
    }

    if (error instanceof WorkspaceAccessDeniedError) {
      log.warn("Task creation denied", { action: "create" }, error);
      return;
    }

    log.error("Failed to create task", { action: "create" }, error);
  }
}

export async function updateTaskAction(formData: FormData) {
  const taskId = String(formData.get("taskId") ?? "").trim();

  if (!taskId) {
    return;
  }

  try {
    const payload = parseUpdateTaskInput({
      title: formData.get("title") ? String(formData.get("title")) : undefined,
      dueAt: formData.get("dueAt")
        ? (() => {
            const date = new Date(String(formData.get("dueAt")));
            return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
          })()
        : undefined,
      priority: formData.get("priority") ? String(formData.get("priority")) : undefined,
      status: formData.get("status") ? String(formData.get("status")) : undefined,
      suggestedChannel: formData.get("suggestedChannel") ? String(formData.get("suggestedChannel")) : undefined
    });

    const actor = await getActorFromServerContext();
    await updateTask(taskId, payload, actor);
    revalidateDashboardViews();
    log.info("Task updated", { action: "update", taskId });
  } catch (error) {
    if (error instanceof TaskServiceUnavailableError || error instanceof TaskNotFoundError) {
      log.warn("Task update skipped", { action: "update", taskId }, error);
      return;
    }

    if (error instanceof WorkspaceAccessDeniedError) {
      log.warn("Task update denied", { action: "update", taskId }, error);
      return;
    }

    log.error("Failed to update task", { action: "update", taskId }, error);
  }
}

export async function deleteTaskAction(formData: FormData) {
  const taskId = String(formData.get("taskId") ?? "").trim();

  if (!taskId) {
    return;
  }

  try {
    const actor = await getActorFromServerContext();
    await deleteTask(taskId, actor);
    revalidateDashboardViews();
    log.info("Task deleted", { action: "delete", taskId });
  } catch (error) {
    if (error instanceof TaskServiceUnavailableError || error instanceof TaskNotFoundError) {
      log.warn("Task deletion skipped", { action: "delete", taskId }, error);
      return;
    }

    if (error instanceof WorkspaceAccessDeniedError) {
      log.warn("Task deletion denied", { action: "delete", taskId }, error);
      return;
    }

    log.error("Failed to delete task", { action: "delete", taskId }, error);
  }
}
