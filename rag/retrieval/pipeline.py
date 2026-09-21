"""Unified RAG Retrieval and Knowledge Pipeline interface.

Provides a clean, single-entry-point facade for backend services and AI agents
to retrieve evidence, rerank passages, and construct citation-backed LLM context.
"""

import logging
from typing import List, Optional

from rag.retrieval.context_builder import ContextBuildResult, ContextBuilder
from rag.retrieval.query_rewriter import QueryRewriter
from rag.retrieval.reranker import BaseReranker, HeuristicReranker
from rag.search.retriever import Retriever, SearchResult

logger = logging.getLogger(__name__)


class RAGPipeline:
    """High-level facade orchestrating query preprocessing, search, reranking, and context building."""

    def __init__(
        self,
        retriever: Optional[Retriever] = None,
        rewriter: Optional[QueryRewriter] = None,
        reranker: Optional[BaseReranker] = None,
        context_builder: Optional[ContextBuilder] = None,
    ) -> None:
        """Initialize RAGPipeline with decoupled, swappable components.

        Args:
            retriever: Retriever instance (defaults to standard Azure AI Search Retriever).
            rewriter: QueryRewriter instance (defaults to deterministic technical rewriter).
            reranker: Reranker instance (defaults to HeuristicReranker).
            context_builder: ContextBuilder instance (defaults to token-budgeted builder).
        """
        self.retriever = retriever or Retriever()
        self.rewriter = rewriter or QueryRewriter()
        self.reranker = reranker or HeuristicReranker()
        self.context_builder = context_builder or ContextBuilder()

    def retrieve_chunks(
        self,
        query: str,
        top_k: int = 5,
        mode: str = "hybrid",
        rerank: bool = True,
        rewrite: bool = True,
        filter_expr: Optional[str] = None,
    ) -> List[SearchResult]:
        """Retrieve relevant search results for a query.

        Args:
            query: User question or search text.
            top_k: Maximum number of chunks to return (default: 5).
            mode: Search mode: 'hybrid' (default), 'vector', or 'keyword'.
            rerank: If True, applies heuristic reranking.
            rewrite: If True, applies deterministic acronym expansion.
            filter_expr: Optional OData filter expression.

        Returns:
            List of SearchResult objects sorted by relevance score.
        """
        if not query or not query.strip():
            return []

        # 1. Query preprocessing
        effective_query = query
        if rewrite and self.rewriter is not None:
            rewritten = self.rewriter.rewrite(query)
            effective_query = rewritten.expanded_query

        # 2. Azure AI Search retrieval
        # Over-fetch slightly if reranking is enabled
        fetch_limit = top_k + 3 if rerank and self.reranker is not None else top_k
        raw_results = self.retriever.retrieve(
            query=effective_query,
            top_k=fetch_limit,
            filter_expr=filter_expr,
            mode=mode,
        )

        # 3. Optional reranking
        if rerank and self.reranker is not None and raw_results:
            return self.reranker.rerank(query, raw_results, top_k=top_k)

        return raw_results[:top_k]

    def retrieve_context(
        self,
        query: str,
        top_k: int = 5,
        mode: str = "hybrid",
        rerank: bool = True,
        rewrite: bool = True,
        filter_expr: Optional[str] = None,
        max_tokens: Optional[int] = None,
    ) -> ContextBuildResult:
        """Single-call method for backend/agent to get formatted LLM context with citations.

        Args:
            query: User question or search text.
            top_k: Maximum chunks to retrieve before budgeting.
            mode: 'hybrid', 'vector', or 'keyword'.
            rerank: Whether to apply reranking.
            rewrite: Whether to expand technical acronyms.
            filter_expr: Optional OData filter expression.
            max_tokens: Optional token budget override.

        Returns:
            ContextBuildResult containing formatted_context, citations, and metadata.
        """
        chunks = self.retrieve_chunks(
            query=query,
            top_k=top_k,
            mode=mode,
            rerank=rerank,
            rewrite=rewrite,
            filter_expr=filter_expr,
        )

        return self.context_builder.build_context(chunks, max_tokens=max_tokens)
