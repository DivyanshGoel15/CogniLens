"""Query preprocessor and rewriter for the RAG retrieval pipeline.

Provides fast, deterministic query cleaning, technical acronym expansion,
stopword-aware keyword extraction, and query decomposition without expensive LLM calls.
"""

import re
import unicodedata
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

# Domain-specific technical acronyms and concepts in networking and distributed systems
ACRONYM_EXPANSION_MAP: Dict[str, str] = {
    "TCP": "Transmission Control Protocol",
    "UDP": "User Datagram Protocol",
    "BDP": "Bandwidth-Delay Product",
    "RTT": "Round Trip Time",
    "AIMD": "Additive-Increase Multiplicative-Decrease",
    "SACK": "Selective Acknowledgments",
    "ACK": "Cumulative Acknowledgment",
    "MSS": "Maximum Segment Size",
    "PDU": "Protocol Data Unit",
    "BBR": "Bottleneck Bandwidth and RTT",
    "OSI": "Open Systems Interconnection",
    "HTTP": "Hypertext Transfer Protocol",
    "DNS": "Domain Name System",
    "BGP": "Border Gateway Protocol",
    "QUIC": "Quick UDP Internet Connections",
}

# Standard english stopwords to filter for keyword extraction
STOPWORDS = {
    "a", "an", "and", "are", "as", "at", "be", "by", "for", "from", "has", "he",
    "in", "is", "it", "its", "of", "on", "that", "the", "to", "was", "were",
    "will", "with", "what", "which", "who", "when", "where", "why", "how",
    "can", "could", "should", "would", "do", "does", "did", "explain", "describe",
    "tell", "me", "about", "show", "give", "list", "detail", "details", "please",
}


class RewrittenQuery(BaseModel):
    """Encapsulates processed and expanded query representations."""

    original_query: str = Field(description="Original verbatim query input")
    cleaned_query: str = Field(description="Normalized and sanitized query string")
    expanded_query: str = Field(description="Query with technical acronyms expanded")
    keywords: List[str] = Field(default_factory=list, description="Extracted high-signal keywords")
    sub_queries: List[str] = Field(default_factory=list, description="Decomposed sub-queries for multi-hop retrieval")
    filter_hints: Dict[str, Any] = Field(default_factory=dict, description="Inferred metadata filters like page or type")


class QueryRewriter:
    """Preprocesses and enhances user queries for optimal retrieval."""

    def __init__(self, acronym_map: Optional[Dict[str, str]] = None) -> None:
        """Initialize QueryRewriter.

        Args:
            acronym_map: Optional custom dictionary mapping acronyms to expansions.
        """
        self.acronym_map = acronym_map or ACRONYM_EXPANSION_MAP

    def clean(self, query: str) -> str:
        """Normalize unicode, strip unwanted special characters, collapse whitespace."""
        if not query:
            return ""
        # Unicode normalization (NFKC)
        normalized = unicodedata.normalize("NFKC", query)
        # Replace zero-width spaces and line breaks with space to prevent word joining
        normalized = re.sub(r"[\u200b\u200c\u200d\ufeff\r\n\t]+", " ", normalized)
        # Remove remaining non-printable control characters
        cleaned = "".join(ch for ch in normalized if unicodedata.category(ch)[0] != "C")
        # Collapse whitespace
        cleaned = re.sub(r"\s+", " ", cleaned).strip()
        return cleaned

    def extract_keywords(self, query: str) -> List[str]:
        """Extract high-information technical terms and keywords from query."""
        cleaned = self.clean(query)
        # Tokenize by non-alphanumeric (allowing hyphens in compound words like "packet-switched")
        tokens = re.findall(r"\b[a-zA-Z0-9_\-\.\/]+\b", cleaned)
        keywords: List[str] = []
        for t in tokens:
            lower = t.lower()
            if lower not in STOPWORDS and len(lower) > 1:
                # Keep original case or clean form
                if t not in keywords:
                    keywords.append(t)
        return keywords

    def expand_acronyms(self, query: str) -> str:
        """Expand recognized technical acronyms while retaining the original acronym."""
        cleaned = self.clean(query)
        words = re.findall(r"\b[A-Za-z0-9]+\b|\S", cleaned)
        expanded_parts: List[str] = []

        for word in words:
            upper = word.upper()
            if upper in self.acronym_map:
                expansion = self.acronym_map[upper]
                # Include both the original acronym and its definition
                if upper in word:
                    expanded_parts.append(f"{word} ({expansion})")
                else:
                    expanded_parts.append(f"{word}")
            else:
                expanded_parts.append(word)

        # Clean joined spacing
        result = " ".join(expanded_parts)
        result = re.sub(r"\s+([,\.\?\!])", r"\1", result)
        result = re.sub(r"\s+", " ", result).strip()
        return result

    def detect_filter_hints(self, query: str) -> Dict[str, Any]:
        """Infer potential metadata search filters (e.g., page number, tables) from natural language."""
        hints: Dict[str, Any] = {}
        cleaned = self.clean(query).lower()

        # Detect page number references (e.g. "on page 2", "page 1", "p. 2", "pg 2")
        page_match = re.search(r"\b(?:page|pg|p\.)\s*(\d+)\b", cleaned)
        if page_match:
            hints["page_number"] = int(page_match.group(1))

        # Detect table requests (e.g. "table", "tabular", "matrix", "column", "pdu table")
        if any(term in cleaned for term in ["table", "tabular", "matrix", "pdu table"]):
            hints["table_intent"] = True

        return hints

    def decompose(self, query: str) -> List[str]:
        """Decompose compound/comparative questions into individual aspects."""
        cleaned = self.clean(query)
        sub_queries: List[str] = []

        # Check for contrast / comparison patterns
        contrast_match = re.search(
            r"(?:contrast|compare|difference between|versus|vs\.?)\s+(.*?)\s+(?:and|with|to|vs\.?)\s+(.*)",
            cleaned,
            re.IGNORECASE,
        )
        if contrast_match:
            part1 = contrast_match.group(1).strip()
            part2 = contrast_match.group(2).strip()
            # Clean up trailing punctuation
            part1 = re.sub(r"[\?\.\,]+$", "", part1)
            part2 = re.sub(r"[\?\.\,]+$", "", part2)
            if part1 and part2:
                sub_queries.append(f"Details and characteristics of {part1}")
                sub_queries.append(f"Details and characteristics of {part2}")

        # Check for multi-clause conjunctions with "also" or "and what is"
        conjunction_split = re.split(r";\s*|\b(?:and also|and what is|and how does)\b", cleaned, flags=re.IGNORECASE)
        if len(conjunction_split) > 1:
            for part in conjunction_split:
                p = part.strip()
                if len(p) > 10 and p not in sub_queries:
                    sub_queries.append(p)

        return sub_queries

    def rewrite(self, query: str) -> RewrittenQuery:
        """Execute full preprocessing, expansion, and decomposition pipeline.

        Args:
            query: Raw user query.

        Returns:
            RewrittenQuery instance with all enriched forms.
        """
        cleaned = self.clean(query)
        expanded = self.expand_acronyms(cleaned)
        keywords = self.extract_keywords(cleaned)
        sub_queries = self.decompose(cleaned)
        filter_hints = self.detect_filter_hints(cleaned)

        return RewrittenQuery(
            original_query=query,
            cleaned_query=cleaned,
            expanded_query=expanded,
            keywords=keywords,
            sub_queries=sub_queries,
            filter_hints=filter_hints,
        )
