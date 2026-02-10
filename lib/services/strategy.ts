import type { Activity, Deal, OutboundApproval, Signal, StrategyPlay, Task } from "@/lib/domain/types";
import { isAIConfigured, openaiProvider } from "@/lib/ai";
import type { AIMessage } from "@/lib/ai";

function hasKeyword(value: string, keywords: string[]): boolean {
  const lower = value.toLowerCase();
  return keywords.some((keyword) => lower.includes(keyword));
}

function clampConfidence(value: number): number {
  return Math.max(0.35, Math.min(0.95, value));
}

function avgSignalScore(signals: Signal[]): number {
  if (signals.length === 0) {
    return 65;
  }

  const total = signals.reduce((sum, signal) => sum + signal.score, 0);
  return total / signals.length;
}

function pendingApprovals(approvals: OutboundApproval[]): number {
  return approvals.filter((approval) => approval.status === "pending").length;
}

function overdueHighPriorityTasks(tasks: Task[]): number {
  const now = Date.now();
  return tasks.filter((task) => task.priority === "high" && new Date(task.dueAt).getTime() < now).length;
}

function hasSecurityRisk(deal: Deal, activities: Activity[]): boolean {
  if (hasKeyword(deal.riskSummary, ["security", "legal", "compliance", "procurement"])) {
    return true;
  }

  return activities.some((activity) =>
    hasKeyword(activity.summary, ["security", "legal", "compliance", "procurement", "questionnaire"])
  );
}

function hasSingleThreadRisk(activities: Activity[]): boolean {
  const influencerWords = ["champion", "only contact", "single", "loop in"];
  return activities.some((activity) => hasKeyword(activity.summary, influencerWords));
}

// Fallback to rule-based plays when AI is not configured
function buildRuleBasedPlays(input: {
  deal: Deal;
  signals: Signal[];
  tasks: Task[];
  approvals: OutboundApproval[];
  recentActivities: Activity[];
}): StrategyPlay[] {
  const signalStrength = avgSignalScore(input.signals);
  const pendingApprovalCount = pendingApprovals(input.approvals);
  const overduePriorityTasks = overdueHighPriorityTasks(input.tasks);
  const securityRisk = hasSecurityRisk(input.deal, input.recentActivities);
  const singleThreadRisk = hasSingleThreadRisk(input.recentActivities);

  const plays: StrategyPlay[] = [];

  plays.push({
    id: "play-commitment-map",
    title: "Mutual Commitment Map",
    thesis: "Replace loose follow-ups with explicit owner/date commitments in one shared map.",
    trigger:
      overduePriorityTasks > 0
        ? `${overduePriorityTasks} high-priority tasks are overdue.`
        : "Follow-up execution must stay deterministic as deal pressure rises.",
    steps: [
      "Send one-page mutual action map with named owners.",
      "Book a 15-minute confirmation call in the next 24 hours.",
      "Convert every verbal commitment into task + deadline immediately."
    ],
    expectedImpact: "Improves velocity and reduces silent stalls in mid-stage deals.",
    confidence: clampConfidence(input.deal.confidence + signalStrength / 500)
  });

  if (securityRisk) {
    plays.push({
      id: "play-risk-frontload",
      title: "Risk Front-Load",
      thesis: "Surface security/legal objections before commercial negotiation to prevent late-stage drag.",
      trigger: "Detected compliance/procurement language in risk summary or activity stream.",
      steps: [
        "Share security packet and legal baseline proactively.",
        "Ask buyer to nominate a single reviewer and target review date.",
        "Track review as a separate approval lane with escalation triggers."
      ],
      expectedImpact: "Reduces cycle slippage caused by late risk discovery.",
      confidence: clampConfidence(0.72 + signalStrength / 600)
    });
  }

  plays.push({
    id: "play-multithread",
    title: "Decision Surface Expansion",
    thesis: "Build 3-person deal coverage to prevent single-thread champion failure.",
    trigger: singleThreadRisk ? "Activity stream indicates potential single-thread dependency." : "Standard expansion play.",
    steps: [
      "Map approver + blocker + champion with explicit influence labels.",
      "Create one value artifact tailored to each stakeholder.",
      "Secure a joint call with at least two buyer roles."
    ],
    expectedImpact: "Raises close probability and protects forecast quality.",
    confidence: clampConfidence(0.68 + signalStrength / 700)
  });

  if (pendingApprovalCount > 0) {
    plays.push({
      id: "play-approval-throughput",
      title: "Approval Throughput Sprint",
      thesis: "Treat outbound approvals as a latency bottleneck and clear them in dedicated windows.",
      trigger: `${pendingApprovalCount} outbound approvals are currently pending.`,
      steps: [
        "Batch pending approvals into one reviewer queue.",
        "Set strict approve/reject SLA under 4 business hours.",
        "Auto-convert approved items to outbound channel adapters."
      ],
      expectedImpact: "Improves response speed without sacrificing governance.",
      confidence: clampConfidence(0.74)
    });
  }

  return plays.slice(0, 4);
}

interface AIGeneratedPlay {
  title: string;
  thesis: string;
  trigger: string;
  steps: string[];
  expectedImpact: string;
  confidence: number;
}

interface AIPlaysResponse {
  plays: AIGeneratedPlay[];
}

async function buildAIGeneratedPlays(input: {
  deal: Deal;
  signals: Signal[];
  tasks: Task[];
  approvals: OutboundApproval[];
  recentActivities: Activity[];
}): Promise<StrategyPlay[]> {
  const signalSummaries = input.signals.map((s) => `${s.type}: ${s.summary} (score: ${s.score})`).join("\n");
  const activitySummaries = input.recentActivities.map((a) => `${a.type}: ${a.summary}`).join("\n");
  const taskSummaries = input.tasks.map((t) => `${t.title} (${t.priority}, ${t.status})`).join("\n");
  const pendingApprovalCount = pendingApprovals(input.approvals);
  const overdueCount = overdueHighPriorityTasks(input.tasks);

  const systemPrompt = `You are a strategic sales advisor. Generate actionable sales strategy plays based on deal context.
Each play must have:
- title: Short, memorable name for the play
- thesis: Core strategic insight (1-2 sentences)
- trigger: What signals or conditions led to this recommendation
- steps: 3 specific, actionable steps to execute (each step must be concrete and doable)
- expectedImpact: What outcome this play drives
- confidence: 0.35-0.95 confidence score based on signal strength

Focus on:
1. Deal velocity and momentum
2. Stakeholder alignment and influence
3. Risk mitigation (security, legal, budget)
4. Follow-up execution and accountability

Return a JSON object with a "plays" array containing 2-4 plays.`;

  const userPrompt = `Generate strategy plays for this deal:

**Deal:** ${input.deal.name}
- Stage: ${input.deal.stage}
- Amount: $${input.deal.amount.toLocaleString()}
- Confidence: ${Math.round(input.deal.confidence * 100)}%
- Close Date: ${input.deal.closeDate}
- Risk Summary: ${input.deal.riskSummary}

**Buying Signals:**
${signalSummaries || "No recent signals"}

**Recent Activities:**
${activitySummaries || "No recent activities"}

**Current Tasks:**
${taskSummaries || "No active tasks"}

**Context:**
- Overdue high-priority tasks: ${overdueCount}
- Pending outbound approvals: ${pendingApprovalCount}

Generate 2-4 strategic plays tailored to this specific deal situation.`;

  const messages: AIMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt }
  ];

  try {
    const response = await openaiProvider.generateJSON<AIPlaysResponse>(messages, {
      temperature: 0.7,
      maxTokens: 1500
    });

    return response.plays.slice(0, 4).map((play, index) => ({
      id: `play-ai-${index + 1}-${Date.now()}`,
      title: play.title,
      thesis: play.thesis,
      trigger: play.trigger,
      steps: play.steps.slice(0, 4),
      expectedImpact: play.expectedImpact,
      confidence: clampConfidence(play.confidence)
    }));
  } catch (error) {
    console.error("AI strategy generation failed, falling back to rules:", error);
    return buildRuleBasedPlays(input);
  }
}

export async function buildStrategyPlays(input: {
  deal: Deal;
  signals: Signal[];
  tasks: Task[];
  approvals: OutboundApproval[];
  recentActivities: Activity[];
}): Promise<StrategyPlay[]> {
  if (isAIConfigured()) {
    return buildAIGeneratedPlays(input);
  }
  return buildRuleBasedPlays(input);
}

// Legacy sync export for backward compatibility (uses rules only)
export function buildStrategyPlaysSync(input: {
  deal: Deal;
  signals: Signal[];
  tasks: Task[];
  approvals: OutboundApproval[];
  recentActivities: Activity[];
}): StrategyPlay[] {
  return buildRuleBasedPlays(input);
}
