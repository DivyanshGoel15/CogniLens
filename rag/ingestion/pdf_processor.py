"""Azure AI Document Intelligence processor for educational PDFs.

Extracts page-by-page text, structural layout, and formatted tables
using Azure AI Document Intelligence (prebuilt-layout model).
"""

import logging
import os
from pathlib import Path
from typing import Any, BinaryIO, Dict, List, Optional

from azure.core.credentials import AzureKeyCredential
from azure.core.exceptions import AzureError
from azure.ai.documentintelligence import DocumentIntelligenceClient
from azure.ai.documentintelligence.models import AnalyzeResult

from rag.ingestion.models import PageData, TableData

logger = logging.getLogger(__name__)


class DocumentIntelligenceConfigError(Exception):
    """Raised when Azure Document Intelligence configuration or credentials are missing."""
    pass


class DocumentIntelligenceError(Exception):
    """Raised when document analysis fails during processing."""
    pass


class DocumentIntelligenceProcessor:
    """Processes documents using Azure AI Document Intelligence (prebuilt-layout)."""

    def __init__(
        self,
        endpoint: Optional[str] = None,
        api_key: Optional[str] = None,
    ) -> None:
        """Initialize DocumentIntelligenceProcessor.

        Args:
            endpoint: Azure Document Intelligence endpoint URL.
                      Defaults to AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT env var.
            api_key: Azure Document Intelligence API key.
                     Defaults to AZURE_DOCUMENT_INTELLIGENCE_KEY env var.
        """
        self.endpoint = endpoint or os.getenv("AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT")
        self.api_key = api_key or os.getenv("AZURE_DOCUMENT_INTELLIGENCE_KEY")

        self._client: Optional[DocumentIntelligenceClient] = None

    def _get_client(self) -> DocumentIntelligenceClient:
        """Lazily initialize and validate the Azure Document Intelligence client."""
        if self._client is not None:
            return self._client

        if not self.endpoint:
            raise DocumentIntelligenceConfigError(
                "Missing Azure Document Intelligence endpoint. "
                "Set 'AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT' environment variable."
            )
        if not self.api_key:
            raise DocumentIntelligenceConfigError(
                "Missing Azure Document Intelligence key. "
                "Set 'AZURE_DOCUMENT_INTELLIGENCE_KEY' environment variable."
            )

        try:
            credential = AzureKeyCredential(self.api_key)
            self._client = DocumentIntelligenceClient(
                endpoint=self.endpoint,
                credential=credential,
            )
            return self._client
        except Exception as e:
            raise DocumentIntelligenceConfigError(
                f"Failed to initialize DocumentIntelligenceClient: {e}"
            ) from e

    def analyze_document(
        self,
        file_path: Path | str,
        source_name: Optional[str] = None,
    ) -> List[PageData]:
        """Analyze a local PDF document using prebuilt-layout model.

        Args:
            file_path: Path to the local PDF file.
            source_name: Optional custom source label (defaults to file basename).

        Returns:
            List of PageData instances containing text, tables, and metadata.
        """
        path = Path(file_path)
        if not path.is_file():
            raise FileNotFoundError(f"Target PDF file does not exist: {path}")

        source = source_name or path.name
        client = self._get_client()

        logger.info("Submitting '%s' to Azure Document Intelligence (prebuilt-layout)...", source)
        try:
            with open(path, "rb") as f:
                poller = client.begin_analyze_document(
                    model_id="prebuilt-layout",
                    body=f,
                )
                analyze_result: AnalyzeResult = poller.result()
        except AzureError as e:
            raise DocumentIntelligenceError(
                f"Azure Document Intelligence call failed for '{source}': {e}"
            ) from e
        except Exception as e:
            raise DocumentIntelligenceError(
                f"Unexpected error during document analysis for '{source}': {e}"
            ) from e

        return self.parse_analyze_result(analyze_result, source=source)

    def parse_analyze_result(
        self,
        analyze_result: Any,
        source: str,
    ) -> List[PageData]:
        """Parse raw Azure Document Intelligence AnalyzeResult into structured PageData.

        This method is decoupled from the network call to allow zero-cost unit testing.

        Args:
            analyze_result: AnalyzeResult object or compatible duck-typed object/dict.
            source: Source filename/identifier.

        Returns:
            List of structured PageData objects.
        """
        # Step 1: Extract all tables and group by 1-indexed page number
        tables_by_page: Dict[int, List[TableData]] = {}
        raw_tables = getattr(analyze_result, "tables", None) or []
        for idx, table in enumerate(raw_tables):
            table_page, table_data = self._parse_single_table(table, table_index=idx + 1)
            tables_by_page.setdefault(table_page, []).append(table_data)

        # Step 2: Parse pages
        pages: List[PageData] = []
        raw_pages = getattr(analyze_result, "pages", None) or []

        # If pages attribute is missing or empty, handle fallback
        if not raw_pages:
            logger.warning("No pages found in Document Intelligence result for '%s'", source)
            raw_content = getattr(analyze_result, "content", "") or ""
            pages.append(
                PageData(
                    page_number=1,
                    text=raw_content,
                    cleaned_text="",
                    tables=tables_by_page.get(1, []),
                    char_count=len(raw_content),
                    word_count=len(raw_content.split()),
                    source=source,
                    metadata={"is_empty": len(raw_content.strip()) == 0},
                )
            )
            return pages

        for page in raw_pages:
            page_num = getattr(page, "page_number", len(pages) + 1)

            # Reconstruct page text from lines
            page_lines = getattr(page, "lines", None) or []
            if page_lines:
                page_text = "\n".join(
                    getattr(line, "content", "") for line in page_lines if getattr(line, "content", None)
                )
            else:
                page_text = ""

            page_tables = tables_by_page.get(page_num, [])

            is_empty = len(page_text.strip()) == 0 and len(page_tables) == 0

            page_meta: Dict[str, Any] = {
                "is_empty": is_empty,
                "width": getattr(page, "width", None),
                "height": getattr(page, "height", None),
                "unit": getattr(page, "unit", None),
                "angle": getattr(page, "angle", None),
                "lines_count": len(page_lines),
            }

            pages.append(
                PageData(
                    page_number=page_num,
                    text=page_text,
                    cleaned_text="",  # Populated in preprocessing step
                    tables=page_tables,
                    char_count=len(page_text),
                    word_count=len(page_text.split()),
                    source=source,
                    metadata=page_meta,
                )
            )

        return pages

    def _parse_single_table(self, table: Any, table_index: int) -> tuple[int, TableData]:
        """Convert a single Document Intelligence table object into TableData.

        Args:
            table: DocumentTable instance.
            table_index: 1-based index of the table in document.

        Returns:
            Tuple of (page_number, TableData).
        """
        row_count = getattr(table, "row_count", 0)
        col_count = getattr(table, "column_count", 0)
        cells = getattr(table, "cells", None) or []

        # Determine target page from table bounding regions or first cell
        page_num = 1
        bounding_regions = getattr(table, "bounding_regions", None) or []
        if bounding_regions and hasattr(bounding_regions[0], "page_number"):
            page_num = bounding_regions[0].page_number
        elif cells:
            cell_regions = getattr(cells[0], "bounding_regions", None) or []
            if cell_regions and hasattr(cell_regions[0], "page_number"):
                page_num = cell_regions[0].page_number

        # Build 2D grid
        grid: List[List[str]] = [["" for _ in range(col_count)] for _ in range(row_count)]
        header_rows_indices: set[int] = set()

        for cell in cells:
            r = getattr(cell, "row_index", 0)
            c = getattr(cell, "column_index", 0)
            content = getattr(cell, "content", "") or ""
            kind = getattr(cell, "kind", None)

            if kind in ("columnHeader", "header"):
                header_rows_indices.add(r)

            if 0 <= r < row_count and 0 <= c < col_count:
                grid[r][c] = content.replace("\n", " ").strip()

        # Identify headers
        headers: List[str] = []
        rows: List[List[str]] = []

        if row_count > 0:
            if 0 in header_rows_indices or len(header_rows_indices) > 0:
                headers = [grid[0][c] for c in range(col_count)]
                rows = [grid[r] for r in range(1, row_count)]
            else:
                # Default first row as header if no explicit kind tags
                headers = [grid[0][c] for c in range(col_count)]
                rows = [grid[r] for r in range(1, row_count)]
        else:
            headers = []
            rows = []

        # Format markdown representation
        markdown_str = self._format_table_markdown(headers, rows)

        table_data = TableData(
            table_id=f"table_{page_num}_{table_index}",
            page_number=page_num,
            row_count=row_count,
            column_count=col_count,
            headers=headers,
            rows=rows,
            markdown=markdown_str,
        )

        return page_num, table_data

    @staticmethod
    def _format_table_markdown(headers: List[str], rows: List[List[str]]) -> str:
        """Render a 2D table matrix into clean GitHub-flavored markdown."""
        if not headers and not rows:
            return ""

        output_lines = []
        if headers:
            output_lines.append("| " + " | ".join(headers) + " |")
            output_lines.append("| " + " | ".join(["---"] * len(headers)) + " |")
        elif rows:
            col_count = len(rows[0])
            headers = [f"Col {i+1}" for i in range(col_count)]
            output_lines.append("| " + " | ".join(headers) + " |")
            output_lines.append("| " + " | ".join(["---"] * col_count) + " |")

        for row in rows:
            output_lines.append("| " + " | ".join(row) + " |")

        return "\n".join(output_lines)
