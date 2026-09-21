"""
Flashcard Generator Module.
Member 1 - AI / LLM Engineer
"""

import logging
from typing import List, Dict, Any, Optional
from ai.llm.azure_openai import AzureOpenAIService
from ai.llm.structured_output import FlashcardResponse

logger = logging.getLogger(__name__)


class FlashcardGenerator:
    """Generates active-recall flashcards for continuous revision."""

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

    def generate_flashcards(
        self,
        topic: str,
        context_chunks: Optional[List[Dict[str, Any]]] = None,
        num_cards: int = 5,
    ) -> FlashcardResponse:
        """
        Generates a FlashcardResponse containing active recall card decks.
        """
        chunks = context_chunks or []
        context_str = self._format_context(chunks)

        prompt = self.llm_service.render_prompt(
            "flashcards.txt",
            topic=topic,
            context=context_str,
            num_cards=num_cards,
        )

        system_prompt = self.llm_service.render_prompt("system.txt")

        flashcard_response, latency, tokens = self.llm_service.generate_structured_output(
            prompt=prompt,
            response_model=FlashcardResponse,
            system_prompt=system_prompt,
        )

        return flashcard_response
