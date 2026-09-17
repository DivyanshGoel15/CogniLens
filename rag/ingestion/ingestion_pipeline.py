"""End-to-End Document Ingestion Pipeline for Day 1 RAG foundation.

Orchestrates:
PDF -> Validation & Hashing -> Blob Storage -> Document Intelligence ->
Metadata Extraction -> Text Cleaning & Normalization -> Structured Document.
"""

import json
import logging
from pathlib import Path
from typing import Optional

from rag.ingestion.blob_storage import BlobStorageService
from rag.ingestion.document_loader import DocumentLoader, LoadedDocumentInfo
from rag.ingestion.metadata_extractor import MetadataExtractor
from rag.ingestion.models import ProcessedDocument
from rag.ingestion.pdf_processor import DocumentIntelligenceProcessor
from rag.preprocessing.text_cleaner import TextCleaner
from rag.preprocessing.text_normalizer import TextNormalizer

logger = logging.getLogger(__name__)


class IngestionPipeline:
    """Orchestrates document validation, cloud storage, AI analysis, and preprocessing."""

    def __init__(
        self,
        blob_service: Optional[BlobStorageService] = None,
        processor: Optional[DocumentIntelligenceProcessor] = None,
        text_cleaner: Optional[TextCleaner] = None,
        text_normalizer: Optional[TextNormalizer] = None,
        skip_blob_upload: bool = False,
    ) -> None:
        """Initialize IngestionPipeline.

        Args:
            blob_service: Optional BlobStorageService instance (auto-initialized if None and upload not skipped).
            processor: Optional DocumentIntelligenceProcessor instance (auto-initialized if None).
            text_cleaner: TextCleaner instance.
            text_normalizer: TextNormalizer instance.
            skip_blob_upload: If True, bypasses Blob Storage upload (useful for local dry-run / cost saving).
        """
        self.skip_blob_upload = skip_blob_upload
        self._blob_service = blob_service
        self._processor = processor
        self.text_cleaner = text_cleaner or TextCleaner()
        self.text_normalizer = text_normalizer or TextNormalizer()

    def _get_blob_service(self) -> Optional[BlobStorageService]:
        """Lazily initialize BlobStorageService when needed."""
        if self.skip_blob_upload:
            return None
        if self._blob_service is None:
            self._blob_service = BlobStorageService()
        return self._blob_service

    def _get_processor(self) -> DocumentIntelligenceProcessor:
        """Lazily initialize DocumentIntelligenceProcessor when needed."""
        if self._processor is None:
            self._processor = DocumentIntelligenceProcessor()
        return self._processor

    def process(
        self,
        file_path: Path | str,
        save_output_dir: Optional[Path | str] = None,
    ) -> ProcessedDocument:
        """Execute the full document ingestion pipeline.

        Args:
            file_path: Path to the target PDF file.
            save_output_dir: Optional directory to persist the JSON processed document.

        Returns:
            ProcessedDocument: Validated and structured document representation.
        """
        # Step 1: Validate file and compute deterministic hash
        logger.info("Step 1: Validating file '%s'...", file_path)
        doc_info: LoadedDocumentInfo = DocumentLoader.load(file_path)
        logger.info(
            "File validated: %s (%d bytes, SHA256: %s)",
            doc_info.filename,
            doc_info.file_size_bytes,
            doc_info.sha256_hash[:12],
        )

        # Step 2: Upload to Azure Blob Storage (or skip if configured for dry-run/testing)
        blob_name: Optional[str] = None
        blob_url: Optional[str] = None

        if not self.skip_blob_upload:
            logger.info("Step 2: Uploading to Azure Blob Storage...")
            blob_service = self._get_blob_service()
            if blob_service:
                blob_name = blob_service.generate_safe_blob_name(
                    doc_info.filename, sha256_prefix=doc_info.sha256_hash
                )
                blob_url = blob_service.upload_file(doc_info.file_path, blob_name=blob_name)
                logger.info("Uploaded blob URL: %s", blob_url)
        else:
            logger.info("Step 2: Skipped Azure Blob Storage upload (skip_blob_upload=True).")

        # Step 3: Analyze document with Azure AI Document Intelligence
        logger.info("Step 3: Analyzing document with Azure AI Document Intelligence...")
        processor = self._get_processor()
        pages = processor.analyze_document(doc_info.file_path, source_name=doc_info.filename)
        logger.info("Extracted %d page(s) from document.", len(pages))

        # Step 4: Text cleaning and normalization on each page
        logger.info("Step 4: Preprocessing (cleaning & normalizing) page text...")
        total_tables = 0
        total_chars = 0
        total_words = 0

        for page in pages:
            raw_text = page.text or ""
            cleaned = self.text_cleaner.clean(raw_text)
            normalized = self.text_normalizer.normalize(cleaned)

            page.cleaned_text = normalized
            page.char_count = len(normalized)
            page.word_count = len(normalized.split())

            total_tables += len(page.tables)
            total_chars += page.char_count
            total_words += page.word_count

        # Step 5: Extract and consolidate document metadata
        logger.info("Step 5: Extracting document metadata...")
        metadata = MetadataExtractor.extract(
            doc_info=doc_info,
            page_count=len(pages),
            blob_name=blob_name,
            blob_url=blob_url,
        )

        # Step 6: Assemble final ProcessedDocument
        processed_doc = ProcessedDocument(
            document_id=doc_info.sha256_hash,
            filename=doc_info.filename,
            metadata=metadata,
            pages=pages,
            total_tables=total_tables,
            total_chars=total_chars,
            total_words=total_words,
        )

        # Step 7: Optionally save to local JSON file for inspection/caching
        if save_output_dir:
            out_dir = Path(save_output_dir)
            out_dir.mkdir(parents=True, exist_ok=True)
            output_file = out_dir / f"{doc_info.filename}_{doc_info.sha256_hash[:8]}.json"
            logger.info("Saving structured output to: %s", output_file)
            with open(output_file, "w", encoding="utf-8") as f:
                f.write(processed_doc.model_dump_json(indent=2))

        logger.info("Ingestion completed successfully for '%s'.", doc_info.filename)
        return processed_doc
