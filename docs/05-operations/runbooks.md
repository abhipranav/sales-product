# Runbooks

## Local development

1. `npm install`
2. Configure `.env` with Supabase `DATABASE_URL` + `DIRECT_URL` (optional for read-only demo mode)
3. Configure tenancy defaults in `.env`: `APP_WORKSPACE_SLUG`, `APP_WORKSPACE_NAME`, `APP_ACTOR_EMAIL`, `APP_ACTOR_NAME`
4. `npm run db:generate`
5. `npm run db:push`
6. `npm run db:seed`
7. `npm run dev`
8. Validate dashboard render at `/`
9. Validate API response at `/api/dashboard`
10. Validate task APIs: `POST /api/tasks`, `PATCH /api/tasks/:taskId`, `DELETE /api/tasks/:taskId`, `POST /api/tasks/:taskId/complete`
11. Validate calendar ingest API: `POST /api/calendar/events/ingest`
12. Validate meeting notes processing API: `POST /api/meetings/process`
13. Validate HubSpot sync APIs: `POST /api/integrations/hubspot/sync`, `GET /api/integrations/hubspot/sync`
14. Validate approvals APIs: `GET /api/approvals`, `POST /api/approvals`, `POST /api/approvals/:approvalId/review`
15. Validate audit API: `GET /api/deals/:dealId/audit?limit=10`
16. Validate access control: send `x-actor-email` for a non-member and confirm scoped routes return `403`

## Incident triage baseline

- Capture failing endpoint and account/deal context
- Reproduce with recorded payload
- Check workflow state transitions for stale tasks
- Check audit logs for blocked outbound actions
