import { getPrismaClient } from "@/lib/db/prisma";
import { createUserAwareProvider, openaiProvider } from "@/lib/ai/openai";
import type { ActorIdentity } from "@/lib/auth/actor";
import { logAuditEvent } from "@/lib/services/audit";
import { z } from "zod";

export const autoDraftSchema = z.object({
  subject: z.string(),
  body: z.string(),
  reasoning: z.string(),
});

export type AutoDraftResponse = z.infer<typeof autoDraftSchema>;

/**
 * Automatically intercepts high-value buying signals (score > 75), matches plays,
 * auto-drafts a personalized follow-up with gpt-5.4-mini, and inserts it into
 * the "Outbound Approvals" queue for CRM reps to verify.
 */
export async function processSignalAutomation(
  signalId: string,
  actor?: ActorIdentity
): Promise<{
  success: boolean;
  approvalId?: string;
  reason?: string;
  draft?: AutoDraftResponse;
}> {
  const prisma = getPrismaClient();
  if (!prisma) {
    return { success: false, reason: "Database not configured." };
  }

  // 1. Fetch signal, account, contacts, and active deals
  const signal = await prisma.signal.findUnique({
    where: { id: signalId },
    include: {
      account: {
        include: {
          contacts: true,
          deals: {
            where: {
              stage: {
                notIn: ["CLOSED_WON", "CLOSED_LOST"]
              }
            },
            orderBy: {
              updatedAt: "desc"
            }
          }
        }
      }
    }
  });

  if (!signal) {
    return { success: false, reason: `Signal with ID ${signalId} not found.` };
  }

  // 2. Score threshold check (>75 as specified)
  if (signal.score <= 75) {
    return {
      success: false,
      reason: `Signal score ${signal.score} does not exceed threshold of 75.`
    };
  }

  // 3. Ensure an active deal exists
  const activeDeal = signal.account.deals[0];
  if (!activeDeal) {
    return {
      success: false,
      reason: `No active deal found for account: ${signal.account.name} to trigger automation.`
    };
  }

  // 4. Determine target contact (default to first contact, or placeholder)
  const contact = signal.account.contacts[0];
  const contactName = contact ? contact.fullName.split(" ")[0] : "Team";
  const contactTitle = contact ? contact.title : "Decision Maker";

  // 5. Build prompt and invoke gpt-5.4-mini-2026-03-17 for SOTA cost-free auto-drafting
  const provider = actor ? await createUserAwareProvider(actor) : openaiProvider;

  const systemPrompt = `You are a SOTA Agentforce-style B2B signal automation agent.
Your mission is to analyze high-priority buying signals and draft highly personalized, hyper-targeted outbound emails.
Use a modern, professional, extremely concise B2B SaaS tone (no fluff, clear value, very direct, 5th-grade readability level).
Address the contact natively. Use the buying signal as a direct contextual trigger.`;

  const userPrompt = `
  Analyze this target profile & signal:
  - Account: ${signal.account.name}
  - Active Deal: ${activeDeal.name}
  - Target Contact: ${contactName} (${contactTitle})
  - Signal Type: ${signal.type}
  - Signal Summary: ${signal.summary}

  Draft a compelling email to progress the active sales deal.
  Guidelines:
  1. Address ${contactName} naturally by first name.
  2. Contextualize the signal immediately (e.g. "Saw you recently closed your Series C round..." or "Noticed the procurement team opening roles...").
  3. Offer a very low-friction value alignment and a clear, singular call-to-action (CTA).
  4. Keep the body text under 80 words. No boilerplate introductions like "Hope this email finds you well". Go straight to the point.
  
  Provide structured response:
  - subject: email subject line
  - body: complete email body with proper line breaks
  - reasoning: short summary (under 20 words) explaining why this play was chosen.
  `;

  try {
    const response = await provider.generateJSON<AutoDraftResponse>([
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ], {
      model: "gpt-5.4-mini-2026-03-17",
      schema: autoDraftSchema
    });

    // 6. Save directly into OutboundApproval table (Queued as PENDING for rep review as requested!)
    const approval = await prisma.outboundApproval.create({
      data: {
        dealId: activeDeal.id,
        channel: "EMAIL",
        subject: response.subject,
        body: response.body,
        status: "PENDING",
        requestedBy: "Agentforce Signal Engine"
      }
    });

    // 7. Audit Log integration
    await logAuditEvent({
      dealId: activeDeal.id,
      entityType: "activity",
      entityId: approval.id,
      action: "approval.requested",
      actor: "Agentforce Signal Engine",
      details: `Auto-drafted playbook sequence for signal [${signal.type}]. Rationale: ${response.reasoning}`
    });

    return {
      success: true,
      approvalId: approval.id,
      draft: response
    };
  } catch (error: any) {
    console.error("Signal automation generation failed:", error);
    return {
      success: false,
      reason: `LLM generation failed: ${error.message}`
    };
  }
}
