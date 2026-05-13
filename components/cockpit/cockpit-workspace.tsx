"use client";

import { useState } from "react";
import type { DashboardData, PilotMetricsSnapshot } from "@/lib/domain/types";
import { NextActions } from "@/components/cockpit/next-actions";
import { MeetingBriefCard } from "@/components/cockpit/meeting-brief";
import { FollowUpComposer } from "@/components/cockpit/follow-up-composer";
import { MeetingNotesCapture } from "@/components/cockpit/meeting-notes-capture";
import { ApprovalQueue } from "@/components/cockpit/approval-queue";
import { StrategyLab } from "@/components/cockpit/strategy-lab";
import { PilotMetricsPanel } from "@/components/cockpit/pilot-metrics-panel";
import { DealHealth } from "@/components/cockpit/deal-health";
import { BuyingSignalAlerts } from "@/components/cockpit/buying-signal-alerts";
import { StakeholderMap } from "@/components/cockpit/stakeholder-map";
import { AuditTrail } from "@/components/cockpit/audit-trail";
import { CalendarIngest } from "@/components/cockpit/calendar-ingest";
import { CrmSyncPanel } from "@/components/cockpit/crm-sync-panel";
import { CrmCommandCenter } from "@/components/cockpit/crm-command-center";
import { SequenceExecutionBoard } from "@/components/cockpit/sequence-execution-board";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface CockpitWorkspaceProps {
  data: DashboardData;
  pilotMetrics: PilotMetricsSnapshot;
  pilotMetricsMode: "live" | "mock";
  sequences: any[];
}

type TabId = "focus" | "meeting" | "approvals" | "strategy" | "telemetry" | "crm_command";

const tabsList = [
  { id: "focus" as TabId, label: "FOCUS_BOARD", index: "01" },
  { id: "meeting" as TabId, label: "MEETING_PREP", index: "02" },
  { id: "approvals" as TabId, label: "OUTBOUND_APPROVALS", index: "03" },
  { id: "strategy" as TabId, label: "STRATEGY_LAB", index: "04" },
  { id: "telemetry" as TabId, label: "TELEMETRY_LOGS", index: "05" },
  { id: "crm_command" as TabId, label: "CRM_COMMAND", index: "06" },
];

export function CockpitWorkspace({ data, pilotMetrics, pilotMetricsMode, sequences }: CockpitWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<TabId>("focus");

  return (
    <div className="space-y-6">
      {/* Premium Tactile Tab Navigation */}
      <div className="border-[2px] border-[hsl(var(--border))] bg-[hsl(var(--card))] p-2">
        <div className="flex flex-wrap gap-2">
          {tabsList.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "relative flex-1 min-w-[140px] px-4 py-3 text-left font-mono transition-all duration-150 border-[2px] cursor-pointer",
                  isActive
                    ? "bg-[hsl(var(--foreground))] border-[hsl(var(--foreground))] text-[hsl(var(--background))]"
                    : "bg-[hsl(var(--card))] border-[hsl(var(--border))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className={cn(
                    "text-[10px] font-bold opacity-60",
                    isActive ? "text-[hsl(var(--background))] opacity-90" : ""
                  )}>
                    SYS_VAL // {tab.index}
                  </span>
                  {isActive && (
                    <span className="w-1.5 h-1.5 bg-yellow-400 border border-black animate-pulse" />
                  )}
                </div>
                <div className="mt-1.5 text-xs font-black tracking-wider uppercase">
                  {tab.label}
                </div>
                {isActive && (
                  <div className="absolute left-0 bottom-0 right-0">
                    <div className="caution-stripe-thin h-[3px]" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Panels */}
      <div className="transition-all duration-200">
        {activeTab === "focus" && (
          <div className="reveal grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-5">
              <div className="reveal reveal-delay-1">
                <NextActions dealId={data.deal.id} tasks={data.tasks} />
              </div>
              <div className="reveal reveal-delay-2">
                <BuyingSignalAlerts deal={data.deal} signals={data.account.signals} />
              </div>
            </div>
            <div className="space-y-5">
              <div className="reveal reveal-delay-1">
                <PilotMetricsPanel metrics={pilotMetrics} mode={pilotMetricsMode} />
              </div>
              <div className="reveal reveal-delay-2">
                <DealHealth deal={data.deal} contacts={data.contacts} signals={data.account.signals} />
              </div>
              <div className="reveal reveal-delay-3">
                <StakeholderMap contacts={data.contacts} />
              </div>
            </div>
          </div>
        )}

        {activeTab === "meeting" && (
          <div className="reveal grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-5">
              <div className="reveal reveal-delay-1">
                <MeetingNotesCapture dealId={data.deal.id} />
              </div>
              <div className="reveal reveal-delay-2">
                <MeetingBriefCard dealId={data.deal.id} brief={data.meetingBrief} />
              </div>
            </div>
            <div className="space-y-5">
              <div className="reveal reveal-delay-1">
                <FollowUpComposer dealId={data.deal.id} draft={data.followUpDraft} />
              </div>
            </div>
          </div>
        )}

        {activeTab === "approvals" && (
          <div className="reveal grid gap-5 lg:grid-cols-[1fr_1fr]">
            <div className="reveal reveal-delay-1 space-y-5">
              <ApprovalQueue approvals={data.approvals} />
            </div>
            <div className="reveal reveal-delay-2 space-y-5">
              <SequenceExecutionBoard
                dealId={data.deal.id}
                contacts={data.contacts}
                sequences={sequences}
              />
            </div>
          </div>
        )}

        {activeTab === "strategy" && (
          <div className="reveal space-y-5 max-w-4xl mx-auto">
            <div className="reveal reveal-delay-1">
              <StrategyLab plays={data.strategyPlays} dealId={data.deal.id} />
            </div>
          </div>
        )}

        {activeTab === "telemetry" && (
          <div className="reveal grid gap-5 lg:grid-cols-[1fr_1fr]">
            <div className="space-y-5">
              <div className="reveal reveal-delay-1">
                <CrmSyncPanel />
              </div>
              <div className="reveal reveal-delay-2">
                <CalendarIngest dealId={data.deal.id} />
              </div>
            </div>
            <div className="space-y-5">
              <Card className="reveal reveal-delay-1">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-[hsl(var(--foreground))]">
                      RECENT_ACTIVITY
                    </h3>
                    <span className="font-mono text-[10px] bg-yellow-400 text-black px-1.5 py-0.5 border border-black font-bold">
                      LIVE_STREAM
                    </span>
                  </div>
                  <ul className="space-y-3">
                    {data.recentActivities.map((activity) => (
                      <li key={activity.id} className="border-[2px] border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-3 text-sm transition-colors duration-150 hover:bg-[hsl(var(--card))]">
                        <p className="font-bold capitalize text-[hsl(var(--foreground))]">{activity.type}</p>
                        <p className="text-[hsl(var(--muted-foreground))] mt-0.5">{activity.summary}</p>
                        <p className="mt-1 font-mono text-[9px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]">{new Date(activity.happenedAt).toLocaleString()}</p>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
              <div className="reveal reveal-delay-2">
                <AuditTrail events={data.auditTrail} />
              </div>
            </div>
          </div>
        )}

        {activeTab === "crm_command" && (
          <div className="reveal space-y-5 max-w-4xl mx-auto">
            <div className="reveal reveal-delay-1">
              <CrmCommandCenter account={data.account} deal={data.deal} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
