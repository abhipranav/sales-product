export type StakeholderRole = "champion" | "approver" | "blocker" | "influencer";

export interface Account {
  id: string;
  name: string;
  segment: "startup" | "mid-market" | "enterprise";
  website?: string;
  employeeBand?: string;
  signals: Signal[];
}

export interface Contact {
  id: string;
  accountId: string;
  fullName: string;
  title: string;
  email?: string;
  linkedInUrl?: string;
  role: StakeholderRole;
}

export interface Deal {
  id: string;
  accountId: string;
  name: string;
  stage: "discovery" | "evaluation" | "proposal" | "procurement" | "closed-won" | "closed-lost";
  amount: number;
  confidence: number;
  closeDate: string;
  riskSummary: string;
}

export interface Signal {
  id: string;
  accountId: string;
  type: "hiring" | "funding" | "tooling" | "engagement";
  summary: string;
  happenedAt: string;
  score: number;
}

export interface Activity {
  id: string;
  dealId: string;
  type: "call" | "email" | "meeting" | "note";
  happenedAt: string;
  summary: string;
}

export interface Task {
  id: string;
  dealId: string;
  title: string;
  owner: "rep" | "manager" | "system";
  dueAt: string;
  priority: "high" | "medium" | "low";
  status: "todo" | "in-progress" | "done";
  suggestedChannel: "email" | "phone" | "linkedin" | "meeting";
}

export interface PipelineMetrics {
  openDeals: number;
  openPipelineAmount: number;
  weightedPipelineAmount: number;
  overdueTasks: number;
  highPriorityTasks: number;
}

export interface AuditEvent {
  id: string;
  entityType: "task" | "calendar-event" | "activity";
  entityId: string;
  action: string;
  actor: string;
  details: string;
  happenedAt: string;
}

export interface MeetingBrief {
  accountName: string;
  primaryGoal: string;
  likelyObjections: string[];
  recommendedNarrative: string;
  proofPoints: string[];
}

export interface FollowUpDraft {
  subject: string;
  body: string;
  ask: string;
  ctaTimeWindow: string;
}

export interface OutboundApproval {
  id: string;
  dealId: string;
  channel: "email" | "phone" | "linkedin" | "meeting";
  subject: string;
  body: string;
  status: "pending" | "approved" | "rejected";
  requestedBy: string;
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  createdAt: string;
}

export interface StrategyPlay {
  id: string;
  title: string;
  thesis: string;
  trigger: string;
  steps: string[];
  expectedImpact: string;
  confidence: number;
}

export interface WorkspaceContextView {
  slug: string;
  name: string;
  actorEmail: string;
  actorName: string;
  actorRole: "owner" | "manager" | "rep";
}

export interface DashboardData {
  workspace: WorkspaceContextView;
  account: Account;
  contacts: Contact[];
  deal: Deal;
  pipelineMetrics: PipelineMetrics;
  tasks: Task[];
  recentActivities: Activity[];
  auditTrail: AuditEvent[];
  approvals: OutboundApproval[];
  strategyPlays: StrategyPlay[];
  meetingBrief: MeetingBrief;
  followUpDraft: FollowUpDraft;
}
