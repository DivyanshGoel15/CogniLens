"""Semantic chunker for educational documents.

Transforms structured ProcessedDocument instances into semantically coherent,
token-budgeted DocumentChunk objects with rich metadata and table preservation.
"""

import json
import logging
from pathlib import Path
from typing import List, Optional

from rag.chunking.metadata import ChunkMetadata, DocumentChunk
from rag.chunking.strategies import ChunkConfig, SectionDetector, SemanticSplitter, TokenCounter
from rag.ingestion.models import PageData, ProcessedDocument, TableData

logger = logging.getLogger(__name__)


class SemanticChunker:
    """Orchestrates hierarchical chunking of educational documents."""

    def __init__(self, config: Optional[ChunkConfig] = None) -> None:
        """Initialize SemanticChunker with configuration."""
        self.config = config or ChunkConfig.from_env()
        self.splitter = SemanticSplitter(self.config)
        self.token_counter = TokenCounter(self.config.encoding_name)

    def chunk_document(
        self,
        document: ProcessedDocument,
        save_chunks_dir: Optional[Path | str] = None,
    ) -> List[DocumentChunk]:
        """Chunk a ProcessedDocument into a list of DocumentChunk objects.

        Args:
            document: ProcessedDocument instance from Day 1 ingestion.
            save_chunks_dir: Optional directory to persist the chunks as JSON for manual inspection.

        Returns:
            List of DocumentChunk instances with verified metadata and content.
        """
        doc_id = document.document_id
        doc_id_prefix = doc_id[:8]
        filename = document.filename
        blob_name = document.metadata.blob_name
        blob_url = document.metadata.blob_url

        raw_chunks: List[DocumentChunk] = []
        chunk_sequence_num = 0

        # Process page by page to guarantee page boundary preservation
        for page in document.pages:
            page_num = page.page_number
            page_source = page.source or filename

            # 1. Process structured tables on this page first
            for table in page.tables:
                chunk_sequence_num += 1
                chunk_id = f"{doc_id_prefix}_p{page_num}_c{chunk_sequence_num:02d}"

                table_text = self._build_table_chunk_text(table, page_num)
                tok_count = self.token_counter.count(table_text)

                meta = ChunkMetadata(
                    chunk_id=chunk_id,
                    document_id=doc_id,
                    filename=filename,
                    source=page_source,
                    page_number=page_num,
                    chunk_index=chunk_sequence_num - 1,
                    section=f"Table: {', '.join(table.headers[:3])}" if table.headers else None,
                    content_type="table",
                    table_present=True,
                    blob_name=blob_name,
                    blob_url=blob_url,
                )

                raw_chunks.append(
                    DocumentChunk(
                        chunk_id=chunk_id,
                        text=table_text,
                        metadata=meta,
                        char_count=len(table_text),
                        word_count=len(table_text.split()),
                        token_count=tok_count,
                    )
                )

            # 2. Process page text: detect sections and split into semantic chunks
            text_to_chunk = page.cleaned_text or page.text or ""
            if not text_to_chunk.strip():
                continue

            # Detect hierarchical sections within page
            sections = SectionDetector.find_sections(text_to_chunk)
            if not sections:
                sections = [(None, text_to_chunk)]

            for section_title, section_body in sections:
                if not section_body.strip():
                    continue

                split_results = self.splitter.split_text(section_body, section_title=section_title)
                for chunk_text, sec in split_results:
                    chunk_sequence_num += 1
                    chunk_id = f"{doc_id_prefix}_p{page_num}_c{chunk_sequence_num:02d}"
                    tok_count = self.token_counter.count(chunk_text)

                    meta = ChunkMetadata(
                        chunk_id=chunk_id,
                        document_id=doc_id,
                        filename=filename,
                        source=page_source,
                        page_number=page_num,
                        chunk_index=chunk_sequence_num - 1,
                        section=sec,
                        content_type="text",
                        table_present=False,
                        blob_name=blob_name,
                        blob_url=blob_url,
                    )

                    raw_chunks.append(
                        DocumentChunk(
                            chunk_id=chunk_id,
                            text=chunk_text,
                            metadata=meta,
                            char_count=len(chunk_text),
                            word_count=len(chunk_text.split()),
                            token_count=tok_count,
                        )
                    )

        # Update total_chunks count on all chunks
        total_count = len(raw_chunks)
        for chunk in raw_chunks:
            chunk.metadata.total_chunks = total_count

        logger.info(
            "Generated %d chunks from document '%s' across %d page(s).",
            total_count,
            filename,
            len(document.pages),
        )

        # Save to local development inspection output if requested
        if save_chunks_dir:
            out_dir = Path(save_chunks_dir)
            out_dir.mkdir(parents=True, exist_ok=True)
            output_file = out_dir / f"{filename}_chunks.json"
            logger.info("Saving development chunk inspection output to: %s", output_file)
            chunks_dict = [c.model_dump() for c in raw_chunks]
            with open(output_file, "w", encoding="utf-8") as f:
                json.dump(chunks_dict, f, indent=2)

        return raw_chunks

    def chunk_from_file(
        self,
        processed_json_path: Path | str,
        save_chunks_dir: Optional[Path | str] = None,
    ) -> List[DocumentChunk]:
        """Load a ProcessedDocument from a JSON file and chunk it."""
        path = Path(processed_json_path)
        if not path.is_file():
            raise FileNotFoundError(f"Processed document JSON not found: {path}")

        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)

        document = ProcessedDocument.model_validate(data)
        return self.chunk_document(document, save_chunks_dir=save_chunks_dir)

    @staticmethod
    def _build_table_chunk_text(table: TableData, page_num: int) -> str:
        """Create a retrieval-friendly text representation of an extracted table."""
        header_summary = f"Table on Page {page_num}"
        if table.headers:
            header_summary += f" [Columns: {', '.join(table.headers)}]"

        if table.markdown:
            return f"{header_summary}\n\n{table.markdown}"

        # Fallback if markdown representation is empty
        rows_text = [" | ".join(r) for r in table.rows]
        return f"{header_summary}\n\n" + "\n".join(rows_text)
