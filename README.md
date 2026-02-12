# Sales Product (AI Sales Execution)

A docs-first, conversation-first AI sales execution platform focused on reducing manual rep work.

## Finalized v1 tech stack

- Product architecture: modular monolith (single deployable app, clean domain boundaries)
- Frontend: Next.js App Router + React + TypeScript + Tailwind CSS + shadcn/ui primitives
- Backend: Next.js Route Handlers + server-side domain services
- Data layer (planned in next iteration): PostgreSQL + Prisma + pgvector
- Async/workflows (planned in next iteration): Redis + BullMQ workers
- AI layer (planned in next iteration): provider abstraction for OpenAI/Anthropic
- Auth and RBAC (planned in next iteration): Better Auth + row-level data scoping
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
  - meeting prep brief
  - follow-up draft
  - deal health panel
  - execution audit log
  - calendar ingest control
- Multi-page super-app shell with persistent navigation:
  - `/` (Marketing landing page)
  - `/workspace` (Super App Home)
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
- API endpoints:
  - `GET /api/dashboard`
  - `GET /api/notifications`
  - `POST /api/notifications/:notificationId/ack`
  - `GET /api/sequences`
  - `POST /api/sequences`
  - `PATCH /api/sequences/steps/:stepId`
  - `POST /api/tasks`
  - `PATCH /api/tasks/:taskId`
  - `DELETE /api/tasks/:taskId`
  - `POST /api/tasks/:taskId/complete`
  - `POST /api/calendar/events/ingest`
  - `POST /api/meetings/process`
  - `GET /api/integrations/hubspot/sync`
  - `POST /api/integrations/hubspot/sync`
  - `GET /api/approvals`
  - `POST /api/approvals`
  - `POST /api/approvals/:approvalId/review`
  - `GET /api/deals/:dealId/audit`

## Run locally

1. Install dependencies: `npm install`
2. Start dev server: `npm run dev`
3. Open: `http://localhost:3000`

## Supabase integration (recommended)

1. Open Supabase dashboard -> `Project Settings` -> `Database` -> `Connection string`.
2. Copy the pooled connection string (pooler, typically port `6543`) into `DATABASE_URL`.
3. Copy the direct connection string (typically port `5432`) into `DIRECT_URL`.
4. Ensure both URLs include `sslmode=require`.
5. For `DATABASE_URL`, include `pgbouncer=true&connection_limit=1`.
6. Add both values to `.env` using `.env.example` as template.
7. Set workspace defaults in `.env`: `APP_WORKSPACE_SLUG`, `APP_WORKSPACE_NAME`, `APP_ACTOR_EMAIL`, `APP_ACTOR_NAME`.
8. Run:
   - `npm run db:generate`
   - `npm run db:push`
   - `npm run db:seed`
9. Start app: `npm run dev`

## Notes for Supabase + Prisma

- `DATABASE_URL` is used by the running app (pooler).
- `DIRECT_URL` is used for schema operations (`db:push`, seed, migrations).
- If your network cannot reach direct DB host, use Supabase session pooler as `DIRECT_URL` temporarily.

## Actor + Workspace Access

- Workspace scope is enforced via `Workspace` + `WorkspaceMember`.
- Default actor is from `.env` (`APP_ACTOR_EMAIL`, `APP_ACTOR_NAME`).
- API clients can override actor headers:
  - `x-actor-email`
  - `x-actor-name`
- Non-member actors get `403` on scoped endpoints.

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
- Outbound send adapters behind approval state transitions
