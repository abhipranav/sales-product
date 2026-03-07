import { z } from "zod";
import { getPrismaClient } from "@/lib/db/prisma";
import type { ActorIdentity } from "@/lib/auth/actor";
import { resolveWorkspaceScope } from "@/lib/services/workspace";
import { AIProviderError, createUserAwareProvider, type AIProvider } from "@/lib/ai";

const toneSchema = z.enum(["concise", "consultative", "executive"]);

const generateFollowUpInputSchema = z.object({
  notes: z.string().min(20).max(6000).optional(),
  tone: toneSchema.default("consultative")
});

const generateBriefInputSchema = z.object({
  notes: z.string().min(20).max(6000).optional(),
  focus: z.string().min(3).max(160).optional()
});

const updateFollowUpDraftInputSchema = z.object({
  subject: z.string().min(5).max(160),
  body: z.string().min(20).max(3000),
  ask: z.string().min(5).max(240),
  ctaTimeWindow: z.string().min(3).max(120)
});

const followUpShapeSchema = z.object({
  subject: z.string().min(5).max(160),
  body: z.string().min(20).max(3000),
  ask: z.string().min(5).max(240),
  ctaTimeWindow: z.string().min(3).max(120)
});

const briefShapeSchema = z.object({
  primaryGoal: z.string().min(10).max(240),
  likelyObjections: z.array(z.string().min(3).max(180)).min(1).max(5),
  recommendedNarrative: z.string().min(15).max(500),
  proofPoints: z.array(z.string().min(3).max(220)).min(1).max(5)
});

type FollowUpShape = z.infer<typeof followUpShapeSchema>;
type BriefShape = z.infer<typeof briefShapeSchema>;

type FollowUpTone = z.infer<typeof toneSchema>;

const objectionKeywords = [
  { key: "budget", value: "Budget alignment and commercial terms" },
  { key: "pricing", value: "Pricing, ROI, and discount justification" },
  { key: "security", value: "Security and legal review process" },
  { key: "legal", value: "Security and legal review process" },
  { key: "integration", value: "Implementation complexity and timeline risk" },
  { key: "migration", value: "Implementation complexity and timeline risk" },
  { key: "procurement", value: "Procurement and stakeholder alignment timing" },
  { key: "approval", value: "Internal approval dependencies" }
] as const;

export class DraftGenerationServiceUnavailableError extends Error {
  constructor() {
    super("Draft generation service unavailable because database is not configured.");
    this.name = "DraftGenerationServiceUnavailableError";
  }
}

export class DraftGenerationDealNotFoundError extends Error {
  constructor(dealId: string) {
    super(`Deal not found: ${dealId}`);
    this.name = "DraftGenerationDealNotFoundError";
  }
}

export function parseGenerateFollowUpInput(payload: unknown) {
  return generateFollowUpInputSchema.parse(payload);
}

export function parseGenerateBriefInput(payload: unknown) {
  return generateBriefInputSchema.parse(payload);
}

export function parseUpdateFollowUpDraftInput(payload: unknown) {
  return updateFollowUpDraftInputSchema.parse(payload);
}

function compact(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function summarizeContext(notes: string | undefined, activitySummary: string | undefined, riskSummary: string): string {
  const source = notes ? compact(notes) : activitySummary ? compact(activitySummary) : compact(riskSummary);
  if (!source) {
    return "Alignment on next-step owners and execution timeline.";
  }

  return source.length <= 180 ? source : `${source.slice(0, 177)}...`;
}

function inferObjections(text: string, riskSummary: string) {
  const normalized = `${text} ${riskSummary}`.toLowerCase();
  const objections = new Set<string>();

  for (const keyword of objectionKeywords) {
    if (normalized.includes(keyword.key)) {
      objections.add(keyword.value);
    }
  }

  if (objections.size === 0) {
    objections.add("Competing priorities and urgency alignment");
    objections.add("Execution confidence and implementation ownership");
  }

  return [...objections].slice(0, 4);
}

function tonePrompt(tone: FollowUpTone) {
  if (tone === "concise") {
    return "Use compact language with short paragraphs.";
  }
  if (tone === "executive") {
    return "Use executive style: strategic, crisp, and outcome-focused.";
  }
  return "Use consultative style: clear, warm, and action-oriented.";
}

function fallbackFollowUp(
  dealName: string,
  accountName: string,
  contextSummary: string,
  objections: string[],
  tone: FollowUpTone
): FollowUpShape {
  const toneLead =
    tone === "executive"
      ? "From a leadership standpoint, we should keep momentum with clear owner commitments."
      : tone === "concise"
        ? "Quick recap and next steps."
        : "Thanks again for the discussion today.";

  const bulletLines = objections
    .slice(0, 3)
    .map((item, index) => `${index + 1}. Address ${item.toLowerCase()}.`)
    .join("\n");

  return {
    subject: `${accountName}: ${dealName} next steps`,
    body: `${toneLead}\n\nContext: ${contextSummary}\n\nPriority actions:\n${bulletLines}\n\nReply with owner + target date for each item and we will proceed immediately.`,
    ask: "Can you confirm owners and dates for the action plan?",
    ctaTimeWindow: "Within the next 24 hours"
  };
}

function fallbackBrief(dealName: string, contextSummary: string, objections: string[]): BriefShape {
  return {
    primaryGoal: `Secure commitment on the next-step plan for ${dealName} with named owners and target dates.`,
    likelyObjections: objections.slice(0, 3),
    recommendedNarrative:
      `Open with outcomes and urgency from the latest context: ${contextSummary}. Then de-risk execution with explicit ownership, timeline, and governance clarity.`,
    proofPoints: [
      "Outcome-focused recap linked to buyer priorities",
      "Execution plan with owners and milestone checkpoints",
      "Risk-control evidence for security, legal, and procurement paths"
    ]
  };
}

async function generateFollowUpWithAI(params: {
  provider: AIProvider;
  dealName: string;
  accountName: string;
  contextSummary: string;
  objections: string[];
  tone: FollowUpTone;
}) {
  const { provider, dealName, accountName, contextSummary, objections, tone } = params;
  const prompt = [
    `Deal: ${dealName}`,
    `Account: ${accountName}`,
    `Context summary: ${contextSummary}`,
    `Likely objections: ${objections.join("; ")}`,
    tonePrompt(tone),
    "Return JSON with keys subject, body, ask, ctaTimeWindow."
  ].join("\n");

  const result = await provider.generateJSON<FollowUpShape>(
    [
      {
        role: "system",
        content:
          "You are a B2B sales execution assistant. Generate concise and practical follow-up drafts. Return strict JSON."
      },
      { role: "user", content: prompt }
    ]
  );

  return followUpShapeSchema.parse(result);
}

async function generateBriefWithAI(params: {
  provider: AIProvider;
  dealName: string;
  contextSummary: string;
  objections: string[];
  focus?: string;
}) {
  const { provider, dealName, contextSummary, objections, focus } = params;
  const prompt = [
    `Deal: ${dealName}`,
    `Context summary: ${contextSummary}`,
    `Likely objections: ${objections.join("; ")}`,
    focus ? `Extra focus: ${focus}` : "",
    "Return JSON with keys primaryGoal, likelyObjections[], recommendedNarrative, proofPoints[]."
  ]
    .filter(Boolean)
    .join("\n");

  const result = await provider.generateJSON<BriefShape>(
    [
      {
        role: "system",
        content:
          "You are a B2B sales strategist. Produce practical meeting briefs with clear goals and proof points. Return strict JSON."
      },
      { role: "user", content: prompt }
    ]
  );

  return briefShapeSchema.parse(result);
}

async function loadDealContext(dealId: string, actor?: ActorIdentity) {
  const prisma = getPrismaClient();
  if (!prisma) {
    throw new DraftGenerationServiceUnavailableError();
  }

  const workspaceScope = await resolveWorkspaceScope(prisma, actor);
  const deal = await prisma.deal.findFirst({
    where: {
      OR: [{ id: dealId }, { externalId: dealId }],
      ...(workspaceScope?.workspaceId
        ? {
            account: {
              workspaceId: workspaceScope.workspaceId
            }
          }
        : {})
    },
    include: {
      account: {
        include: {
          signals: {
            orderBy: { happenedAt: "desc" },
            take: 3
          }
        }
      },
      activities: {
        orderBy: { happenedAt: "desc" },
        take: 3
      }
    }
  });

  if (!deal) {
    throw new DraftGenerationDealNotFoundError(dealId);
  }

  return { prisma, deal };
}

export async function generateFollowUpDraftForDeal(
  dealId: string,
  payload: z.infer<typeof generateFollowUpInputSchema>,
  actor?: ActorIdentity
) {
  const { prisma, deal } = await loadDealContext(dealId, actor);
  const contextSummary = summarizeContext(payload.notes, deal.activities[0]?.summary, deal.riskSummary);
  const objections = inferObjections(payload.notes ?? contextSummary, deal.riskSummary);

  let draft: FollowUpShape;
  let source: "ai" | "rule-based" = "rule-based";

  try {
    const provider = await createUserAwareProvider(actor);
    draft = await generateFollowUpWithAI({
      provider,
      dealName: deal.name,
      accountName: deal.account.name,
      contextSummary,
      objections,
      tone: payload.tone
    });
    source = "ai";
  } catch (error) {
    if (!(error instanceof AIProviderError)) {
      console.warn("AI follow-up generation failed, using fallback.", error);
    }
    draft = fallbackFollowUp(deal.name, deal.account.name, contextSummary, objections, payload.tone);
    source = "rule-based";
  }

  const saved = await prisma.followUpDraft.upsert({
    where: {
      dealId: deal.id
    },
    create: {
      dealId: deal.id,
      subject: draft.subject,
      body: draft.body,
      ask: draft.ask,
      ctaTimeWindow: draft.ctaTimeWindow
    },
    update: {
      subject: draft.subject,
      body: draft.body,
      ask: draft.ask,
      ctaTimeWindow: draft.ctaTimeWindow
    }
  });

  return {
    dealId: deal.externalId ?? deal.id,
    draft: {
      subject: saved.subject,
      body: saved.body,
      ask: saved.ask,
      ctaTimeWindow: saved.ctaTimeWindow
    },
    source,
    generatedAt: new Date().toISOString()
  };
}

export async function generateMeetingBriefForDeal(
  dealId: string,
  payload: z.infer<typeof generateBriefInputSchema>,
  actor?: ActorIdentity
) {
  const { prisma, deal } = await loadDealContext(dealId, actor);
  const contextSummary = summarizeContext(payload.notes, deal.activities[0]?.summary, deal.riskSummary);
  const objections = inferObjections(payload.notes ?? contextSummary, deal.riskSummary);

  let brief: BriefShape;
  let source: "ai" | "rule-based" = "rule-based";

  try {
    const provider = await createUserAwareProvider(actor);
    brief = await generateBriefWithAI({
      provider,
      dealName: deal.name,
      contextSummary,
      objections,
      focus: payload.focus
    });
    source = "ai";
  } catch (error) {
    if (!(error instanceof AIProviderError)) {
      console.warn("AI brief generation failed, using fallback.", error);
    }
    brief = fallbackBrief(deal.name, contextSummary, objections);
    source = "rule-based";
  }

  const saved = await prisma.meetingBrief.upsert({
    where: {
      dealId: deal.id
    },
    create: {
      dealId: deal.id,
      primaryGoal: brief.primaryGoal,
      likelyObjections: brief.likelyObjections,
      recommendedNarrative: brief.recommendedNarrative,
      proofPoints: brief.proofPoints
    },
    update: {
      primaryGoal: brief.primaryGoal,
      likelyObjections: brief.likelyObjections,
      recommendedNarrative: brief.recommendedNarrative,
      proofPoints: brief.proofPoints
    }
  });

  return {
    dealId: deal.externalId ?? deal.id,
    brief: {
      primaryGoal: saved.primaryGoal,
      likelyObjections: saved.likelyObjections,
      recommendedNarrative: saved.recommendedNarrative,
      proofPoints: saved.proofPoints
    },
    source,
    generatedAt: new Date().toISOString()
  };
}

export async function updateFollowUpDraftForDeal(
  dealId: string,
  payload: z.infer<typeof updateFollowUpDraftInputSchema>,
  actor?: ActorIdentity
) {
  const { prisma, deal } = await loadDealContext(dealId, actor);

  const saved = await prisma.followUpDraft.upsert({
    where: {
      dealId: deal.id
    },
    create: {
      dealId: deal.id,
      subject: payload.subject,
      body: payload.body,
      ask: payload.ask,
      ctaTimeWindow: payload.ctaTimeWindow
    },
    update: {
      subject: payload.subject,
      body: payload.body,
      ask: payload.ask,
      ctaTimeWindow: payload.ctaTimeWindow
    }
  });

  return {
    dealId: deal.externalId ?? deal.id,
    draft: {
      subject: saved.subject,
      body: saved.body,
      ask: saved.ask,
      ctaTimeWindow: saved.ctaTimeWindow
    },
    updatedAt: new Date().toISOString()
  };
}
