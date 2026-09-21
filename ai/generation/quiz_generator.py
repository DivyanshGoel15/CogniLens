"""Quiz Generator Module.

Generates grounded, curriculum-aligned multiple-choice quizzes with options A–D,
pedagogical explanations, and source references.
"""

import logging
from typing import Any, Dict, List, Optional

from ai.llm.base_provider import BaseLLMProvider
from ai.llm.llm_service import get_llm_provider
from ai.llm.structured_output import QuizResponse
from ai.prompts.prompt_manager import DEFAULT_SYSTEM_INSTRUCTION, render_prompt
from server.app.services.rag_service import RAGService

logger = logging.getLogger(__name__)


class QuizGenerator:
    """Generates structured multiple-choice quizzes grounded in course materials."""

    def __init__(
        self,
        llm_provider: Optional[BaseLLMProvider] = None,
        rag_service: Optional[RAGService] = None,
        llm_service: Optional[Any] = None,
    ) -> None:
        """Initialize QuizGenerator."""
        self.llm_provider = llm_provider or llm_service or get_llm_provider()
        self.rag_service = rag_service or RAGService()

    def _format_context(self, chunks: List[Dict[str, Any]]) -> str:
        """Format chunk dicts into context string."""
        if not chunks:
            return "General domain knowledge context."
        passages = []
        for idx, c in enumerate(chunks, 1):
            text = c.get("text", c.get("content", "")).strip()
            page = c.get("page_number", "N/A")
            sec = c.get("section", "General")
            passages.append(f"[Source {idx}] (Page: {page} | Section: {sec}):\n{text}")
        return "\n\n".join(passages)

    def generate_quiz(
        self,
        topic: str,
        num_questions: int = 3,
        difficulty: str = "Medium",
        context_chunks: Optional[List[Dict[str, Any]]] = None,
        top_k: int = 4,
    ) -> QuizResponse:
        """Generate structured QuizResponse with questions, options, and explanations.

        Args:
            topic: Topic or concept to test.
            num_questions: Number of questions to generate (default: 3).
            difficulty: 'Easy', 'Medium', or 'Hard'.
            context_chunks: Optional manual chunks.
            top_k: Number of chunks to retrieve if not provided.

        Returns:
            QuizResponse model instance.
        """
        if context_chunks is not None:
            context_str = self._format_context(context_chunks)
        else:
            rag_ctx = self.rag_service.get_grounded_context(query=topic, top_k=top_k)
            context_str = rag_ctx.formatted_context

        prompt = render_prompt(
            "quiz.txt",
            topic=topic,
            context=context_str,
            num_questions=num_questions,
            difficulty=difficulty,
        )

        if hasattr(self.llm_provider, "generate_structured"):
            quiz_response = self.llm_provider.generate_structured(
                prompt=prompt,
                schema=QuizResponse,
                system_instruction=DEFAULT_SYSTEM_INSTRUCTION,
            )
        elif hasattr(self.llm_provider, "generate_structured_output"):
            quiz_response, _, _ = self.llm_provider.generate_structured_output(
                prompt=prompt,
                response_model=QuizResponse,
                system_prompt=DEFAULT_SYSTEM_INSTRUCTION,
            )
        else:
            raise TypeError("Configured provider does not support structured generation.")

        quiz_response.target_difficulty = difficulty
        quiz_response.total_questions = len(quiz_response.questions)
        return quiz_response
