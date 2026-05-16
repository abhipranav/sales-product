import { NextResponse } from "next/server";
import { z } from "zod";
import { getActorFromServerContext } from "@/lib/auth/actor";
import { createUserAwareProvider } from "@/lib/ai/openai";

const refineInputSchema = z.object({
  subject: z.string().min(1),
  body: z.string().min(1),
  instruction: z.enum(["shorten", "punchier", "executive", "simplify"]),
});

const refineOutputSchema = z.object({
  subject: z.string(),
  body: z.string(),
  explanation: z.string(),
});

export async function POST(req: Request) {
  try {
    const actor = await getActorFromServerContext();
    if (!actor?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await req.json().catch(() => ({}));
    const validated = refineInputSchema.safeParse(payload);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid payload parameters", details: validated.error.flatten() },
        { status: 400 }
      );
    }

    const { subject, body, instruction } = validated.data;
    const provider = await createUserAwareProvider(actor);

    let instructionText = "";
    if (instruction === "shorten") {
      instructionText = "Reduce word count and eliminate filler phrases. Try to keep the body under 60 words.";
    } else if (instruction === "punchier") {
      instructionText = "Enhance the impact of the opening sentence and CTA. Use strong action verbs.";
    } else if (instruction === "executive") {
      instructionText = "Adopt an elite, authoritative, respectful tone optimized for C-suite decision makers.";
    } else if (instruction === "simplify") {
      instructionText = "Simplify grammar and vocabulary to target a 5th-grade Flesch-Kincaid readability level.";
    }

    const systemPrompt = `You are an expert email refiner. Your task is to edit a sales email draft based on a specific optimization goal.
Keep the output extremely tight, clean, professional, and clear. Avoid typical AI email introduction clichés.`;

    const userPrompt = `
    Optimization Command: ${instructionText}

    CURRENT DRAFT:
    Subject: ${subject}
    Body:
    ${body}

    Refine the subject and body according to the instruction. Return clean JSON following the schema.`;

    const result = await provider.generateJSON<z.infer<typeof refineOutputSchema>>([
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ], {
      model: "gpt-5.4-mini-2026-03-17",
      schema: refineOutputSchema
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error("Refinement Route Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to refine draft" },
      { status: 500 }
    );
  }
}
