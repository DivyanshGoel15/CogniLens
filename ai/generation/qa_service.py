"""Grounded Question-Answering Service.

Orchestrates RAG context retrieval and LLM response generation with strict
academic grounding guardrails and source citation tracking.
"""

import time
import logging
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

from ai.llm.base_provider import BaseLLMProvider
from ai.llm.llm_service import get_llm_provider
from ai.prompts.prompt_manager import DEFAULT_SYSTEM_INSTRUCTION, build_grounded_qa_prompt
from server.app.services.rag_service import RAGService

logger = logging.getLogger(__name__)


class GroundedQAResponse(BaseModel):
    """Response model for grounded Q&A with citations and retrieval metadata."""
    answer: str = Field(..., description="Grounded answer text with inline citation tags")
    citations: List[Dict[str, Any]] = Field(default_factory=list, description="List of source citations")
    query: str = Field(..., description="The original query")
    chunks_used: int = Field(0, description="Number of evidence chunks included in context")
    latency_ms: float = Field(0.0, description="Total generation latency in milliseconds")
    provider: str = Field("unknown", description="LLM provider used")


class GroundedQAService:
    """Service handling grounded conversational question answering."""

    def __init__(
        self,
        llm_provider: Optional[BaseLLMProvider] = None,
        rag_service: Optional[RAGService] = None,
    ) -> None:
        """Initialize GroundedQAService with LLM provider and RAG service."""
        self.llm_provider = llm_provider or get_llm_provider()
        self.rag_service = rag_service or RAGService()

    def answer_question(
        self,
        query: str,
        conversation_history: Optional[List[Dict[str, str]]] = None,
        top_k: int = 4,
        retrieval_mode: str = "hybrid",
        rerank: bool = True,
        temperature: float = 0.2,
    ) -> GroundedQAResponse:
        """Retrieve grounded context and generate answer.

        Args:
            query: User question.
            conversation_history: Optional previous chat turns.
            top_k: Number of chunks to retrieve.
            retrieval_mode: 'hybrid', 'vector', or 'keyword'.
            rerank: Whether to apply heuristic reranker.
            temperature: LLM sampling temperature.

        Returns:
            GroundedQAResponse with answer, citations, and metrics.
        """
        start_time = time.time()

        # 1. Retrieve grounded context from verified RAG pipeline
        context_result = self.rag_service.get_grounded_context(
            query=query,
            top_k=top_k,
            mode=retrieval_mode,
            rerank=rerank,
        )

        formatted_context = context_result.formatted_context
        citations = [cit.model_dump() for cit in context_result.citations]

        # 2. Build grounded prompt with guardrails
        prompt = build_grounded_qa_prompt(
            query=query,
            context=formatted_context,
            conversation_history=conversation_history,
        )

        # 3. Generate response using LLM provider
        answer = self.llm_provider.generate(
            prompt=prompt,
            system_instruction=DEFAULT_SYSTEM_INSTRUCTION,
            temperature=temperature,
        )

        latency_ms = (time.time() - start_time) * 1000.0

        return GroundedQAResponse(
            answer=answer,
            citations=citations,
            query=query,
            chunks_used=context_result.chunk_count,
            latency_ms=round(latency_ms, 2),
            provider=self.llm_provider.__class__.__name__,
        )
