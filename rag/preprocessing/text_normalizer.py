"""Text normalizer for educational document content.

Normalizes whitespace, unicode forms, and line breaks while preserving
equations, technical notation, lists, and semantic paragraph breaks.
"""

import re
import unicodedata
from typing import Optional


class TextNormalizer:
    """Normalizes cleaned text into a consistent format suitable for chunking and retrieval."""

    # De-hyphenation: letters followed by hyphen, newline, and letters (e.g. "distri-\nbuted" -> "distributed")
    _DEHYPHENATION_REGEX = re.compile(r"([a-zA-Z]{2,})-\n([a-zA-Z]{2,})")

    # Horizontal whitespace (multiple spaces/tabs reduced to single space, except indentation)
    _EXCESS_HORIZONTAL_SPACES = re.compile(r"[^\S\r\n]+")

    # Excessive blank lines: 3 or more newlines collapsed into 2 (preserving standard paragraph break)
    _EXCESS_BLANK_LINES = re.compile(r"\n{3,}")

    def __init__(self, fix_hyphenation: bool = True) -> None:
        """Initialize TextNormalizer.

        Args:
            fix_hyphenation: Whether to reconnect hyphenated words split across lines.
        """
        self.fix_hyphenation = fix_hyphenation

    def normalize(self, text: Optional[str]) -> str:
        """Normalize text representation.

        Args:
            text: Text to normalize (typically output of TextCleaner).

        Returns:
            Normalized string.
        """
        if not text:
            return ""

        # Step 1: Unicode normalization (NFKC ensures standard characters, decomposing compatibility forms)
        normalized = unicodedata.normalize("NFKC", text)

        # Step 2: Fix hyphenated word breaks split across line boundaries
        if self.fix_hyphenation:
            normalized = self._DEHYPHENATION_REGEX.sub(r"\1\2", normalized)

        # Step 3: Normalize excessive horizontal whitespace per line without flattening newlines
        lines = normalized.split("\n")
        processed_lines = []
        for line in lines:
            # Preserve leading indentation if it's code/list, but collapse multiple internal spaces
            stripped_line = line.strip()
            if not stripped_line:
                processed_lines.append("")
            else:
                # Keep indentation up to 4 spaces if present
                leading_spaces = len(line) - len(line.lstrip(" "))
                indent = " " * min(leading_spaces, 4) if leading_spaces > 1 else ""
                collapsed = self._EXCESS_HORIZONTAL_SPACES.sub(" ", stripped_line)
                processed_lines.append(f"{indent}{collapsed}")

        normalized = "\n".join(processed_lines)

        # Step 4: Collapse 3 or more consecutive newlines into 2 (standard paragraph break)
        normalized = self._EXCESS_BLANK_LINES.sub("\n\n", normalized)

        return normalized.strip()
