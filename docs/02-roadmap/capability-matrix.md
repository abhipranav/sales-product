# Capability Matrix

| Rank | Capability | Impact | Complexity | Status |
| :--- | :--- | :--- | :--- | :--- |
| 1 | Auto CRM update from meetings/calls | Very High | Low | Implemented (v1) |
| 2 | Follow-up autopilot (draft + reminders) | Very High | Low | Implemented (v1) — AI generation + rule-based fallback + toast feedback |
| 3 | Meeting prep brief generation | High | Low | Implemented (v1) — AI generation + rule-based fallback |
| 4 | Lead enrichment + dedupe | High | Low | Implemented (v0) — persona inference + overlap detection |
| 5 | Buying-signal alerts | High | Medium | Implemented (v0) — scored alerts with recommended actions |
| 6 | Sequence personalization | High | Medium | Implemented (v0) — role-aware, signal-aware step plans |
| 7 | Next-step enforcement + MAP tracking | High | Medium | Implemented (v0) — task lifecycle with audit trail |
| 8 | Stakeholder mapping | High | Medium | Implemented (v0) — coverage gap analysis |
| 9 | Workspace scoping + actor access checks | Very High | Medium | Implemented (v1) — RBAC role gates added (owner/manager/rep) |
| 10 | Outbound approval queue | High | Medium | Implemented (v1) — approval lifecycle + outbound dispatch on approve |
| 11 | CRM sync checkpoints (delta-ready) | High | Medium | Implemented (v1) — HubSpot delta scheduler + cron-callable endpoint |
| 12 | Buying-signal notification inbox | High | Medium | Implemented (v0) — notification feed with ack workflow |
| 13 | Sequence execution tracking (step states) | High | Medium | Implemented (v0) — board with step-level state management |
| 14 | In-app CRM command center forms | Medium | Low | Implemented (v0) — account/contact/deal forms with toast |
| 15 | Task SLA reminders | High | Medium | Implemented (v1) — reminder service + cron endpoint |
| 16 | Pilot metrics panel | Medium | Low | Implemented (v1) — recommendation acceptance, action latency, operations |
| 17 | Integration connection health | Medium | Low | Implemented (v1) — HubSpot + Calendar status API + UI panel |
| 18 | RBAC permission enforcement | High | Medium | Implemented (v1) — role-permission matrix + enforcement helpers |
| 19 | Calendar/HubSpot OAuth stubs | Medium | High | Stubbed (v1) — interfaces defined, awaiting provider credentials |
