import { getPrismaClient } from "@/lib/db/prisma";
import { resolveWorkspaceScope } from "@/lib/services/workspace";
import type { ActorIdentity } from "@/lib/auth/actor";
import { z } from "zod";

const processMeetingNotesSchema = z.object({
  dealId: z.string().min(1),
  notes: z.string().min(20).max(6000),
  happenedAt: z.string().datetime().optional(),
  actor: z.string().min(1).default("rep"),
  source: z.string().min(2).default("manual-notes")
});

type TaskTemplate = {
  title: string;
  dueInHours: number;
  priority: "high" | "medium" | "low";
  suggestedChannel: "email" | "phone" | "linkedin" | "meeting";
};

const priorityMap = {
  high: "HIGH",
  medium: "MEDIUM",
  low: "LOW"
} as const;

const channelMap = {
  email: "EMAIL",
  phone: "PHONE",
  linkedin: "LINKEDIN",
  meeting: "MEETING"
} as const;

const dbPriorityToUi = {
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "low"
} as const;

const dbChannelToUi = {
  EMAIL: "email",
  PHONE: "phone",
  LINKEDIN: "linkedin",
  MEETING: "meeting"
} as const;

export class MeetingNotesServiceUnavailableError extends Error {
  constructor() {
    super("Meeting notes service unavailable because database is not configured.");
    this.name = "MeetingNotesServiceUnavailableError";
  }
}

export class MeetingNotesDealNotFoundError extends Error {
  constructor(dealId: string) {
    super(`Deal not found: ${dealId}`);
    this.name = "MeetingNotesDealNotFoundError";
  }
}

export function parseMeetingNotesInput(payload: unknown) {
  return processMeetingNotesSchema.parse(payload);
}

function hasAny(text: string, keywords: string[]): boolean {
  return keywords.some((keyword) => text.includes(keyword));
}

function compact(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function summarizeNotes(notes: string): string {
  const summary = compact(notes);
  if (summary.length <= 180) {
    return summary;
  }

  return `${summary.slice(0, 177)}...`;
}

function extractLikelyObjections(notes: string): string[] {
  const lower = notes.toLowerCase();
  const objections: string[] = [];

  if (hasAny(lower, ["budget", "cost", "price", "pricing", "discount"])) {
    objections.push("Budget alignment and commercial terms");
  }

  if (hasAny(lower, ["security", "compliance", "legal", "privacy", "nda", "dpa"])) {
    objections.push("Security and legal review requirements");
  }

  if (hasAny(lower, ["integration", "migration", "implementation", "timeline"])) {
    objections.push("Implementation complexity and rollout timeline");
  }

  if (hasAny(lower, ["board", "approval", "approver", "decision", "procurement"])) {
    objections.push("Internal approval process and procurement timing");
  }

  if (objections.length === 0) {
    objections.push("Competing priorities and urgency");
  }

  return objections.slice(0, 3);
}

function derivePrimaryGoal(notes: string): string {
  const normalized = compact(notes);
  const [firstSentence] = normalized.split(/[.!?]/);
  const goal = firstSentence?.trim();

  if (goal && goal.length >= 20) {
    return goal.length <= 120 ? goal : `${goal.slice(0, 117)}...`;
  }

  return "Drive explicit buyer commitment on next-step owners and timeline.";
}

function deriveProofPoints(notes: string): string[] {
  const lower = notes.toLowerCase();
  const proofPoints: string[] = [];

  if (hasAny(lower, ["roi", "savings", "cost"])) {
    proofPoints.push("Cost savings and ROI narrative tailored to account stage");
  }

  if (hasAny(lower, ["security", "compliance", "legal"])) {
    proofPoints.push("Security posture summary and legal readiness packet");
  }

  if (hasAny(lower, ["integration", "implementation", "migration"])) {
    proofPoints.push("Implementation plan with owners, milestones, and risk controls");
  }

  if (proofPoints.length === 0) {
    proofPoints.push("Outcome-focused recap anchored to agreed success criteria");
  }

  return proofPoints.slice(0, 3);
}

function dedupeTemplates(templates: TaskTemplate[]): TaskTemplate[] {
  const seen = new Set<string>();
  const deduped: TaskTemplate[] = [];

  for (const template of templates) {
    const key = template.title.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    deduped.push(template);
  }

  return deduped;
}

function buildTaskTemplates(notes: string): TaskTemplate[] {
  const lower = notes.toLowerCase();

  const templates: TaskTemplate[] = [
    {
      title: "Send recap with explicit owners and due dates",
      dueInHours: 4,
      priority: "high",
      suggestedChannel: "email"
    }
  ];

  if (hasAny(lower, ["security", "legal", "nda", "dpa", "compliance"])) {
    templates.push({
      title: "Share security and legal packet with reviewer",
      dueInHours: 12,
      priority: "high",
      suggestedChannel: "email"
    });
  }

  if (hasAny(lower, ["budget", "pricing", "discount", "commercial"])) {
    templates.push({
      title: "Prepare pricing options with ROI framing",
      dueInHours: 24,
      priority: "medium",
      suggestedChannel: "email"
    });
  }

  if (hasAny(lower, ["demo", "trial", "poc", "pilot"])) {
    templates.push({
      title: "Schedule product walkthrough or pilot kickoff",
      dueInHours: 24,
      priority: "medium",
      suggestedChannel: "meeting"
    });
  }

  if (hasAny(lower, ["approver", "decision", "board", "procurement", "stakeholder"])) {
    templates.push({
      title: "Confirm decision process and map approvers",
      dueInHours: 36,
      priority: "medium",
      suggestedChannel: "meeting"
    });
  }

  if (hasAny(lower, ["follow up", "follow-up", "next week", "timeline"])) {
    templates.push({
      title: "Lock next meeting slot and mutual action plan",
      dueInHours: 20,
      priority: "high",
      suggestedChannel: "meeting"
    });
  }

  return dedupeTemplates(templates).slice(0, 4);
}

function addHours(base: Date, hours: number): Date {
  return new Date(base.getTime() + hours * 60 * 60 * 1000);
}

function buildFollowUpBody(accountName: string, summary: string, tasks: TaskTemplate[]): string {
  const actionLines = tasks.slice(0, 3).map((task) => `- ${task.title}`).join("\n");

  return [
    `Thanks for the conversation today, ${accountName} team.`,
    `Key recap: ${summary}`,
    "Proposed next steps:",
    actionLines,
    "If this aligns, please confirm owners and target dates."
  ].join("\n");
}

export async function processMeetingNotes(
  payload: z.infer<typeof processMeetingNotesSchema>,
  actorIdentity?: ActorIdentity
) {
  const prisma = getPrismaClient();

  if (!prisma) {
    throw new MeetingNotesServiceUnavailableError();
  }

  const workspaceScope = await resolveWorkspaceScope(prisma, actorIdentity);
  const actorEmail = workspaceScope?.actorEmail ?? payload.actor;

  const deal = await prisma.deal.findFirst({
    where: {
      OR: [{ id: payload.dealId }, { externalId: payload.dealId }],
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
        select: {
          name: true
        }
      }
    }
  });

  if (!deal) {
    throw new MeetingNotesDealNotFoundError(payload.dealId);
  }

  const happenedAt = payload.happenedAt ? new Date(payload.happenedAt) : new Date();
  const summary = summarizeNotes(payload.notes);
  const objections = extractLikelyObjections(payload.notes);
  const proofPoints = deriveProofPoints(payload.notes);
  const taskTemplates = buildTaskTemplates(payload.notes);

  const activity = await prisma.activity.create({
    data: {
      dealId: deal.id,
      type: "NOTE",
      happenedAt,
      summary
    }
  });

  const createdTasks = await prisma.$transaction(
    taskTemplates.map((template) =>
      prisma.task.create({
        data: {
          dealId: deal.id,
          title: template.title,
          owner: "REP",
          dueAt: addHours(happenedAt, template.dueInHours),
          priority: priorityMap[template.priority],
          status: "TODO",
          suggestedChannel: channelMap[template.suggestedChannel]
        }
      })
    )
  );

  const primaryGoal = derivePrimaryGoal(payload.notes);
  const recommendedNarrative = `Lead with business impact, then de-risk execution using concrete proof points.`;

  const meetingBrief = await prisma.meetingBrief.upsert({
    where: {
      dealId: deal.id
    },
    create: {
      dealId: deal.id,
      primaryGoal,
      likelyObjections: objections,
      recommendedNarrative,
      proofPoints
    },
    update: {
      primaryGoal,
      likelyObjections: objections,
      recommendedNarrative,
      proofPoints
    }
  });

  const followUpDraft = await prisma.followUpDraft.upsert({
    where: {
      dealId: deal.id
    },
    create: {
      dealId: deal.id,
      subject: `${deal.account.name}: recap and next steps`,
      body: buildFollowUpBody(deal.account.name, summary, taskTemplates),
      ask: "Can you confirm owners and dates for the next-step plan?",
      ctaTimeWindow: "Within the next 24 hours"
    },
    update: {
      subject: `${deal.account.name}: recap and next steps`,
      body: buildFollowUpBody(deal.account.name, summary, taskTemplates),
      ask: "Can you confirm owners and dates for the next-step plan?",
      ctaTimeWindow: "Within the next 24 hours"
    }
  });

  await prisma.auditLog.createMany({
    data: [
      {
        dealId: deal.id,
        entityType: "activity",
        entityId: activity.externalId ?? activity.id,
        action: "meeting-notes.processed",
        actor: actorEmail,
        details: `${payload.source}: notes captured and execution plan generated.`
      },
      ...createdTasks.map((task) => ({
        dealId: deal.id,
        taskId: task.id,
        entityType: "task",
        entityId: task.externalId ?? task.id,
        action: "task.created.from-notes",
        actor: actorEmail,
        details: `Generated from meeting notes: ${task.title}`
      }))
    ]
  });

  return {
    activity: {
      id: activity.externalId ?? activity.id,
      dealId: deal.externalId ?? deal.id,
      type: "note" as const,
      happenedAt: activity.happenedAt.toISOString(),
      summary: activity.summary
    },
    generatedTasks: createdTasks.map((task) => ({
      id: task.externalId ?? task.id,
      dealId: deal.externalId ?? deal.id,
      title: task.title,
      owner: "rep" as const,
      dueAt: task.dueAt.toISOString(),
      priority: dbPriorityToUi[task.priority],
      status: "todo" as const,
      suggestedChannel: dbChannelToUi[task.suggestedChannel]
    })),
    meetingBrief: {
      primaryGoal: meetingBrief.primaryGoal,
      likelyObjections: meetingBrief.likelyObjections,
      recommendedNarrative: meetingBrief.recommendedNarrative,
      proofPoints: meetingBrief.proofPoints
    },
    followUpDraft: {
      subject: followUpDraft.subject,
      body: followUpDraft.body,
      ask: followUpDraft.ask,
      ctaTimeWindow: followUpDraft.ctaTimeWindow
    }
  };
}
