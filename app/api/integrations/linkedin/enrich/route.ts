import { NextResponse } from "next/server";
import { z } from "zod";
import { getActorFromServerContext } from "@/lib/auth/actor";
import { generateLinkedInSalesBrief, linkedInEnrichmentSchema } from "@/lib/services/linkedin-enrich";

export async function POST(req: Request) {
  try {
    const actor = await getActorFromServerContext();
    if (!actor?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await req.json().catch(() => ({}));
    const validated = linkedInEnrichmentSchema.safeParse(payload);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: validated.error.flatten() },
        { status: 400 }
      );
    }

    const result = await generateLinkedInSalesBrief(validated.data, actor);

    return NextResponse.json({ success: true, summary: result });
  } catch (error: any) {
    if (error.name === "AIProviderError") {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    console.error("LinkedIn Enrichment Error:", error);
    return NextResponse.json(
      { error: "Failed to generate AI enrichment brief" },
      { status: 500 }
    );
  }
}
