import { NextResponse } from "next/server";
import { z } from "zod";
import { getActorFromServerContext } from "@/lib/auth/actor";
import { runWaterfallEnrichment } from "@/lib/services/enrich-waterfall";

const enrichInputSchema = z.object({
  contactName: z.string().min(2),
  contactTitle: z.string().min(2),
  companyName: z.string().min(2),
  companyDomain: z.string().optional(),
  aboutText: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const actor = await getActorFromServerContext();
    if (!actor?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await req.json().catch(() => ({}));
    const validated = enrichInputSchema.safeParse(payload);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid payload parameters", details: validated.error.flatten() },
        { status: 400 }
      );
    }

    const result = await runWaterfallEnrichment({
      ...validated.data,
      actor,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    if (error.name === "AIProviderError") {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    console.error("Waterfall Enrichment Route Error:", error);
    return NextResponse.json(
      { error: "Failed to perform B2B waterfall data enrichment" },
      { status: 500 }
    );
  }
}
