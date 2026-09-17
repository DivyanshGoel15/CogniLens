"""Azure AI Search Retriever.

Performs vector and hybrid retrieval against indexed educational chunks, returning
top-K relevant evidence passages with full source, page, and section attribution.
"""

import logging
import os
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

from azure.core.credentials import AzureKeyCredential
from azure.core.exceptions import AzureError
from azure.search.documents import SearchClient
from azure.search.documents.models import VectorizedQuery

from rag.embeddings.embedding_service import EmbeddingService

logger = logging.getLogger(__name__)


class SearchResult(BaseModel):
    """Structured evidence result retrieved from Azure AI Search."""

    chunk_id: str = Field(description="Unique ID of the matched chunk")
    document_id: str = Field(description="Parent document identifier")
    filename: str = Field(description="Original document filename")
    source: str = Field(description="Source document name or path")
    page_number: int = Field(description="1-based page number where the evidence is located")
    chunk_index: int = Field(description="Sequential index of chunk in document")
    section: Optional[str] = Field(default=None, description="Section heading context")
    content_type: str = Field(default="text", description="'text' or 'table'")
    table_present: bool = Field(default=False, description="Whether this chunk represents a table")
    blob_url: Optional[str] = Field(default=None, description="Direct URL to source document in blob storage")
    text: str = Field(description="Retrieved chunk text")
    score: float = Field(default=0.0, description="Relevance score (hybrid RRF or cosine similarity)")


class RetrievalError(Exception):
    """Base exception for retrieval failures."""
    pass


class Retriever:
    """Retrieves relevant evidence chunks using vector or hybrid search against Azure AI Search."""

    def __init__(
        self,
        endpoint: Optional[str] = None,
        api_key: Optional[str] = None,
        index_name: Optional[str] = None,
        embedding_service: Optional[EmbeddingService] = None,
        search_client: Optional[SearchClient] = None,
        top_k: int = 5,
    ) -> None:
        """Initialize Retriever.

        Args:
            endpoint: Azure AI Search endpoint.
            api_key: Azure AI Search API key.
            index_name: Azure AI Search index name.
            embedding_service: EmbeddingService instance for query vectorization.
            search_client: Optional pre-configured SearchClient (useful for unit testing).
            top_k: Default number of top results to retrieve (default: 5).
        """
        self.endpoint = endpoint or os.getenv("AZURE_SEARCH_ENDPOINT")
        self.api_key = api_key or os.getenv("AZURE_SEARCH_API_KEY")
        self.index_name = (
            index_name
            or os.getenv("AZURE_SEARCH_INDEX_NAME")
            or "learning-agent-chunks"
        )
        self.top_k = int(os.getenv("TOP_K", str(top_k)))
        self._embedding_service = embedding_service
        self._client = search_client

    def _get_embedding_service(self) -> EmbeddingService:
        """Lazily initialize EmbeddingService."""
        if self._embedding_service is None:
            self._embedding_service = EmbeddingService()
        return self._embedding_service

    def _get_client(self) -> SearchClient:
        """Lazily initialize SearchClient."""
        if self._client is not None:
            return self._client

        if not self.endpoint:
            raise RetrievalError(
                "Missing Azure AI Search endpoint. Set 'AZURE_SEARCH_ENDPOINT' environment variable."
            )
        if not self.api_key:
            raise RetrievalError(
                "Missing Azure AI Search API key. Set 'AZURE_SEARCH_API_KEY' environment variable."
            )

        try:
            credential = AzureKeyCredential(self.api_key)
            self._client = SearchClient(
                endpoint=self.endpoint,
                index_name=self.index_name,
                credential=credential,
            )
            return self._client
        except Exception as e:
            raise RetrievalError(f"Failed to initialize SearchClient: {e}") from e

    def retrieve(
        self,
        query: str,
        top_k: Optional[int] = None,
        filter_expr: Optional[str] = None,
        use_hybrid: bool = True,
    ) -> List[SearchResult]:
        """Retrieve top relevant chunks for a user query.

        Args:
            query: The user search query string.
            top_k: Maximum number of chunks to return (defaults to self.top_k).
            filter_expr: Optional OData filter expression (e.g. "filename eq 'sample.pdf'").
            use_hybrid: If True, combines text keyword search + vector search.

        Returns:
            List of SearchResult objects sorted by relevance score.
        """
        if not query or not query.strip():
            return []

        limit = top_k or self.top_k
        client = self._get_client()
        embedder = self._get_embedding_service()

        logger.info("Generating query embedding for: '%s'", query)
        query_vector = embedder.embed_text(query)

        # Configure VectorizedQuery
        vector_query = VectorizedQuery(
            vector=query_vector,
            k_nearest_neighbors=limit,
            fields="embedding",
        )

        search_text = query if use_hybrid else None

        select_fields = [
            "chunk_id",
            "document_id",
            "filename",
            "source",
            "page_number",
            "chunk_index",
            "section",
            "content_type",
            "table_present",
            "blob_url",
            "text",
        ]

        logger.info("Executing %s search on index '%s' (top_k=%d)...", "hybrid" if use_hybrid else "vector", self.index_name, limit)

        try:
            raw_results = client.search(
                search_text=search_text,
                vector_queries=[vector_query],
                filter=filter_expr,
                top=limit,
                select=select_fields,
            )
            return self.parse_search_results(raw_results)
        except AzureError as e:
            raise RetrievalError(f"Azure AI Search query failed: {e}") from e

    @staticmethod
    def parse_search_results(raw_results: Any) -> List[SearchResult]:
        """Convert Azure search hit dictionaries/models into typed SearchResult objects.

        Decoupled from network calls for offline unit testing.
        """
        results: List[SearchResult] = []
        for hit in raw_results:
            score = float(hit.get("@search.score", 0.0))
            result = SearchResult(
                chunk_id=hit.get("chunk_id", ""),
                document_id=hit.get("document_id", ""),
                filename=hit.get("filename", ""),
                source=hit.get("source", ""),
                page_number=int(hit.get("page_number", 1)),
                chunk_index=int(hit.get("chunk_index", 0)),
                section=hit.get("section"),
                content_type=hit.get("content_type", "text"),
                table_present=bool(hit.get("table_present", False)),
                blob_url=hit.get("blob_url"),
                text=hit.get("text", ""),
                score=score,
            )
            results.append(result)

        return results
