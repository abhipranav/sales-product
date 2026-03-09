import { z } from "zod";
import type { ActorIdentity } from "@/lib/auth/actor";
import { createUserAwareProvider } from "@/lib/ai/openai";
import { AIProviderError } from "@/lib/ai/provider";

export const linkedInEnrichmentSchema = z.object({
  contactName: z.string().optional(),
  contactTitle: z.string().optional(),
  companyName: z.string().optional(),
  about: z.string().optional().nullable(),
  experience: z.string().optional().nullable(),
  education: z.string().optional().nullable(),
});

export type LinkedInEnrichmentInput = z.infer<typeof linkedInEnrichmentSchema>;

export interface LinkedInEnrichmentResult {
  executiveSummary: string;
  suggestedIcebreaker: string;
  estimatedSeniority: "Executive" | "Director" | "Manager" | "Individual Contributor" | "Unknown";
  salesRelevance: number; // 1-10 string mapped to number later
}

const systemPrompt = `You are an elite B2B sales intelligence AI. 
Analyze the provided LinkedIn profile data and return a concise, high-impact sales brief in JSON format following this exact schema:

{
  "executiveSummary": "1 paragraph (max 3 sentences) summarizing their current role, past trajectory, and likely current priorities based on their experience.",
  "suggestedIcebreaker": "1 sentence, highly personalized, non-generic opening hook based on their career history or education. Do not use 'I saw that you...'",
  "estimatedSeniority": "Executive" | "Director" | "Manager" | "Individual Contributor" | "Unknown",
  "salesRelevance": <number 1-10>
}

Focus on facts, maintain a professional and direct tone.`;

function buildUserPrompt(data: LinkedInEnrichmentInput): string {
  let prompt = `Analyze this LinkedIn profile:\n\n`;
  if (data.contactName) prompt += `Name: ${data.contactName}\n`;
  if (data.contactTitle) prompt += `Title: ${data.contactTitle}\n`;
  if (data.companyName) prompt += `Company: ${data.companyName}\n`;
  
  if (data.about) {
    prompt += `\n--- ABOUT ---\n${data.about}\n`;
  }
  
  if (data.experience) {
    prompt += `\n--- EXPERIENCE ---\n${data.experience}\n`;
  }
  
  if (data.education) {
    prompt += `\n--- EDUCATION ---\n${data.education}\n`;
  }

  return prompt;
}

export async function generateLinkedInSalesBrief(
  data: LinkedInEnrichmentInput,
  actor?: ActorIdentity
): Promise<LinkedInEnrichmentResult> {
  const provider = await createUserAwareProvider(actor);

  try {
    const messages = [
      { role: "system" as const, content: systemPrompt },
      { role: "user" as const, content: buildUserPrompt(data) }
    ];

    const result = await provider.generateJSON<LinkedInEnrichmentResult>(messages);
    
    // Ensure the response matches the expected shape
    return {
      executiveSummary: result.executiveSummary ?? "Information insufficient for a summary.",
      suggestedIcebreaker: result.suggestedIcebreaker ?? "No clear icebreaker found.",
      estimatedSeniority: ["Executive", "Director", "Manager", "Individual Contributor", "Unknown"].includes(result.estimatedSeniority) 
        ? result.estimatedSeniority 
        : "Unknown",
      salesRelevance: typeof result.salesRelevance === "number" ? result.salesRelevance : 5,
    };
  } catch (error) {
    if (error instanceof AIProviderError) throw error;
    throw new Error("Failed to generate LinkedIn sales brief");
  }
}
