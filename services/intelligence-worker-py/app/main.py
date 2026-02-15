from datetime import datetime, timezone
from fastapi import FastAPI
from pydantic import BaseModel, Field


class EventEntity(BaseModel):
    type: str
    id: str
    externalId: str | None = None


class EventMetadata(BaseModel):
    correlationId: str
    idempotencyKey: str
    actorEmail: str | None = None


class SalesEventEnvelope(BaseModel):
    eventId: str
    eventType: str
    occurredAt: datetime
    source: str
    workspaceSlug: str
    entity: EventEntity
    payload: dict
    metadata: EventMetadata


class IntelligenceResult(BaseModel):
    eventId: str
    workspaceSlug: str
    generatedAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    outputs: list[str]


app = FastAPI(title="intelligence-worker-py")


@app.get("/healthz")
def healthz() -> dict:
    return {"status": "ok", "service": "intelligence-worker-py"}


@app.post("/v1/intelligence/process", response_model=IntelligenceResult)
def process_event(event: SalesEventEnvelope) -> IntelligenceResult:
    text = str(event.payload).lower()
    outputs: list[str] = []

    if "budget" in text or "pricing" in text:
        outputs.append("Risk: budget alignment may block close.")
    if "security" in text or "legal" in text:
        outputs.append("Action: attach security/legal packet in next follow-up.")
    if not outputs:
        outputs.append("Action: confirm owners + dates for next-step plan.")

    return IntelligenceResult(
        eventId=event.eventId,
        workspaceSlug=event.workspaceSlug,
        outputs=outputs,
    )
