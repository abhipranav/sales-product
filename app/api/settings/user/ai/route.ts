import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { getActorFromRequest } from "@/lib/auth/actor";
import {
  getUserAISettings,
  parseUpdateAISettingsInput,
  updateUserAISettings,
  AISettingsServiceError
} from "@/lib/services/ai-settings";
import { invalidateSystemReadiness } from "@/lib/services/system-readiness";

export async function GET(request: NextRequest) {
  try {
    const actor = getActorFromRequest(request);
    const settings = await getUserAISettings(actor);
    return NextResponse.json(settings);
  } catch (error) {
    if (error instanceof AISettingsServiceError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }

    console.error("Failed to load AI settings", error);
    return NextResponse.json({ error: "Failed to load AI settings." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const actor = getActorFromRequest(request);
    const body = await request.json();
    const input = parseUpdateAISettingsInput(body);
    const settings = await updateUserAISettings(input, actor);
    invalidateSystemReadiness(actor);
    return NextResponse.json(settings);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Invalid AI settings payload.", details: error.issues }, { status: 400 });
    }

    if (error instanceof AISettingsServiceError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }

    console.error("Failed to update AI settings", error);
    return NextResponse.json({ error: "Failed to update AI settings." }, { status: 500 });
  }
}
