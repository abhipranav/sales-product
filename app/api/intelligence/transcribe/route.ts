import { NextResponse } from "next/server";
import { z } from "zod";
import { getActorFromServerContext } from "@/lib/auth/actor";
import { processConversationIntelligence } from "@/lib/services/conversation-intelligence";

const transcribeInputSchema = z.object({
  dealId: z.string().min(1),
  audioFileName: z.string().optional().default("call-recording.mp3"),
});

export async function POST(req: Request) {
  try {
    const actor = await getActorFromServerContext();
    if (!actor?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await req.json().catch(() => ({}));
    const validated = transcribeInputSchema.safeParse(payload);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid payload parameters", details: validated.error.flatten() },
        { status: 400 }
      );
    }

    const result = await processConversationIntelligence(
      validated.data.dealId,
      validated.data.audioFileName,
      actor
    );

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    if (error.name === "AIProviderError") {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    console.error("Transcription Route Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process call transcription" },
      { status: 500 }
    );
  }
}
