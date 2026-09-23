"""Database connection and session management for CogniLens.

Supports Azure Database for PostgreSQL / Azure SQL / SQLAlchemy-compatible databases,
with automatic fallback to local persistent SQLite (data/cognilens.db) for zero-crash
offline and local development.
"""

import os
import logging
from pathlib import Path
from typing import Generator
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker, Session

load_dotenv()
logger = logging.getLogger("cognilens.database")

Base = declarative_base()

def _resolve_database_url() -> str:
    """Resolve database URL from environment or fall back to local SQLite."""
    raw_url = os.getenv("AZURE_DATABASE_URL") or os.getenv("DATABASE_URL")
    if raw_url and raw_url.strip():
        url = raw_url.strip()
        # Adjust legacy postgres:// prefix for SQLAlchemy
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql+psycopg://", 1)
        elif url.startswith("postgresql://") and not url.startswith("postgresql+"):
            # Use psycopg v3 driver if available
            url = url.replace("postgresql://", "postgresql+psycopg://", 1)
        return url

    # Default to local SQLite database in data directory
    data_dir = Path("data")
    data_dir.mkdir(parents=True, exist_ok=True)
    sqlite_path = (data_dir / "cognilens.db").resolve()
    return f"sqlite:///{sqlite_path}"


def _create_database_engine():
    """Create SQLAlchemy engine with connection resilience and fallback."""
    db_url = _resolve_database_url()
    is_sqlite = db_url.startswith("sqlite")

    try:
        if is_sqlite:
            engine = create_engine(
                db_url,
                connect_args={"check_same_thread": False},
                echo=False,
            )
            logger.info("Connected to local persistent SQLite database at %s", db_url)
        else:
            # Azure / Cloud Database connection
            engine = create_engine(
                db_url,
                pool_pre_ping=True,
                pool_recycle=1800,
                pool_size=10,
                max_overflow=20,
                echo=False,
            )
            # Test remote connection
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            logger.info("Successfully connected to Azure / Remote database!")
        return engine
    except Exception as exc:
        logger.warning(
            "Could not connect to remote database (%s): %s. Falling back to local persistent SQLite.",
            db_url, exc
        )
        data_dir = Path("data")
        data_dir.mkdir(parents=True, exist_ok=True)
        fallback_url = f"sqlite:///{(data_dir / 'cognilens.db').resolve()}"
        return create_engine(
            fallback_url,
            connect_args={"check_same_thread": False},
            echo=False,
        )


engine = _create_database_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency for obtaining a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Initialize all tables defined in models."""
    try:
        # Import models to register schemas with Base.metadata
        from server.app.models import user, document, progress, quiz, flashcard, study_plan  # noqa: F401
        Base.metadata.create_all(bind=engine)
        logger.info("CogniLens database tables verified/created successfully.")
    except Exception as exc:
        logger.exception("Failed to initialize database tables: %s", exc)
