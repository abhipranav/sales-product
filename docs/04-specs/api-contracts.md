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

## Additional implemented platform routes

- `GET|POST /api/auth/[...nextauth]`
  - Auth.js provider runtime for sign-in, callbacks, and session handling.
- `GET|POST /api/accounts`
  - Lists or creates account records in workspace scope.
- `GET|PATCH|DELETE /api/accounts/:id`
  - Reads, updates, or deletes a single account.
- `GET|POST /api/contacts`
  - Lists or creates contact records in workspace scope.
- `GET|PATCH|DELETE /api/contacts/:id`
  - Reads, updates, or deletes a single contact.
- `GET|POST /api/deals`
  - Lists or creates deal records in workspace scope.
- `GET|PATCH|DELETE /api/deals/:dealId`
  - Reads, updates, or deletes a single deal.
- `POST /api/deals/:dealId/stage`
  - Moves a deal to a new stage with validation + persistence.
- `GET /api/system/status`
  - Returns readiness checks, mode (`live` | `demo`), dataset counts, and sync summary.
- `GET /api/integrations/status`
  - Returns cached HubSpot + Calendar connectivity health.
- `GET /api/search`
  - Cross-entity CRM search (`account`, `contact`, `deal`) for command palette and quick navigation.
- `GET|PATCH /api/settings/user`
  - Reads and updates user/workspace preference fields.
- `GET|PATCH /api/settings/user/ai`
  - Reads and updates per-user AI provider preferences and usage context.
- `POST /api/integrations/linkedin/capture`
  - Saves operator-confirmed LinkedIn companion context into workspace-scoped account/contact records.
- `POST /api/cron/reminders`
  - Cron-protected reminder runner wrapper around task reminder generation.
- `POST /api/cron/crm-sync`
  - Cron-protected cadence trigger for incremental HubSpot delta sync.

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

## `POST /api/tasks/reminders/run`

Runs SLA reminder generation for open tasks due within a configurable window.

### Request body

- `windowHours?` (1-168, default `24`)
- `includeOverdue?` (boolean, default `true`)

### Response shape

- `triggeredAt`
- `windowHours`
- `remindersCreated`
- `reminders[]` (`taskId`, `dealId`, `dealName`, `title`, `dueAt`, `priority`, `reminderType`)

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

## `POST /api/integrations/linkedin/capture`

Creates or matches a workspace account and optionally saves a contact from the LinkedIn companion workbench.

### Request body

- `sourceUrl?` (string, URL)
- `sourceTitle?` (string)
- `accountId?` (string, existing workspace account)
- `companyName?` (string)
- `companyWebsite?` (string, URL)
- `employeeBand?` (string)
- `segment` (`startup` | `mid-market` | `enterprise`)
- `contactName?` (string)
- `contactTitle?` (string, required when `contactName` is set)
- `contactEmail?` (string, email)
- `contactLinkedInUrl?` (string, URL)
- `contactRole` (`champion` | `approver` | `blocker` | `influencer`)

### Response shape

- `source`
  - `url`
  - `title`
- `account`
  - `id`
  - `name`
  - `status` (`created` | `updated` | `matched`)
- `contact`
  - `id`
  - `fullName`
  - `status` (`created` | `updated` | `matched`)
  - nullable when no contact was saved

## `GET /api/integrations/hubspot/sync`

Returns current workspace sync checkpoint for HubSpot delta runs.

## `POST /api/integrations/hubspot/sync/delta`

Runs one incremental HubSpot delta batch using the persisted sync cursor (`IntegrationSyncState`).

### Request body

- `dryRun?` (boolean, default `false`)
- `syncReason?` (string)

### Response shape

- `status` (`preview` | `synced` | `no-op`)
- `currentCursor`
- `nextCursor`
- `mode` (`dry-run` | `apply`)

## `POST /api/integrations/hubspot/sync/delta/cadence`

Runs multiple incremental delta batches in one cadence trigger until no new batches remain or `maxBatches` is reached.

### Request body

- `maxBatches?` (1-25, default `5`)
- `syncReason?` (string)

### Response shape

- `trigger` (`cadence`)
- `syncReason`
- `totalRuns`
- `totalSyncedBatches`
- `finalCursor`
- `stoppedReason` (`no-new-delta` | `cursor-not-advanced` | `max-batches-reached` | `completed` | `preview-only`)
- `runs[]` (`index`, `status`, `currentCursor`, `nextCursor`)

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

### Response shape

- `approval` (updated approval payload)
- `approval.dispatch?` (present on approve path)
- `approval.dispatch.status` (`sent` | `already-sent` | `failed`)
- `approval.dispatch.provider?`
- `approval.dispatch.providerMessageId?`
- `approval.dispatch.sentAt?`
- `approval.dispatch.error?`

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

## `POST /api/followups/:dealId/generate`

Generates and persists a follow-up draft for a deal.

### Request body

- `notes?` (string, optional context override)
- `tone?` (`concise` | `consultative` | `executive`)

### Response shape

- `dealId`
- `draft.subject`
- `draft.body`
- `draft.ask`
- `draft.ctaTimeWindow`
- `source` (`ai` | `rule-based`)
- `generatedAt` (ISO datetime)

## `POST /api/briefs/:dealId/generate`

Generates and persists a meeting prep brief for a deal.

### Request body

- `notes?` (string, optional context override)
- `focus?` (string, optional emphasis)

### Response shape

- `dealId`
- `brief.primaryGoal`
- `brief.likelyObjections[]`
- `brief.recommendedNarrative`
- `brief.proofPoints[]`
- `source` (`ai` | `rule-based`)
- `generatedAt` (ISO datetime)

## `POST /api/strategy/execute`

Executes a strategy play for a deal, creating task bundles and approval records.

### Request body

- `playId`
- `dealId`

### Response shape

- `tasksCreated`
- `approvalsCreated`

## `GET /api/metrics/pilot`

Returns recommendation acceptance and action-latency pilot metrics.

### Response shape

- `mode` (`live` | `mock`)
- `metrics.generatedAt`
- `metrics.windowDays`
- `metrics.recommendationSignals`
  - `strategyExecutions7d`
  - `approvedApprovals7d`
  - `rejectedApprovals7d`
  - `approvalAcceptanceRate`
- `metrics.actionLatency`
  - `completedTasks7d`
  - `avgTaskCompletionHours30d`
  - `medianTaskCompletionHours30d`
- `metrics.operations`
  - `meetingNotesProcessed7d`
  - `reminderEvents24h`

## Actor Headers

All scoped API routes support actor override headers:

- `x-actor-email`
- `x-actor-name`

Non-member actors receive `403`.
