"""FastAPI Endpoints for Conversational AI, Explanations, Quizzes, and Flashcards."""

import logging
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from ai.chat.chat_engine import ChatEngine, ChatMessage
from ai.generation.explanation_generator import ExplanationGenerator
from ai.generation.flashcard_generator import FlashcardGenerator
from ai.generation.quiz_generator import QuizGenerator
from ai.llm.base_provider import LLMError
from ai.llm.llm_service import get_llm_provider
from ai.llm.structured_output import ExplanationResponse, FlashcardResponse, QuizResponse
from server.app.schemas.chat import (
    ChatRequest,
    ChatResponseSchema,
    ExplanationRequest,
    FlashcardRequest,
    QuizRequest,
)
from server.app.services.rag_service import RAGService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["CogniLens AI"])

# Shared service instances
_rag_service = RAGService()
_llm_provider = get_llm_provider()
_chat_engine = ChatEngine(llm_provider=_llm_provider, rag_service=_rag_service)
_explanation_gen = ExplanationGenerator(llm_provider=_llm_provider, rag_service=_rag_service)
_quiz_gen = QuizGenerator(llm_provider=_llm_provider, rag_service=_rag_service)
_flashcard_gen = FlashcardGenerator(llm_provider=_llm_provider, rag_service=_rag_service)


@router.post("/chat", response_model=ChatResponseSchema)
def handle_chat(request: ChatRequest) -> ChatResponseSchema:
    """Conversational chat endpoint with multi-turn history and adaptive intent dispatch."""
    try:
        history_msgs = []
        if request.history:
            for item in request.history:
                history_msgs.append(
                    ChatMessage(
                        role=item.role,
                        content=item.content,
                        citations=item.citations,
                    )
                )

        resp = _chat_engine.chat(
            message=request.message,
            history=history_msgs,
            forced_intent=request.intent,
            difficulty=request.difficulty,
        )

        return ChatResponseSchema(
            message=resp.message,
            intent=resp.intent,
            topic=resp.topic,
            citations=resp.citations,
            structured_payload=resp.structured_payload,
            latency_ms=resp.latency_ms,
            provider=resp.provider,
        )
    except LLMError as exc:
        logger.error("LLM generation error in /api/chat: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI Provider error: {str(exc)}",
        )
    except Exception as exc:
        logger.exception("Unexpected error in /api/chat: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal processing error: {str(exc)}",
        )


@router.post("/explain", response_model=ExplanationResponse)
def handle_explain(request: ExplanationRequest) -> ExplanationResponse:
    """Generate structured multi-level concept explanation grounded in course materials."""
    try:
        return _explanation_gen.generate_explanation(
            topic=request.topic,
            difficulty=request.difficulty,
            top_k=request.top_k,
        )
    except LLMError as exc:
        logger.error("LLM error in /api/explain: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI Provider error: {str(exc)}",
        )
    except Exception as exc:
        logger.exception("Unexpected error in /api/explain: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal processing error: {str(exc)}",
        )


@router.post("/quiz", response_model=QuizResponse)
def handle_quiz(request: QuizRequest) -> QuizResponse:
    """Generate structured multiple-choice quiz grounded in course materials."""
    try:
        return _quiz_gen.generate_quiz(
            topic=request.topic,
            num_questions=request.num_questions,
            difficulty=request.difficulty,
            top_k=request.top_k,
        )
    except LLMError as exc:
        logger.error("LLM error in /api/quiz: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI Provider error: {str(exc)}",
        )
    except Exception as exc:
        logger.exception("Unexpected error in /api/quiz: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal processing error: {str(exc)}",
        )


@router.post("/flashcards", response_model=FlashcardResponse)
def handle_flashcards(request: FlashcardRequest) -> FlashcardResponse:
    """Generate structured active-recall flashcard deck grounded in course materials."""
    try:
        return _flashcard_gen.generate_flashcards(
            topic=request.topic,
            num_cards=request.num_cards,
            top_k=request.top_k,
        )
    except LLMError as exc:
        logger.error("LLM error in /api/flashcards: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI Provider error: {str(exc)}",
        )
    except Exception as exc:
        logger.exception("Unexpected error in /api/flashcards: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal processing error: {str(exc)}",
        )
