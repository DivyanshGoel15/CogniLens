"""Unit and local pipeline tests for Day 2 + Day 3 RAG Knowledge Subsystem.

Tests Semantic Chunking, Metadata Modeling, Embedding Service, and Search Indexing.
All unit tests run 100% offline with zero Azure credits consumed.
"""

import json
import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import MagicMock

from rag.chunking.chunker import SemanticChunker
from rag.chunking.metadata import ChunkMetadata, DocumentChunk
from rag.chunking.strategies import ChunkConfig, SectionDetector, SemanticSplitter, TokenCounter
from rag.embeddings.embedding_service import (
    EmbeddingConfigError,
    EmbeddingService,
    EmbeddingServiceError,
)
from rag.ingestion.models import DocumentMetadata, PageData, ProcessedDocument, TableData
from rag.search.index_creator import SearchIndexConfigError, SearchIndexManager
from rag.search.retriever import Retriever, SearchResult
from rag.search.search_service import SearchIndexingError, SearchService


class TestTokenCounterAndSplitter(unittest.TestCase):
    """Tests token estimation and paragraph/sentence splitting."""

    def setUp(self) -> None:
        self.counter = TokenCounter()
        self.config = ChunkConfig(chunk_size=50, chunk_overlap=10, min_chunk_size=10)
        self.splitter = SemanticSplitter(self.config)

    def test_token_counter_empty_and_text(self) -> None:
        self.assertEqual(self.counter.count(""), 0)
        tokens = self.counter.count("Hello world, this is a test.")
        self.assertGreater(tokens, 3)

    def test_section_detector(self) -> None:
        text = (
            "1. Introduction to Networks\n"
            "This is introductory text.\n\n"
            "2. Mathematical Formulation\n"
            "BDP = BW * RTT\n"
        )
        sections = SectionDetector.find_sections(text)
        self.assertEqual(len(sections), 2)
        self.assertEqual(sections[0][0], "1. Introduction to Networks")
        self.assertEqual(sections[1][0], "2. Mathematical Formulation")

    def test_semantic_splitter_respects_budget(self) -> None:
        long_text = "Word " * 200  # ~200 tokens
        chunks = self.splitter.split_text(long_text, section_title="Test Section")
        self.assertGreater(len(chunks), 1)
        for chunk_text, sec in chunks:
            self.assertEqual(sec, "Test Section")
            self.assertLessEqual(self.counter.count(chunk_text), int(self.config.chunk_size * 1.3))


class TestSemanticChunker(unittest.TestCase):
    """Tests chunking of ProcessedDocument structures."""

    def setUp(self) -> None:
        self.chunker = SemanticChunker(ChunkConfig(chunk_size=150, chunk_overlap=20))

    def _create_mock_document(self) -> ProcessedDocument:
        meta = DocumentMetadata(
            document_id="doc_1234567890abcdef",
            filename="network_architecture.pdf",
            file_type="pdf",
            file_size_bytes=4096,
            page_count=2,
            sha256_hash="doc_1234567890abcdef",
            blob_name="doc_1234.pdf",
            blob_url="https://example.blob.core.windows.net/docs/doc_1234.pdf",
        )

        page1 = PageData(
            page_number=1,
            text="1. Network Layering\nLayering is essential.\n\n2. BDP Formula\nBDP = BW * RTT",
            cleaned_text="1. Network Layering\nLayering is essential.\n\n2. BDP Formula\nBDP = BW * RTT",
            tables=[
                TableData(
                    table_id="t1",
                    page_number=1,
                    row_count=2,
                    column_count=2,
                    headers=["Layer", "PDU"],
                    rows=[["Transport", "Segment"]],
                    markdown="| Layer | PDU |\n| --- | --- |\n| Transport | Segment |",
                )
            ],
            char_count=80,
            word_count=15,
            source="network_architecture.pdf",
        )

        page2 = PageData(
            page_number=2,
            text="3. Congestion Avoidance\nTCP Reno and CUBIC regulate congestion.",
            cleaned_text="3. Congestion Avoidance\nTCP Reno and CUBIC regulate congestion.",
            tables=[],
            char_count=65,
            word_count=10,
            source="network_architecture.pdf",
        )

        return ProcessedDocument(
            document_id=meta.document_id,
            filename=meta.filename,
            metadata=meta,
            pages=[page1, page2],
            total_tables=1,
            total_chars=145,
            total_words=25,
        )

    def test_chunk_empty_document(self) -> None:
        meta = DocumentMetadata(
            document_id="empty_doc",
            filename="empty.pdf",
            file_size_bytes=0,
            page_count=0,
            sha256_hash="empty_hash",
        )
        empty_doc = ProcessedDocument(
            document_id="empty_doc",
            filename="empty.pdf",
            metadata=meta,
            pages=[],
        )
        chunks = self.chunker.chunk_document(empty_doc)
        self.assertEqual(len(chunks), 0)

    def test_chunking_preserves_pages_and_tables(self) -> None:
        doc = self._create_mock_document()
        chunks = self.chunker.chunk_document(doc)

        self.assertGreater(len(chunks), 1)

        # Check table chunk
        table_chunks = [c for c in chunks if c.metadata.content_type == "table"]
        self.assertEqual(len(table_chunks), 1)
        self.assertTrue(table_chunks[0].metadata.table_present)
        self.assertIn("| Layer | PDU |", table_chunks[0].text)
        self.assertEqual(table_chunks[0].metadata.page_number, 1)

        # Check text chunks preserve page numbers
        pages_in_chunks = {c.metadata.page_number for c in chunks}
        self.assertEqual(pages_in_chunks, {1, 2})

        # Check metadata inheritance
        for c in chunks:
            self.assertEqual(c.metadata.document_id, doc.document_id)
            self.assertEqual(c.metadata.filename, doc.filename)
            self.assertEqual(c.metadata.blob_url, doc.metadata.blob_url)
            self.assertEqual(c.metadata.total_chunks, len(chunks))

    def test_chunk_from_file_and_save(self) -> None:
        doc = self._create_mock_document()
        with tempfile.TemporaryDirectory() as tmp_dir:
            tmp_path = Path(tmp_dir)
            doc_file = tmp_path / "doc.json"
            doc_file.write_text(doc.model_dump_json(), encoding="utf-8")

            chunks_dir = tmp_path / "chunks"
            chunks = self.chunker.chunk_from_file(doc_file, save_chunks_dir=chunks_dir)

            saved_files = list(chunks_dir.glob("*.json"))
            self.assertEqual(len(saved_files), 1)

            # Validate saved JSON structure
            with open(saved_files[0], "r", encoding="utf-8") as f:
                data = json.load(f)
            self.assertEqual(len(data), len(chunks))
            self.assertEqual(data[0]["chunk_id"], chunks[0].chunk_id)


class TestEmbeddingService(unittest.TestCase):
    """Tests EmbeddingService validation, caching, and batching."""

    def test_missing_credentials_raises_config_error(self) -> None:
        service = EmbeddingService(endpoint="", api_key="")
        with self.assertRaises(EmbeddingConfigError):
            service._get_client()

    def test_empty_text_raises_value_error(self) -> None:
        service = EmbeddingService(endpoint="mock", api_key="mock")
        with self.assertRaises(ValueError):
            service.embed_text("")
        with self.assertRaises(ValueError):
            service.embed_text("   \n\t  ")

    def test_embed_with_mock_client_and_cache(self) -> None:
        mock_client = MagicMock()
        mock_item = MagicMock()
        mock_item.embedding = [0.1, 0.2, 0.3]
        mock_resp = MagicMock()
        mock_resp.data = [mock_item]
        mock_client.embeddings.create.return_value = mock_resp

        service = EmbeddingService(
            endpoint="https://mock.openai.azure.com",
            api_key="mock-key",
            deployment="text-embedding-3-small",
            client=mock_client,
        )

        # First call hits mock client
        emb1 = service.embed_text("Test sentence")
        self.assertEqual(emb1, [0.1, 0.2, 0.3])
        self.assertEqual(mock_client.embeddings.create.call_count, 1)

        # Second call with identical text should hit in-memory cache (0 additional API calls)
        emb2 = service.embed_text("Test sentence")
        self.assertEqual(emb2, [0.1, 0.2, 0.3])
        self.assertEqual(mock_client.embeddings.create.call_count, 1)


class TestSearchIndexAndService(unittest.TestCase):
    """Tests Azure AI Search schema generation, document mapping, and retriever."""

    def test_build_index_schema_fields(self) -> None:
        schema = SearchIndexManager.build_index_schema("test-index", dimensions=1536)
        self.assertEqual(schema.name, "test-index")
        field_names = [f.name for f in schema.fields]
        expected_fields = [
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
            "embedding",
        ]
        for ef in expected_fields:
            self.assertIn(ef, field_names)

    def test_chunk_to_search_document_mapping(self) -> None:
        meta = ChunkMetadata(
            chunk_id="chk_01",
            document_id="doc_01",
            filename="test.pdf",
            source="test.pdf",
            page_number=3,
            chunk_index=0,
            section="Section 1",
            content_type="text",
            table_present=False,
            blob_url="https://blob.url/test.pdf",
        )
        chunk = DocumentChunk(
            chunk_id="chk_01",
            text="Some content",
            metadata=meta,
            embedding=[0.1, 0.2, 0.3],
        )

        doc = SearchService.chunk_to_search_document(chunk)
        self.assertEqual(doc["chunk_id"], "chk_01")
        self.assertEqual(doc["page_number"], 3)
        self.assertEqual(doc["embedding"], [0.1, 0.2, 0.3])
        self.assertEqual(doc["text"], "Some content")

    def test_chunk_to_search_document_missing_embedding_raises(self) -> None:
        meta = ChunkMetadata(
            chunk_id="chk_02",
            document_id="doc_02",
            filename="test.pdf",
            source="test.pdf",
            page_number=1,
            chunk_index=0,
        )
        chunk = DocumentChunk(chunk_id="chk_02", text="No embedding", metadata=meta, embedding=None)
        with self.assertRaises(ValueError):
            SearchService.chunk_to_search_document(chunk)

    def test_retriever_parse_search_results(self) -> None:
        raw_hits = [
            {
                "@search.score": 0.895,
                "chunk_id": "c1",
                "document_id": "d1",
                "filename": "sample.pdf",
                "source": "sample.pdf",
                "page_number": 2,
                "chunk_index": 1,
                "section": "Congestion Control",
                "content_type": "text",
                "table_present": False,
                "blob_url": "https://blob/sample.pdf",
                "text": "TCP Reno regulates flow.",
            }
        ]
        results = Retriever.parse_search_results(raw_hits)
        self.assertEqual(len(results), 1)
        res = results[0]
        self.assertEqual(res.chunk_id, "c1")
        self.assertEqual(res.page_number, 2)
        self.assertEqual(res.section, "Congestion Control")
        self.assertAlmostEqual(res.score, 0.895)


if __name__ == "__main__":
    unittest.main()
