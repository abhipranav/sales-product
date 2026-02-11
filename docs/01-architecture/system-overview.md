# System Overview

## Architecture style

Hybrid super-app architecture:

- TypeScript modular monolith remains control plane and primary product surface.
- Polyglot service lanes are introduced for specialized runtime concerns:
  - Go ingestion gateway
  - Python intelligence worker

## Main modules

- `capture`: inbound activities (meetings, calls, emails, CRM events)
- `intelligence`: signal scoring, risk scoring, stakeholder inference
- `workflow`: tasks, reminders, next-step enforcement, approvals
- `execution`: drafts, meeting briefs, rep cockpit actions
- `governance`: consent tracking, audit logs, regional compliance gates
- `platform-services`: polyglot ingestion and intelligence runtimes

## Product route map

- `/`: marketing landing page
- `/workspace`: super-app home with module-level status and launch actions
- `/cockpit`: rep execution cockpit (tasks, briefs, approvals, audit, ingestion)
- `/accounts`: account + stakeholder context with live signals
- `/pipeline`: revenue metrics, stage progression, and risked execution work
- `/intelligence`: strategy plays, briefing, and notes-to-actions workflows
- `/integrations`: CRM and calendar integration control surface
- `/workflows`: orchestration layer for tasks, approvals, and operational audit

## Data flow

1. Activity ingestion writes canonical events.
2. Intelligence jobs annotate accounts/deals/tasks.
3. Workflow engine computes next actions.
4. UI surfaces "what to do now" and draft artifacts.
5. User actions and outcomes feed model-learning datasets.
