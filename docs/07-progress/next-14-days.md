# Next 14 Days

1. Replace header-based actor identity with provider-backed auth sessions and signed claims.
2. Connect Go ingestion gateway to queue + event store write path.
3. Connect Python intelligence worker outputs into workflow decision engine.
4. ✅ Add strategy-play execution actions (one-click launch -> generated task bundles).
5. ◐ Add CRM delta scheduler using `IntegrationSyncState` checkpoints.
   - Done: incremental delta endpoint + cursor advancement (`/api/integrations/hubspot/sync/delta`)
   - Done: cadence runner endpoint (`/api/integrations/hubspot/sync/delta/cadence`) + cockpit trigger
   - Remaining: wire external HubSpot fetch source (replace mock delta feed)
6. ◐ Add UX-level feedback states (success/error/toast) for all mutations.
   - Done: strategy execution, meeting-notes processing, follow-up regeneration, brief regeneration
   - Done: task CRUD/complete, approval review, calendar ingest, follow-up approval queue, and sequence create/step updates
   - Remaining: CRM command-center and other niche mutation surfaces
7. ✅ Add pilot metrics panel for recommendation acceptance and action-latency.
