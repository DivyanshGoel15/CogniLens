"""Text cleaner for educational document content.

Removes extraction artifacts and cleans non-printable characters while strictly
preserving technical notations, equations, symbols, and paragraph structure.
"""

import re
from typing import Optional


class TextCleaner:
    """Cleans raw text extracted from documents without destroying semantic or technical content."""

    # Zero-width spaces, soft hyphens, and replacement characters commonly produced by OCR
    _EXTRACTION_ARTIFACTS = re.compile(r"[\u200B-\u200D\uFEFF\u00AD\uFFFD]")

    # Non-printable control characters, preserving standard whitespace (\t, \n, \r)
    _CONTROL_CHARS = re.compile(r"[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]")

    # Trailing/leading whitespace on each individual line
    _LINE_WHITESPACE = re.compile(r"[ \t]+$", re.MULTILINE)

    def __init__(self, remove_page_numbers_in_body: bool = False) -> None:
        """Initialize TextCleaner.

        Args:
            remove_page_numbers_in_body: Whether to strip standalone page numbers inside body text.
        """
        self.remove_page_numbers_in_body = remove_page_numbers_in_body

    def clean(self, text: Optional[str]) -> str:
        """Clean raw extracted text.

        Args:
            text: Raw input text from PDF / OCR extraction.

        Returns:
            Cleaned text with preserved formatting, math, and code structures.
        """
        if not text:
            return ""

        # Step 1: Remove extraction artifacts (replacement chars, zero-width spaces, soft hyphens)
        cleaned = self._EXTRACTION_ARTIFACTS.sub("", text)

        # Step 2: Remove control characters while preserving \n, \r, \t
        cleaned = self._CONTROL_CHARS.sub("", cleaned)

        # Step 3: Standardize carriage returns to standard newlines
        cleaned = cleaned.replace("\r\n", "\n").replace("\r", "\n")

        # Step 4: Strip trailing horizontal whitespace from each line
        cleaned = self._LINE_WHITESPACE.sub("", cleaned)

        # Step 5: Strip standalone page footer numbers if configured (e.g. "\n  12  \n")
        if self.remove_page_numbers_in_body:
            cleaned = re.sub(r"^\s*\d{1,4}\s*$", "", cleaned, flags=re.MULTILINE)

        # Return stripped result
        return cleaned.strip()
