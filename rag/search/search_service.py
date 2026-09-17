"""Azure AI Search Service for document indexing and ingestion.

Converts enriched DocumentChunks into searchable index documents and uploads
them in robust batches while validating metadata integrity and vector alignment.
"""

import logging
import os
from typing import Any, Dict, List, Optional

from azure.core.credentials import AzureKeyCredential
from azure.core.exceptions import AzureError
from azure.search.documents import SearchClient

from rag.chunking.metadata import DocumentChunk

logger = logging.getLogger(__name__)


class SearchIndexingError(Exception):
    """Raised when indexing chunks into Azure AI Search fails."""
    pass


class SearchService:
    """Handles uploading and indexing chunks into Azure AI Search."""

    def __init__(
        self,
        endpoint: Optional[str] = None,
        api_key: Optional[str] = None,
        index_name: Optional[str] = None,
        client: Optional[SearchClient] = None,
    ) -> None:
        """Initialize SearchService.

        Args:
            endpoint: Azure AI Search endpoint URL.
            api_key: Azure AI Search admin API key.
            index_name: Target search index name.
            client: Optional pre-configured SearchClient instance.
        """
        self.endpoint = endpoint or os.getenv("AZURE_SEARCH_ENDPOINT")
        self.api_key = api_key or os.getenv("AZURE_SEARCH_API_KEY")
        self.index_name = (
            index_name
            or os.getenv("AZURE_SEARCH_INDEX_NAME")
            or "learning-agent-chunks"
        )
        self._client = client

    def _get_client(self) -> SearchClient:
        """Lazily initialize SearchClient."""
        if self._client is not None:
            return self._client

        if not self.endpoint:
            raise SearchIndexingError(
                "Missing Azure AI Search endpoint. Set 'AZURE_SEARCH_ENDPOINT' environment variable."
            )
        if not self.api_key:
            raise SearchIndexingError(
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
            raise SearchIndexingError(f"Failed to initialize SearchClient: {e}") from e

    @staticmethod
    def chunk_to_search_document(chunk: DocumentChunk) -> Dict[str, Any]:
        """Map a DocumentChunk and its metadata into an Azure AI Search document dictionary.

        Args:
            chunk: DocumentChunk instance.

        Returns:
            Dictionary matching the SearchIndex field schema.
        """
        if not chunk.embedding:
            raise ValueError(
                f"Chunk '{chunk.chunk_id}' is missing an embedding vector. "
                "All chunks must be embedded prior to indexing."
            )

        meta = chunk.metadata
        return {
            "chunk_id": chunk.chunk_id,
            "document_id": meta.document_id,
            "filename": meta.filename,
            "source": meta.source,
            "page_number": meta.page_number,
            "chunk_index": meta.chunk_index,
            "section": meta.section,
            "content_type": meta.content_type,
            "table_present": meta.table_present,
            "blob_url": meta.blob_url or "",
            "text": chunk.text,
            "embedding": chunk.embedding,
        }

    def index_chunks(
        self,
        chunks: List[DocumentChunk],
        batch_size: int = 100,
    ) -> int:
        """Index a list of embedded DocumentChunk objects into Azure AI Search.

        Args:
            chunks: List of DocumentChunks with embeddings populated.
            batch_size: Batch size for document upload (default: 100).

        Returns:
            Count of successfully indexed chunks.
        """
        if not chunks:
            logger.info("No chunks provided for indexing.")
            return 0

        client = self._get_client()

        # Transform and validate documents
        documents = [self.chunk_to_search_document(c) for c in chunks]
        total_indexed = 0

        logger.info(
            "Uploading %d document(s) to search index '%s' in batches of %d...",
            len(documents),
            self.index_name,
            batch_size,
        )

        for i in range(0, len(documents), batch_size):
            batch = documents[i : i + batch_size]
            try:
                results = client.upload_documents(documents=batch)
                failed = [r for r in results if not r.succeeded]
                if failed:
                    logger.error(
                        "Encountered %d failed documents in batch upload. First failure: %s",
                        len(failed),
                        failed[0].error_message,
                    )
                    raise SearchIndexingError(f"Partial upload failure: {failed[0].error_message}")
                total_indexed += len(batch)
            except AzureError as e:
                raise SearchIndexingError(
                    f"Azure AI Search upload failed on batch {i // batch_size + 1}: {e}"
                ) from e

        logger.info("Successfully indexed %d chunks into '%s'.", total_indexed, self.index_name)
        return total_indexed
