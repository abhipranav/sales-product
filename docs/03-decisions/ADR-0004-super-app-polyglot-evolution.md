# ADR-0004: Super App Polyglot Evolution

- Status: Accepted
- Date: 2026-02-07

## Context

The product goal is a super app for revenue teams, not just a cockpit UI. The platform must absorb high-volume integrations (CRM, call intelligence, calendars, email, signals), run heavy intelligence workflows, and keep operational latency low.

A TypeScript modular monolith unlocked fast v1 delivery. It should remain the product surface and orchestration core, but not monopolize every runtime concern.

## Decision

Adopt a polyglot architecture with explicit workload boundaries:

- Keep Next.js + TypeScript as the product application layer (UI, APIs, workflow orchestration, tenancy, approvals).
- Add a Go ingestion gateway for high-throughput webhook/event intake and normalization.
- Add a Python intelligence worker for transcript processing, scoring, and model-heavy workloads.
- Share contracts via versioned event schemas (`contracts/events`) instead of language-specific ad hoc types.
- Use Postgres as system-of-record and event history while introducing asynchronous workflow execution through queue-backed workers.

## Why this decision

- Throughput-sensitive webhook paths benefit from Go runtime efficiency.
- AI/ML and transcript workflows are materially faster to evolve in Python ecosystems.
- Product and workflow orchestration still benefit from existing TypeScript velocity.
- Versioned contracts reduce integration drift across languages and teams.

## Consequences

- Engineering process must include contract versioning and compatibility checks.
- Observability and tracing standards must be consistent across TypeScript, Go, and Python services.
- Local development gains complexity; runbooks must clearly define service startup order and ownership.
