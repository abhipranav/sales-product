# Integration Activation Playbook

This guide is for moving the current frontend from demo-style behavior to production-grade feature execution.

## 1) What is already wired

- Workspace-scoped persistence layer with Prisma + Postgres models.
- CRM read/write APIs:
  - `/api/accounts`
  - `/api/contacts`
  - `/api/deals`
  - `/api/deals/:dealId/stage`
- Workflow APIs:
  - tasks, approvals, meeting-notes processing, activity logging
- LinkedIn companion capture:
  - `/integrations/linkedin`
  - `/api/integrations/linkedin/capture`
- HubSpot payload sync endpoint:
  - `GET /api/integrations/hubspot/sync`
  - `POST /api/integrations/hubspot/sync`
- Notification and search APIs.

## 2) Why features feel non-working today

If DB is not reachable or schema is not applied, many write paths skip persistence and the app falls back to snapshot/demo reads.

Minimum required for real behavior:

1. Valid `DATABASE_URL` and `DIRECT_URL`
2. Prisma client generated
3. Schema applied (`db:push`)
4. Seed/live data present

## 3) Production bootstrap sequence

Run in this exact order:

```bash
npm install
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

Then verify:

```bash
curl -s http://localhost:3000/api/system/status | jq
```

`mode` should be `live`.

## 4) Integration checklist by provider

### HubSpot CRM sync

Current status:
- Manual payload sync exists.
- Incremental delta batch endpoint exists: `POST /api/integrations/hubspot/sync/delta`.
- Multi-batch cadence endpoint exists: `POST /api/integrations/hubspot/sync/delta/cadence`.
- Optional external delta source is supported via `APP_HUBSPOT_DELTA_URL` (+ `HUBSPOT_PRIVATE_APP_TOKEN` header passthrough).
- OAuth token lifecycle is not yet implemented.

Activation plan:
1. Create a HubSpot private app and generate token.
2. Point `APP_HUBSPOT_DELTA_URL` to a service that returns normalized delta batch payloads (`cursor`, `account`, `contacts`, `deals`).
3. Persist cursor in `IntegrationSyncState` (already wired by sync service).
4. Trigger cadence endpoint from scheduler/cron with `APP_CRON_SECRET`.
5. Add retry + dead-letter handling for failed batches.

### Calendar (Google/Microsoft)

Current status:
- Manual ingest exists via `/api/calendar/events/ingest`.
- No OAuth/webhook ingestion yet.

Activation plan:
1. Implement provider OAuth callback + refresh token storage.
2. Subscribe to change notifications (Google push / Microsoft Graph subscriptions).
3. Transform events -> existing `ingestCalendarEvent` input.
4. Persist external event IDs for idempotent upserts.

### AI strategy provider

Current status:
- Works with rule-based fallback.
- OpenAI path activates when `OPENAI_API_KEY` is set.

Activation plan:
1. Add `OPENAI_API_KEY`.
2. Validate strategy execution creates tasks/approvals from generated plays.
3. Add guardrails (max tasks per run, content moderation if required).

### Outbound channel adapters (email/linkedin)

Current status:
- Approval queue exists.
- Approval state transition now triggers outbound dispatch service with audit artifacts (`outbound.sent` / `outbound.failed`).
- Dispatch provider is currently mock-backed; real Gmail/Graph/LinkedIn adapters are not yet implemented.

Activation plan:
1. Trigger sender only on `APPROVED` state transition.
2. Add provider adapters (Gmail/Graph first; LinkedIn last).
3. Write send results (provider message id, status, errors) to audit logs.

### LinkedIn

Current status:
- `linkedin` exists as a suggested channel enum.
- Public install guide exists at `/linkedin-extension`.
- Workspace capture workbench exists at `/integrations/linkedin`.
- Browser companion package exists at `extensions/linkedin-companion`.
- `POST /api/integrations/linkedin/capture` saves operator-confirmed account/contact records from the companion context.
- No LinkedIn send API integration is implemented.

Important:
- LinkedIn APIs require strict app review and approved scopes.
- Treat send-side LinkedIn automation as phase-2 after email adapters are stable.
- Current companion flow is intentionally user-confirmed and CRM-first, so the production auth/runtime path stays independent of the browser extension.

## 5) Social sharing / LinkedIn preview

To preview app links in LinkedIn posts:

1. Set `APP_BASE_URL` to a public `https` domain.
2. Ensure Open Graph metadata is reachable on that domain.
3. Re-scrape using LinkedIn Post Inspector:
   - [https://www.linkedin.com/post-inspector/](https://www.linkedin.com/post-inspector/)

`localhost` links will not produce LinkedIn previews.

## 6) Pre-launch hard requirements

Before inviting external users:

1. Harden the shipped Auth.js session layer with Prisma-backed user/account/session tables and reduce the remaining actor-header bridge.
2. Background job runner for sync and retries.
3. Error telemetry and uptime alerts.
4. Rate limits + input validation on all public API routes.
5. Data retention and PII handling policy for notes/transcripts.
