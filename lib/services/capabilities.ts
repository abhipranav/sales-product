import type { Contact, Deal, Signal } from "@/lib/domain/types";

export interface EnrichedContact {
  contactId: string;
  fullName: string;
  role: Contact["role"];
  title: string;
  persona: string;
  influenceScore: number;
  engagementPriority: "high" | "medium" | "low";
  recommendedAngle: string;
}

export interface DedupeCluster {
  key: string;
  reason: "email" | "name-title";
  contacts: Contact[];
}

export interface BuyingSignalAlert {
  id: string;
  priority: "high" | "medium" | "low";
  summary: string;
  detail: string;
  score: number;
  recommendedAction: string;
}

export interface SequencePlan {
  id: string;
  contactId: string;
  contactName: string;
  role: Contact["role"];
  channelMix: string[];
  steps: string[];
}

export interface StakeholderCoverage {
  hasChampion: boolean;
  hasApprover: boolean;
  hasBlocker: boolean;
  hasInfluencer: boolean;
  gapSummary: string;
}

function getRoleWeight(role: Contact["role"]) {
  if (role === "approver") {
    return 92;
  }
  if (role === "champion") {
    return 88;
  }
  if (role === "blocker") {
    return 64;
  }
  return 72;
}

function getPersona(contact: Contact) {
  const title = contact.title.toLowerCase();
  if (title.includes("vp") || title.includes("chief") || title.includes("head")) {
    return "Executive Sponsor";
  }
  if (title.includes("ops") || title.includes("operations")) {
    return "Operational Driver";
  }
  if (title.includes("security") || title.includes("it")) {
    return "Risk Gatekeeper";
  }
  if (title.includes("manager") || title.includes("lead")) {
    return "Execution Owner";
  }
  return "Influence Partner";
}

function getAngle(contact: Contact, topSignal: Signal | undefined) {
  const signalText = topSignal?.summary ?? "current pipeline goals";
  if (contact.role === "approver") {
    return `Anchor on business case and risk mitigation tied to ${signalText}.`;
  }
  if (contact.role === "champion") {
    return `Equip with internal narrative and urgency around ${signalText}.`;
  }
  if (contact.role === "blocker") {
    return `Address objections explicitly with evidence linked to ${signalText}.`;
  }
  return `Use targeted proof points relevant to ${signalText}.`;
}

function normalizeName(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function normalizeTitle(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function enrichContacts(contacts: Contact[], signals: Signal[]): EnrichedContact[] {
  const topSignal = [...signals].sort((a, b) => b.score - a.score)[0];
  return contacts
    .map((contact) => {
      const roleWeight = getRoleWeight(contact.role);
      const signalBoost = topSignal ? Math.round(topSignal.score * 0.12) : 0;
      const influenceScore = Math.min(99, roleWeight + signalBoost);
      const engagementPriority: EnrichedContact["engagementPriority"] =
        influenceScore >= 90 ? "high" : influenceScore >= 76 ? "medium" : "low";

      return {
        contactId: contact.id,
        fullName: contact.fullName,
        role: contact.role,
        title: contact.title,
        persona: getPersona(contact),
        influenceScore,
        engagementPriority,
        recommendedAngle: getAngle(contact, topSignal)
      };
    })
    .sort((a, b) => b.influenceScore - a.influenceScore);
}

export function findContactDedupeClusters(contacts: Contact[]): DedupeCluster[] {
  const clusters: DedupeCluster[] = [];
  const byEmail = new Map<string, Contact[]>();
  const byNameTitle = new Map<string, Contact[]>();

  for (const contact of contacts) {
    if (contact.email) {
      const key = contact.email.trim().toLowerCase();
      const current = byEmail.get(key) ?? [];
      current.push(contact);
      byEmail.set(key, current);
    }

    const nameTitleKey = `${normalizeName(contact.fullName)}::${normalizeTitle(contact.title)}`;
    const currentByName = byNameTitle.get(nameTitleKey) ?? [];
    currentByName.push(contact);
    byNameTitle.set(nameTitleKey, currentByName);
  }

  for (const [key, group] of byEmail.entries()) {
    if (group.length > 1) {
      clusters.push({ key, reason: "email", contacts: group });
    }
  }

  for (const [key, group] of byNameTitle.entries()) {
    if (group.length > 1) {
      const alreadyCaptured = clusters.some((cluster) => cluster.contacts.some((c) => group.some((g) => g.id === c.id)));
      if (!alreadyCaptured) {
        clusters.push({ key, reason: "name-title", contacts: group });
      }
    }
  }

  return clusters;
}

function signalAction(signal: Signal, deal: Deal) {
  if (signal.type === "hiring") {
    return `Position ${deal.name} as staffing leverage and faster onboarding for new roles.`;
  }
  if (signal.type === "funding") {
    return `Propose an accelerated rollout tied to newly available budget.`;
  }
  if (signal.type === "tooling") {
    return `Contrast migration risk with low-friction deployment approach.`;
  }
  return `Trigger a high-touch check-in with the champion this week.`;
}

export function buildBuyingSignalAlerts(signals: Signal[], deal: Deal): BuyingSignalAlert[] {
  return [...signals]
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((signal) => ({
      id: signal.id,
      priority: signal.score >= 78 ? "high" : signal.score >= 60 ? "medium" : "low",
      summary: signal.summary,
      detail: `${signal.type.toUpperCase()} signal scored ${signal.score} impacting ${deal.stage} stage.`,
      score: signal.score,
      recommendedAction: signalAction(signal, deal)
    }));
}

export function buildSequencePlans(contacts: Contact[], deal: Deal, signals: Signal[]): SequencePlan[] {
  const topSignal = [...signals].sort((a, b) => b.score - a.score)[0];
  const orderedContacts = [...contacts].sort((a, b) => getRoleWeight(b.role) - getRoleWeight(a.role)).slice(0, 4);

  return orderedContacts.map((contact) => {
    const stageLabel = deal.stage.replace("-", " ");
    const signalContext = topSignal?.summary ?? "current pipeline urgency";

    return {
      id: `${contact.id}-sequence`,
      contactId: contact.id,
      contactName: contact.fullName,
      role: contact.role,
      channelMix: ["email", "phone", "linkedin"],
      steps: [
        `Send personalized recap referencing ${signalContext} and ${stageLabel} milestones.`,
        `Within 24h, run a phone check-in focused on blockers and decision criteria.`,
        `Share a role-specific proof asset on LinkedIn or email with explicit next-step ask.`
      ]
    };
  });
}

export function buildStakeholderCoverage(contacts: Contact[]): StakeholderCoverage {
  const roles = new Set(contacts.map((contact) => contact.role));
  const hasChampion = roles.has("champion");
  const hasApprover = roles.has("approver");
  const hasBlocker = roles.has("blocker");
  const hasInfluencer = roles.has("influencer");

  const gaps: string[] = [];
  if (!hasChampion) gaps.push("champion");
  if (!hasApprover) gaps.push("approver");
  if (!hasBlocker) gaps.push("blocker");
  if (!hasInfluencer) gaps.push("influencer");

  return {
    hasChampion,
    hasApprover,
    hasBlocker,
    hasInfluencer,
    gapSummary: gaps.length === 0 ? "No critical stakeholder coverage gaps." : `Missing: ${gaps.join(", ")}.`
  };
}
