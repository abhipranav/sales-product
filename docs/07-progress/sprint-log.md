# Sprint Log

## Sprint 0 (2026-02-07)

Completed:

- Greenfield repo scaffolding
- Stack and scope ADRs
- Core docs system for AI handoff continuity
- Canonical domain model types
- Mock-backed rep cockpit UI + API endpoint
- PostgreSQL Prisma schema for canonical sales entities
- DB-first dashboard service with mock fallback
- Task workflow APIs (`POST /api/tasks`, `POST /api/tasks/:taskId/complete`)
- Task lifecycle expansion (`PATCH /api/tasks/:taskId`, `DELETE /api/tasks/:taskId`)
- Audit log model and retrieval endpoint (`GET /api/deals/:dealId/audit`)
- Calendar ingest endpoint (`POST /api/calendar/events/ingest`) with activity + audit writes
- Meeting notes processing endpoint (`POST /api/meetings/process`) with auto-generated tasks + brief/follow-up refresh
- Workspace tenancy foundations in schema and service-layer filters (`Workspace`, `WorkspaceMember`, account scoping)
- HubSpot CRM sync path (`POST /api/integrations/hubspot/sync`) with workspace-safe upserts
- HubSpot sync checkpoint tracking (`IntegrationSyncState`) with `GET /api/integrations/hubspot/sync`
- Actor-aware access control for API/action flows via workspace membership checks and actor headers
- Outbound approval queue endpoints (`GET/POST /api/approvals`, `POST /api/approvals/:approvalId/review`) plus cockpit review UI
- AI Strategy Lab module in cockpit (first-principles play generation from live deal context)
- Polyglot super-app foundation docs + shared event schema + Go/Python service starters
- Pipeline metrics strip + execution log panel in cockpit UI

Next:

- Add provider-backed authentication and signed session actor propagation
- Add CRM delta sync jobs with change checkpoints and reconciliation logs
- Add outbound sender adapters triggered only from approved queue state

## Sprint 1 (2026-02-08)

Completed:

- Migrated UI baseline to shadcn-style primitives across workspace shell
- Added system/manual dark mode with `next-themes`
- Reworked workspace IA (landing via logo, module-focused sidebar)
- Introduced dashboard cache + route revalidation strategy for faster module loads
- Added capability modules: lead enrichment/dedupe, buying-signal alerts, sequence personalization, stakeholder mapping
- Added persistent `SignalNotification` and `SequenceExecution` models in Prisma with Supabase sync
- Added notifications APIs (`GET /api/notifications`, `POST /api/notifications/:notificationId/ack`)
- Added sequence APIs (`GET/POST /api/sequences`, `PATCH /api/sequences/steps/:stepId`)
- Added Notifications workspace module (`/notifications`) with acknowledgment workflow
- Added Sequence Execution Board in Workflows with create and step-status update actions
- Added CRM Command Center forms in Accounts for account/contact/deal create-update flows
- Updated integration architecture and API docs for AI/human handoff continuity

Next:

- Add outbound sender connectors (email/LinkedIn) gated by approval state
- Add analytics events for sequence and notification conversion impact
- Add durable background workers for high-volume signal processing
