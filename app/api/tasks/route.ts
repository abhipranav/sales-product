import { getActorFromRequest } from "@/lib/auth/actor";
import { DealNotFoundError, TaskServiceUnavailableError, createTask, parseCreateTaskInput } from "@/lib/services/tasks";
import { WorkspaceAccessDeniedError } from "@/lib/services/workspace";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

export async function POST(request: Request) {
  try {
    const actor = getActorFromRequest(request);
    const payload = parseCreateTaskInput(await request.json());
    const task = await createTask(payload, actor);

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "Invalid task payload.",
          details: error.flatten()
        },
        { status: 400 }
      );
    }

    if (error instanceof TaskServiceUnavailableError) {
      return NextResponse.json(
        {
          error: "Database is not configured. Set DATABASE_URL and run migrations before creating tasks."
        },
        { status: 503 }
      );
    }

    if (error instanceof DealNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    if (error instanceof WorkspaceAccessDeniedError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    console.error("Task creation failed", error);
    return NextResponse.json({ error: "Failed to create task." }, { status: 500 });
  }
}
