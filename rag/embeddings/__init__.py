"""Embeddings package for vector representation generation."""

from rag.embeddings.embedding_service import (
    EmbeddingService,
    EmbeddingError,
    EmbeddingConfigError,
    EmbeddingServiceError,
)

__all__ = [
    "EmbeddingService",
    "EmbeddingError",
    "EmbeddingConfigError",
    "EmbeddingServiceError",
]
