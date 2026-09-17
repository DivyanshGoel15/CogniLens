"""Metadata extraction service for educational documents.

Extracts reliable metadata from file attributes, Azure Blob Storage references,
and Azure Document Intelligence analysis results without inventing missing fields.
"""

from pathlib import Path
from typing import Any, Dict, Optional

from rag.ingestion.models import DocumentMetadata
from rag.ingestion.document_loader import LoadedDocumentInfo


class MetadataExtractor:
    """Extracts and consolidates metadata from file, storage, and Document Intelligence sources."""

    @staticmethod
    def extract(
        doc_info: LoadedDocumentInfo,
        page_count: int,
        azure_doc_metadata: Optional[Dict[str, Any]] = None,
        blob_name: Optional[str] = None,
        blob_url: Optional[str] = None,
    ) -> DocumentMetadata:
        """Construct a verified DocumentMetadata instance.

        Args:
            doc_info: Validated file attributes from DocumentLoader.
            page_count: Confirmed total page count from analysis.
            azure_doc_metadata: Optional dictionary of raw document properties returned by Document Intelligence.
            blob_name: Optional blob storage name.
            blob_url: Optional blob storage URL.

        Returns:
            DocumentMetadata object populated with verified data (None for missing fields).
        """
        azure_meta = azure_doc_metadata or {}

        # Extract title and author if explicitly present in Document Intelligence document metadata
        raw_title = azure_meta.get("title") or azure_meta.get("Title")
        title = str(raw_title).strip() if raw_title and str(raw_title).strip() else None

        raw_author = azure_meta.get("author") or azure_meta.get("Author")
        author = str(raw_author).strip() if raw_author and str(raw_author).strip() else None

        raw_created_date = (
            azure_meta.get("creation_date")
            or azure_meta.get("created_date")
            or azure_meta.get("CreationDate")
        )
        created_date = str(raw_created_date).strip() if raw_created_date and str(raw_created_date).strip() else None

        return DocumentMetadata(
            document_id=doc_info.sha256_hash,
            filename=doc_info.filename,
            file_type="pdf",
            file_size_bytes=doc_info.file_size_bytes,
            page_count=page_count,
            sha256_hash=doc_info.sha256_hash,
            title=title,
            author=author,
            created_date=created_date,
            blob_name=blob_name,
            blob_url=blob_url,
        )
