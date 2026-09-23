"""Main FastAPI Application Entrypoint for CogniLens.

Initializes the FastAPI application, mounts CORS middleware, connects to Azure Database,
and registers API routers for Authentication, RAG search, conversational chat,
explanations, quizzes, study plans, documents, progress tracking, and multimodal services.
"""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from server.app.database.connection import init_db
from server.app.api.auth import router as auth_router
from server.app.api.chat import router as chat_router
from server.app.api.health import router as health_router
from server.app.api.documents import router as documents_router
from server.app.api.progress import router as progress_router
from server.app.api.study_plan import router as study_plan_router
from server.app.api.multimodal import router as multimodal_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("cognilens.server")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan context manager for startup and shutdown hooks."""
    logger.info("Starting CogniLens API Server. Initializing Azure / persistent database...")
    init_db()
    yield
    logger.info("CogniLens API Server shutting down gracefully.")


app = FastAPI(
    title="CogniLens API",
    description="Cognitive Multimodal AI Learning Assistant Backend with Grounded RAG & LLM Services",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
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
app.include_router(auth_router)
app.include_router(chat_router)
app.include_router(documents_router)
app.include_router(progress_router)
app.include_router(study_plan_router)
app.include_router(multimodal_router)


@app.get("/", tags=["Root"])
def read_root():
    """Root endpoint welcoming users and providing documentation links."""
    return {
        "name": "CogniLens API",
        "status": "operational",
        "documentation": "/docs",
        "health": "/api/health",
        "database": "azure/sqlite-ready",
        "version": "1.0.0",
    }
