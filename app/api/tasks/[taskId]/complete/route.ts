import { getActorFromRequest } from "@/lib/auth/actor";
import { TaskNotFoundError, TaskServiceUnavailableError, completeTask } from "@/lib/services/tasks";
import { WorkspaceAccessDeniedError } from "@/lib/services/workspace";
import { NextResponse } from "next/server";

interface RouteContext {
  params: Promise<{
    taskId: string;
  }>;
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const actor = getActorFromRequest(request);
    const { taskId } = await context.params;
    const task = await completeTask(taskId, actor);

    return NextResponse.json({ task });
  } catch (error) {
    if (error instanceof TaskNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    if (error instanceof TaskServiceUnavailableError) {
      return NextResponse.json(
        {
          error: "Database is not configured. Set DATABASE_URL and run migrations before completing tasks."
        },
        { status: 503 }
      );
    }

    if (error instanceof WorkspaceAccessDeniedError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    console.error("Task completion failed", error);
    return NextResponse.json({ error: "Failed to complete task." }, { status: 500 });
  }
}
