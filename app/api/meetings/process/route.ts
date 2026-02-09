import { getActorFromRequest } from "@/lib/auth/actor";
import {
  MeetingNotesDealNotFoundError,
  MeetingNotesServiceUnavailableError,
  parseMeetingNotesInput,
  processMeetingNotes
} from "@/lib/services/meeting-notes";
import { WorkspaceAccessDeniedError } from "@/lib/services/workspace";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

export async function POST(request: Request) {
  try {
    const actor = getActorFromRequest(request);
    const payload = parseMeetingNotesInput(await request.json());
    const result = await processMeetingNotes(payload, actor);

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "Invalid meeting notes payload.",
          details: error.flatten()
        },
        { status: 400 }
      );
    }

    if (error instanceof MeetingNotesDealNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    if (error instanceof MeetingNotesServiceUnavailableError) {
      return NextResponse.json(
        {
          error: "Database is not configured. Set DATABASE_URL and run schema sync before processing notes."
        },
        { status: 503 }
      );
    }

    if (error instanceof WorkspaceAccessDeniedError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    console.error("Meeting notes processing failed", error);
    return NextResponse.json({ error: "Failed to process meeting notes." }, { status: 500 });
  }
}
