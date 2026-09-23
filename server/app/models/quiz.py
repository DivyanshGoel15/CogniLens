"""Quiz Result & History ORM Model for CogniLens."""

import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, JSON, ForeignKey
from server.app.database.connection import Base


class QuizHistoryModel(Base):
    """Archived user quiz submission, score metrics, and weak topics."""
    __tablename__ = "quiz_history"

    id = Column(String(64), primary_key=True, default=lambda: f"quiz-res-{uuid.uuid4().hex[:8]}")
    user_id = Column(String(64), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    title = Column(String(255), nullable=False)
    course = Column(String(128), nullable=False)
    topic = Column(String(255), nullable=False)
    score_percentage = Column(Integer, nullable=False)
    total_questions = Column(Integer, nullable=False)
    correct_answers = Column(Integer, nullable=False)
    time_spent_sec = Column(Integer, nullable=False, default=0)
    difficulty = Column(String(32), nullable=False, default="Intermediate")
    strong_topics = Column(JSON, default=list)
    weak_topics = Column(JSON, default=list)
    recommended_revision = Column(JSON, default=list)
    answers = Column(JSON, default=list)

    created_at = Column(DateTime, default=datetime.utcnow)
