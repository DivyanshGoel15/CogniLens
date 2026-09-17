"""Unit and local pipeline tests for Day 1 RAG Document Ingestion.

All unit tests run 100% offline without requiring Azure credentials or spending credits.
Integration tests against live Azure services are skipped automatically when credentials are missing.
"""

import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import MagicMock, patch

from rag.ingestion.document_loader import (
    DocumentLoader,
    DocumentNotFoundError,
    InvalidDocumentError,
    LoadedDocumentInfo,
)
from rag.ingestion.metadata_extractor import MetadataExtractor
from rag.ingestion.models import PageData, ProcessedDocument, TableData
from rag.ingestion.pdf_processor import (
    DocumentIntelligenceConfigError,
    DocumentIntelligenceProcessor,
)
from rag.ingestion.ingestion_pipeline import IngestionPipeline
from rag.preprocessing.text_cleaner import TextCleaner
from rag.preprocessing.text_normalizer import TextNormalizer


class TestDocumentLoader(unittest.TestCase):
    """Tests local file validation, format verification, and hashing."""

    def setUp(self) -> None:
        self.temp_dir = tempfile.TemporaryDirectory()
        self.temp_path = Path(self.temp_dir.name)

    def tearDown(self) -> None:
        self.temp_dir.cleanup()

    def test_invalid_path_raises_not_found(self) -> None:
        non_existent = self.temp_path / "does_not_exist.pdf"
        with self.assertRaises(DocumentNotFoundError):
            DocumentLoader.load(non_existent)

    def test_non_pdf_extension_raises_invalid(self) -> None:
        text_file = self.temp_path / "notes.txt"
        text_file.write_text("Hello World", encoding="utf-8")
        with self.assertRaises(InvalidDocumentError):
            DocumentLoader.load(text_file)

    def test_empty_file_raises_invalid(self) -> None:
        empty_pdf = self.temp_path / "empty.pdf"
        empty_pdf.touch()
        with self.assertRaises(InvalidDocumentError):
            DocumentLoader.load(empty_pdf)

    def test_invalid_pdf_header_raises_invalid(self) -> None:
        corrupt_pdf = self.temp_path / "corrupt.pdf"
        corrupt_pdf.write_bytes(b"NOT A REAL PDF HEADER")
        with self.assertRaises(InvalidDocumentError):
            DocumentLoader.load(corrupt_pdf)

    def test_valid_pdf_loads_successfully(self) -> None:
        valid_pdf = self.temp_path / "valid.pdf"
        valid_pdf.write_bytes(b"%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF")
        info = DocumentLoader.load(valid_pdf)

        self.assertEqual(info.filename, "valid.pdf")
        self.assertGreater(info.file_size_bytes, 0)
        self.assertEqual(len(info.sha256_hash), 64)
        self.assertTrue(Path(info.file_path).is_file())


class TestPreprocessing(unittest.TestCase):
    """Tests text cleaning and normalization."""

    def setUp(self) -> None:
        self.cleaner = TextCleaner()
        self.normalizer = TextNormalizer()

    def test_text_cleaner_removes_artifacts(self) -> None:
        # Zero-width spaces, replacement characters, null bytes
        dirty = "System\u200B Architecture\ufffd with\x00 null bytes."
        cleaned = self.cleaner.clean(dirty)
        self.assertEqual(cleaned, "System Architecture with null bytes.")

    def test_text_cleaner_preserves_technical_symbols_and_equations(self) -> None:
        equation = "BDP = Bandwidth × RTT; Throughput ≤ (MSS / RTT) × (C / √p)"
        cleaned = self.cleaner.clean(equation)
        self.assertEqual(cleaned, equation)

    def test_text_normalizer_collapses_excessive_newlines(self) -> None:
        text = "Paragraph 1\n\n\n\n\nParagraph 2\n\n\nParagraph 3"
        normalized = self.normalizer.normalize(text)
        expected = "Paragraph 1\n\nParagraph 2\n\nParagraph 3"
        self.assertEqual(normalized, expected)

    def test_text_normalizer_fixes_hyphenation(self) -> None:
        hyphenated = "This is a distri-\nbuted system with inter-\nconnected nodes."
        normalized = self.normalizer.normalize(hyphenated)
        self.assertEqual(normalized, "This is a distributed system with interconnected nodes.")

    def test_text_normalizer_preserves_code_and_lists(self) -> None:
        content = "• Item 1\n• Item 2\n\n  def calculate_bdp(bw, rtt):\n      return bw * rtt"
        normalized = self.normalizer.normalize(content)
        self.assertIn("• Item 1", normalized)
        self.assertIn("• Item 2", normalized)
        self.assertIn("def calculate_bdp(bw, rtt):", normalized)


class TestMetadataExtractor(unittest.TestCase):
    """Tests document metadata extraction and missing field handling."""

    def test_extract_with_missing_azure_metadata(self) -> None:
        doc_info = LoadedDocumentInfo(
            file_path=Path("sample.pdf"),
            filename="sample.pdf",
            file_size_bytes=1024,
            sha256_hash="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
            modified_time=1700000000.0,
        )
        metadata = MetadataExtractor.extract(doc_info, page_count=5)

        self.assertEqual(metadata.filename, "sample.pdf")
        self.assertEqual(metadata.file_size_bytes, 1024)
        self.assertEqual(metadata.page_count, 5)
        self.assertEqual(metadata.document_id, doc_info.sha256_hash)
        self.assertIsNone(metadata.title)
        self.assertIsNone(metadata.author)
        self.assertIsNone(metadata.blob_url)

    def test_extract_with_populated_metadata(self) -> None:
        doc_info = LoadedDocumentInfo(
            file_path=Path("sample.pdf"),
            filename="sample.pdf",
            file_size_bytes=2048,
            sha256_hash="abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
            modified_time=1700000000.0,
        )
        azure_meta = {"title": "Computer Networks", "author": "Prof. Turing"}
        metadata = MetadataExtractor.extract(
            doc_info=doc_info,
            page_count=2,
            azure_doc_metadata=azure_meta,
            blob_name="sample_blob.pdf",
            blob_url="https://example.blob.core.windows.net/docs/sample_blob.pdf",
        )

        self.assertEqual(metadata.title, "Computer Networks")
        self.assertEqual(metadata.author, "Prof. Turing")
        self.assertEqual(metadata.blob_name, "sample_blob.pdf")
        self.assertIsNotNone(metadata.blob_url)


class TestDocumentIntelligenceProcessorMock(unittest.TestCase):
    """Tests DocumentIntelligenceProcessor parsing without Azure calls."""

    def test_missing_credentials_raises_config_error(self) -> None:
        processor = DocumentIntelligenceProcessor(endpoint="", api_key="")
        with self.assertRaises(DocumentIntelligenceConfigError):
            processor._get_client()

    def test_parse_analyze_result_pages_and_tables(self) -> None:
        processor = DocumentIntelligenceProcessor(endpoint="mock", api_key="mock")

        # Create mock Line objects
        class MockLine:
            def __init__(self, content: str) -> None:
                self.content = content

        # Create mock Page objects
        class MockPage:
            def __init__(self, page_number: int, lines: list) -> None:
                self.page_number = page_number
                self.lines = lines
                self.width = 8.5
                self.height = 11.0

        # Create mock Table Cell objects
        class MockBoundingRegion:
            def __init__(self, page_number: int) -> None:
                self.page_number = page_number

        class MockCell:
            def __init__(self, r: int, c: int, text: str, kind: str = "content") -> None:
                self.row_index = r
                self.column_index = c
                self.content = text
                self.kind = kind
                self.bounding_regions = [MockBoundingRegion(1)]

        class MockTable:
            def __init__(self) -> None:
                self.row_count = 2
                self.column_count = 2
                self.cells = [
                    MockCell(0, 0, "Layer", kind="columnHeader"),
                    MockCell(0, 1, "Name", kind="columnHeader"),
                    MockCell(1, 0, "7"),
                    MockCell(1, 1, "Application"),
                ]
                self.bounding_regions = [MockBoundingRegion(1)]

        class MockAnalyzeResult:
            def __init__(self) -> None:
                self.pages = [
                    MockPage(1, [MockLine("Heading: Distributed Systems"), MockLine("Text on page 1.")]),
                    MockPage(2, []),  # Empty page
                ]
                self.tables = [MockTable()]

        pages = processor.parse_analyze_result(MockAnalyzeResult(), source="test.pdf")

        self.assertEqual(len(pages), 2)
        # Page 1 checks
        self.assertEqual(pages[0].page_number, 1)
        self.assertIn("Heading: Distributed Systems", pages[0].text)
        self.assertEqual(len(pages[0].tables), 1)
        self.assertEqual(pages[0].tables[0].headers, ["Layer", "Name"])
        self.assertEqual(pages[0].tables[0].rows, [["7", "Application"]])
        self.assertIn("| Layer | Name |", pages[0].tables[0].markdown)
        self.assertFalse(pages[0].metadata.get("is_empty"))

        # Page 2 (Empty page handling)
        self.assertEqual(pages[1].page_number, 2)
        self.assertEqual(pages[1].text, "")
        self.assertTrue(pages[1].metadata.get("is_empty"))


class TestEndToEndPipelineMocked(unittest.TestCase):
    """Tests complete ingestion pipeline using injected mocks (zero Azure calls)."""

    def setUp(self) -> None:
        self.temp_dir = tempfile.TemporaryDirectory()
        self.temp_path = Path(self.temp_dir.name)

        # Create a valid test PDF
        self.test_pdf = self.temp_path / "test_doc.pdf"
        self.test_pdf.write_bytes(b"%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF")

    def tearDown(self) -> None:
        self.temp_dir.cleanup()

    def test_pipeline_execution_with_mocks(self) -> None:
        mock_processor = MagicMock(spec=DocumentIntelligenceProcessor)
        mock_pages = [
            PageData(
                page_number=1,
                text="Introduction to Net-\nworking\n\n\nBDP = BW * RTT",
                source="test_doc.pdf",
            )
        ]
        mock_processor.analyze_document.return_value = mock_pages

        pipeline = IngestionPipeline(
            processor=mock_processor,
            skip_blob_upload=True,
        )

        output_dir = self.temp_path / "processed"
        result: ProcessedDocument = pipeline.process(
            file_path=self.test_pdf,
            save_output_dir=output_dir,
        )

        self.assertEqual(result.filename, "test_doc.pdf")
        self.assertEqual(len(result.pages), 1)
        # Verify text was cleaned and normalized
        page = result.pages[0]
        self.assertIn("Introduction to Networking", page.cleaned_text)
        self.assertIn("BDP = BW * RTT", page.cleaned_text)
        self.assertGreater(result.total_chars, 0)
        self.assertGreater(result.total_words, 0)

        # Verify JSON file was created and is valid JSON
        saved_files = list(output_dir.glob("*.json"))
        self.assertEqual(len(saved_files), 1)
        # Verify schema round-trip
        reloaded = ProcessedDocument.model_validate_json(saved_files[0].read_text(encoding="utf-8"))
        self.assertEqual(reloaded.document_id, result.document_id)
        self.assertEqual(reloaded.pages[0].page_number, 1)


@unittest.skipUnless(
    os.getenv("AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT") and os.getenv("AZURE_DOCUMENT_INTELLIGENCE_KEY"),
    "Live Azure Document Intelligence credentials not configured. Skipping integration test.",
)
class TestLiveAzureIntegration(unittest.TestCase):
    """Live Azure integration tests. Only runs if credentials are set in environment."""

    def test_live_document_intelligence_on_sample_pdf(self) -> None:
        sample_path = Path("data/sample_documents/sample.pdf")
        if not sample_path.exists():
            self.skipTest("Sample PDF not found.")

        processor = DocumentIntelligenceProcessor()
        pages = processor.analyze_document(sample_path)
        self.assertGreater(len(pages), 0)
        self.assertGreater(len(pages[0].text), 0)


if __name__ == "__main__":
    unittest.main()
