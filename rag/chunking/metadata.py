"""Data models for document chunks and chunk metadata.

Ensures that every chunk preserves source, page, section, and storage
attribution throughout chunking, embedding, indexing, and retrieval.
"""

from typing import List, Optional
from pydantic import BaseModel, Field


class ChunkMetadata(BaseModel):
    """Citation and filtering metadata attached to each document chunk."""

    chunk_id: str = Field(description="Deterministic unique ID for the chunk")
    document_id: str = Field(description="Unique parent document identifier (e.g. SHA-256 hash)")
    filename: str = Field(description="Source document filename")
    source: str = Field(description="Document source name or path")
    page_number: int = Field(description="1-based page number where chunk content originates")
    chunk_index: int = Field(description="0-based sequential index of the chunk in document")
    total_chunks: Optional[int] = Field(default=None, description="Total chunks in parent document")
    section: Optional[str] = Field(default=None, description="Section heading or topic label if identified")
    content_type: str = Field(default="text", description="Type of content: 'text' or 'table'")
    table_present: bool = Field(default=False, description="True if chunk contains or describes a table")
    blob_name: Optional[str] = Field(default=None, description="Azure Blob Storage blob name")
    blob_url: Optional[str] = Field(default=None, description="Azure Blob Storage direct URL")


class DocumentChunk(BaseModel):
    """Represents an indexed or searchable unit of text with rich metadata."""

    chunk_id: str = Field(description="Unique chunk identifier")
    text: str = Field(description="Textual content of the chunk")
    metadata: ChunkMetadata = Field(description="Associated chunk metadata")
    char_count: int = Field(default=0, description="Character count of chunk text")
    word_count: int = Field(default=0, description="Word count of chunk text")
    token_count: int = Field(default=0, description="Estimated or exact token count")
    embedding: Optional[List[float]] = Field(default=None, description="Dense vector embedding representation")
