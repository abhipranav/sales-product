# Integration Map

## Tier 0 (required for production workflow)

- Managed Postgres (`Supabase`) for app persistence and workflow state
- CRM system (`Salesforce` / `HubSpot`) for account, contact, deal sync
- Calendar provider (`Google Calendar` / `Microsoft 365`) for meeting ingestion
- Email provider (`Gmail` / `Microsoft Graph`) for send + thread status tracking
- Call transcripts (`Zoom`, `Google Meet`, `Teams`, `Gong`) for notes-to-action automation

## Tier 1 (high-impact extensions)

- Conversation intelligence tools (call metadata + speaker diarization)
- Sales engagement tools (sequence execution telemetry)
- Contract and e-sign tools (commercial milestone tracking)
- Product usage analytics (expansion and risk signals)
- Enrichment feeds (firmographics, technographics, intent, hiring/funding)

## Tier 2 (ecosystem and ops)

- Comms systems (`Slack`, `Teams`) for approvals and alert routing
- File systems (`Google Drive`, `SharePoint`, `Notion`) for artifacts and proof packs
- Data warehouse / BI sync for revenue analytics downstream
- Billing/subscription systems for closed-won activation workflows

## Governance requirements

- Per-integration scopes and least privilege
- Audit trail for ingestion and outbound actions
- Regional policy toggles for outreach and recording constraints
- Retry/backoff policies plus dead-letter handling for integration failures
