# Current State

## What exists now

- Clean Next.js + TypeScript application skeleton
- Multi-page super-app shell with persistent navigation and module routes (home, cockpit, accounts, pipeline, intelligence, integrations, workflows)
- Multi-page super-app shell with persistent navigation and module routes (home, workspace, cockpit, accounts, pipeline, intelligence, notifications, integrations, workflows)
- Initial cockpit experience centered on rep workflow execution
- Domain models for account/contact/deal/task/activity/signal
- Prisma schema for canonical persistent objects
- DB-backed dashboard service with API route fallback to mock data
- Task workflow endpoints for create/update/delete/complete actions
- Audit logging for task and calendar ingest actions
- Calendar ingest endpoint that also writes activity records
- Meeting-notes processing flow that converts notes into activities, tasks, refreshed briefs, and follow-up drafts
- Workspace tenancy baseline (`Workspace` + `WorkspaceMember`) applied across dashboard/task/calendar/meeting services
- HubSpot-style CRM sync endpoint with upsert behavior for account/contact/deal records
- HubSpot sync checkpoint state per workspace (`IntegrationSyncState`) for delta-ready ingestion
- Outbound approval queue (`/api/approvals*`) and cockpit controls for approve/reject workflow
- Header-based actor overrides (`x-actor-email`, `x-actor-name`) with workspace membership checks (`403` on violation)
- AI Strategy Lab in cockpit for first-principles play generation per deal context
- shadcn/ui-style local design system baseline with shared primitives (`components/ui`) and cockpit-wide adoption
- Native dark mode support (system + manual toggle) across app shell and UI primitives
- Standard SaaS marketing landing page IA at `/` with clear section flow (hero, logos, problem, features, modules, pricing, testimonials, FAQ, CTA)
- Workspace shell IA refinement: landing reachable by app logo; sidebar focused on in-product modules
- Implemented planned capability modules (v0): lead enrichment + dedupe, buying-signal alerts, sequence personalization, stakeholder mapping
- Sequence execution board with persistent records and step-level status updates
- Buying-signal notifications service + inbox module with acknowledgment flow
- CRM command-center forms for account/contact/deal create-update
- Polyglot super-app scaffolding with shared contracts, Go ingestion starter, and Python intelligence starter
- Documentation architecture for continuity across AI agents

## Risks

- Database is optional at runtime, so mock fallback can hide missing setup if not monitored
- Actor identity is header/env based, not yet backed by full auth provider session
- Calendar ingest currently manual trigger only (not provider-synced)

## Current mitigation

- Keep API contracts strict and typed
- Keep modules separated by domain concern
- Add explicit `503` responses for task APIs when DB is not configured
- Enforce workspace membership checks on all scoped API routes
- Expand via ADR-driven changes only
