"""Flashcard Deck ORM Model for CogniLens."""

import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, JSON, ForeignKey
from server.app.database.connection import Base


class FlashcardDeckModel(Base):
    """Personalized flashcard deck entity with spaced-repetition card state."""
    __tablename__ = "flashcard_decks"

    id = Column(String(64), primary_key=True, default=lambda: f"deck-{uuid.uuid4().hex[:8]}")
    user_id = Column(String(64), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    title = Column(String(255), nullable=False)
    course = Column(String(128), nullable=False)
    description = Column(String(512), nullable=True)
    total_cards = Column(Integer, default=0)
    reviewed_count = Column(Integer, default=0)
    cards = Column(JSON, default=list)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
