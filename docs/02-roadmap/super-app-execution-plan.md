# Super App Execution Plan

## Objective

Transform the current sales cockpit into a full super app with in-house core systems and selective external integrations where speed-to-value is materially higher.

## Workstreams

1. Product Surface (TypeScript)
2. Ingestion Backbone (Go)
3. Intelligence Runtime (Python)
4. Workflow Reliability (Queue + retries + idempotency)
5. Identity/Governance (auth, RBAC, audit)

## Phase plan

### Phase A: Platform base (current + immediate)

- Keep cockpit as control plane.
- Standardize canonical event envelope.
- Stand up Go gateway starter and Python intelligence worker starter.
- Track integration checkpoints (`IntegrationSyncState`).

### Phase B: In-house system replacements

- Build internal CRM core:
  - account/contact/deal CRUD with pipeline semantics
  - bi-directional sync bridges during migration period
- Build internal call intelligence:
  - transcript ingest
  - speaker/action extraction
  - objection and risk scoring

### Phase C: Closed-loop execution

- Action generation always routes through approval queue.
- Approved actions fan out to channel adapters (email/call/calendar).
- Outcome feedback updates scoring and prioritization.

## Integration policy

- Build in-house when:
  - logic differentiates product win rate
  - data network effects compound over time
- Integrate external when:
  - function is commodity plumbing
  - replacement cost is high and non-differentiating

## Delivery metrics

- Time-to-first-action after meeting end
- Follow-up SLA adherence
- Admin time saved per rep
- Opportunity stage velocity
- Approval turnaround latency
