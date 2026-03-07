import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getActorFromRequest } from "@/lib/auth/actor";
import { revalidateDashboardViews } from "@/lib/services/cache-invalidation";
import {
  DraftGenerationDealNotFoundError,
  DraftGenerationServiceUnavailableError,
  generateMeetingBriefForDeal,
  parseGenerateBriefInput
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
    const payload = parseGenerateBriefInput(body);
    const result = await generateMeetingBriefForDeal(dealId, payload, actor);
    revalidateDashboardViews();
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Invalid brief generation payload.", details: error.flatten() }, { status: 400 });
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

    console.error("Meeting brief generation failed", error);
    return NextResponse.json({ error: "Failed to generate meeting brief." }, { status: 500 });
  }
}
