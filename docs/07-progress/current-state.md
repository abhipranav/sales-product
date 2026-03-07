# Current State

## What exists now

- Clean Next.js + TypeScript application skeleton
- Multi-page super-app shell with persistent navigation and module routes (home, workspace, cockpit, accounts, pipeline, intelligence, notifications, integrations, workflows)
- Additional workspace routes for contacts, activities, settings, setup, and branded sign-in
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
- Incremental HubSpot delta batch runner with cursor progression (`POST /api/integrations/hubspot/sync/delta`)
- Multi-batch HubSpot delta cadence trigger (`POST /api/integrations/hubspot/sync/delta/cadence`)
- Outbound approval queue (`/api/approvals*`) and cockpit controls for approve/reject workflow
- Approval review now auto-dispatches outbound artifacts and logs `outbound.sent` / `outbound.failed`
- Auth.js JWT session runtime with branded sign-in page and middleware protection for workspace routes + APIs
- Middleware-to-service actor bridge via `x-actor-email` / `x-actor-name` headers with workspace membership checks (`403` on violation)
- AI Strategy Lab in cockpit for first-principles play generation per deal context
- shadcn/ui-style local design system baseline with shared primitives (`components/ui`) and cockpit-wide adoption
- Native dark mode support (system + manual toggle) across app shell and UI primitives
- Standard SaaS marketing landing page IA at `/` with clear section flow (hero, logos, problem, features, modules, pricing, testimonials, FAQ, CTA)
- Workspace shell IA refinement: landing reachable by app logo; sidebar focused on in-product modules
- Implemented planned capability modules (v0): lead enrichment + dedupe, buying-signal alerts, sequence personalization, stakeholder mapping
- Sequence execution board with persistent records and step-level status updates
- Buying-signal notifications service + inbox module with acknowledgment flow
- Dedicated generation APIs for follow-up drafts and meeting briefs (`/api/followups/:dealId/generate`, `/api/briefs/:dealId/generate`)
- Strategy-play execution API route (`/api/strategy/execute`) for external/automation triggers
- Task SLA reminder runner endpoint (`/api/tasks/reminders/run`) with daily idempotent reminder events
- CRM command-center forms for account/contact/deal create-update
- Accounts and Contacts index pages now hydrate with server-preloaded initial data instead of client-only loading states
- Pilot metrics service + cockpit panel for recommendation acceptance and action latency (`GET /api/metrics/pilot`)
- Cached pilot metrics, integration health snapshots, and lightweight workspace summary lookups for lower-latency page transitions
- Debounced command palette search with cached client results and parallel CRM entity lookups
- UX feedback toasts for strategy execution, meeting-note processing, follow-up + brief regeneration, task mutations, approval review, calendar ingest, and sequence mutations
- Polyglot super-app scaffolding with shared contracts, Go ingestion starter, and Python intelligence starter
- Documentation architecture for continuity across AI agents
- Cron-callable task reminder endpoint (`POST /api/cron/reminders`) protected with CRON_SECRET bearer token
- Cron-callable HubSpot delta sync cadence endpoint (`POST /api/cron/crm-sync`) for automated incremental sync
- Integration connection health API (`GET /api/integrations/status`) returning real-time HubSpot + Calendar connectivity
- Integration health status cards component on the Integrations page showing live connection state
- Calendar OAuth provider integration stub (Google Calendar scopes, auth URL builder, token lifecycle) awaiting credentials
- HubSpot OAuth integration stub (auth URL, token exchange) with private-app-token fallback and live connection test
- RBAC role-permission matrix service (`owner > manager > rep`) with `enforcePermission` and `enforceMinRole` utilities

## Risks

- Database is optional at runtime, so mock fallback can hide missing setup if not monitored
- Domain services still consume an injected actor-header bridge instead of reading Auth.js session state directly
- Calendar ingest currently manual trigger only (not provider-synced)
- RBAC helpers exist, but broad sensitive-route enforcement is not fully wired yet

## Current mitigation

- Keep API contracts strict and typed
- Keep modules separated by domain concern
- Add explicit `503` responses for task APIs when DB is not configured
- Enforce workspace membership checks on all scoped API routes
- Expand via ADR-driven changes only
