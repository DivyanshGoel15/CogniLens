"""Backend RAG service adapter bridging FastAPI server endpoints to the RAG Knowledge subsystem.

Provides a dependency-injectable service for AI tutor agents, chat endpoints, and quiz generators.
"""

from typing import Any, Dict, List, Optional

from rag.retrieval.context_builder import ContextBuildResult, SourceCitation
from rag.retrieval.pipeline import RAGPipeline
from rag.search.retriever import SearchResult


class RAGService:
    """Backend service wrapper for knowledge retrieval and context construction."""

    def __init__(self, pipeline: Optional[RAGPipeline] = None) -> None:
        """Initialize RAGService.

        Args:
            pipeline: Optional pre-configured RAGPipeline instance.
        """
        self.pipeline = pipeline or RAGPipeline()

    def get_grounded_context(
        self,
        query: str,
        top_k: int = 5,
        mode: str = "hybrid",
        rerank: bool = True,
        max_tokens: int = 2000,
    ) -> ContextBuildResult:
        """Retrieve grounded context with citations formatted for LLM prompts."""
        return self.pipeline.retrieve_context(
            query=query,
            top_k=top_k,
            mode=mode,
            rerank=rerank,
            rewrite=True,
            max_tokens=max_tokens,
        )

    def search_chunks(
        self,
        query: str,
        top_k: int = 5,
        mode: str = "hybrid",
        rerank: bool = True,
    ) -> List[SearchResult]:
        """Search raw evidence chunks matching the query."""
        return self.pipeline.retrieve_chunks(
            query=query,
            top_k=top_k,
            mode=mode,
            rerank=rerank,
            rewrite=True,
        )

    def get_citations(
        self,
        query: str,
        top_k: int = 5,
    ) -> List[Dict[str, Any]]:
        """Retrieve structured citation records for UI display."""
        ctx = self.get_grounded_context(query=query, top_k=top_k)
        return [cit.model_dump() for cit in ctx.citations]
