import { NextResponse } from "next/server";
import { z } from "zod";
import { getActorFromRequest } from "@/lib/auth/actor";
import { parseRunReminderInput, runTaskSlaReminders, TaskReminderServiceUnavailableError } from "@/lib/services/task-reminders";
import { WorkspaceAccessDeniedError } from "@/lib/services/workspace";

export async function POST(request: Request) {
  const cronSecret = process.env.CRON_SECRET?.trim();
  if (cronSecret) {
    const authorization = request.headers.get("authorization");
    if (authorization !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const actor = getActorFromRequest(request);
    const body = await request.json().catch(() => ({}));
    const payload = parseRunReminderInput(body);
    const result = await runTaskSlaReminders(payload, actor);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid reminder payload.", details: error.flatten() }, { status: 400 });
    }

    if (error instanceof TaskReminderServiceUnavailableError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }

    if (error instanceof WorkspaceAccessDeniedError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    console.error("Cron reminders failed", error);
    return NextResponse.json({ error: "Failed to run task reminders." }, { status: 500 });
  }
}
