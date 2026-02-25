import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getActorFromRequest } from "@/lib/auth/actor";
import {
  TaskReminderServiceUnavailableError,
  parseRunReminderInput,
  runTaskSlaReminders
} from "@/lib/services/task-reminders";
import { WorkspaceAccessDeniedError } from "@/lib/services/workspace";

export async function POST(request: Request) {
  try {
    const actor = getActorFromRequest(request);
    const body = await request.json().catch(() => ({}));
    const payload = parseRunReminderInput(body);
    const result = await runTaskSlaReminders(payload, actor);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Invalid reminder payload.", details: error.flatten() }, { status: 400 });
    }

    if (error instanceof TaskReminderServiceUnavailableError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }

    if (error instanceof WorkspaceAccessDeniedError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    console.error("Task reminder run failed", error);
    return NextResponse.json({ error: "Failed to run task reminders." }, { status: 500 });
  }
}
