"""Explanation Generator Module.

Generates grounded multi-level explanations adapted to student difficulty
(Beginner, Intermediate, Technical, ELI5).
"""

import logging
from typing import Any, Dict, List, Optional

from ai.llm.base_provider import BaseLLMProvider
from ai.llm.llm_service import get_llm_provider
from ai.llm.structured_output import ExplanationResponse, SourceCitation
from ai.prompts.prompt_manager import DEFAULT_SYSTEM_INSTRUCTION, build_explanation_prompt, render_prompt
from server.app.services.rag_service import RAGService

logger = logging.getLogger(__name__)


class ExplanationGenerator:
    """Generates grounded multi-level explanations from query and RAG context."""

    def __init__(
        self,
        llm_provider: Optional[BaseLLMProvider] = None,
        rag_service: Optional[RAGService] = None,
        llm_service: Optional[Any] = None,
    ) -> None:
        """Initialize ExplanationGenerator with provider and optional RAG service."""
        # Support legacy parameter llm_service if passed
        self.llm_service = llm_service
        self.llm_provider = llm_provider or llm_service or get_llm_provider()
        self.rag_service = rag_service or RAGService()

    def format_context(self, chunks: List[Any]) -> str:
        """Formats RAG retrieved chunks into a clean text block with citation metadata."""
        if not chunks:
            return "No document context provided."

        formatted_passages = []
        for idx, chunk in enumerate(chunks, 1):
            if isinstance(chunk, dict):
                source = chunk.get("source", chunk.get("filename", "Unknown Source"))
                page = chunk.get("page_number", "N/A")
                section = chunk.get("section", "General")
                text = chunk.get("text", chunk.get("content", "")).strip()
            else:
                source = "Unknown Source"
                page = "N/A"
                section = "General"
                text = str(chunk).strip()

            formatted_passages.append(
                f"[Source {idx}] (File: {source} | Page: {page} | Section: {section})\n{text}"
            )

        return "\n\n".join(formatted_passages)

    def generate_explanation(
        self,
        query: str = "",
        context_chunks: Optional[List[Any]] = None,
        difficulty: str = "Intermediate",
        topic: Optional[str] = None,
        top_k: int = 4,
    ) -> ExplanationResponse:
        """Generate structured explanation adapted to target difficulty.

        Args:
            query: Question or concept to explain.
            context_chunks: Optional manual chunks to ground on.
            difficulty: Target difficulty ('Beginner', 'Intermediate', 'Technical', 'ELI5').
            topic: Concept alias for query.
            top_k: Number of chunks to retrieve if context_chunks not supplied.

        Returns:
            ExplanationResponse Pydantic instance.
        """
        search_topic = topic or query
        citations_from_rag: List[SourceCitation] = []

        if context_chunks is not None:
            context_str = self.format_context(context_chunks)
            for c in context_chunks:
                if isinstance(c, dict):
                    page = c.get("page_number")
                    sec = c.get("section", "General")
                    txt = c.get("text", c.get("content", ""))
                    score = c.get("relevance_score", 0.95)
                else:
                    page = None
                    sec = "General"
                    txt = str(c)
                    score = 0.95

                citations_from_rag.append(
                    SourceCitation(
                        page_number=page if isinstance(page, int) else None,
                        section=sec,
                        snippet=txt[:150],
                        relevance_score=score,
                    )
                )
        else:
            # Retrieve from RAG service if not using a legacy mock without Azure
            if hasattr(self.llm_service, "force_mock") and self.llm_service.force_mock:
                context_str = "No document context provided."
            else:
                rag_ctx = self.rag_service.get_grounded_context(query=search_topic, top_k=top_k)
                context_str = rag_ctx.formatted_context
                for sc in rag_ctx.citations:
                    citations_from_rag.append(
                        SourceCitation(
                            page_number=sc.page_number,
                            section=sc.section,
                            snippet=getattr(sc, "excerpt", getattr(sc, "snippet", "")),
                            relevance_score=sc.score,
                        )
                    )

        # Use render_prompt if provider provides it (e.g. AzureOpenAIService / test mocks)
        if hasattr(self.llm_service, "render_prompt"):
            prompt = self.llm_service.render_prompt(
                "explanation.txt",
                topic=search_topic,
                context=context_str,
                difficulty=difficulty,
            )
            system_prompt = self.llm_service.render_prompt("system.txt")
        else:
            prompt = build_explanation_prompt(
                topic=search_topic,
                context=context_str,
                difficulty=difficulty,
            )
            system_prompt = DEFAULT_SYSTEM_INSTRUCTION

        if hasattr(self.llm_provider, "generate_structured_output"):
            # AzureOpenAIService or compatible
            response, _, _ = self.llm_provider.generate_structured_output(
                prompt=prompt,
                response_model=ExplanationResponse,
                system_prompt=system_prompt,
            )
        elif hasattr(self.llm_provider, "generate_structured"):
            response = self.llm_provider.generate_structured(
                prompt=prompt,
                schema=ExplanationResponse,
                system_instruction=system_prompt,
            )
        else:
            raise TypeError("Configured provider does not support structured generation.")

        # Respect LLM citations if present; only attach RAG fallback citations if empty
        if not response.citations and citations_from_rag:
            response.citations = citations_from_rag[:4]

        response.difficulty_level = difficulty
        return response
