"""Flashcard Generator Module.

Generates atomic, active-recall flashcard decks grounded in academic materials.
"""

import logging
from typing import Any, Dict, List, Optional

from ai.llm.base_provider import BaseLLMProvider
from ai.llm.llm_service import get_llm_provider
from ai.llm.structured_output import FlashcardResponse
from ai.prompts.prompt_manager import DEFAULT_SYSTEM_INSTRUCTION, render_prompt
from server.app.services.rag_service import RAGService

logger = logging.getLogger(__name__)


class FlashcardGenerator:
    """Generates active-recall flashcard decks for continuous revision."""

    def __init__(
        self,
        llm_provider: Optional[BaseLLMProvider] = None,
        rag_service: Optional[RAGService] = None,
        llm_service: Optional[Any] = None,
    ) -> None:
        """Initialize FlashcardGenerator."""
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

    def generate_flashcards(
        self,
        topic: str,
        num_cards: int = 5,
        context_chunks: Optional[List[Dict[str, Any]]] = None,
        top_k: int = 4,
    ) -> FlashcardResponse:
        """Generate a FlashcardResponse containing active recall card decks.

        Args:
            topic: Concept or topic area.
            num_cards: Number of flashcards to generate.
            context_chunks: Optional manual chunks.
            top_k: Number of chunks to retrieve if not provided.

        Returns:
            FlashcardResponse model instance.
        """
        if context_chunks is not None:
            context_str = self._format_context(context_chunks)
        else:
            rag_ctx = self.rag_service.get_grounded_context(query=topic, top_k=top_k)
            context_str = rag_ctx.formatted_context

        prompt = render_prompt(
            "flashcards.txt",
            topic=topic,
            context=context_str,
            num_cards=num_cards,
        )

        if hasattr(self.llm_provider, "generate_structured"):
            flashcard_response = self.llm_provider.generate_structured(
                prompt=prompt,
                schema=FlashcardResponse,
                system_instruction=DEFAULT_SYSTEM_INSTRUCTION,
            )
        elif hasattr(self.llm_provider, "generate_structured_output"):
            flashcard_response, _, _ = self.llm_provider.generate_structured_output(
                prompt=prompt,
                response_model=FlashcardResponse,
                system_prompt=DEFAULT_SYSTEM_INSTRUCTION,
            )
        else:
            raise TypeError("Configured provider does not support structured generation.")

        flashcard_response.total_cards = len(flashcard_response.cards)
        return flashcard_response
