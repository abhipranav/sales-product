# API Contracts (Draft)

## `GET /api/dashboard`

Returns a rep cockpit snapshot for the active account/deal context.

### Response shape

- `workspace`
- `account`
- `contacts[]`
- `deal`
- `tasks[]`
- `recentActivities[]`
- `approvals[]`
- `strategyPlays[]`
- `meetingBrief`
- `followUpDraft`

## `POST /api/tasks`

Creates a task for a deal.

### Request body

- `dealId` (string)
- `title` (string, min length 3)
- `owner` (`rep` | `manager` | `system`)
- `dueAt` (ISO datetime)
- `priority` (`high` | `medium` | `low`)
- `suggestedChannel` (`email` | `phone` | `linkedin` | `meeting`)

## `PATCH /api/tasks/:taskId`

Updates selected task fields.

### Request body (partial)

- `title?`
- `dueAt?` (ISO datetime)
- `priority?` (`high` | `medium` | `low`)
- `status?` (`todo` | `in-progress` | `done`)
- `suggestedChannel?` (`email` | `phone` | `linkedin` | `meeting`)

## `DELETE /api/tasks/:taskId`

Deletes a task.

### Response shape

- `id`
- `deleted` (`true`)

## `POST /api/tasks/:taskId/complete`

Marks a task as completed.

### Response shape

- `task.id`
- `task.status` (`done`)
- `task.completedAt` (ISO datetime)

## `POST /api/calendar/events/ingest`

Ingests a calendar event into `calendar_events`, creates a meeting activity, and writes an audit log.

### Request body

- `dealId`
- `title`
- `startsAt` (ISO datetime)
- `endsAt` (ISO datetime)
- `externalId?`
- `summary?`
- `organizerEmail?`
- `attendees[]`
- `source`

## `GET /api/deals/:dealId/audit`

Returns latest audit events for a deal.

### Query params

- `limit` (optional, max 50)

## `POST /api/meetings/process`

Processes free-form meeting notes into actionable workflow updates:
- creates a note activity
- generates follow-up tasks
- refreshes meeting brief and follow-up draft
- writes audit entries

### Request body

- `dealId` (string)
- `notes` (string, min length 20)
- `happenedAt?` (ISO datetime)
- `source?` (string, defaults to `manual-notes`)

## `POST /api/integrations/hubspot/sync`

Upserts account, contacts, and deals from a HubSpot-style payload into the active workspace scope.

### Request body

- `source` (`hubspot`)
- `syncReason` (string)
- `cursor?` (string, last processed checkpoint)
- `nextCursor?` (string, checkpoint after this batch)
- `account` (`externalId`, `name`, `segment`, `website?`, `employeeBand?`)
- `contacts[]` (`externalId`, `fullName`, `title`, `email?`, `linkedInUrl?`, `role`)
- `deals[]` (`externalId`, `name`, `stage`, `amount`, `confidence`, `closeDate`, `riskSummary`)

## `GET /api/integrations/hubspot/sync`

Returns current workspace sync checkpoint for HubSpot delta runs.

## `GET /api/approvals`

Lists approval requests in workspace scope.

### Query params

- `dealId?`
- `status?` (`pending` | `approved` | `rejected`)
- `limit?` (max 50)

## `POST /api/approvals`

Creates a new outbound approval request.

### Request body

- `dealId`
- `channel` (`email` | `phone` | `linkedin` | `meeting`)
- `subject`
- `body`

## `POST /api/approvals/:approvalId/review`

Reviews an approval request.

### Request body

- `decision` (`approved` | `rejected`)
- `rejectionReason?` (required when decision is `rejected`)

## `GET /api/notifications`

Lists generated buying-signal notifications for the active workspace.

### Query params

- `limit?` (max 100)

## `POST /api/notifications/:notificationId/ack`

Acknowledges a notification and records reviewer metadata.

### Response shape

- `notification.id`
- `notification.status` (`acknowledged`)
- `notification.acknowledgedAt` (ISO datetime)

## `GET /api/sequences`

Lists sequence execution records.

### Query params

- `dealId?`
- `limit?` (max 50)

## `POST /api/sequences`

Creates a sequence execution with ordered steps.

### Request body

- `dealId`
- `contactId?`
- `title`
- `channelMix[]` (`email` | `phone` | `linkedin` | `meeting`)
- `steps[]` (`channel`, `instruction`)

## `PATCH /api/sequences/steps/:stepId`

Updates step status/outcome and auto-reconciles parent execution state.

### Request body

- `status?` (`todo` | `in-progress` | `done` | `skipped`)
- `outcome?` (string)

## Actor Headers

All scoped API routes support actor override headers:

- `x-actor-email`
- `x-actor-name`

Non-member actors receive `403`.

## Upcoming endpoints

- `POST /api/followups/:dealId/generate`
- `POST /api/briefs/:dealId/generate`
