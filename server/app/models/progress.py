"""Learning Progress & Activity Log ORM Models for CogniLens."""

import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, DateTime, JSON, ForeignKey
from server.app.database.connection import Base


class ProgressModel(Base):
    """Aggregated learning progress metrics tied to a specific user."""
    __tablename__ = "user_progress"

    id = Column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(64), ForeignKey("users.id", ondelete="CASCADE"), unique=True, index=True, nullable=False)
    overall_mastery = Column(Integer, default=70)
    total_study_hours = Column(Float, default=0.0)
    quiz_accuracy = Column(Integer, default=80)
    current_streak_days = Column(Integer, default=1)
    last_active_date = Column(String(32), nullable=True)
    active_days_history = Column(JSON, default=list)
    total_questions_answered = Column(Integer, default=0)
    flashcards_mastered = Column(Integer, default=0)
    last_studied = Column(JSON, nullable=True)
    courses = Column(JSON, default=list)

    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class ActivityLogModel(Base):
    """Individual learning activity audit log for a specific user."""
    __tablename__ = "user_activities"

    id = Column(String(64), primary_key=True, default=lambda: f"act-{uuid.uuid4().hex[:8]}")
    user_id = Column(String(64), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    title = Column(String(255), nullable=False)
    type = Column(String(64), nullable=False)  # quiz, material, flashcard, tutor
    timestamp_str = Column(String(64), nullable=False, default="Just now")
    result_snippet = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
