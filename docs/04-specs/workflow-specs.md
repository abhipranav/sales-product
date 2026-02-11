# Workflow Specs (Draft)

## Task SLA workflow

1. Create task from meeting action item.
2. Set owner, due date, priority, and channel recommendation.
3. Trigger reminder notices at configured intervals.
4. Mark task complete when action is sent/logged.

## Follow-up approval workflow

1. Generate draft from last activity + deal stage.
2. Show editable draft in cockpit.
3. Require explicit human approval for outbound send.
4. Log final sent artifact for audit and learning.

## Calendar ingest workflow

1. Receive calendar event payload bound to a deal.
2. Upsert event in `calendar_events` by `externalId` when present.
3. Write meeting activity record for timeline context.
4. Write audit log entry for traceability.
