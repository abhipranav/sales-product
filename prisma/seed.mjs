import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🧹 Cleaning existing data...");
  
  await prisma.sequenceStep.deleteMany();
  await prisma.sequenceExecution.deleteMany();
  await prisma.signalNotification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.calendarEvent.deleteMany();
  await prisma.followUpDraft.deleteMany();
  await prisma.meetingBrief.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.task.deleteMany();
  await prisma.outboundApproval.deleteMany();
  await prisma.signal.deleteMany();
  await prisma.deal.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.account.deleteMany();
  await prisma.integrationSyncState.deleteMany();
  await prisma.workspaceMember.deleteMany();
  await prisma.workspace.deleteMany();

  console.log("🏢 Creating workspace...");
  
  const workspace = await prisma.workspace.create({
    data: {
      slug: process.env.APP_WORKSPACE_SLUG || "aurora-main",
      name: process.env.APP_WORKSPACE_NAME || "Aurora Sales"
    }
  });

  await prisma.workspaceMember.create({
    data: {
      workspaceId: workspace.id,
      email: process.env.APP_ACTOR_EMAIL || "alex@velocity.io",
      fullName: process.env.APP_ACTOR_NAME || "Alex Chen",
      role: "OWNER"
    }
  });

  await prisma.integrationSyncState.create({
    data: {
      workspaceId: workspace.id,
      provider: "HUBSPOT",
      cursor: "seed-cursor-v2",
      status: "ok",
      lastRunAt: new Date("2026-02-09T08:00:00Z")
    }
  });

  console.log("🏭 Creating accounts...");

  // ========== ACCOUNT 1: Aurora Logistics (Mid-Market) ==========
  const aurora = await prisma.account.create({
    data: {
      workspaceId: workspace.id,
      externalId: "acct_aurora",
      name: "Aurora Logistics",
      segment: "MID_MARKET",
      website: "https://auroralogistics.com",
      employeeBand: "201-500"
    }
  });

  const [mayaKim, alexRivera, neilGrant] = await Promise.all([
    prisma.contact.create({
      data: {
        externalId: "cnt_maya",
        accountId: aurora.id,
        fullName: "Maya Kim",
        title: "VP of Talent Operations",
        email: "maya.kim@auroralogistics.com",
        linkedIn: "https://linkedin.com/in/mayakim",
        role: "CHAMPION"
      }
    }),
    prisma.contact.create({
      data: {
        externalId: "cnt_alex",
        accountId: aurora.id,
        fullName: "Alex Rivera",
        title: "CFO",
        email: "alex.rivera@auroralogistics.com",
        role: "APPROVER"
      }
    }),
    prisma.contact.create({
      data: {
        externalId: "cnt_neil",
        accountId: aurora.id,
        fullName: "Neil Grant",
        title: "Director of Security",
        email: "neil.grant@auroralogistics.com",
        role: "BLOCKER"
      }
    })
  ]);

  // ========== ACCOUNT 2: TechVenture Labs (Enterprise) ==========
  const techventure = await prisma.account.create({
    data: {
      workspaceId: workspace.id,
      externalId: "acct_techventure",
      name: "TechVenture Labs",
      segment: "ENTERPRISE",
      website: "https://techventurelabs.io",
      employeeBand: "1001-5000"
    }
  });

  const [sarahChen, marcusJohnson, emilyWatson] = await Promise.all([
    prisma.contact.create({
      data: {
        externalId: "cnt_sarah",
        accountId: techventure.id,
        fullName: "Sarah Chen",
        title: "Chief Revenue Officer",
        email: "sarah.chen@techventurelabs.io",
        linkedIn: "https://linkedin.com/in/sarahchen",
        role: "CHAMPION"
      }
    }),
    prisma.contact.create({
      data: {
        externalId: "cnt_marcus",
        accountId: techventure.id,
        fullName: "Marcus Johnson",
        title: "VP of Engineering",
        email: "marcus.johnson@techventurelabs.io",
        role: "APPROVER"
      }
    }),
    prisma.contact.create({
      data: {
        externalId: "cnt_emily",
        accountId: techventure.id,
        fullName: "Emily Watson",
        title: "Technical Lead",
        email: "emily.watson@techventurelabs.io",
        role: "INFLUENCER"
      }
    })
  ]);

  // ========== ACCOUNT 3: Bloom Dynamics (Startup) ==========
  const bloom = await prisma.account.create({
    data: {
      workspaceId: workspace.id,
      externalId: "acct_bloom",
      name: "Bloom Dynamics",
      segment: "STARTUP",
      website: "https://bloomdynamics.co",
      employeeBand: "11-50"
    }
  });

  const [jessicaLee, davidPark, rachelMoore] = await Promise.all([
    prisma.contact.create({
      data: {
        externalId: "cnt_jessica",
        accountId: bloom.id,
        fullName: "Jessica Lee",
        title: "CEO & Co-Founder",
        email: "jessica@bloomdynamics.co",
        linkedIn: "https://linkedin.com/in/jessicalee",
        role: "CHAMPION"
      }
    }),
    prisma.contact.create({
      data: {
        externalId: "cnt_david",
        accountId: bloom.id,
        fullName: "David Park",
        title: "CTO",
        email: "david@bloomdynamics.co",
        role: "APPROVER"
      }
    }),
    prisma.contact.create({
      data: {
        externalId: "cnt_rachel",
        accountId: bloom.id,
        fullName: "Rachel Moore",
        title: "Head of Growth",
        email: "rachel@bloomdynamics.co",
        role: "INFLUENCER"
      }
    })
  ]);

  // ========== ACCOUNT 4: Meridian Healthcare (Enterprise) ==========
  const meridian = await prisma.account.create({
    data: {
      workspaceId: workspace.id,
      externalId: "acct_meridian",
      name: "Meridian Healthcare",
      segment: "ENTERPRISE",
      website: "https://meridianhealth.org",
      employeeBand: "5001+"
    }
  });

  const [drJamesWilson, lisaThompson, michaelBrown] = await Promise.all([
    prisma.contact.create({
      data: {
        externalId: "cnt_james",
        accountId: meridian.id,
        fullName: "Dr. James Wilson",
        title: "Chief Medical Information Officer",
        email: "james.wilson@meridianhealth.org",
        role: "CHAMPION"
      }
    }),
    prisma.contact.create({
      data: {
        externalId: "cnt_lisa",
        accountId: meridian.id,
        fullName: "Lisa Thompson",
        title: "VP of IT Procurement",
        email: "lisa.thompson@meridianhealth.org",
        role: "APPROVER"
      }
    }),
    prisma.contact.create({
      data: {
        externalId: "cnt_michael",
        accountId: meridian.id,
        fullName: "Michael Brown",
        title: "HIPAA Compliance Officer",
        email: "michael.brown@meridianhealth.org",
        role: "BLOCKER"
      }
    })
  ]);

  // ========== ACCOUNT 5: Catalyst Financial (Mid-Market) ==========
  const catalyst = await prisma.account.create({
    data: {
      workspaceId: workspace.id,
      externalId: "acct_catalyst",
      name: "Catalyst Financial",
      segment: "MID_MARKET",
      website: "https://catalystfinancial.com",
      employeeBand: "501-1000"
    }
  });

  const [amandaGarcia, chrisAnderson, kevinTaylor] = await Promise.all([
    prisma.contact.create({
      data: {
        externalId: "cnt_amanda",
        accountId: catalyst.id,
        fullName: "Amanda Garcia",
        title: "Director of Operations",
        email: "amanda.garcia@catalystfinancial.com",
        linkedIn: "https://linkedin.com/in/amandagarcia",
        role: "CHAMPION"
      }
    }),
    prisma.contact.create({
      data: {
        externalId: "cnt_chris",
        accountId: catalyst.id,
        fullName: "Chris Anderson",
        title: "Chief Compliance Officer",
        email: "chris.anderson@catalystfinancial.com",
        role: "APPROVER"
      }
    }),
    prisma.contact.create({
      data: {
        externalId: "cnt_kevin",
        accountId: catalyst.id,
        fullName: "Kevin Taylor",
        title: "Senior IT Manager",
        email: "kevin.taylor@catalystfinancial.com",
        role: "INFLUENCER"
      }
    })
  ]);

  console.log("📊 Creating signals...");

  const signals = await Promise.all([
    // Aurora signals
    prisma.signal.create({
      data: {
        externalId: "sig_aurora_1",
        accountId: aurora.id,
        type: "HIRING",
        summary: "Hiring 3 senior recruiters across US & UK offices",
        happenedAt: new Date("2026-02-07T14:20:00Z"),
        score: 85
      }
    }),
    prisma.signal.create({
      data: {
        externalId: "sig_aurora_2",
        accountId: aurora.id,
        type: "TOOLING",
        summary: "Published migration note from Greenhouse to hybrid ATS",
        happenedAt: new Date("2026-02-05T17:00:00Z"),
        score: 74
      }
    }),
    prisma.signal.create({
      data: {
        externalId: "sig_aurora_3",
        accountId: aurora.id,
        type: "ENGAGEMENT",
        summary: "Downloaded ROI calculator and attended product webinar",
        happenedAt: new Date("2026-02-08T09:30:00Z"),
        score: 88
      }
    }),
    // TechVenture signals
    prisma.signal.create({
      data: {
        externalId: "sig_techventure_1",
        accountId: techventure.id,
        type: "FUNDING",
        summary: "Announced Series C funding of $75M led by Andreessen Horowitz",
        happenedAt: new Date("2026-02-01T10:00:00Z"),
        score: 95
      }
    }),
    prisma.signal.create({
      data: {
        externalId: "sig_techventure_2",
        accountId: techventure.id,
        type: "HIRING",
        summary: "Posted 12 new engineering roles, including AI/ML specialists",
        happenedAt: new Date("2026-02-06T12:00:00Z"),
        score: 82
      }
    }),
    // Bloom signals
    prisma.signal.create({
      data: {
        externalId: "sig_bloom_1",
        accountId: bloom.id,
        type: "FUNDING",
        summary: "Closed $4M seed round, planning rapid expansion",
        happenedAt: new Date("2026-01-28T16:00:00Z"),
        score: 90
      }
    }),
    prisma.signal.create({
      data: {
        externalId: "sig_bloom_2",
        accountId: bloom.id,
        type: "TOOLING",
        summary: "CTO posted about evaluating new sales automation tools",
        happenedAt: new Date("2026-02-04T11:00:00Z"),
        score: 78
      }
    }),
    // Meridian signals
    prisma.signal.create({
      data: {
        externalId: "sig_meridian_1",
        accountId: meridian.id,
        type: "ENGAGEMENT",
        summary: "Requested detailed security documentation and SOC 2 report",
        happenedAt: new Date("2026-02-07T15:30:00Z"),
        score: 80
      }
    }),
    prisma.signal.create({
      data: {
        externalId: "sig_meridian_2",
        accountId: meridian.id,
        type: "HIRING",
        summary: "Opening new digital health innovation center in Boston",
        happenedAt: new Date("2026-02-03T09:00:00Z"),
        score: 72
      }
    }),
    // Catalyst signals
    prisma.signal.create({
      data: {
        externalId: "sig_catalyst_1",
        accountId: catalyst.id,
        type: "TOOLING",
        summary: "Current vendor contract expires in 60 days per LinkedIn post",
        happenedAt: new Date("2026-02-08T14:00:00Z"),
        score: 92
      }
    }),
    prisma.signal.create({
      data: {
        externalId: "sig_catalyst_2",
        accountId: catalyst.id,
        type: "ENGAGEMENT",
        summary: "Attended demo session and asked detailed compliance questions",
        happenedAt: new Date("2026-02-06T16:30:00Z"),
        score: 86
      }
    })
  ]);

  console.log("💰 Creating deals...");

  // DEAL 1: Aurora - Evaluation (Primary Focus)
  const auroraDeal1 = await prisma.deal.create({
    data: {
      externalId: "deal_aurora_1",
      accountId: aurora.id,
      name: "AI Interview Platform Rollout",
      stage: "EVALUATION",
      amount: 76000,
      confidence: 0.68,
      closeDate: new Date("2026-03-14T00:00:00Z"),
      riskSummary: "Security review has no owner on buyer side; procurement timeline unclear. Need to align VP Finance and Director of Security."
    }
  });

  // DEAL 2: Aurora - Discovery
  const auroraDeal2 = await prisma.deal.create({
    data: {
      externalId: "deal_aurora_2",
      accountId: aurora.id,
      name: "Recruiter Expansion Pack",
      stage: "DISCOVERY",
      amount: 48000,
      confidence: 0.25,
      closeDate: new Date("2026-05-20T00:00:00Z"),
      riskSummary: "Early stage. Champion identified but executive sponsor not engaged yet."
    }
  });

  // DEAL 3: TechVenture - Proposal
  const techventureDeal1 = await prisma.deal.create({
    data: {
      externalId: "deal_techventure_1",
      accountId: techventure.id,
      name: "Enterprise AI Sales Suite",
      stage: "PROPOSAL",
      amount: 245000,
      confidence: 0.72,
      closeDate: new Date("2026-03-28T00:00:00Z"),
      riskSummary: "Competing with Salesforce Einstein. Need strong ROI narrative and proof points from similar enterprise deployments."
    }
  });

  // DEAL 4: TechVenture - Discovery
  const techventureDeal2 = await prisma.deal.create({
    data: {
      externalId: "deal_techventure_2",
      accountId: techventure.id,
      name: "Pipeline Analytics Module",
      stage: "DISCOVERY",
      amount: 65000,
      confidence: 0.35,
      closeDate: new Date("2026-06-15T00:00:00Z"),
      riskSummary: "Cross-sell opportunity. Technical team interested but budget not allocated."
    }
  });

  // DEAL 5: Bloom - Evaluation
  const bloomDeal = await prisma.deal.create({
    data: {
      externalId: "deal_bloom_1",
      accountId: bloom.id,
      name: "Startup Growth Accelerator",
      stage: "EVALUATION",
      amount: 28000,
      confidence: 0.55,
      closeDate: new Date("2026-03-05T00:00:00Z"),
      riskSummary: "Fast-moving startup. Decision expected within 2 weeks. Price sensitivity is main concern."
    }
  });

  // DEAL 6: Meridian - Procurement
  const meridianDeal = await prisma.deal.create({
    data: {
      externalId: "deal_meridian_1",
      accountId: meridian.id,
      name: "Healthcare Compliance Suite",
      stage: "PROCUREMENT",
      amount: 380000,
      confidence: 0.85,
      closeDate: new Date("2026-02-28T00:00:00Z"),
      riskSummary: "In final legal review. HIPAA BAA nearly finalized. Expected close this month."
    }
  });

  // DEAL 7: Catalyst - Proposal
  const catalystDeal = await prisma.deal.create({
    data: {
      externalId: "deal_catalyst_1",
      accountId: catalyst.id,
      name: "Financial Services Platform",
      stage: "PROPOSAL",
      amount: 125000,
      confidence: 0.62,
      closeDate: new Date("2026-04-10T00:00:00Z"),
      riskSummary: "Strong champion but compliance team has concerns about data residency. Addressing with custom deployment option."
    }
  });

  // DEAL 8: Closed Won - TechVenture
  const techventureWon = await prisma.deal.create({
    data: {
      externalId: "deal_techventure_won",
      accountId: techventure.id,
      name: "Q4 2025 Initial Deployment",
      stage: "CLOSED_WON",
      amount: 98000,
      confidence: 1.0,
      closeDate: new Date("2025-12-15T00:00:00Z"),
      riskSummary: "Successful deployment. Now expanding to additional teams."
    }
  });

  // DEAL 9: Closed Won - Catalyst
  const catalystWon = await prisma.deal.create({
    data: {
      externalId: "deal_catalyst_won",
      accountId: catalyst.id,
      name: "POC Success - Initial License",
      stage: "CLOSED_WON",
      amount: 45000,
      confidence: 1.0,
      closeDate: new Date("2026-01-20T00:00:00Z"),
      riskSummary: "POC exceeded expectations. Customer expanding scope."
    }
  });

  // DEAL 10: Closed Lost - Aurora
  const auroraLost = await prisma.deal.create({
    data: {
      externalId: "deal_aurora_lost",
      accountId: aurora.id,
      name: "2025 Pilot Program",
      stage: "CLOSED_LOST",
      amount: 21000,
      confidence: 0,
      closeDate: new Date("2025-11-30T00:00:00Z"),
      riskSummary: "Budget frozen in prior cycle. Re-engaging in 2026."
    }
  });

  console.log("📋 Creating tasks...");

  await prisma.task.createMany({
    data: [
      // Aurora Deal 1 Tasks
      {
        externalId: "tsk_1",
        dealId: auroraDeal1.id,
        title: "Send security controls matrix to Neil Grant",
        owner: "REP",
        dueAt: new Date("2026-02-10T18:00:00Z"),
        priority: "HIGH",
        status: "TODO",
        suggestedChannel: "EMAIL"
      },
      {
        externalId: "tsk_2",
        dealId: auroraDeal1.id,
        title: "Book alignment call with Maya + Alex",
        owner: "REP",
        dueAt: new Date("2026-02-11T16:00:00Z"),
        priority: "HIGH",
        status: "TODO",
        suggestedChannel: "MEETING"
      },
      {
        externalId: "tsk_3",
        dealId: auroraDeal1.id,
        title: "Request procurement process documentation",
        owner: "REP",
        dueAt: new Date("2026-02-12T14:00:00Z"),
        priority: "MEDIUM",
        status: "IN_PROGRESS",
        suggestedChannel: "EMAIL"
      },
      {
        externalId: "tsk_4",
        dealId: auroraDeal1.id,
        title: "Prepare ROI presentation for finance review",
        owner: "REP",
        dueAt: new Date("2026-02-14T12:00:00Z"),
        priority: "HIGH",
        status: "TODO",
        suggestedChannel: "MEETING"
      },
      // TechVenture Deal Tasks
      {
        externalId: "tsk_5",
        dealId: techventureDeal1.id,
        title: "Send revised proposal with enterprise pricing",
        owner: "MANAGER",
        dueAt: new Date("2026-02-10T12:00:00Z"),
        priority: "HIGH",
        status: "DONE",
        suggestedChannel: "EMAIL",
        completedAt: new Date("2026-02-09T11:30:00Z")
      },
      {
        externalId: "tsk_6",
        dealId: techventureDeal1.id,
        title: "Schedule technical deep-dive with engineering team",
        owner: "REP",
        dueAt: new Date("2026-02-13T10:00:00Z"),
        priority: "MEDIUM",
        status: "TODO",
        suggestedChannel: "MEETING"
      },
      // Bloom Deal Tasks
      {
        externalId: "tsk_7",
        dealId: bloomDeal.id,
        title: "Provide startup-friendly pricing options",
        owner: "REP",
        dueAt: new Date("2026-02-10T09:00:00Z"),
        priority: "HIGH",
        status: "IN_PROGRESS",
        suggestedChannel: "EMAIL"
      },
      {
        externalId: "tsk_8",
        dealId: bloomDeal.id,
        title: "Connect with similar startup reference customer",
        owner: "REP",
        dueAt: new Date("2026-02-11T15:00:00Z"),
        priority: "MEDIUM",
        status: "TODO",
        suggestedChannel: "LINKEDIN"
      },
      // Meridian Deal Tasks
      {
        externalId: "tsk_9",
        dealId: meridianDeal.id,
        title: "Review final BAA terms with legal",
        owner: "MANAGER",
        dueAt: new Date("2026-02-10T17:00:00Z"),
        priority: "HIGH",
        status: "IN_PROGRESS",
        suggestedChannel: "MEETING"
      },
      {
        externalId: "tsk_10",
        dealId: meridianDeal.id,
        title: "Coordinate with implementation team for kickoff",
        owner: "SYSTEM",
        dueAt: new Date("2026-02-15T10:00:00Z"),
        priority: "MEDIUM",
        status: "TODO",
        suggestedChannel: "EMAIL"
      },
      // Catalyst Deal Tasks
      {
        externalId: "tsk_11",
        dealId: catalystDeal.id,
        title: "Prepare data residency compliance documentation",
        owner: "REP",
        dueAt: new Date("2026-02-12T11:00:00Z"),
        priority: "HIGH",
        status: "TODO",
        suggestedChannel: "EMAIL"
      },
      {
        externalId: "tsk_12",
        dealId: catalystDeal.id,
        title: "Demo dedicated deployment option to compliance team",
        owner: "REP",
        dueAt: new Date("2026-02-14T14:00:00Z"),
        priority: "HIGH",
        status: "TODO",
        suggestedChannel: "MEETING"
      }
    ]
  });

  console.log("📝 Creating activities...");

  await prisma.activity.createMany({
    data: [
      // Aurora activities
      {
        externalId: "act_1",
        dealId: auroraDeal1.id,
        type: "MEETING",
        happenedAt: new Date("2026-02-08T19:00:00Z"),
        summary: "Discovery call with Maya. Discussed hiring challenges and timeline pressure. Champion confirmed for Q1 close."
      },
      {
        externalId: "act_2",
        dealId: auroraDeal1.id,
        type: "EMAIL",
        happenedAt: new Date("2026-02-08T22:00:00Z"),
        summary: "Sent follow-up with pricing options for 150 and 300 recruiter seats. Included ROI calculator link."
      },
      {
        externalId: "act_3",
        dealId: auroraDeal1.id,
        type: "CALL",
        happenedAt: new Date("2026-02-07T16:30:00Z"),
        summary: "Quick check-in call. Alex asking about security certifications - need to provide SOC 2 Type II report."
      },
      // TechVenture activities
      {
        externalId: "act_4",
        dealId: techventureDeal1.id,
        type: "MEETING",
        happenedAt: new Date("2026-02-06T14:00:00Z"),
        summary: "Executive presentation to Sarah and Marcus. Strong interest in AI capabilities. Competing with Salesforce Einstein."
      },
      {
        externalId: "act_5",
        dealId: techventureDeal1.id,
        type: "EMAIL",
        happenedAt: new Date("2026-02-07T10:00:00Z"),
        summary: "Sent enterprise proposal with volume pricing. Included implementation timeline and dedicated support SLA."
      },
      {
        externalId: "act_6",
        dealId: techventureDeal1.id,
        type: "NOTE",
        happenedAt: new Date("2026-02-08T09:00:00Z"),
        summary: "Internal note: Need to position against Salesforce. Key differentiator is our AI accuracy and faster time-to-value."
      },
      // Bloom activities
      {
        externalId: "act_7",
        dealId: bloomDeal.id,
        type: "MEETING",
        happenedAt: new Date("2026-02-05T11:00:00Z"),
        summary: "Intro call with Jessica (CEO). Startup moving fast, needs solution within 30 days. Price-sensitive."
      },
      {
        externalId: "act_8",
        dealId: bloomDeal.id,
        type: "NOTE",
        happenedAt: new Date("2026-02-06T15:00:00Z"),
        summary: "Connected with David (CTO) on LinkedIn. He's evaluating technical integrations."
      },
      // Meridian activities
      {
        externalId: "act_9",
        dealId: meridianDeal.id,
        type: "MEETING",
        happenedAt: new Date("2026-02-04T13:00:00Z"),
        summary: "Final negotiation meeting. HIPAA BAA approved by their legal. Awaiting signature from procurement."
      },
      {
        externalId: "act_10",
        dealId: meridianDeal.id,
        type: "EMAIL",
        happenedAt: new Date("2026-02-07T08:00:00Z"),
        summary: "Sent final contract documents. Lisa confirmed signature expected by end of month."
      },
      // Catalyst activities
      {
        externalId: "act_11",
        dealId: catalystDeal.id,
        type: "MEETING",
        happenedAt: new Date("2026-02-06T15:00:00Z"),
        summary: "Technical review with Kevin and compliance team. Data residency is main blocker - proposing dedicated deployment."
      },
      {
        externalId: "act_12",
        dealId: catalystDeal.id,
        type: "CALL",
        happenedAt: new Date("2026-02-08T11:00:00Z"),
        summary: "Call with Amanda. She's working internally to get compliance pre-approval. Optimistic about resolution."
      }
    ]
  });

  console.log("🔔 Creating notifications...");

  await prisma.signalNotification.createMany({
    data: [
      {
        workspaceId: workspace.id,
        signalId: signals[0].id,
        dealId: auroraDeal1.id,
        priority: "HIGH",
        summary: "Aurora Logistics hiring 3 senior recruiters",
        recommendedAction: "Position faster recruiter onboarding with measurable cycle-time reduction.",
        status: "UNREAD"
      },
      {
        workspaceId: workspace.id,
        signalId: signals[2].id,
        dealId: auroraDeal1.id,
        priority: "HIGH",
        summary: "High engagement: Downloaded ROI calculator",
        recommendedAction: "Follow up on ROI analysis. Offer to walk through calculations together.",
        status: "UNREAD"
      },
      {
        workspaceId: workspace.id,
        signalId: signals[3].id,
        dealId: techventureDeal1.id,
        priority: "HIGH",
        summary: "TechVenture Labs raised $75M Series C",
        recommendedAction: "Leverage funding news to accelerate enterprise deal. Budget is now available.",
        status: "ACKNOWLEDGED",
        acknowledgedAt: new Date("2026-02-07T10:00:00Z"),
        acknowledgedBy: process.env.APP_ACTOR_EMAIL || "alex@velocity.io"
      },
      {
        workspaceId: workspace.id,
        signalId: signals[9].id,
        dealId: catalystDeal.id,
        priority: "HIGH",
        summary: "Catalyst vendor contract expires in 60 days",
        recommendedAction: "Urgent: Accelerate proposal. Current vendor renewal window is closing.",
        status: "UNREAD"
      },
      {
        workspaceId: workspace.id,
        signalId: signals[5].id,
        dealId: bloomDeal.id,
        priority: "MEDIUM",
        summary: "Bloom Dynamics closed $4M seed round",
        recommendedAction: "Startup has fresh funding. Good time to close deal with growth narrative.",
        status: "UNREAD"
      }
    ]
  });

  console.log("📅 Creating calendar events...");

  await prisma.calendarEvent.createMany({
    data: [
      {
        externalId: "cal_1",
        dealId: auroraDeal1.id,
        title: "Security Alignment Call - Aurora",
        startsAt: new Date("2026-02-12T16:00:00Z"),
        endsAt: new Date("2026-02-12T16:45:00Z"),
        organizerEmail: "maya.kim@auroralogistics.com",
        attendees: ["maya.kim@auroralogistics.com", "neil.grant@auroralogistics.com", process.env.APP_ACTOR_EMAIL || "alex@velocity.io"],
        source: "google-calendar"
      },
      {
        externalId: "cal_2",
        dealId: auroraDeal1.id,
        title: "Finance Review - Aurora ROI",
        startsAt: new Date("2026-02-14T14:00:00Z"),
        endsAt: new Date("2026-02-14T14:30:00Z"),
        organizerEmail: process.env.APP_ACTOR_EMAIL || "alex@velocity.io",
        attendees: ["alex.rivera@auroralogistics.com", "maya.kim@auroralogistics.com"],
        source: "google-calendar"
      },
      {
        externalId: "cal_3",
        dealId: techventureDeal1.id,
        title: "Technical Deep Dive - TechVenture",
        startsAt: new Date("2026-02-13T10:00:00Z"),
        endsAt: new Date("2026-02-13T11:00:00Z"),
        organizerEmail: "marcus.johnson@techventurelabs.io",
        attendees: ["marcus.johnson@techventurelabs.io", "emily.watson@techventurelabs.io", process.env.APP_ACTOR_EMAIL || "alex@velocity.io"],
        source: "google-calendar"
      },
      {
        externalId: "cal_4",
        dealId: catalystDeal.id,
        title: "Compliance Review - Catalyst",
        startsAt: new Date("2026-02-14T14:00:00Z"),
        endsAt: new Date("2026-02-14T15:00:00Z"),
        organizerEmail: process.env.APP_ACTOR_EMAIL || "alex@velocity.io",
        attendees: ["chris.anderson@catalystfinancial.com", "kevin.taylor@catalystfinancial.com", "amanda.garcia@catalystfinancial.com"],
        source: "google-calendar"
      },
      {
        externalId: "cal_5",
        dealId: meridianDeal.id,
        title: "Contract Signing - Meridian",
        startsAt: new Date("2026-02-20T15:00:00Z"),
        endsAt: new Date("2026-02-20T15:30:00Z"),
        organizerEmail: "lisa.thompson@meridianhealth.org",
        attendees: ["lisa.thompson@meridianhealth.org", "james.wilson@meridianhealth.org"],
        source: "google-calendar"
      }
    ]
  });

  console.log("📋 Creating meeting briefs...");

  await prisma.meetingBrief.createMany({
    data: [
      {
        dealId: auroraDeal1.id,
        primaryGoal: "Secure security and finance alignment before proposal stage.",
        likelyObjections: [
          "Need evidence of data segregation for EU candidates.",
          "Seat-based pricing may be high for seasonal hiring variability.",
          "Security team hasn't seen SOC 2 Type II report yet."
        ],
        recommendedNarrative: "Lead with cycle-time reduction (31% faster screening-to-offer). Anchor on their hiring urgency signal. Offer staged ramp pricing tied to hiring volume.",
        proofPoints: [
          "Median screening-to-offer cycle reduced by 31% in logistics cohort.",
          "SOC 2 Type II certified with controls mapped to common buyer questionnaires.",
          "3 similar mid-market recruiting teams deployed in under 2 weeks."
        ]
      },
      {
        dealId: techventureDeal1.id,
        primaryGoal: "Differentiate against Salesforce Einstein and secure technical approval.",
        likelyObjections: [
          "How does AI accuracy compare to Salesforce Einstein?",
          "What's the implementation timeline for 1000+ users?",
          "Need evidence of enterprise-scale deployments."
        ],
        recommendedNarrative: "Focus on faster time-to-value (2 weeks vs 3 months) and specialization for sales execution. Highlight recent $75M funding as green light for technology investments.",
        proofPoints: [
          "48% improvement in forecast accuracy vs legacy tools.",
          "Average implementation time of 2 weeks for enterprise clients.",
          "Used by 3 of the top 10 fastest-growing enterprise SaaS companies."
        ]
      },
      {
        dealId: catalystDeal.id,
        primaryGoal: "Address data residency concerns and move to contract.",
        likelyObjections: [
          "Where is data stored? We need US-only residency.",
          "What about PII handling and SOC 2 compliance?",
          "Can we get a dedicated instance?"
        ],
        recommendedNarrative: "Lead with dedicated deployment option that addresses all data residency requirements. Emphasize financial services expertise with existing Catalyst POC success.",
        proofPoints: [
          "Dedicated deployment option with US-only data residency.",
          "SOC 2 Type II and SOC 2 + HIPAA certified.",
          "POC delivered 40% improvement in lead response time."
        ]
      }
    ]
  });

  console.log("✉️ Creating follow-up drafts...");

  await prisma.followUpDraft.createMany({
    data: [
      {
        dealId: auroraDeal1.id,
        subject: "Recap + Next Steps for Aurora Rollout",
        body: "Maya, great discussion yesterday. We aligned on reducing your screening cycle time while keeping the security review low-friction for Neil's team.\n\nI've attached the controls matrix and two pricing ramp options for 150/300 seats that account for your seasonal hiring patterns.",
        ask: "Can we lock 30 minutes with you and Alex on Monday to finalize the commercial structure?",
        ctaTimeWindow: "Mon Feb 10, 10:00-14:00 ET"
      },
      {
        dealId: techventureDeal1.id,
        subject: "Technical Deep Dive Prep - TechVenture Labs",
        body: "Sarah, following up on our executive presentation. Marcus and Emily are set for Thursday's technical session.\n\nI've prepared a comparison showing how we differ from Einstein on accuracy metrics and implementation speed - exactly what you asked for.",
        ask: "Anything specific you'd like us to cover to help accelerate your internal review?",
        ctaTimeWindow: "Before Thu Feb 13 meeting"
      },
      {
        dealId: catalystDeal.id,
        subject: "Data Residency Solution for Catalyst",
        body: "Amanda, great call today. I heard Chris's concerns about data residency clearly.\n\nI've documented our dedicated deployment option that provides US-only data residency with your own isolated instance. This addresses all the compliance requirements Kevin raised.",
        ask: "Would a 30-minute demo of the dedicated deployment architecture help get Chris comfortable?",
        ctaTimeWindow: "This week - before Friday EOD"
      }
    ]
  });

  console.log("✅ Creating approval queue items...");

  await prisma.outboundApproval.createMany({
    data: [
      {
        dealId: auroraDeal1.id,
        channel: "EMAIL",
        subject: "Recap + Next Steps for Aurora Rollout",
        body: "Maya, great discussion yesterday. We aligned on reducing your screening cycle time while keeping the security review low-friction for Neil's team.",
        status: "PENDING",
        requestedBy: process.env.APP_ACTOR_EMAIL || "alex@velocity.io"
      },
      {
        dealId: techventureDeal1.id,
        channel: "EMAIL",
        subject: "Enterprise Pricing Proposal - TechVenture Labs",
        body: "Sarah, as discussed, here's our enterprise pricing proposal with volume discounts for your 1000+ seat deployment.",
        status: "APPROVED",
        requestedBy: process.env.APP_ACTOR_EMAIL || "alex@velocity.io",
        reviewedBy: "manager@velocity.io",
        reviewedAt: new Date("2026-02-08T09:00:00Z")
      },
      {
        dealId: catalystDeal.id,
        channel: "EMAIL",
        subject: "Dedicated Deployment Architecture",
        body: "Amanda, attached is the technical documentation for our dedicated deployment option with US-only data residency.",
        status: "PENDING",
        requestedBy: process.env.APP_ACTOR_EMAIL || "alex@velocity.io"
      },
      {
        dealId: bloomDeal.id,
        channel: "LINKEDIN",
        subject: "Connection Request to David Park",
        body: "Hi David, I wanted to connect regarding Bloom's evaluation of sales tools. Given your recent funding announcement, I'd love to share how we've helped similar fast-growing startups.",
        status: "REJECTED",
        requestedBy: process.env.APP_ACTOR_EMAIL || "alex@velocity.io",
        reviewedBy: "manager@velocity.io",
        reviewedAt: new Date("2026-02-07T14:00:00Z"),
        rejectionReason: "Too sales-y. Suggest a more value-led approach focusing on their specific challenges."
      }
    ]
  });

  console.log("🔄 Creating sequence executions...");

  const auroraSequence = await prisma.sequenceExecution.create({
    data: {
      workspaceId: workspace.id,
      dealId: auroraDeal1.id,
      contactId: mayaKim.id,
      title: "Champion & Finance Alignment Sequence",
      channelMix: ["EMAIL", "PHONE", "LINKEDIN"],
      status: "ACTIVE",
      createdBy: process.env.APP_ACTOR_EMAIL || "alex@velocity.io"
    }
  });

  await prisma.sequenceStep.createMany({
    data: [
      {
        executionId: auroraSequence.id,
        order: 1,
        channel: "EMAIL",
        instruction: "Send personalized recap aligned to hiring signal urgency.",
        status: "DONE",
        outcome: "Recap sent with controls matrix attached. Maya confirmed receipt.",
        completedAt: new Date("2026-02-08T23:00:00Z")
      },
      {
        executionId: auroraSequence.id,
        order: 2,
        channel: "PHONE",
        instruction: "Call champion to confirm finance decision process and blockers.",
        status: "IN_PROGRESS"
      },
      {
        executionId: auroraSequence.id,
        order: 3,
        channel: "LINKEDIN",
        instruction: "Share proof-point post with VP Finance and request next-step meeting.",
        status: "TODO"
      }
    ]
  });

  const techventureSequence = await prisma.sequenceExecution.create({
    data: {
      workspaceId: workspace.id,
      dealId: techventureDeal1.id,
      contactId: sarahChen.id,
      title: "Enterprise Close Acceleration",
      channelMix: ["EMAIL", "MEETING"],
      status: "ACTIVE",
      createdBy: process.env.APP_ACTOR_EMAIL || "alex@velocity.io"
    }
  });

  await prisma.sequenceStep.createMany({
    data: [
      {
        executionId: techventureSequence.id,
        order: 1,
        channel: "EMAIL",
        instruction: "Send competitive differentiation document vs Salesforce Einstein.",
        status: "DONE",
        outcome: "Document sent. Sarah forwarded to technical team.",
        completedAt: new Date("2026-02-07T11:00:00Z")
      },
      {
        executionId: techventureSequence.id,
        order: 2,
        channel: "MEETING",
        instruction: "Technical deep-dive with engineering leads.",
        status: "TODO"
      }
    ]
  });

  console.log("📊 Creating audit trail...");

  const tasks = await prisma.task.findMany({ where: { dealId: auroraDeal1.id }, take: 3 });
  const calendarEvents = await prisma.calendarEvent.findMany({ where: { dealId: auroraDeal1.id }, take: 2 });

  await prisma.auditLog.createMany({
    data: [
      {
        dealId: auroraDeal1.id,
        taskId: tasks[0]?.id,
        entityType: "task",
        entityId: tasks[0]?.externalId ?? tasks[0]?.id ?? "unknown",
        action: "task.created",
        actor: "system",
        details: "Task created from meeting action item"
      },
      {
        dealId: auroraDeal1.id,
        taskId: tasks[1]?.id,
        entityType: "task",
        entityId: tasks[1]?.externalId ?? tasks[1]?.id ?? "unknown",
        action: "task.created",
        actor: "system",
        details: "Task created from follow-up requirement"
      },
      {
        dealId: auroraDeal1.id,
        entityType: "deal",
        entityId: auroraDeal1.externalId ?? auroraDeal1.id,
        action: "deal.stage_changed",
        actor: process.env.APP_ACTOR_EMAIL || "alex@velocity.io",
        details: "Stage changed from DISCOVERY to EVALUATION"
      },
      {
        dealId: auroraDeal1.id,
        entityType: "calendar-event",
        entityId: calendarEvents[0]?.externalId ?? calendarEvents[0]?.id ?? "unknown",
        action: "calendar.ingested",
        actor: "system",
        details: "Calendar event ingested and linked to deal"
      },
      {
        dealId: techventureDeal1.id,
        entityType: "deal",
        entityId: techventureDeal1.externalId ?? techventureDeal1.id,
        action: "deal.created",
        actor: "hubspot-sync",
        details: "Deal synced from HubSpot CRM"
      },
      {
        dealId: techventureDeal1.id,
        entityType: "approval",
        entityId: "approval_tv_1",
        action: "approval.approved",
        actor: "manager@velocity.io",
        details: "Enterprise pricing proposal approved for sending"
      },
      {
        dealId: meridianDeal.id,
        entityType: "deal",
        entityId: meridianDeal.externalId ?? meridianDeal.id,
        action: "deal.stage_changed",
        actor: process.env.APP_ACTOR_EMAIL || "alex@velocity.io",
        details: "Stage changed from PROPOSAL to PROCUREMENT"
      },
      {
        dealId: catalystDeal.id,
        entityType: "signal",
        entityId: signals[9]?.externalId ?? signals[9]?.id ?? "unknown",
        action: "signal.detected",
        actor: "system",
        details: "New signal detected: Vendor contract expiring"
      }
    ]
  });

  console.log("✅ Seed complete!");
  console.log(`
📊 Summary:
- 5 Accounts (2 Enterprise, 2 Mid-Market, 1 Startup)
- 15 Contacts (Champions, Approvers, Blockers, Influencers)
- 10 Deals (across all pipeline stages)
- 11 Signals (hiring, funding, tooling, engagement)
- 12 Tasks (various priorities and statuses)
- 12 Activities (calls, emails, meetings, notes)
- 5 Signal Notifications
- 5 Calendar Events
- 3 Meeting Briefs
- 3 Follow-up Drafts
- 4 Outbound Approvals
- 2 Sequence Executions with Steps
- 8 Audit Log Entries
  `);
}

main()
  .catch((error) => {
    console.error("Seed failed", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
