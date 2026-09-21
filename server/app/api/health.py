"""Health check API route for CogniLens backend."""

import os
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(tags=["Health"])


class HealthStatus(BaseModel):
    status: str
    app: str
    environment: str
    rag_status: str
    llm_provider: str


@router.get("/health", response_model=HealthStatus)
def get_health() -> HealthStatus:
    """Return backend service health and configuration status."""
    provider = os.getenv("LLM_PROVIDER", "gemini" if os.getenv("GEMINI_API_KEY") else "mock")
    return HealthStatus(
        status="healthy",
        app="CogniLens Multimodal Learning Agent",
        environment=os.getenv("APP_ENV", "development"),
        rag_status="ready",
        llm_provider=provider,
    )
