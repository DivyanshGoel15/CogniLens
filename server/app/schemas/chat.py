"""Pydantic Schemas for AI Chat, Explanation, Quiz, and Flashcard API Endpoints."""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class ChatMessageSchema(BaseModel):
    """Chat message schema for conversation turn."""
    role: str = Field(..., description="Message author role: 'user' or 'assistant'")
    content: str = Field(..., description="Message text content")
    citations: Optional[List[Dict[str, Any]]] = Field(default=None, description="Optional citations")


class ChatRequest(BaseModel):
    """Incoming request for /api/chat endpoint."""
    message: str = Field(..., description="User message or prompt")
    history: Optional[List[ChatMessageSchema]] = Field(default=None, description="Prior conversation turns")
    intent: Optional[str] = Field(default=None, description="Optional forced intent: qa, explanation, quiz, flashcards")
    difficulty: Optional[str] = Field(default=None, description="Optional difficulty override: Beginner, Intermediate, Technical")


class ChatResponseSchema(BaseModel):
    """Response returned by /api/chat endpoint."""
    message: str = Field(..., description="Conversational text output")
    intent: str = Field(..., description="Handled intent modality")
    topic: str = Field(..., description="Resolved topic or concept")
    citations: List[Dict[str, Any]] = Field(default_factory=list, description="Grounding source citations")
    structured_payload: Optional[Dict[str, Any]] = Field(default=None, description="Structured artifact payload if applicable")
    latency_ms: float = Field(..., description="End-to-end processing latency in ms")
    provider: str = Field(..., description="Active LLM provider")


class ExplanationRequest(BaseModel):
    """Request for /api/explain endpoint."""
    topic: str = Field(..., description="Concept or topic to explain")
    difficulty: str = Field("Intermediate", description="Target difficulty: Beginner, Intermediate, Technical, ELI5")
    top_k: int = Field(4, description="Number of evidence chunks to retrieve")


class QuizRequest(BaseModel):
    """Request for /api/quiz endpoint."""
    topic: str = Field(..., description="Subject or concept for quiz")
    num_questions: int = Field(3, description="Number of questions to generate", ge=1, le=10)
    difficulty: str = Field("Medium", description="Quiz difficulty: Easy, Medium, Hard")
    top_k: int = Field(4, description="Number of evidence chunks to retrieve")


class FlashcardRequest(BaseModel):
    """Request for /api/flashcards endpoint."""
    topic: str = Field(..., description="Subject or concept for flashcard deck")
    num_cards: int = Field(5, description="Number of flashcards to generate", ge=1, le=20)
    top_k: int = Field(4, description="Number of evidence chunks to retrieve")
