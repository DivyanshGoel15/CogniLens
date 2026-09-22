"""Backend RAG service adapter bridging FastAPI server endpoints to the RAG Knowledge subsystem.

Provides a dependency-injectable service for AI tutor agents, chat endpoints, and quiz generators.
Gracefully degrades to an empty context when Azure Search credentials are not configured,
allowing the Mock LLM provider to generate dynamic content without any external dependencies.
"""

import logging
from typing import Any, Dict, List, Optional

from rag.retrieval.context_builder import ContextBuildResult, SourceCitation
from rag.retrieval.pipeline import RAGPipeline
from rag.search.retriever import SearchResult

logger = logging.getLogger(__name__)


def _empty_context(query: str) -> ContextBuildResult:
    """Return an empty but valid ContextBuildResult for offline / no-credentials mode."""
    return ContextBuildResult(
        formatted_context=f"General domain knowledge context for: {query}",
        citations=[],
        citation_map={},
        total_tokens=0,
        chunk_count=0,
        included_chunk_ids=[],
    )


def _empty_chunks() -> List[SearchResult]:
    """Return an empty list of search results for offline mode."""
    return []


class RAGService:
    """Backend service wrapper for knowledge retrieval and context construction."""

    def __init__(self, pipeline: Optional[RAGPipeline] = None) -> None:
        """Initialize RAGService.

        Args:
            pipeline: Optional pre-configured RAGPipeline instance.
        """
        try:
            self.pipeline = pipeline or RAGPipeline()
            self._online = True
        except Exception as exc:
            logger.warning(
                "RAGPipeline could not be initialized (likely missing credentials): %s. "
                "Operating in offline mode — all retrieval calls will return empty context.",
                exc,
            )
            self.pipeline = None
            self._online = False

    def get_grounded_context(
        self,
        query: str,
        top_k: int = 5,
        mode: str = "hybrid",
        rerank: bool = True,
        max_tokens: int = 2000,
    ) -> ContextBuildResult:
        """Retrieve grounded context with citations formatted for LLM prompts.

        Falls back to empty context when Azure Search credentials are unavailable.
        """
        if not self._online or self.pipeline is None:
            return _empty_context(query)

        try:
            return self.pipeline.retrieve_context(
                query=query,
                top_k=top_k,
                mode=mode,
                rerank=rerank,
                rewrite=True,
                max_tokens=max_tokens,
            )
        except Exception as exc:
            logger.warning("RAG retrieval failed for query '%s': %s — returning empty context.", query, exc)
            return _empty_context(query)

    def search_chunks(
        self,
        query: str,
        top_k: int = 5,
        mode: str = "hybrid",
        rerank: bool = True,
    ) -> List[SearchResult]:
        """Search raw evidence chunks matching the query."""
        if not self._online or self.pipeline is None:
            return _empty_chunks()

        try:
            return self.pipeline.retrieve_chunks(
                query=query,
                top_k=top_k,
                mode=mode,
                rerank=rerank,
                rewrite=True,
            )
        except Exception as exc:
            logger.warning("RAG chunk search failed for query '%s': %s — returning empty.", query, exc)
            return _empty_chunks()

    def get_citations(
        self,
        query: str,
        top_k: int = 5,
    ) -> List[Dict[str, Any]]:
        """Retrieve structured citation records for UI display."""
        ctx = self.get_grounded_context(query=query, top_k=top_k)
        return [cit.model_dump() for cit in ctx.citations]
