import { syncHubspotAction } from "@/app/actions/crm-sync";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

const samplePayload = JSON.stringify(
  {
    source: "hubspot",
    syncReason: "manual-import",
    cursor: "batch-42",
    nextCursor: "batch-43",
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
      }
    ],
    deals: [
      {
        externalId: "hs_deal_q1",
        name: "AI Interview Platform Rollout",
        stage: "evaluation",
        amount: 76000,
        confidence: 0.64,
        closeDate: "2026-03-14T00:00:00.000Z",
        riskSummary: "Security review owner still pending."
      }
    ]
  },
  null,
  2
);

export function CrmSyncPanel() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-['Sora',sans-serif]">CRM Sync (HubSpot)</CardTitle>
        <CardDescription>Paste a HubSpot-style payload to upsert account, contacts, and deals into this workspace.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={syncHubspotAction} className="grid gap-2">
          <Textarea name="payload" required rows={12} defaultValue={samplePayload} className="font-mono text-xs" />
          <Button type="submit" className="w-fit">
            Run Sync
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
