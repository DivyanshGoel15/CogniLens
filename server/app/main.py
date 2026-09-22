"""Main FastAPI Application Entrypoint for CogniLens.

Initializes the FastAPI application, mounts CORS middleware, and registers
API routers for RAG search, conversational chat, explanations, quizzes, and health checks.
"""

import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from server.app.api.chat import router as chat_router
from server.app.api.health import router as health_router
from server.app.api.documents import router as documents_router
from server.app.api.progress import router as progress_router
from server.app.api.multimodal import router as multimodal_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("cognilens.server")

app = FastAPI(
    title="CogniLens API",
    description="Cognitive Multimodal AI Learning Assistant Backend with Grounded RAG & LLM Services",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS configuration for frontend clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routers
app.include_router(health_router, prefix="/api")
app.include_router(chat_router)
app.include_router(documents_router)
app.include_router(progress_router)
app.include_router(multimodal_router)


@app.get("/", tags=["Root"])
def read_root():
    """Root endpoint welcoming users and providing documentation links."""
    return {
        "name": "CogniLens API",
        "status": "operational",
        "documentation": "/docs",
        "health": "/api/health",
        "version": "1.0.0",
    }
