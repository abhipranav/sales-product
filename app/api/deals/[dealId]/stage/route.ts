import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getActorFromRequest } from "@/lib/auth/actor";
import {
  updateDealStage,
  CrmServiceUnavailableError,
  CrmRecordNotFoundError
} from "@/lib/services/crm-records";

const stageUpdateSchema = z.object({
  stage: z.enum(["discovery", "evaluation", "proposal", "procurement", "closed-won", "closed-lost"])
});

interface RouteContext {
  params: Promise<{ dealId: string }>;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { dealId } = await context.params;
    const actor = getActorFromRequest(request);
    const body = await request.json();
    const { stage } = stageUpdateSchema.parse(body);

    const result = await updateDealStage(dealId, stage, actor);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof CrmServiceUnavailableError) {
      return NextResponse.json({ error: "CRM service unavailable" }, { status: 503 });
    }
    if (error instanceof CrmRecordNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid stage value", details: error.issues }, { status: 400 });
    }
    console.error("Error updating deal stage:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
