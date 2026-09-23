"""Document Metadata ORM Model for CogniLens."""

import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, Text, JSON, ForeignKey
from server.app.database.connection import Base


class DocumentModel(Base):
    """User-specific and indexed educational document metadata."""
    __tablename__ = "documents"

    id = Column(String(64), primary_key=True, default=lambda: f"mat-{uuid.uuid4().hex[:8]}")
    user_id = Column(String(64), ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    title = Column(String(255), nullable=False)
    filename = Column(String(255), nullable=False)
    type = Column(String(32), nullable=False, default="pdf")
    pages_count = Column(Integer, nullable=False, default=1)
    size = Column(String(32), nullable=False, default="1.0 MB")
    upload_date = Column(String(64), nullable=False, default="Just now")
    status = Column(String(32), nullable=False, default="indexed")
    course = Column(String(128), nullable=False, default="General Studies")
    topics = Column(JSON, nullable=False, default=list)
    content_preview = Column(Text, nullable=True)
    sections = Column(JSON, nullable=True, default=list)
    blob_url = Column(String(512), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
