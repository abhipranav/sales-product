import { getActorFromRequest } from "@/lib/auth/actor";
import {
  TaskNotFoundError,
  TaskServiceUnavailableError,
  deleteTask,
  parseUpdateTaskInput,
  updateTask
} from "@/lib/services/tasks";
import { WorkspaceAccessDeniedError } from "@/lib/services/workspace";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

interface RouteContext {
  params: Promise<{
    taskId: string;
  }>;
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const actor = getActorFromRequest(request);
    const { taskId } = await context.params;
    const payload = parseUpdateTaskInput(await request.json());
    const task = await updateTask(taskId, payload, actor);

    return NextResponse.json({ task });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "Invalid task patch payload.",
          details: error.flatten()
        },
        { status: 400 }
      );
    }

    if (error instanceof TaskNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    if (error instanceof TaskServiceUnavailableError) {
      return NextResponse.json(
        {
          error: "Database is not configured. Set DATABASE_URL and run migrations before updating tasks."
        },
        { status: 503 }
      );
    }

    if (error instanceof WorkspaceAccessDeniedError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    console.error("Task update failed", error);
    return NextResponse.json({ error: "Failed to update task." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const actor = getActorFromRequest(_request);
    const { taskId } = await context.params;
    const result = await deleteTask(taskId, actor);

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof TaskNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    if (error instanceof TaskServiceUnavailableError) {
      return NextResponse.json(
        {
          error: "Database is not configured. Set DATABASE_URL and run migrations before deleting tasks."
        },
        { status: 503 }
      );
    }

    if (error instanceof WorkspaceAccessDeniedError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    console.error("Task delete failed", error);
    return NextResponse.json({ error: "Failed to delete task." }, { status: 500 });
  }
}
