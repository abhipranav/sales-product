# Data Model

Canonical entities for v1:

- Account
- Workspace
- WorkspaceMember
- Contact
- Deal
- Stakeholder
- Activity
- Task
- Signal
- Document
- CalendarEvent
- AuditLog
- OutboundApproval
- IntegrationSyncState

## Design rules

- Immutable activity/event log for auditability
- Explicit ownership for every task and workflow state
- Deterministic IDs for identity resolution where possible
- AI outputs versioned with prompt + model metadata
