"""Grounding and context factual completeness evaluation.

Verifies that context constructed by the RAG pipeline contains the essential
academic facts, terms, and formulas needed for accurate downstream LLM answers.
"""

import json
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

from rag.retrieval.context_builder import ContextBuilder
from rag.retrieval.query_rewriter import QueryRewriter
from rag.retrieval.reranker import HeuristicReranker
from rag.search.retriever import Retriever

logger = logging.getLogger(__name__)


class GroundingFactCheck(BaseModel):
    """Fact verification record for a single evaluation query."""

    query_id: str
    query: str
    expected_facts: List[str]
    matched_facts: List[str]
    missing_facts: List[str]
    grounding_score: float = Field(description="Fraction of expected facts present in built context")
    citations_count: int
    context_token_count: int


class GroundingEvaluationSummary(BaseModel):
    """Overall summary of factual context coverage."""

    total_queries: int
    avg_grounding_score: float
    total_expected_facts: int
    total_matched_facts: int
    detailed_checks: List[GroundingFactCheck]


class ContextGroundingEvaluator:
    """Evaluates whether retrieved and built context contains all required source facts."""

    def __init__(
        self,
        retriever: Optional[Retriever] = None,
        rewriter: Optional[QueryRewriter] = None,
        reranker: Optional[HeuristicReranker] = None,
        context_builder: Optional[ContextBuilder] = None,
        dataset_path: Optional[Path] = None,
    ) -> None:
        """Initialize ContextGroundingEvaluator."""
        self.retriever = retriever or Retriever()
        self.rewriter = rewriter or QueryRewriter()
        self.reranker = reranker or HeuristicReranker()
        self.builder = context_builder or ContextBuilder()

        default_dataset = Path(__file__).resolve().parent / "dataset.json"
        self.dataset_path = dataset_path or default_dataset

    def load_dataset(self) -> List[Dict[str, Any]]:
        """Load benchmark dataset."""
        with open(self.dataset_path, "r", encoding="utf-8") as f:
            return json.load(f)

    def evaluate_grounding(
        self,
        top_k: int = 3,
    ) -> GroundingEvaluationSummary:
        """Run factual grounding check across benchmark dataset."""
        dataset = self.load_dataset()
        checks: List[GroundingFactCheck] = []

        total_facts = 0
        matched_facts_count = 0

        for item in dataset:
            query = item["query"]
            expected_facts = item.get("key_facts", [])
            total_facts += len(expected_facts)

            # Retrieve, rerank, and build context
            rewritten = self.rewriter.rewrite(query)
            raw_results = self.retriever.retrieve(
                query=rewritten.expanded_query,
                top_k=top_k + 2,
                mode="hybrid",
            )
            reranked = self.reranker.rerank(query, raw_results, top_k=top_k)
            context_result = self.builder.build_context(reranked)

            context_lower = context_result.formatted_context.lower()

            matched: List[str] = []
            missing: List[str] = []

            for fact in expected_facts:
                if fact.lower() in context_lower:
                    matched.append(fact)
                else:
                    missing.append(fact)

            matched_facts_count += len(matched)
            score = len(matched) / len(expected_facts) if expected_facts else 1.0

            checks.append(
                GroundingFactCheck(
                    query_id=item.get("id", ""),
                    query=query,
                    expected_facts=expected_facts,
                    matched_facts=matched,
                    missing_facts=missing,
                    grounding_score=round(score, 4),
                    citations_count=len(context_result.citations),
                    context_token_count=context_result.total_tokens,
                )
            )

        avg_score = matched_facts_count / total_facts if total_facts > 0 else 0.0

        return GroundingEvaluationSummary(
            total_queries=len(dataset),
            avg_grounding_score=round(avg_score, 4),
            total_expected_facts=total_facts,
            total_matched_facts=matched_facts_count,
            detailed_checks=checks,
        )
