"""Conversational Chat Engine for CogniLens AI.

Orchestrates multi-turn history, context-aware referent resolution (e.g. resolving
"it" / "that" to previous topic), intent-based dispatch to QA, explanation, quiz,
and flashcard generators, and source citation propagation.
"""

import logging
import re
import time
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

from ai.generation.explanation_generator import ExplanationGenerator
from ai.generation.flashcard_generator import FlashcardGenerator
from ai.generation.qa_service import GroundedQAService
from ai.generation.quiz_generator import QuizGenerator
from ai.llm.base_provider import BaseLLMProvider
from ai.llm.llm_service import get_llm_provider
from ai.routing.intent_router import IntentRouter, IntentType
from server.app.services.rag_service import RAGService

logger = logging.getLogger(__name__)


class ChatMessage(BaseModel):
    """A single turn in conversational history."""
    role: str = Field(..., description="'user' or 'assistant'")
    content: str = Field(..., description="Message text")
    citations: Optional[List[Dict[str, Any]]] = Field(default=None, description="Source citations for assistant turns")


class ChatResponse(BaseModel):
    """Unified response from CogniLens Chat Engine."""
    message: str = Field(..., description="Primary conversational response text")
    intent: str = Field(..., description="Detected intent ('qa', 'explanation', 'quiz', 'flashcards')")
    topic: str = Field(..., description="Resolved topic")
    citations: List[Dict[str, Any]] = Field(default_factory=list, description="Grounding source citations")
    structured_payload: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Optional structured model output (quiz, flashcard deck, or detailed explanation)",
    )
    latency_ms: float = Field(..., description="Total processing latency in milliseconds")
    provider: str = Field(..., description="LLM provider name")


class ChatEngine:
    """Conversational orchestrator supporting multi-turn chat and adaptive intent routing."""

    PRONOUN_PATTERNS = [
        r"\b(it|this|that|these|the topic|the concept|this mechanism|the same)\b"
    ]

    def __init__(
        self,
        llm_provider: Optional[BaseLLMProvider] = None,
        rag_service: Optional[RAGService] = None,
    ) -> None:
        """Initialize the chat engine and its sub-generators."""
        self.llm_provider = llm_provider or get_llm_provider()
        self.rag_service = rag_service or RAGService()
        self.router = IntentRouter()

        self.qa_service = GroundedQAService(
            llm_provider=self.llm_provider,
            rag_service=self.rag_service,
        )
        self.explanation_gen = ExplanationGenerator(
            llm_provider=self.llm_provider,
            rag_service=self.rag_service,
        )
        self.quiz_gen = QuizGenerator(
            llm_provider=self.llm_provider,
            rag_service=self.rag_service,
        )
        self.flashcard_gen = FlashcardGenerator(
            llm_provider=self.llm_provider,
            rag_service=self.rag_service,
        )

    def resolve_referents(self, query: str, history: List[ChatMessage]) -> str:
        """Resolve conversational pronouns ('it', 'that', 'this') using recent turns.

        Args:
            query: Incoming user query.
            history: Previous turns.

        Returns:
            Resolved query string with antecedents substituted.
        """
        if not history:
            return query

        clean_q = query.strip().lower()
        has_pronoun = any(re.search(pat, clean_q) for pat in self.PRONOUN_PATTERNS)

        if not has_pronoun:
            return query

        # Find the most recent user turn or assistant topic
        last_user_query = ""
        for msg in reversed(history):
            if msg.role == "user" and msg.content.strip():
                last_user_query = msg.content.strip()
                break

        if not last_user_query:
            return query

        # Extract main topic from last user query
        prev_intent = self.router.classify(last_user_query)
        prior_topic = prev_intent.topic.strip()

        if not prior_topic:
            return query

        # Substitute pronoun
        resolved = re.sub(
            r"\b(it|that|this concept|the topic|the mechanism)\b",
            prior_topic,
            query,
            count=1,
            flags=re.IGNORECASE,
        )
        logger.info("Resolved query from '%s' to '%s'", query, resolved)
        return resolved

    def chat(
        self,
        message: str,
        history: Optional[List[ChatMessage]] = None,
        forced_intent: Optional[str] = None,
        difficulty: Optional[str] = None,
    ) -> ChatResponse:
        """Execute a conversational interaction turn.

        Args:
            message: User prompt.
            history: Optional list of previous chat messages.
            forced_intent: Optional manual intent override ('qa', 'explanation', 'quiz', 'flashcards').
            difficulty: Optional manual difficulty override ('Beginner', 'Intermediate', 'Technical').

        Returns:
            ChatResponse with text, citations, and optional structured payload.
        """
        start_time = time.time()
        chat_history = history or []

        # 1. Referent resolution for follow-up turns
        resolved_query = self.resolve_referents(message, chat_history)

        # 2. Classify intent
        intent_result = self.router.classify(resolved_query)
        effective_intent = (forced_intent or intent_result.intent.value).lower()
        effective_diff = difficulty or intent_result.difficulty
        topic = intent_result.topic or resolved_query

        # 3. Dispatch to appropriate modality
        if effective_intent == IntentType.QUIZ.value:
            quiz_count = intent_result.count or 3
            quiz_resp = self.quiz_gen.generate_quiz(
                topic=topic,
                num_questions=quiz_count,
                difficulty=effective_diff,
            )
            summary_msg = (
                f"I have generated a {effective_diff.lower()}-level quiz with {len(quiz_resp.questions)} questions "
                f"on **{quiz_resp.topic}** grounded in your course materials."
            )
            latency_ms = (time.time() - start_time) * 1000.0
            return ChatResponse(
                message=summary_msg,
                intent="quiz",
                topic=topic,
                citations=[],
                structured_payload=quiz_resp.model_dump(),
                latency_ms=round(latency_ms, 2),
                provider=self.llm_provider.__class__.__name__,
            )

        elif effective_intent == IntentType.FLASHCARDS.value:
            card_count = intent_result.count or 5
            deck_resp = self.flashcard_gen.generate_flashcards(
                topic=topic,
                num_cards=card_count,
            )
            summary_msg = (
                f"Here is a revision deck with {len(deck_resp.cards)} active-recall flashcards "
                f"on **{deck_resp.topic}**."
            )
            latency_ms = (time.time() - start_time) * 1000.0
            return ChatResponse(
                message=summary_msg,
                intent="flashcards",
                topic=topic,
                citations=[],
                structured_payload=deck_resp.model_dump(),
                latency_ms=round(latency_ms, 2),
                provider=self.llm_provider.__class__.__name__,
            )

        elif effective_intent == IntentType.EXPLANATION.value:
            exp_resp = self.explanation_gen.generate_explanation(
                topic=topic,
                difficulty=effective_diff,
            )
            explanation_text = (
                f"### {exp_resp.title}\n\n"
                f"**Summary**: {exp_resp.summary}\n\n"
                f"{exp_resp.detailed_explanation}\n\n"
            )
            if exp_resp.analogy:
                explanation_text += f"> **Analogy**: {exp_resp.analogy}\n\n"
            if exp_resp.key_concepts:
                explanation_text += "**Key Concepts**: " + ", ".join(exp_resp.key_concepts) + "\n"

            citations = [c.model_dump() for c in exp_resp.citations]
            latency_ms = (time.time() - start_time) * 1000.0
            return ChatResponse(
                message=explanation_text.strip(),
                intent="explanation",
                topic=topic,
                citations=citations,
                structured_payload=exp_resp.model_dump(),
                latency_ms=round(latency_ms, 2),
                provider=self.llm_provider.__class__.__name__,
            )

        else:  # QA default
            history_dicts = [{"role": m.role, "content": m.content} for m in chat_history]
            qa_resp = self.qa_service.answer_question(
                query=resolved_query,
                conversation_history=history_dicts,
            )
            latency_ms = (time.time() - start_time) * 1000.0
            return ChatResponse(
                message=qa_resp.answer,
                intent="qa",
                topic=topic,
                citations=qa_resp.citations,
                structured_payload=None,
                latency_ms=round(latency_ms, 2),
                provider=qa_resp.provider,
            )
