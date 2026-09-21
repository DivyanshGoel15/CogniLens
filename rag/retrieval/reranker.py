"""Reranking subsystem for retrieved search results.

Provides scoring adjustments based on exact phrase matches, section relevance,
content-type matching (tables/text), and domain heuristics to enhance Top-K precision.
"""

import abc
import re
from typing import List, Optional
from pydantic import BaseModel, Field

from rag.search.retriever import SearchResult


class RerankedResult(BaseModel):
    """Encapsulates a search result with its original and reranked scores."""

    result: SearchResult = Field(description="Underlying search result")
    original_score: float = Field(description="Initial retrieval score from search index")
    reranked_score: float = Field(description="Final score computed by reranker")
    boost_factors: List[str] = Field(default_factory=list, description="Explanations of applied score boosts")


class BaseReranker(abc.ABC):
    """Abstract base class for all RAG rerankers."""

    @abc.abstractmethod
    def rerank(
        self,
        query: str,
        results: List[SearchResult],
        top_k: Optional[int] = None,
    ) -> List[SearchResult]:
        """Rerank search results and return top_k candidates."""
        pass


class HeuristicReranker(BaseReranker):
    """High-precision, deterministic heuristic reranker tailored for technical courseware."""

    def __init__(
        self,
        phrase_match_weight: float = 0.35,
        section_match_weight: float = 0.25,
        keyword_overlap_weight: float = 0.30,
        table_intent_weight: float = 0.20,
        formula_intent_weight: float = 0.20,
        page_intent_weight: float = 0.30,
    ) -> None:
        """Initialize HeuristicReranker with tunable heuristic weights."""
        self.phrase_match_weight = phrase_match_weight
        self.section_match_weight = section_match_weight
        self.keyword_overlap_weight = keyword_overlap_weight
        self.table_intent_weight = table_intent_weight
        self.formula_intent_weight = formula_intent_weight
        self.page_intent_weight = page_intent_weight

    def rerank(
        self,
        query: str,
        results: List[SearchResult],
        top_k: Optional[int] = None,
    ) -> List[SearchResult]:
        """Rerank search results according to semantic and structural heuristic signals.

        Args:
            query: The user search query.
            results: Initial SearchResult items from Retriever.
            top_k: Optional number of results to return.

        Returns:
            Re-ordered list of SearchResult items with updated .score values.
        """
        if not results or not query:
            return results

        q_lower = query.lower().strip()
        q_tokens = set(re.findall(r"\b[a-zA-Z0-9_\-]+\b", q_lower))
        stopwords = {
            "a", "an", "and", "are", "as", "at", "be", "by", "for", "from", "has", "he",
            "in", "is", "it", "its", "of", "on", "that", "the", "to", "was", "were",
            "will", "with", "what", "which", "who", "when", "where", "why", "how",
        }
        content_tokens = q_tokens - stopwords

        # Check for specific intents in the query
        has_table_intent = any(term in q_lower for term in ["table", "columns", "pdu", "matrix", "protocol stack"])
        has_formula_intent = any(term in q_lower for term in ["formula", "equation", "calculate", "bdp", "mathis", "throughput"])
        
        # Check for explicit page request
        page_match = re.search(r"\b(?:page|pg|p\.)\s*(\d+)\b", q_lower)
        target_page = int(page_match.group(1)) if page_match else None

        # Max score for normalization
        max_orig = max(r.score for r in results) if results else 1.0
        if max_orig <= 0.0:
            max_orig = 1.0

        reranked_items: List[RerankedResult] = []

        for item in results:
            # Normalize initial retrieval score to [0, 1]
            base_score = item.score / max_orig
            boost = 0.0
            boost_factors: List[str] = []

            text_lower = item.text.lower()
            section_lower = (item.section or "").lower()
            combined_text = f"{section_lower}\n{text_lower}"

            # 1. Exact phrase matching (bigrams / multi-word sub-phrases) across combined text
            words = q_lower.split()
            if len(words) >= 2:
                for i in range(len(words) - 1):
                    bigram = f"{words[i]} {words[i+1]}"
                    if len(bigram) > 5 and bigram in combined_text:
                        boost += self.phrase_match_weight * 0.5
                        boost_factors.append(f"exact_phrase('{bigram}')")
            if len(q_lower) > 8 and q_lower in combined_text:
                boost += self.phrase_match_weight
                boost_factors.append("full_query_match")

            # 2. Section heading alignment
            if item.section:
                sec_tokens = set(re.findall(r"\b[a-zA-Z0-9_\-]+\b", section_lower))
                sec_overlap = content_tokens.intersection(sec_tokens)
                if sec_overlap:
                    fraction = len(sec_overlap) / max(len(content_tokens), 1)
                    boost += self.section_match_weight * fraction
                    boost_factors.append(f"section_match({list(sec_overlap)})")

            # 3. Keyword overlap across text & section
            if content_tokens:
                matched_keywords = [kw for kw in content_tokens if kw in combined_text]
                if matched_keywords:
                    kw_fraction = len(matched_keywords) / len(content_tokens)
                    boost += self.keyword_overlap_weight * kw_fraction
                    boost_factors.append(f"keyword_overlap({matched_keywords})")

            # 4. Table intent match
            if has_table_intent and (item.content_type == "table" or item.table_present):
                boost += self.table_intent_weight
                boost_factors.append("table_intent_match")

            # 5. Formula / Math equation intent match
            if has_formula_intent:
                if any(sym in item.text for sym in ["=", "≤", "×", "BDP", "Mathis", "Throughput"]):
                    boost += self.formula_intent_weight
                    boost_factors.append("formula_intent_match")

            # 6. Page target alignment
            if target_page is not None:
                if item.page_number == target_page:
                    boost += self.page_intent_weight
                    boost_factors.append(f"page_target_match({target_page})")
                else:
                    boost -= (self.page_intent_weight * 0.5)

            final_score = base_score + boost
            reranked_items.append(
                RerankedResult(
                    result=item,
                    original_score=item.score,
                    reranked_score=final_score,
                    boost_factors=boost_factors,
                )
            )

        # Sort descending by reranked score
        reranked_items.sort(key=lambda x: x.reranked_score, reverse=True)

        # Construct updated SearchResult items
        output: List[SearchResult] = []
        limit = top_k if top_k is not None else len(results)

        for rr in reranked_items[:limit]:
            # Create updated SearchResult with reranked score
            updated_item = rr.result.model_copy()
            updated_item.score = round(rr.reranked_score, 4)
            output.append(updated_item)

        return output
