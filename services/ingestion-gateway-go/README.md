# Ingestion Gateway (Go)

Purpose:

- Receive high-volume inbound webhooks/events.
- Normalize payloads to shared sales-event envelope.
- Emit accepted events to downstream queue/pipeline.

## Endpoints

- `GET /healthz`
- `POST /v1/events/ingest`

## Run

```bash
cd services/ingestion-gateway-go
go run .
```

Optional env:

- `INGESTION_GATEWAY_PORT` (default `8081`)
