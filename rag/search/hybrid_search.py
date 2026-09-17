"""Hybrid search module combining vector embeddings and full-text keyword retrieval.

Provides enhanced relevance scoring and specialized query filtering
for educational courseware and technical documentation.
"""

from typing import List, Optional

from rag.search.retriever import Retriever, SearchResult


class HybridSearchService:
    """Specialized hybrid search service providing filtered and multi-field retrieval."""

    def __init__(self, retriever: Optional[Retriever] = None) -> None:
        """Initialize HybridSearchService.

        Args:
            retriever: Retriever instance.
        """
        self.retriever = retriever or Retriever()

    def search_by_document(
        self,
        query: str,
        document_id: str,
        top_k: int = 5,
    ) -> List[SearchResult]:
        """Search strictly within a specific document using hybrid search."""
        filter_expr = f"document_id eq '{document_id}'"
        return self.retriever.retrieve(
            query=query,
            top_k=top_k,
            filter_expr=filter_expr,
            use_hybrid=True,
        )

    def search_tables_only(
        self,
        query: str,
        top_k: int = 3,
    ) -> List[SearchResult]:
        """Search only extracted tabular chunks using hybrid search."""
        filter_expr = "content_type eq 'table'"
        return self.retriever.retrieve(
            query=query,
            top_k=top_k,
            filter_expr=filter_expr,
            use_hybrid=True,
        )
