"""
Explanation Generator Module.
Member 1 - AI / LLM Engineer
"""

import logging
from typing import List, Dict, Any, Optional
from ai.llm.azure_openai import AzureOpenAIService
from ai.llm.structured_output import ExplanationResponse, SourceCitation

logger = logging.getLogger(__name__)


class ExplanationGenerator:
    """Generates grounded explanations from query and retrieved RAG context."""

    def __init__(self, llm_service: Optional[AzureOpenAIService] = None):
        self.llm_service = llm_service or AzureOpenAIService()

    def format_context(self, chunks: List[Dict[str, Any]]) -> str:
        """Formats RAG retrieved chunks into a clean text block with citation metadata."""
        if not chunks:
            return "No document context provided."

        formatted_passages = []
        for idx, chunk in enumerate(chunks, 1):
            source = chunk.get("source", chunk.get("filename", "Unknown Source"))
            page = chunk.get("page_number", "N/A")
            section = chunk.get("section", "General")
            text = chunk.get("text", chunk.get("content", "")).strip()

            formatted_passages.append(
                f"[Source {idx}] (File: {source} | Page: {page} | Section: {section})\n{text}"
            )

        return "\n\n".join(formatted_passages)

    def generate_explanation(
        self,
        query: str,
        context_chunks: Optional[List[Dict[str, Any]]] = None,
        difficulty: str = "Intermediate",
    ) -> ExplanationResponse:
        """
        Generates a grounded explanation for the given query.
        """
        chunks = context_chunks or []
        context_str = self.format_context(chunks)

        prompt = self.llm_service.render_prompt(
            "explanation.txt",
            topic=query,
            context=context_str,
            difficulty=difficulty,
        )

        system_prompt = self.llm_service.render_prompt("system.txt")

        explanation_response, latency, tokens = self.llm_service.generate_structured_output(
            prompt=prompt,
            response_model=ExplanationResponse,
            system_prompt=system_prompt,
        )

        # Attach citations derived directly from provided context chunks if available
        # Only overwrite if LLM returned zero citations
        if chunks and not explanation_response.citations:
            citations = []
            for chunk in chunks[:5]:
                citations.append(
                    SourceCitation(
                        page_number=chunk.get("page_number"),
                        section=chunk.get("section", "General"),
                        snippet=chunk.get("text", chunk.get("content", ""))[:150],
                        relevance_score=chunk.get("relevance_score", 0.95),
                    )
                )
            explanation_response.citations = citations

        explanation_response.difficulty_level = difficulty
        return explanation_response
