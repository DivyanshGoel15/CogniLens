"""Data models for structured document representation in the RAG ingestion pipeline."""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class TableData(BaseModel):
    """Represents a structured table extracted from a document page."""

    table_id: str = Field(description="Unique identifier for the table")
    page_number: int = Field(description="1-based page number where the table appears")
    row_count: int = Field(description="Number of rows in the table")
    column_count: int = Field(description="Number of columns in the table")
    headers: List[str] = Field(default_factory=list, description="Column header labels")
    rows: List[List[str]] = Field(default_factory=list, description="Matrix of table cell values")
    markdown: str = Field(default="", description="Markdown representation of the table for downstream chunking")


class PageData(BaseModel):
    """Represents a single processed page within a document."""

    page_number: int = Field(description="1-based page number")
    text: str = Field(default="", description="Raw extracted text from the page")
    cleaned_text: str = Field(default="", description="Cleaned and normalized text")
    tables: List[TableData] = Field(default_factory=list, description="Tables identified on this page")
    char_count: int = Field(default=0, description="Character count of cleaned text")
    word_count: int = Field(default=0, description="Word count of cleaned text")
    source: str = Field(description="Source document name or path")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Page-level structural metadata")


class DocumentMetadata(BaseModel):
    """Reliable metadata extracted from the document file, storage, and Document Intelligence."""

    document_id: str = Field(description="Deterministic or unique ID for the document")
    filename: str = Field(description="Original filename")
    file_type: str = Field(default="pdf", description="File extension / MIME type")
    file_size_bytes: int = Field(description="Size in bytes on disk")
    page_count: int = Field(description="Total page count")
    sha256_hash: str = Field(description="Cryptographic SHA-256 hash of the source content")
    title: Optional[str] = Field(default=None, description="Document title if explicitly available")
    author: Optional[str] = Field(default=None, description="Document author if explicitly available")
    created_date: Optional[str] = Field(default=None, description="Creation timestamp from metadata")
    blob_name: Optional[str] = Field(default=None, description="Azure Blob Storage blob name")
    blob_url: Optional[str] = Field(default=None, description="Azure Blob Storage reference URL")
    ingestion_timestamp: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat(),
        description="ISO 8601 timestamp when the document was ingested"
    )


class ProcessedDocument(BaseModel):
    """Complete structured representation of an ingested document."""

    document_id: str = Field(description="Unique document ID")
    filename: str = Field(description="Original document filename")
    metadata: DocumentMetadata = Field(description="Comprehensive document metadata")
    pages: List[PageData] = Field(default_factory=list, description="List of page data objects")
    total_tables: int = Field(default=0, description="Total number of tables extracted across all pages")
    total_chars: int = Field(default=0, description="Total cleaned characters across all pages")
    total_words: int = Field(default=0, description="Total cleaned words across all pages")
    version: str = Field(default="1.0.0", description="Pipeline data model schema version")
