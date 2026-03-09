import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { getActorFromRequest } from "@/lib/auth/actor";
import { revalidateDashboardViews } from "@/lib/services/cache-invalidation";
import {
  captureLinkedInLead,
  LinkedInCaptureServiceUnavailableError,
  parseLinkedInCaptureInput
} from "@/lib/services/linkedin-capture";

export async function POST(request: NextRequest) {
  try {
    const actor = getActorFromRequest(request);
    const body = await request.json();
    const input = parseLinkedInCaptureInput(body);
    const result = await captureLinkedInLead(input, actor);
    revalidateDashboardViews();
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Invalid LinkedIn capture payload.", details: error.issues }, { status: 400 });
    }

    if (error instanceof LinkedInCaptureServiceUnavailableError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }

    console.error("Failed to save LinkedIn capture", error);
    return NextResponse.json({ error: "Failed to save LinkedIn capture." }, { status: 500 });
  }
}
