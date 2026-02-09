import { getActorFromRequest } from "@/lib/auth/actor";
import {
  SequenceRecordNotFoundError,
  SequenceServiceUnavailableError,
  createSequenceExecution,
  listSequenceExecutions,
  parseCreateSequenceInput
} from "@/lib/services/sequences";
import { WorkspaceAccessDeniedError } from "@/lib/services/workspace";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

export async function GET(request: Request) {
  try {
    const actor = getActorFromRequest(request);
    const url = new URL(request.url);
    const dealId = url.searchParams.get("dealId")?.trim() || undefined;
    const limitRaw = Number(url.searchParams.get("limit") ?? "20");
    const limit = Number.isFinite(limitRaw) ? limitRaw : 20;

    const sequences = await listSequenceExecutions({ dealId, limit }, actor);
    return NextResponse.json({ sequences });
  } catch (error) {
    if (error instanceof SequenceServiceUnavailableError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }

    if (error instanceof SequenceRecordNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    if (error instanceof WorkspaceAccessDeniedError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    console.error("Sequence list failed", error);
    return NextResponse.json({ error: "Failed to list sequences." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const actor = getActorFromRequest(request);
    const payload = parseCreateSequenceInput(await request.json());
    const sequence = await createSequenceExecution(payload, actor);
    return NextResponse.json({ sequence }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Invalid sequence payload.", details: error.flatten() }, { status: 400 });
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

    console.error("Sequence create failed", error);
    return NextResponse.json({ error: "Failed to create sequence." }, { status: 500 });
  }
}
