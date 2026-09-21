"""
Quiz Generator Module.
Member 1 - AI / LLM Engineer
"""

import logging
from typing import List, Dict, Any, Optional
from ai.llm.azure_openai import AzureOpenAIService
from ai.llm.structured_output import QuizResponse

logger = logging.getLogger(__name__)


class QuizGenerator:
    """Generates structured multiple-choice quizzes with difficulty adaptation."""

    def __init__(self, llm_service: Optional[AzureOpenAIService] = None):
        self.llm_service = llm_service or AzureOpenAIService()

    def _format_context(self, chunks: List[Dict[str, Any]]) -> str:
        if not chunks:
            return "General domain knowledge context."

        passages = []
        for idx, c in enumerate(chunks, 1):
            text = c.get("text", c.get("content", "")).strip()
            page = c.get("page_number", "N/A")
            passages.append(f"[Chunk {idx} - Page {page}]: {text}")
        return "\n\n".join(passages)

    def generate_quiz(
        self,
        topic: str,
        context_chunks: Optional[List[Dict[str, Any]]] = None,
        num_questions: int = 3,
        difficulty: str = "Medium",
    ) -> QuizResponse:
        """
        Generates a QuizResponse containing a list of QuizQuestions.
        """
        chunks = context_chunks or []
        context_str = self._format_context(chunks)

        prompt = self.llm_service.render_prompt(
            "quiz.txt",
            topic=topic,
            context=context_str,
            num_questions=num_questions,
            difficulty=difficulty,
        )

        system_prompt = self.llm_service.render_prompt("system.txt")

        quiz_response, latency, tokens = self.llm_service.generate_structured_output(
            prompt=prompt,
            response_model=QuizResponse,
            system_prompt=system_prompt,
        )

        quiz_response.target_difficulty = difficulty
        return quiz_response
