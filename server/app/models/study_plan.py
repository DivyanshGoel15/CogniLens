"""Study Plan ORM Model for CogniLens."""

import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, DateTime, JSON, ForeignKey
from server.app.database.connection import Base


class StudyPlanRecord(Base):
    """Personalized Weekly Study Plan entity tied to a specific user."""
    __tablename__ = "study_plans"

    id = Column(String(64), primary_key=True, default=lambda: f"plan-{uuid.uuid4().hex[:8]}")
    user_id = Column(String(64), ForeignKey("users.id", ondelete="CASCADE"), unique=True, index=True, nullable=False)
    week_range = Column(String(128), nullable=False, default="This Week")
    target_focus = Column(String(255), nullable=False)
    total_study_hours_planned = Column(Float, default=5.0)
    completed_minutes = Column(Integer, default=0)
    items = Column(JSON, default=list)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
