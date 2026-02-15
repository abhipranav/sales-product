# Polyglot Services

This folder holds non-Next.js services for the super-app platform.

## Current service starters

- `ingestion-gateway-go`: webhook/event intake and envelope normalization.
- `intelligence-worker-py`: transcript/intelligence processing worker.

## Ownership pattern

- Service code owns transport/runtime concerns.
- Shared event shape is defined only in `contracts/events`.
- Product behavior and workflow orchestration remain in main app until service extraction is justified.
