import { getActorFromRequest } from "@/lib/auth/actor";
import {
  CalendarDealNotFoundError,
  CalendarServiceUnavailableError,
  ingestCalendarEvent,
  parseCalendarIngestInput
} from "@/lib/services/calendar";
import { WorkspaceAccessDeniedError } from "@/lib/services/workspace";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

export async function POST(request: Request) {
  try {
    const actor = getActorFromRequest(request);
    const payload = parseCalendarIngestInput(await request.json());
    const result = await ingestCalendarEvent(payload, actor);

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "Invalid calendar ingest payload.",
          details: error.flatten()
        },
        { status: 400 }
      );
    }

    if (error instanceof CalendarDealNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    if (error instanceof CalendarServiceUnavailableError) {
      return NextResponse.json(
        {
          error: "Database is not configured. Set DATABASE_URL and run migrations before calendar ingest."
        },
        { status: 503 }
      );
    }

    if (error instanceof WorkspaceAccessDeniedError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    console.error("Calendar ingest failed", error);
    return NextResponse.json({ error: "Failed to ingest calendar event." }, { status: 500 });
  }
}
