# Intelligence Worker (Python)

Purpose:

- Consume normalized sales-event envelopes.
- Run transcript and signal intelligence logic.
- Emit structured recommendations for workflow execution.

## Endpoints

- `GET /healthz`
- `POST /v1/intelligence/process`

## Run

```bash
cd services/intelligence-worker-py
python -m pip install -e .
uvicorn app.main:app --host 0.0.0.0 --port 8091
```
