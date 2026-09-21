"""Azure OpenAI Embedding Service.

Provides batched, cached vector embedding generation using Azure OpenAI / Foundry
deployments (e.g. text-embedding-3-small, text-embedding-ada-002) with strict cost controls.
"""

import hashlib
import logging
import os
from typing import Dict, List, Optional

from openai import AzureOpenAI, APIError, AuthenticationError

from rag.chunking.metadata import DocumentChunk

logger = logging.getLogger(__name__)


class EmbeddingError(Exception):
    """Base exception for embedding operations."""
    pass


class EmbeddingConfigError(EmbeddingError):
    """Raised when Azure OpenAI embedding configuration or credentials are missing."""
    pass


class EmbeddingServiceError(EmbeddingError):
    """Raised when embedding API call fails."""
    pass


class EmbeddingService:
    """Service wrapper for generating vector embeddings via Azure OpenAI."""

    def __init__(
        self,
        endpoint: Optional[str] = None,
        api_key: Optional[str] = None,
        deployment: Optional[str] = None,
        api_version: Optional[str] = None,
        dimensions: Optional[int] = None,
        client: Optional[AzureOpenAI] = None,
    ) -> None:
        """Initialize EmbeddingService with credentials and deployment settings.

        Args:
            endpoint: Azure OpenAI endpoint. Defaults to AZURE_EMBEDDING_ENDPOINT or AZURE_OPENAI_ENDPOINT.
            api_key: Azure OpenAI API key. Defaults to AZURE_EMBEDDING_API_KEY or AZURE_OPENAI_API_KEY.
            deployment: Deployment name (e.g., 'text-embedding-3-small'). Defaults to AZURE_EMBEDDING_DEPLOYMENT.
            api_version: Azure OpenAI API version. Defaults to AZURE_EMBEDDING_API_VERSION or '2024-02-01'.
            dimensions: Vector dimensions (e.g. 1536). Defaults to AZURE_EMBEDDING_DIMENSIONS.
            client: Optional pre-configured AzureOpenAI client (useful for unit tests / mocking).
        """
        self.endpoint = (
            endpoint
            or os.getenv("AZURE_EMBEDDING_ENDPOINT")
            or os.getenv("AZURE_OPENAI_ENDPOINT")
        )
        self.api_key = (
            api_key
            or os.getenv("AZURE_EMBEDDING_API_KEY")
            or os.getenv("AZURE_OPENAI_API_KEY")
        )
        self.deployment = (
            deployment
            or os.getenv("AZURE_EMBEDDING_DEPLOYMENT")
            or "text-embedding-3-small"
        )
        self.api_version = (
            api_version
            or os.getenv("AZURE_EMBEDDING_API_VERSION")
            or "2024-02-01"
        )
        dim_str = os.getenv("AZURE_EMBEDDING_DIMENSIONS", "1536")
        self.dimensions = dimensions or int(dim_str)

        self._client = client
        # In-memory SHA-256 cache to prevent re-embedding identical text strings (Azure cost control)
        self._cache: Dict[str, List[float]] = {}

    def _get_client(self) -> AzureOpenAI:
        """Lazily initialize and validate the Azure OpenAI client."""
        if self._client is not None:
            return self._client

        if not self.endpoint:
            raise EmbeddingConfigError(
                "Missing Azure OpenAI embedding endpoint. "
                "Set 'AZURE_EMBEDDING_ENDPOINT' or 'AZURE_OPENAI_ENDPOINT' environment variable."
            )
        if not self.api_key:
            raise EmbeddingConfigError(
                "Missing Azure OpenAI embedding API key. "
                "Set 'AZURE_EMBEDDING_API_KEY' or 'AZURE_OPENAI_API_KEY' environment variable."
            )
        if not self.deployment:
            raise EmbeddingConfigError(
                "Missing Azure OpenAI embedding deployment name. "
                "Set 'AZURE_EMBEDDING_DEPLOYMENT' environment variable (e.g. 'text-embedding-3-small')."
            )

        try:
            self._client = AzureOpenAI(
                azure_endpoint=self.endpoint,
                api_key=self.api_key,
                api_version=self.api_version,
            )
            return self._client
        except Exception as e:
            raise EmbeddingConfigError(f"Failed to initialize Azure OpenAI client: {e}") from e

    def embed_text(self, text: str) -> List[float]:
        """Generate an embedding vector for a single string.

        Args:
            text: Input text to embed.

        Returns:
            List of floats representing the dense vector.
        """
        if not text or not text.strip():
            raise ValueError("Cannot embed empty or whitespace-only text.")

        # Check local cache first (Cost control safeguard)
        cache_key = hashlib.sha256(text.encode("utf-8")).hexdigest()
        if cache_key in self._cache:
            return self._cache[cache_key]

        client = self._get_client()
        try:
            response = client.embeddings.create(
                input=[text],
                model=self.deployment,
            )
            embedding = response.data[0].embedding
            self._cache[cache_key] = embedding
            return embedding
        except AuthenticationError as e:
            raise EmbeddingConfigError(f"Azure OpenAI authentication failed: {e}") from e
        except APIError as e:
            raise EmbeddingServiceError(f"Azure OpenAI API error during embedding: {e}") from e
        except Exception as e:
            raise EmbeddingServiceError(f"Unexpected error generating embedding: {e}") from e

    def embed_chunks(
        self,
        chunks: List[DocumentChunk],
        batch_size: int = 16,
    ) -> List[DocumentChunk]:
        """Embed a list of DocumentChunks in batches, attaching embeddings in-place.

        Args:
            chunks: List of DocumentChunk instances.
            batch_size: Maximum texts per embedding batch request (default: 16).

        Returns:
            The same list of DocumentChunk instances with .embedding populated.
        """
        if not chunks:
            return []

        client = self._get_client()

        # Identify which chunks need embedding vs which are in cache
        chunks_to_embed: List[DocumentChunk] = []
        for chunk in chunks:
            if not chunk.text or not chunk.text.strip():
                continue
            cache_key = hashlib.sha256(chunk.text.encode("utf-8")).hexdigest()
            if cache_key in self._cache:
                chunk.embedding = self._cache[cache_key]
            else:
                chunks_to_embed.append(chunk)

        if not chunks_to_embed:
            logger.info("All %d chunks resolved from embedding cache.", len(chunks))
            return chunks

        logger.info(
            "Embedding %d chunk(s) using deployment '%s' in batches of %d...",
            len(chunks_to_embed),
            self.deployment,
            batch_size,
        )

        for i in range(0, len(chunks_to_embed), batch_size):
            batch = chunks_to_embed[i : i + batch_size]
            batch_texts = [c.text for c in batch]

            try:
                response = client.embeddings.create(
                    input=batch_texts,
                    model=self.deployment,
                )
                for item, chunk in zip(response.data, batch):
                    chunk.embedding = item.embedding
                    cache_key = hashlib.sha256(chunk.text.encode("utf-8")).hexdigest()
                    self._cache[cache_key] = item.embedding

            except AuthenticationError as e:
                raise EmbeddingConfigError(f"Azure OpenAI authentication failed: {e}") from e
            except APIError as e:
                raise EmbeddingServiceError(f"Azure OpenAI batch embedding failed: {e}") from e
            except Exception as e:
                raise EmbeddingServiceError(f"Unexpected error during batch embedding: {e}") from e

        logger.info("Successfully embedded %d chunk(s).", len(chunks_to_embed))
        return chunks
