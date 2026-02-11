# Event Contracts

## Canonical envelope

Path: `contracts/events/sales-event.v1.schema.json`

Every ingest event (CRM, calendar, call intelligence, signals) must normalize to this envelope before downstream processing.

Envelope fields:

- `eventId`: globally unique identifier
- `eventType`: namespaced domain event type
- `occurredAt`: ISO timestamp
- `source`: producing system (`hubspot`, `fireflies`, etc.)
- `workspaceSlug`: workspace boundary key
- `entity`: normalized entity reference block
- `payload`: source-specific data payload
- `metadata`: correlation/idempotency/actor metadata

## Versioning policy

- Contract file is immutable by version.
- Additive fields only for v1.
- Breaking changes require `v2` schema file and dual-reader support during migration.

## Validation policy

- Gateway rejects non-conforming events with `400`.
- Worker code assumes already-validated envelope and focuses on semantic validation.
