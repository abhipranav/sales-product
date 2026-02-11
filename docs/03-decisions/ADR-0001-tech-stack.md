# ADR-0001: v1 Technology Stack

- Status: Accepted
- Date: 2026-02-07
- Superseded-by: ADR-0004 (polyglot super-app evolution), ADR-0005 (UI system baseline)

## Context

The product must ship quickly with high UX quality while supporting a future path to workflow automation, AI reasoning, and enterprise governance.

## Decision

Use a TypeScript-first modular monolith for v1:

- Frontend: Next.js App Router + React + Tailwind CSS
- Backend: Next.js route handlers + domain services
- Persistence target: PostgreSQL + Prisma + pgvector
- Async jobs target: Redis + BullMQ
- AI provider layer: adapter pattern to support multiple LLM vendors

## Why this stack

- Enables fast iteration with one codebase and no early distributed-systems overhead
- Strong SSR and server action ergonomics for low-latency cockpit experiences
- Clear migration path from monolith modules to services only when operationally justified
- Type safety across UI, API, and workflow boundaries

## Consequences

- v1 prioritizes developer velocity over maximal runtime isolation
- Requires strict internal module boundaries to avoid monolith entropy
- Background workflow scale depends on worker architecture introduced in Phase 2
