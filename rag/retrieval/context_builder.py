"""Context construction and source citation builder for the RAG pipeline.

Deduplicates retrieved chunks, enforces configurable token budgets, and formats
evidence into structured, verifiable context blocks with exact page and section citations
ready for downstream LLMs and tutor agents.
"""

import logging
from typing import Dict, List, Optional
from pydantic import BaseModel, Field

from rag.search.retriever import SearchResult

logger = logging.getLogger(__name__)

try:
    import tiktoken
    _TIKTOKEN_AVAILABLE = True
except ImportError:
    _TIKTOKEN_AVAILABLE = False


class SourceCitation(BaseModel):
    """First-class source attribution attached to an evidence passage."""

    citation_id: str = Field(description="Unique reference tag e.g. '[Source 1]'")
    document_name: str = Field(description="Source filename (e.g. sample.pdf)")
    page_number: int = Field(description="1-based page number where evidence originates")
    section: Optional[str] = Field(default=None, description="Section heading or topic context")
    chunk_id: str = Field(description="Original unique chunk ID")
    blob_url: Optional[str] = Field(default=None, description="Direct URL to Azure Blob Storage reference")
    content_type: str = Field(default="text", description="Type of content: 'text' or 'table'")
    score: float = Field(default=0.0, description="Relevance score from retrieval or reranking")
    excerpt: str = Field(description="Brief text excerpt for UI preview or citation tooltip")


class ContextBuildResult(BaseModel):
    """Structured result of context assembly."""

    formatted_context: str = Field(description="Structured markdown string for LLM system/user prompts")
    citations: List[SourceCitation] = Field(default_factory=list, description="List of source citations")
    citation_map: Dict[str, SourceCitation] = Field(default_factory=dict, description="Lookup map from citation_id to citation")
    total_tokens: int = Field(default=0, description="Estimated token count of the formatted context")
    chunk_count: int = Field(default=0, description="Number of unique chunks included within token budget")
    included_chunk_ids: List[str] = Field(default_factory=list, description="IDs of chunks included in context")


class ContextBuilder:
    """Constructs grounded, budget-aware context blocks with source citations."""

    def __init__(
        self,
        max_tokens: int = 2000,
        tokenizer_model: str = "cl100k_base",
        deduplicate: bool = True,
    ) -> None:
        """Initialize ContextBuilder.

        Args:
            max_tokens: Maximum token budget for the assembled context (default: 2000).
            tokenizer_model: Tiktoken encoding name (default: 'cl100k_base').
            deduplicate: If True, filters out duplicate chunks by chunk_id or text.
        """
        self.max_tokens = max_tokens
        self.tokenizer_model = tokenizer_model
        self.deduplicate = deduplicate

        self._encoder = None
        if _TIKTOKEN_AVAILABLE:
            try:
                self._encoder = tiktoken.get_encoding(self.tokenizer_model)
            except Exception as e:
                logger.warning("Could not initialize tiktoken encoder: %s. Using heuristic fallback.", e)

    def count_tokens(self, text: str) -> int:
        """Estimate token count for a text string."""
        if not text:
            return 0
        if self._encoder is not None:
            return len(self._encoder.encode(text))
        # Fallback heuristic: ~4 characters per token
        return max(1, len(text) // 4)

    def build_context(
        self,
        results: List[SearchResult],
        max_tokens: Optional[int] = None,
    ) -> ContextBuildResult:
        """Assemble retrieved search results into a clean, cited context block.

        Args:
            results: List of SearchResult candidates from retriever or reranker.
            max_tokens: Optional override for token budget.

        Returns:
            ContextBuildResult containing the formatted context and citation metadata.
        """
        if not results:
            return ContextBuildResult(
                formatted_context="",
                citations=[],
                citation_map={},
                total_tokens=0,
                chunk_count=0,
                included_chunk_ids=[],
            )

        budget = max_tokens if max_tokens is not None else self.max_tokens

        # Step 1: Deduplicate while preserving relevance order
        unique_results: List[SearchResult] = []
        seen_ids = set()
        seen_texts = set()

        for res in results:
            if self.deduplicate:
                if res.chunk_id in seen_ids:
                    continue
                # Also deduplicate identical text bodies
                norm_text = res.text.strip().lower()
                if norm_text in seen_texts:
                    continue
                seen_ids.add(res.chunk_id)
                seen_texts.add(norm_text)

            unique_results.append(res)

        # Step 2: Assemble context blocks within token budget
        context_blocks: List[str] = []
        citations: List[SourceCitation] = []
        citation_map: Dict[str, SourceCitation] = {}
        included_chunk_ids: List[str] = []
        accumulated_tokens = 0

        for idx, res in enumerate(unique_results, start=1):
            citation_tag = f"[Source {idx}]"
            section_label = res.section if res.section else "[General]"
            
            # Format block
            block_lines = [
                f"{citation_tag}",
                f"Document: {res.filename}",
                f"Page: {res.page_number}",
                f"Section: {section_label}",
                "Content:",
                res.text.strip(),
            ]
            block_text = "\n".join(block_lines)
            block_tokens = self.count_tokens(block_text) + 2  # spacing separator overhead

            if accumulated_tokens + block_tokens > budget and context_blocks:
                logger.info(
                    "Token budget reached (%d / %d tokens). Truncating at %d chunks.",
                    accumulated_tokens,
                    budget,
                    len(context_blocks),
                )
                break

            context_blocks.append(block_text)
            accumulated_tokens += block_tokens
            included_chunk_ids.append(res.chunk_id)

            # Generate excerpt (first 120 chars)
            excerpt = res.text.strip().replace("\n", " ")
            if len(excerpt) > 120:
                excerpt = excerpt[:117] + "..."

            citation = SourceCitation(
                citation_id=citation_tag,
                document_name=res.filename,
                page_number=res.page_number,
                section=res.section,
                chunk_id=res.chunk_id,
                blob_url=res.blob_url,
                content_type=res.content_type,
                score=res.score,
                excerpt=excerpt,
            )
            citations.append(citation)
            citation_map[citation_tag] = citation

        final_context = "\n\n---\n\n".join(context_blocks)
        total_tokens = self.count_tokens(final_context)

        return ContextBuildResult(
            formatted_context=final_context,
            citations=citations,
            citation_map=citation_map,
            total_tokens=total_tokens,
            chunk_count=len(context_blocks),
            included_chunk_ids=included_chunk_ids,
        )
