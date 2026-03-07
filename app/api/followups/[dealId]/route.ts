import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getActorFromRequest } from "@/lib/auth/actor";
import { revalidateDashboardViews } from "@/lib/services/cache-invalidation";
import {
  DraftGenerationDealNotFoundError,
  DraftGenerationServiceUnavailableError,
  parseUpdateFollowUpDraftInput,
  updateFollowUpDraftForDeal
} from "@/lib/services/draft-generation";
import { WorkspaceAccessDeniedError } from "@/lib/services/workspace";

interface RouteContext {
  params: Promise<{
    dealId: string;
  }>;
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const actor = getActorFromRequest(request);
    const { dealId } = await context.params;
    const body = await request.json();
    const payload = parseUpdateFollowUpDraftInput(body);
    const result = await updateFollowUpDraftForDeal(dealId, payload, actor);
    revalidateDashboardViews();
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Invalid follow-up draft payload.", details: error.flatten() }, { status: 400 });
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

    console.error("Follow-up draft update failed", error);
    return NextResponse.json({ error: "Failed to update follow-up draft." }, { status: 500 });
  }
}
