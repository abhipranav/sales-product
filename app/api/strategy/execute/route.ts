import { NextResponse } from "next/server";
import { z } from "zod";
import { getActorFromRequest } from "@/lib/auth/actor";
import {
  StrategyExecutionError,
  StrategyPlayNotFoundError,
  executeStrategyPlay
} from "@/lib/services/strategy-execution";
import { WorkspaceAccessDeniedError } from "@/lib/services/workspace";

const executePlayInputSchema = z.object({
  playId: z.string().min(1),
  dealId: z.string().min(1)
});

export async function POST(request: Request) {
  try {
    const actor = getActorFromRequest(request);
    const input = executePlayInputSchema.parse(await request.json());
    const result = await executeStrategyPlay(input.playId, input.dealId, actor);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid strategy execution payload.", details: error.flatten() }, { status: 400 });
    }

    if (error instanceof StrategyPlayNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    if (error instanceof StrategyExecutionError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }

    if (error instanceof WorkspaceAccessDeniedError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    console.error("Strategy execution API failed", error);
    return NextResponse.json({ error: "Failed to execute strategy play." }, { status: 500 });
  }
}
