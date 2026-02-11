# ADR-0003: DB-First Dashboard With Fallback

- Status: Accepted
- Date: 2026-02-07

## Context

During early build, teams need the cockpit UI usable even before provisioning managed PostgreSQL environments.

## Decision

- Dashboard reads are DB-first via Prisma.
- If Prisma is unavailable or `DATABASE_URL` is missing, the dashboard falls back to deterministic mock data.
- Task mutation endpoints do not fallback; they return `503` when DB is unavailable.

## Rationale

- Keeps frontend development and demo flow unblocked.
- Preserves strictness for write paths so data consistency expectations are explicit.

## Consequences

- Production readiness requires an environment guard that disallows mock fallback.
- Monitoring must detect fallback usage so missing DB setup is surfaced quickly.
