import type { HubspotSyncPayload } from "@/lib/services/integrations/hubspot-sync";

export type HubspotDeltaBatch = {
  cursor: string;
  account: HubspotSyncPayload["account"];
  contacts: HubspotSyncPayload["contacts"];
  deals: HubspotSyncPayload["deals"];
};

export const hubspotDeltaFeed: HubspotDeltaBatch[] = [
  {
    cursor: "delta-001",
    account: {
      externalId: "hs_acc_aurora",
      name: "Aurora Logistics",
      segment: "mid-market",
      website: "https://auroralogistics.example",
      employeeBand: "201-500"
    },
    contacts: [
      {
        externalId: "hs_cnt_maya",
        fullName: "Maya Kim",
        title: "Head of Talent Operations",
        email: "maya.kim@auroralogistics.example",
        role: "champion"
      },
      {
        externalId: "hs_cnt_alex",
        fullName: "Alex Rivera",
        title: "VP Finance",
        email: "alex.rivera@auroralogistics.example",
        role: "approver"
      }
    ],
    deals: [
      {
        externalId: "hs_deal_q1",
        name: "AI Interview Platform Rollout",
        stage: "evaluation",
        amount: 76000,
        confidence: 0.64,
        closeDate: new Date("2026-03-14T00:00:00.000Z"),
        riskSummary: "Security review owner still pending."
      }
    ]
  },
  {
    cursor: "delta-002",
    account: {
      externalId: "hs_acc_aurora",
      name: "Aurora Logistics",
      segment: "mid-market",
      website: "https://auroralogistics.example",
      employeeBand: "201-500"
    },
    contacts: [
      {
        externalId: "hs_cnt_maya",
        fullName: "Maya Kim",
        title: "VP Talent Operations",
        email: "maya.kim@auroralogistics.example",
        role: "champion"
      }
    ],
    deals: [
      {
        externalId: "hs_deal_q1",
        name: "AI Interview Platform Rollout",
        stage: "proposal",
        amount: 82000,
        confidence: 0.69,
        closeDate: new Date("2026-03-11T00:00:00.000Z"),
        riskSummary: "Commercial approval in progress, procurement owner still unconfirmed."
      }
    ]
  },
  {
    cursor: "delta-003",
    account: {
      externalId: "hs_acc_aurora",
      name: "Aurora Logistics",
      segment: "enterprise",
      website: "https://auroralogistics.example",
      employeeBand: "501-1000"
    },
    contacts: [
      {
        externalId: "hs_cnt_neil",
        fullName: "Neil Grant",
        title: "Director of Security",
        email: "neil.grant@auroralogistics.example",
        role: "blocker"
      }
    ],
    deals: [
      {
        externalId: "hs_deal_q1",
        name: "AI Interview Platform Rollout",
        stage: "proposal",
        amount: 82000,
        confidence: 0.73,
        closeDate: new Date("2026-03-09T00:00:00.000Z"),
        riskSummary: "Legal packet requested; security questions acknowledged."
      }
    ]
  },
  {
    cursor: "delta-004",
    account: {
      externalId: "hs_acc_aurora",
      name: "Aurora Logistics",
      segment: "enterprise",
      website: "https://auroralogistics.example",
      employeeBand: "501-1000"
    },
    contacts: [],
    deals: [
      {
        externalId: "hs_deal_q1",
        name: "AI Interview Platform Rollout",
        stage: "procurement",
        amount: 82000,
        confidence: 0.78,
        closeDate: new Date("2026-03-06T00:00:00.000Z"),
        riskSummary: "Procurement queue entered; legal redlines expected."
      }
    ]
  }
];
