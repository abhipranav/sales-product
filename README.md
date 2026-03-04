# Sales Product (AI Sales Execution)

A docs-first, conversation-first AI sales execution platform focused on reducing manual rep work.

## Finalized v1 tech stack

- Product architecture: modular monolith (single deployable app, clean domain boundaries)
- Frontend: Next.js App Router + React + TypeScript + Tailwind CSS + shadcn/ui primitives
- Backend: Next.js Route Handlers + server-side domain services
- Data layer (planned in next iteration): PostgreSQL + Prisma + pgvector
- Async/workflows (planned in next iteration): Redis + BullMQ workers
- AI layer: OpenAI provider abstraction with per-user key/model preferences and daily usage accounting
- Auth: Auth.js (JWT sessions) with Google/LinkedIn and optional dev credentials login
- Observability (planned in next iteration): OpenTelemetry traces + structured audit logs

## Current state

This repository now includes:

- Core docs system for handoff-safe execution (`/docs`)
- Architecture decision record selecting stack (`/docs/03-decisions/ADR-0001-tech-stack.md`)
- Canonical domain model types (`/lib/domain/types.ts`)
- Prisma schema + seed (`/prisma/schema.prisma`, `/prisma/seed.mjs`)
- DB-backed dashboard service with fallback (`/lib/services/dashboard.ts`)
- Workspace membership scoping across read/write services
- AI Strategy Lab for first-principles deal plays
- Initial Rep Cockpit UI (`/app/(workspace)/cockpit/page.tsx`) with:
  - prioritized next actions
  - pipeline metrics strip
  - pilot metrics panel (recommendation acceptance + action latency)
  - meeting prep brief
  - follow-up draft
  - deal health panel
  - execution audit log
  - calendar ingest control
- Multi-page super-app shell with persistent navigation:
  - `/` (Marketing landing page)
  - `/auth/signin` (custom branded sign-in)
  - `/workspace` (Super App Home)
  - `/settings` (User account + notification preferences)
  - `/setup` (Live readiness and integration checklist)
  - `/cockpit`
  - `/accounts`
  - `/pipeline`
  - `/intelligence`
  - `/notifications`
  - `/integrations`
  - `/workflows`
- Shared UI primitives and cockpit migration to shadcn-style components:
  - `Button`, `Card`, `Input`, `Textarea`, `Select`, `Badge`, `Separator`
  - `cn` utility with `clsx` + `tailwind-merge`
- New v0 capability modules now live in-product:
  - Lead enrichment + dedupe
  - Buying-signal alerts
  - Sequence personalization
  - Stakeholder mapping
  - Sequence execution board with step-level status tracking
  - Buying-signal notifications inbox with acknowledgment workflow
  - CRM command center forms for account/contact/deal create-update
- Native dark mode support (system-aware with manual toggle) via `next-themes`
- Standard SaaS-style marketing landing page at `/` (hero, logos, problem, features, modules, integrations, pricing, testimonials, FAQ, CTA)
- Workspace sidebar now routes to landing page via app logo (no separate landing nav item)
- Route-level performance timing logs for dashboard fetches (enable with `APP_PERF_LOGS=1`)
- Protected workspace + API routes via middleware and Auth.js session checks
- API endpoints:
  - `GET|POST /api/auth/[...nextauth]`
  - `GET /api/dashboard`
  - `GET /api/metrics/pilot`
  - `GET /api/system/status`
  - `GET /api/settings/user`
  - `PATCH /api/settings/user`
  - `GET /api/settings/user/ai`
  - `PATCH /api/settings/user/ai`
  - `GET /api/notifications`
  - `POST /api/notifications/:notificationId/ack`
  - `POST /api/followups/:dealId/generate`
  - `POST /api/briefs/:dealId/generate`
  - `POST /api/strategy/execute`
  - `GET /api/sequences`
  - `POST /api/sequences`
  - `PATCH /api/sequences/steps/:stepId`
  - `POST /api/tasks`
  - `POST /api/tasks/reminders/run`
  - `PATCH /api/tasks/:taskId`
  - `DELETE /api/tasks/:taskId`
  - `POST /api/tasks/:taskId/complete`
  - `POST /api/calendar/events/ingest`
  - `POST /api/meetings/process`
  - `GET /api/integrations/hubspot/sync`
  - `POST /api/integrations/hubspot/sync`
  - `POST /api/integrations/hubspot/sync/delta`
  - `POST /api/integrations/hubspot/sync/delta/cadence`
  - `GET /api/approvals`
  - `POST /api/approvals`
  - `POST /api/approvals/:approvalId/review`
  - `GET /api/deals/:dealId/audit`

## Run locally

1. Install dependencies: `npm install`
2. Set `AUTH_SECRET` in `.env` (or copy from `.env.example`)
3. Start dev server: `npm run dev`
4. Open: `http://localhost:3000`
5. Sign in: `http://localhost:3000/auth/signin`
6. Open setup/readiness page: `http://localhost:3000/setup`

## Supabase integration (recommended)

1. Open Supabase dashboard -> `Project Settings` -> `Database` -> `Connection string`.
2. Copy the pooled connection string (pooler, typically port `6543`) into `DATABASE_URL`.
3. Copy the direct connection string (typically port `5432`) into `DIRECT_URL`.
4. Ensure both URLs include `sslmode=require`.
5. For `DATABASE_URL`, include `pgbouncer=true&connection_limit=1`.
6. Add both values to `.env` using `.env.example` as template.
7. Set workspace defaults in `.env`: `APP_WORKSPACE_SLUG`, `APP_WORKSPACE_NAME`, `APP_ACTOR_EMAIL`, `APP_ACTOR_NAME`.
8. Set public base URL for social previews: `APP_BASE_URL` (for LinkedIn/Open Graph cards).
9. Set auth provider vars if using OAuth:
   - `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`
   - `AUTH_LINKEDIN_ID`, `AUTH_LINKEDIN_SECRET`
10. Keep `APP_ENABLE_DEV_LOGIN=1` for local testing, set to `0` in production.
11. Run:
   - `npm run db:generate`
   - `npm run db:push`
   - `npm run db:seed`
12. Start app: `npm run dev`

## AI settings and daily token caps

- Each workspace member can configure:
  - personal OpenAI API key (encrypted at rest)
  - preferred model (default: `gpt-5-mini`)
- Daily model token caps are enforced per user (UTC day):
  - `gpt-5-mini`: `2,500,000` total tokens/day
  - `gpt-5`: `250,000` total tokens/day
- Usage is recorded from provider response usage (`total_tokens`) and shown in account settings.
- Daily counters reset at `00:00 UTC`.

## Notes for Supabase + Prisma

- `DATABASE_URL` is used by the running app (pooler).
- `DIRECT_URL` is used for schema operations (`db:push`, seed, migrations).
- If your network cannot reach direct DB host, use Supabase session pooler as `DIRECT_URL` temporarily.

## Auth provider setup (Vercel)

- Production URL: `https://sales-product-beta.vercel.app/`
- Keep `APP_ENABLE_DEV_LOGIN=1` during rollout (switch to `0` later).
- Set these Vercel Environment Variables:
  - `AUTH_SECRET` (generate: `openssl rand -base64 32`)
  - `AUTH_GOOGLE_ID`
  - `AUTH_GOOGLE_SECRET`
  - `AUTH_LINKEDIN_ID`
  - `AUTH_LINKEDIN_SECRET`
  - `APP_BASE_URL=https://sales-product-beta.vercel.app/`
  - `APP_ENABLE_DEV_LOGIN=1`
- OAuth callback URLs:
  - Google: `https://sales-product-beta.vercel.app/api/auth/callback/google`
  - LinkedIn: `https://sales-product-beta.vercel.app/api/auth/callback/linkedin`
- Local callback URLs:
  - Google: `http://localhost:3000/api/auth/callback/google`
  - LinkedIn: `http://localhost:3000/api/auth/callback/linkedin`

## Actor + Workspace Access

- Workspace scope is enforced via `Workspace` + `WorkspaceMember`.
- Default actor is from `.env` (`APP_ACTOR_EMAIL`, `APP_ACTOR_NAME`).
- New actor emails are auto-provisioned as `REP` by default (`APP_AUTO_PROVISION_MEMBERS=1`).
- Set `APP_AUTO_PROVISION_MEMBERS=0` to require explicit membership provisioning.
- API clients can override actor headers:
  - `x-actor-email`
  - `x-actor-name`

## Super-App Foundation

- Shared cross-language event contracts live in `contracts/events`.
- Polyglot service starters live in `services/`:
  - Go ingestion gateway
  - Python intelligence worker
- Architecture and execution docs:
  - `docs/01-architecture/super-app-topology.md`
  - `docs/02-roadmap/super-app-execution-plan.md`
  - `docs/03-decisions/ADR-0004-super-app-polyglot-evolution.md`
  - `docs/03-decisions/ADR-0005-ui-system-shadcn.md`

## Immediate build focus

- CRM delta sync jobs (incremental pulls + reconciliation logs)
- Workspace RBAC expansion beyond single actor defaults
- Production outbound channel adapters (Gmail/Graph/LinkedIn) replacing mock dispatch provider

## Integration go-live playbook

- See `docs/05-operations/integration-activation-playbook.md` for step-by-step production activation across HubSpot, calendar, AI, outbound channels, and LinkedIn readiness.
- See `docs/05-operations/auth-integration-playbook.md` for free-tier auth provider options and a concrete implementation path.
- See `docs/04-specs/account-settings-spec.md` for the researched SaaS baseline behind user account/settings implementation.
