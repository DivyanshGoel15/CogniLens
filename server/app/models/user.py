"""User ORM Model for CogniLens."""

import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Text
from server.app.database.connection import Base


class UserModel(Base):
    """User account entity with credentials and profile details."""
    __tablename__ = "users"

    id = Column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False, default="Student Member")
    major = Column(String(255), nullable=False, default="Computer Science")
    academic_year = Column(String(64), nullable=False, default="Year 3")
    avatar_initials = Column(String(8), nullable=False, default="S")
    avatar_bg_color = Column(String(32), nullable=False, default="#3b82f6")
    
    # Password Reset via SMTP
    reset_code = Column(String(32), nullable=True)
    reset_code_expires_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
