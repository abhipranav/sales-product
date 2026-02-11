# Super App Topology

## Runtime topology

1. Product App (`nextjs` / TypeScript)
2. Ingestion Gateway (`go`)
3. Intelligence Worker (`python`)
4. Postgres (`supabase`)
5. Queue/Stream backbone (planned: Redis Streams or NATS)

## Bounded responsibilities

- Product App (TypeScript):
  - Workspace tenancy + actor authorization
  - Human-in-loop workflow state (tasks, approvals, queue visibility)
  - Canonical REST APIs and cockpit rendering
- Ingestion Gateway (Go):
  - CRM/calendar/call-intelligence webhook intake
  - Idempotency keys and retry-safe write path
  - Event normalization into shared envelope contract
- Intelligence Worker (Python):
  - Transcript parsing and extraction
  - Objection/risk scoring
  - Suggested actions and narrative synthesis
  - Batch and async model workflows

## Data lanes

1. External systems emit webhook payloads to Go gateway.
2. Gateway validates, normalizes to event contract, writes event records and queue message.
3. Python worker consumes normalized events, computes intelligence outputs.
4. Product app consumes enriched outputs for task/brief/follow-up/approval UX.
5. Audit logs capture every mutation path.

## Integration classes for super-app outcomes

- System-of-record integrations:
  - CRM (HubSpot/Salesforce)
  - Calendar (Google/Microsoft)
  - Email (Gmail/Graph)
- Conversation intelligence:
  - Fireflies/Gong/Zoom transcript feeds
- Signal intelligence:
  - Hiring, funding, org-change, web behavior
- Execution stack:
  - E-sign/proposal tooling
  - Contract/procurement tooling
  - Notification hubs (Slack/Teams)

## Operational standards

- Every service emits correlation IDs and workspace IDs in logs.
- Contract evolution is additive-first with explicit versioning.
- Fail-open is forbidden for access control and approval transitions.
