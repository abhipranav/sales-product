import type { DashboardData } from "@/lib/domain/types";

export function getDashboardSnapshot(): DashboardData {
  return {
    workspace: {
      slug: "aurora-main",
      name: "Aurora Main Workspace",
      actorEmail: "rep@aurora.local",
      actorName: "Default Rep",
      actorRole: "rep"
    },
    account: {
      id: "acct_aurora",
      name: "Aurora Logistics",
      segment: "mid-market",
      website: "https://auroralogistics.example",
      employeeBand: "201-500",
      signals: [
        {
          id: "sig_hiring_1",
          accountId: "acct_aurora",
          type: "hiring",
          summary: "Hiring 3 technical recruiters across US + UK.",
          happenedAt: "2026-02-05T14:20:00Z",
          score: 82
        },
        {
          id: "sig_tooling_1",
          accountId: "acct_aurora",
          type: "tooling",
          summary: "Published migration note from Greenhouse to hybrid ATS stack.",
          happenedAt: "2026-02-03T17:00:00Z",
          score: 74
        }
      ]
    },
    contacts: [
      {
        id: "cnt_1",
        accountId: "acct_aurora",
        fullName: "Maya Kim",
        title: "Head of Talent Operations",
        email: "maya.kim@auroralogistics.example",
        role: "champion"
      },
      {
        id: "cnt_2",
        accountId: "acct_aurora",
        fullName: "Alex Rivera",
        title: "VP Finance",
        email: "alex.rivera@auroralogistics.example",
        role: "approver"
      },
      {
        id: "cnt_3",
        accountId: "acct_aurora",
        fullName: "Neil Grant",
        title: "Director of Security",
        role: "blocker"
      }
    ],
    deal: {
      id: "deal_aurora_q1",
      accountId: "acct_aurora",
      name: "AI Interview Platform Rollout",
      stage: "evaluation",
      amount: 76000,
      confidence: 0.64,
      closeDate: "2026-03-14",
      riskSummary: "Security review has no owner on buyer side; procurement timeline unclear."
    },
    pipelineMetrics: {
      openDeals: 4,
      openPipelineAmount: 252000,
      weightedPipelineAmount: 153640,
      overdueTasks: 2,
      highPriorityTasks: 3
    },
    tasks: [
      {
        id: "tsk_1",
        dealId: "deal_aurora_q1",
        title: "Send recap with security controls matrix",
        owner: "rep",
        dueAt: "2026-02-07T20:00:00Z",
        priority: "high",
        status: "todo",
        suggestedChannel: "email"
      },
      {
        id: "tsk_2",
        dealId: "deal_aurora_q1",
        title: "Book 20-min call with VP Finance + Champion",
        owner: "rep",
        dueAt: "2026-02-08T18:30:00Z",
        priority: "high",
        status: "todo",
        suggestedChannel: "meeting"
      },
      {
        id: "tsk_3",
        dealId: "deal_aurora_q1",
        title: "Request procurement process document",
        owner: "rep",
        dueAt: "2026-02-10T16:00:00Z",
        priority: "medium",
        status: "in-progress",
        suggestedChannel: "email"
      }
    ],
    recentActivities: [
      {
        id: "act_1",
        dealId: "deal_aurora_q1",
        type: "meeting",
        happenedAt: "2026-02-06T19:00:00Z",
        summary: "Champion requested proof of reduced screening cycle time and SOC 2 posture."
      },
      {
        id: "act_2",
        dealId: "deal_aurora_q1",
        type: "email",
        happenedAt: "2026-02-06T22:00:00Z",
        summary: "Finance requested pricing options for 150 and 300 recruiter seats."
      }
    ],
    auditTrail: [
      {
        id: "audit_task_create_1",
        entityType: "task",
        entityId: "tsk_3",
        action: "task.created",
        actor: "system",
        details: "Auto-created from meeting action item.",
        happenedAt: "2026-02-06T19:05:00Z"
      },
      {
        id: "audit_cal_ingest_1",
        entityType: "calendar-event",
        entityId: "cal_987",
        action: "calendar.ingested",
        actor: "system",
        details: "Ingested call event and linked it to active deal.",
        happenedAt: "2026-02-06T19:00:30Z"
      }
    ],
    approvals: [
      {
        id: "apr_1",
        dealId: "deal_aurora_q1",
        channel: "email",
        subject: "Recap + next-step options for Aurora rollout",
        body: "Draft queued for manager approval before send.",
        status: "pending",
        requestedBy: "rep@aurora.local",
        createdAt: "2026-02-07T09:15:00Z"
      }
    ],
    strategyPlays: [
      {
        id: "play-commitment-map",
        title: "Mutual Commitment Map",
        thesis: "Replace loose follow-ups with explicit owner/date commitments in one shared map.",
        trigger: "2 high-priority actions are near due and need explicit owners.",
        steps: [
          "Send one-page mutual action map with named owners.",
          "Book a 15-minute confirmation call in the next 24 hours.",
          "Convert every verbal commitment into task + deadline immediately."
        ],
        expectedImpact: "Improves velocity and reduces silent stalls in mid-stage deals.",
        confidence: 0.78
      },
      {
        id: "play-risk-frontload",
        title: "Risk Front-Load",
        thesis: "Surface security/legal objections before commercial negotiation to prevent late-stage drag.",
        trigger: "Risk summary references security owner gaps and procurement uncertainty.",
        steps: [
          "Share security packet and legal baseline proactively.",
          "Ask buyer to nominate a single reviewer and target review date.",
          "Track review as a separate approval lane with escalation triggers."
        ],
        expectedImpact: "Reduces cycle slippage caused by late risk discovery.",
        confidence: 0.74
      }
    ],
    meetingBrief: {
      accountName: "Aurora Logistics",
      primaryGoal: "Secure security and finance alignment before proposal.",
      likelyObjections: [
        "Need evidence of data segregation for EU candidates.",
        "Seat-based pricing may be high for seasonal hiring variability."
      ],
      recommendedNarrative:
        "Lead with cycle-time reduction and risk controls. Offer staged ramp pricing tied to hiring volume.",
      proofPoints: [
        "Median screening-to-offer cycle reduced by 31% in logistics cohort.",
        "SOC 2 Type II controls mapped to buyer questionnaire sections."
      ]
    },
    followUpDraft: {
      subject: "Recap + next-step options for Aurora rollout",
      body:
        "Maya, great discussion today. We aligned on reducing screening cycle time while keeping security review low-friction. I attached the controls matrix and two pricing ramps for 150/300 seats.",
      ask: "Can we lock 20 minutes with you and Alex on Monday to finalize commercial shape?",
      ctaTimeWindow: "Mon Feb 9, 10:00-14:00 ET"
    }
  };
}
