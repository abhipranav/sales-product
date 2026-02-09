import { getActorFromRequest } from "@/lib/auth/actor";
import {
  SequenceRecordNotFoundError,
  SequenceServiceUnavailableError,
  parseUpdateSequenceStepInput,
  updateSequenceStep
} from "@/lib/services/sequences";
import { WorkspaceAccessDeniedError } from "@/lib/services/workspace";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

interface RouteContext {
  params: Promise<{
    stepId: string;
  }>;
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const actor = getActorFromRequest(request);
    const { stepId } = await context.params;
    const payload = parseUpdateSequenceStepInput(await request.json());
    const step = await updateSequenceStep(stepId, payload, actor);
    return NextResponse.json({ step });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Invalid sequence step payload.", details: error.flatten() }, { status: 400 });
    }

    if (error instanceof SequenceServiceUnavailableError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }

    if (error instanceof SequenceRecordNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    if (error instanceof WorkspaceAccessDeniedError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    console.error("Sequence step update failed", error);
    return NextResponse.json({ error: "Failed to update sequence step." }, { status: 500 });
  }
}
