"""Chunking strategies and section-aware splitting for educational documents.

Preserves semantic hierarchy: Document -> Page -> Section -> Paragraph -> Chunk,
ensuring equations, tables, lists, and concept boundaries remain intact.
"""

import os
import re
from dataclasses import dataclass
from typing import List, Optional, Tuple

try:
    import tiktoken

    _TIKTOKEN_AVAILABLE = True
except ImportError:
    _TIKTOKEN_AVAILABLE = False


@dataclass
class ChunkConfig:
    """Configuration parameters for semantic chunking."""

    chunk_size: int = 500  # Target max tokens per chunk
    chunk_overlap: int = 50  # Overlap tokens between adjacent chunks
    min_chunk_size: int = 40  # Minimum tokens to form a standalone chunk
    encoding_name: str = "cl100k_base"

    @classmethod
    def from_env(cls) -> "ChunkConfig":
        """Load chunk configuration from environment variables with safe defaults."""
        return cls(
            chunk_size=int(os.getenv("CHUNK_SIZE", "500")),
            chunk_overlap=int(os.getenv("CHUNK_OVERLAP", "50")),
            min_chunk_size=int(os.getenv("MIN_CHUNK_SIZE", "40")),
        )


class TokenCounter:
    """Utility for counting tokens accurately using tiktoken with whitespace fallback."""

    def __init__(self, encoding_name: str = "cl100k_base") -> None:
        self.encoding_name = encoding_name
        self._tokenizer = None
        if _TIKTOKEN_AVAILABLE:
            try:
                self._tokenizer = tiktoken.get_encoding(encoding_name)
            except Exception:
                self._tokenizer = None

    def count(self, text: str) -> int:
        """Count tokens in text."""
        if not text:
            return 0
        if self._tokenizer:
            return len(self._tokenizer.encode(text))
        # Fallback: estimate 1 token ≈ 0.75 words (or ~4 chars in English)
        words = len(text.split())
        return max(1, int(words * 1.33))


class SectionDetector:
    """Detects headings, numbered topics, and section titles in educational content."""

    # Matches numbered sections (e.g., "1. Introduction", "2.1 Transmission Media", "Module 01:")
    _NUMBERED_SECTION_REGEX = re.compile(
        r"^(?:(?:[0-9]{1,2}(?:\.[0-9]{1,2})*|\bModule\s+[0-9]+)\.?\s+[A-Z][A-Za-z0-9\s,\-–—/&]{2,80})$",
        re.MULTILINE,
    )

    # Matches Markdown headings (# Heading, ## Heading)
    _MARKDOWN_HEADING_REGEX = re.compile(
        r"^(#{1,4})\s+(.+)$",
        re.MULTILINE,
    )

    @classmethod
    def find_sections(cls, text: str) -> List[Tuple[Optional[str], str]]:
        """Split text into (section_title, section_body) segments based on headings.

        Args:
            text: Input page or document text.

        Returns:
            List of tuples where each tuple is (section_title, text_block).
        """
        if not text or not text.strip():
            return []

        lines = text.split("\n")
        sections: List[Tuple[Optional[str], List[str]]] = []
        current_title: Optional[str] = None
        current_lines: List[str] = []

        for line in lines:
            stripped = line.strip()
            if not stripped:
                current_lines.append(line)
                continue

            # Check if line matches section heading
            is_heading = False
            heading_title = None

            md_match = cls._MARKDOWN_HEADING_REGEX.match(stripped)
            if md_match:
                is_heading = True
                heading_title = md_match.group(2).strip()
            elif cls._NUMBERED_SECTION_REGEX.match(stripped) and len(stripped.split()) <= 10:
                is_heading = True
                heading_title = stripped

            if is_heading:
                # Flush existing buffer if it has content
                if any(l.strip() for l in current_lines):
                    sections.append((current_title, current_lines))
                    current_lines = []
                current_title = heading_title
                # Include the heading line at the top of the section text for context
                current_lines.append(line)
            else:
                current_lines.append(line)

        if any(l.strip() for l in current_lines):
            sections.append((current_title, current_lines))

        # Flatten lines into strings
        return [(title, "\n".join(sec_lines).strip()) for title, sec_lines in sections]


class SemanticSplitter:
    """Splits section blocks into token-budgeted chunks with intelligent paragraph boundaries."""

    def __init__(self, config: Optional[ChunkConfig] = None) -> None:
        self.config = config or ChunkConfig()
        self.token_counter = TokenCounter(self.config.encoding_name)

    def split_text(self, text: str, section_title: Optional[str] = None) -> List[Tuple[str, Optional[str]]]:
        """Split text into chunks that fit within chunk_size while respecting paragraphs.

        Args:
            text: Text to split.
            section_title: Optional section label associated with this block.

        Returns:
            List of (chunk_text, section_title).
        """
        if not text or not text.strip():
            return []

        total_tokens = self.token_counter.count(text)
        if total_tokens <= self.config.chunk_size:
            return [(text.strip(), section_title)]

        # Split into paragraphs
        paragraphs = re.split(r"\n\s*\n", text)
        paragraphs = [p.strip() for p in paragraphs if p.strip()]

        chunks: List[Tuple[str, Optional[str]]] = []
        current_parts: List[str] = []
        current_tokens = 0

        for para in paragraphs:
            para_tokens = self.token_counter.count(para)

            # If a single paragraph is larger than chunk_size, split by sentences
            if para_tokens > self.config.chunk_size:
                # Flush pending buffer first
                if current_parts:
                    chunk_text = "\n\n".join(current_parts).strip()
                    chunks.append((chunk_text, section_title))
                    current_parts = []
                    current_tokens = 0

                sub_chunks = self._split_large_paragraph(para)
                for sc in sub_chunks:
                    chunks.append((sc, section_title))
                continue

            if current_tokens + para_tokens > self.config.chunk_size:
                # Buffer full: emit chunk
                chunk_text = "\n\n".join(current_parts).strip()
                chunks.append((chunk_text, section_title))

                # Handle overlap: retain last paragraph if its tokens fit in overlap budget
                overlap_parts: List[str] = []
                overlap_tokens = 0
                for prev in reversed(current_parts):
                    p_tok = self.token_counter.count(prev)
                    if overlap_tokens + p_tok <= self.config.chunk_overlap:
                        overlap_parts.insert(0, prev)
                        overlap_tokens += p_tok
                    else:
                        break

                current_parts = overlap_parts + [para]
                current_tokens = sum(self.token_counter.count(p) for p in current_parts)
            else:
                current_parts.append(para)
                current_tokens += para_tokens

        if current_parts:
            chunk_text = "\n\n".join(current_parts).strip()
            if self.token_counter.count(chunk_text) >= self.config.min_chunk_size or not chunks:
                chunks.append((chunk_text, section_title))
            elif chunks:
                # Merge small trailing fragment with previous chunk if budget allows
                prev_text, prev_sec = chunks[-1]
                combined = prev_text + "\n\n" + chunk_text
                if self.token_counter.count(combined) <= int(self.config.chunk_size * 1.25):
                    chunks[-1] = (combined, prev_sec)
                else:
                    chunks.append((chunk_text, section_title))

        return chunks

    def _split_large_paragraph(self, paragraph: str) -> List[str]:
        """Split an oversized paragraph on sentence boundaries with word-level fallback."""
        sentences = re.split(r"(?<=[.!?])\s+", paragraph)
        chunks: List[str] = []
        current: List[str] = []
        current_tokens = 0

        for sent in sentences:
            s_tok = self.token_counter.count(sent)

            # If an individual sentence itself exceeds chunk_size, split it by words
            if s_tok > self.config.chunk_size:
                if current:
                    chunks.append(" ".join(current).strip())
                    current = []
                    current_tokens = 0

                words = sent.split()
                w_current: List[str] = []
                w_tokens = 0
                for w in words:
                    wt = self.token_counter.count(w)
                    if w_tokens + wt > self.config.chunk_size and w_current:
                        chunks.append(" ".join(w_current).strip())
                        w_current = [w]
                        w_tokens = wt
                    else:
                        w_current.append(w)
                        w_tokens += wt
                if w_current:
                    chunks.append(" ".join(w_current).strip())
                continue

            if current_tokens + s_tok > self.config.chunk_size:
                if current:
                    chunks.append(" ".join(current).strip())
                current = [sent]
                current_tokens = s_tok
            else:
                current.append(sent)
                current_tokens += s_tok

        if current:
            chunks.append(" ".join(current).strip())

        return chunks
