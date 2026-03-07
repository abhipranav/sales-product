# Next 14 Days

1. Add Prisma-backed Auth.js adapter tables and reduce the remaining middleware header bridge inside domain services.
2. Wire RBAC enforcement into sensitive mutations that currently only rely on workspace membership.
3. Connect Go ingestion gateway to queue + event store write path.
4. Connect Python intelligence worker outputs into workflow decision engine.
5. ✅ Add strategy-play execution actions (one-click launch -> generated task bundles).
6. ◐ Add CRM delta scheduler using `IntegrationSyncState` checkpoints.
   - Done: incremental delta endpoint + cursor advancement (`/api/integrations/hubspot/sync/delta`)
   - Done: cadence runner endpoint (`/api/integrations/hubspot/sync/delta/cadence`) + cockpit trigger
   - Remaining: wire external HubSpot fetch source (replace mock delta feed)
7. ◐ Add UX-level feedback states (success/error/toast) for all mutations.
   - Done: strategy execution, meeting-notes processing, follow-up regeneration, brief regeneration
   - Done: task CRUD/complete, approval review, calendar ingest, follow-up approval queue, and sequence create/step updates
   - Remaining: CRM command-center and other niche mutation surfaces
8. ✅ Add pilot metrics panel for recommendation acceptance and action-latency.
