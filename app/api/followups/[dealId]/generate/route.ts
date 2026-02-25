import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getActorFromRequest } from "@/lib/auth/actor";
import {
  DraftGenerationDealNotFoundError,
  DraftGenerationServiceUnavailableError,
  generateFollowUpDraftForDeal,
  parseGenerateFollowUpInput
} from "@/lib/services/draft-generation";
import { WorkspaceAccessDeniedError } from "@/lib/services/workspace";

interface RouteContext {
  params: Promise<{
    dealId: string;
  }>;
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const actor = getActorFromRequest(request);
    const { dealId } = await context.params;
    const body = await request.json().catch(() => ({}));
    const payload = parseGenerateFollowUpInput(body);
    const result = await generateFollowUpDraftForDeal(dealId, payload, actor);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Invalid follow-up generation payload.", details: error.flatten() }, { status: 400 });
    }

    if (error instanceof DraftGenerationDealNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    if (error instanceof DraftGenerationServiceUnavailableError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }

    if (error instanceof WorkspaceAccessDeniedError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    console.error("Follow-up generation failed", error);
    return NextResponse.json({ error: "Failed to generate follow-up draft." }, { status: 500 });
  }
}
