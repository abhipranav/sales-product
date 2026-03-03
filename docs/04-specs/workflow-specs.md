# Workflow Specs (Draft)

## Task SLA workflow

1. Create task from meeting action item.
2. Set owner, due date, priority, and channel recommendation.
3. Trigger reminder notices at configured intervals (`POST /api/tasks/reminders/run`).
4. Mark task complete when action is sent/logged.

## Follow-up approval workflow

1. Generate draft from last activity + deal stage.
2. Show editable draft in cockpit.
3. Require explicit human approval for outbound send.
4. On approve, dispatch outbound artifact and log `outbound.sent` (or `outbound.failed`) in audit trail.

## Calendar ingest workflow

1. Receive calendar event payload bound to a deal.
2. Upsert event in `calendar_events` by `externalId` when present.
3. Write meeting activity record for timeline context.
4. Write audit log entry for traceability.
