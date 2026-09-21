"""Unit and offline pipeline tests for Retrieval, Reranking, Context Building, and Evaluation.

All tests run 100% offline without requiring Azure credentials or spending credits.
"""

import unittest
from unittest.mock import MagicMock

from rag.evaluation.evaluate_answers import ContextGroundingEvaluator
from rag.evaluation.evaluate_retrieval import RetrievalEvaluator
from rag.retrieval.context_builder import ContextBuilder
from rag.retrieval.query_rewriter import QueryRewriter
from rag.retrieval.reranker import HeuristicReranker
from rag.search.retriever import Retriever, SearchResult


class TestQueryRewriter(unittest.TestCase):
    """Tests deterministic query normalization, acronym expansion, and keyword extraction."""

    def setUp(self) -> None:
        self.rewriter = QueryRewriter()

    def test_clean_normalizes_unicode_and_whitespace(self) -> None:
        raw = "What\u200B is   the   BDP\r\nformula?  "
        cleaned = self.rewriter.clean(raw)
        self.assertEqual(cleaned, "What is the BDP formula?")

    def test_clean_empty_query(self) -> None:
        self.assertEqual(self.rewriter.clean(""), "")
        self.assertEqual(self.rewriter.clean("   "), "")

    def test_acronym_expansion(self) -> None:
        query = "How does BDP affect TCP throughput?"
        expanded = self.rewriter.expand_acronyms(query)
        self.assertIn("Bandwidth-Delay Product", expanded)
        self.assertIn("Transmission Control Protocol", expanded)
        self.assertIn("BDP", expanded)
        self.assertIn("TCP", expanded)

    def test_keyword_extraction_removes_stopwords(self) -> None:
        query = "What is the primary difference between TCP and UDP?"
        keywords = self.rewriter.extract_keywords(query)
        self.assertIn("primary", keywords)
        self.assertIn("difference", keywords)
        self.assertIn("TCP", keywords)
        self.assertIn("UDP", keywords)
        self.assertNotIn("what", [k.lower() for k in keywords])
        self.assertNotIn("is", [k.lower() for k in keywords])
        self.assertNotIn("the", [k.lower() for k in keywords])

    def test_detect_filter_hints(self) -> None:
        hints_page = self.rewriter.detect_filter_hints("Review questions on page 2")
        self.assertEqual(hints_page.get("page_number"), 2)

        hints_table = self.rewriter.detect_filter_hints("Show me the protocols table")
        self.assertTrue(hints_table.get("table_intent"))

    def test_decompose_comparative_query(self) -> None:
        query = "Contrast selective acknowledgments SACK and cumulative ACK"
        sub_queries = self.rewriter.decompose(query)
        self.assertGreaterEqual(len(sub_queries), 2)
        self.assertTrue(any("selective acknowledgments" in sq for sq in sub_queries))
        self.assertTrue(any("cumulative ACK" in sq for sq in sub_queries))

    def test_rewrite_encapsulates_all_fields(self) -> None:
        res = self.rewriter.rewrite("What is BDP on page 1?")
        self.assertEqual(res.original_query, "What is BDP on page 1?")
        self.assertIn("Bandwidth-Delay Product", res.expanded_query)
        self.assertEqual(res.filter_hints.get("page_number"), 1)
        self.assertIn("BDP", res.keywords)


class TestHeuristicReranker(unittest.TestCase):
    """Tests relevance reranking with phrase, section, and intent heuristic boosts."""

    def setUp(self) -> None:
        self.reranker = HeuristicReranker()
        self.sample_results = [
            SearchResult(
                chunk_id="c01",
                document_id="doc1",
                filename="sample.pdf",
                source="sample.pdf",
                page_number=1,
                chunk_index=0,
                section="Table: Protocol Stack",
                content_type="table",
                table_present=True,
                text="| Layer | Protocol |\n| 4 | TCP |\n| 3 | IP |",
                score=0.75,
            ),
            SearchResult(
                chunk_id="c02",
                document_id="doc1",
                filename="sample.pdf",
                source="sample.pdf",
                page_number=1,
                chunk_index=1,
                section="1. Introduction to Network Layering",
                content_type="text",
                table_present=False,
                text="Modern distributed networks rely on hierarchical abstraction models.",
                score=0.80,
            ),
            SearchResult(
                chunk_id="c03",
                document_id="doc1",
                filename="sample.pdf",
                source="sample.pdf",
                page_number=2,
                chunk_index=2,
                section="4. Congestion Control & Avoidance Algorithms",
                content_type="text",
                table_present=False,
                text="Congestion avoidance algorithms regulate transmission rate dynamically using AIMD.",
                score=0.70,
            ),
        ]

    def test_empty_results_returns_empty(self) -> None:
        self.assertEqual(self.reranker.rerank("test query", []), [])

    def test_table_intent_boosts_table_chunk(self) -> None:
        reranked = self.reranker.rerank("Show the protocol stack table", self.sample_results)
        self.assertEqual(reranked[0].chunk_id, "c01")
        self.assertGreater(reranked[0].score, reranked[1].score)

    def test_section_and_phrase_boost(self) -> None:
        reranked = self.reranker.rerank("Congestion Control and AIMD", self.sample_results)
        self.assertEqual(reranked[0].chunk_id, "c03")

    def test_top_k_limits_output(self) -> None:
        reranked = self.reranker.rerank("Network layering", self.sample_results, top_k=2)
        self.assertEqual(len(reranked), 2)


class TestContextBuilder(unittest.TestCase):
    """Tests context assembly, source citations, token budgeting, and deduplication."""

    def setUp(self) -> None:
        self.builder = ContextBuilder(max_tokens=500)
        self.results = [
            SearchResult(
                chunk_id="c01",
                document_id="doc1",
                filename="sample.pdf",
                source="sample.pdf",
                page_number=1,
                chunk_index=0,
                section="Introduction",
                content_type="text",
                table_present=False,
                text="First evidence passage explaining network protocols.",
                score=0.9,
                blob_url="https://storage.blob/documents/sample.pdf",
            ),
            SearchResult(
                chunk_id="c02",
                document_id="doc1",
                filename="sample.pdf",
                source="sample.pdf",
                page_number=2,
                chunk_index=1,
                section="Congestion Control",
                content_type="text",
                table_present=False,
                text="Second evidence passage explaining AIMD algorithms.",
                score=0.85,
                blob_url="https://storage.blob/documents/sample.pdf",
            ),
        ]

    def test_build_context_formats_sources_and_metadata(self) -> None:
        ctx = self.builder.build_context(self.results)
        self.assertEqual(ctx.chunk_count, 2)
        self.assertIn("[Source 1]", ctx.formatted_context)
        self.assertIn("[Source 2]", ctx.formatted_context)
        self.assertIn("Document: sample.pdf", ctx.formatted_context)
        self.assertIn("Page: 1", ctx.formatted_context)
        self.assertIn("Page: 2", ctx.formatted_context)
        self.assertEqual(len(ctx.citations), 2)
        self.assertEqual(ctx.citations[0].citation_id, "[Source 1]")
        self.assertEqual(ctx.citations[0].page_number, 1)
        self.assertEqual(ctx.citations[1].citation_id, "[Source 2]")
        self.assertEqual(ctx.citations[1].page_number, 2)

    def test_build_context_deduplicates_chunks(self) -> None:
        # Duplicate c01
        duplicate_results = [self.results[0], self.results[0], self.results[1]]
        ctx = self.builder.build_context(duplicate_results)
        self.assertEqual(ctx.chunk_count, 2)
        self.assertEqual(len(ctx.citations), 2)

    def test_token_budget_truncation(self) -> None:
        # Create a small budget builder
        small_builder = ContextBuilder(max_tokens=25)
        ctx = small_builder.build_context(self.results)
        # Should fit at most 1 chunk
        self.assertEqual(ctx.chunk_count, 1)

    def test_empty_results_returns_empty_context(self) -> None:
        ctx = self.builder.build_context([])
        self.assertEqual(ctx.chunk_count, 0)
        self.assertEqual(ctx.formatted_context, "")
        self.assertEqual(len(ctx.citations), 0)


class TestRetrieverModesMocked(unittest.TestCase):
    """Tests Retriever keyword, vector, and hybrid modes with mock SearchClient."""

    def setUp(self) -> None:
        self.mock_client = MagicMock()
        self.mock_embedder = MagicMock()
        self.mock_embedder.embed_text.return_value = [0.1] * 1536

        self.retriever = Retriever(
            endpoint="https://mock.search.windows.net",
            api_key="mock-key",
            index_name="test-index",
            embedding_service=self.mock_embedder,
            search_client=self.mock_client,
        )

        self.mock_hit = {
            "@search.score": 0.88,
            "chunk_id": "c01",
            "document_id": "doc1",
            "filename": "sample.pdf",
            "source": "sample.pdf",
            "page_number": 1,
            "chunk_index": 0,
            "section": "Intro",
            "content_type": "text",
            "table_present": False,
            "blob_url": "https://blob.mock/file.pdf",
            "text": "Extracted text content",
        }
        self.mock_client.search.return_value = [self.mock_hit]

    def test_keyword_mode_does_not_call_embedder(self) -> None:
        results = self.retriever.retrieve(query="TCP protocol", mode="keyword")
        self.mock_embedder.embed_text.assert_not_called()
        self.mock_client.search.assert_called_once()
        _, kwargs = self.mock_client.search.call_args
        self.assertEqual(kwargs["search_text"], "TCP protocol")
        self.assertIsNone(kwargs["vector_queries"])
        self.assertEqual(len(results), 1)

    def test_vector_mode_calls_embedder(self) -> None:
        results = self.retriever.retrieve(query="TCP protocol", mode="vector")
        self.mock_embedder.embed_text.assert_called_once_with("TCP protocol")
        _, kwargs = self.mock_client.search.call_args
        self.assertIsNone(kwargs["search_text"])
        self.assertIsNotNone(kwargs["vector_queries"])
        self.assertEqual(len(results), 1)

    def test_hybrid_mode_calls_embedder_and_search_text(self) -> None:
        results = self.retriever.retrieve(query="TCP protocol", mode="hybrid")
        self.mock_embedder.embed_text.assert_called_once_with("TCP protocol")
        _, kwargs = self.mock_client.search.call_args
        self.assertEqual(kwargs["search_text"], "TCP protocol")
        self.assertIsNotNone(kwargs["vector_queries"])
        self.assertEqual(len(results), 1)

    def test_empty_query_returns_empty_list(self) -> None:
        results = self.retriever.retrieve(query="   ")
        self.assertEqual(results, [])
        self.mock_client.search.assert_not_called()


class TestEvaluationMetrics(unittest.TestCase):
    """Tests evaluation metrics calculation and factual grounding verification."""

    def test_evaluator_metric_calculation(self) -> None:
        mock_retriever = MagicMock()
        mock_retriever.retrieve.return_value = [
            SearchResult(
                chunk_id="c01",
                document_id="doc1",
                filename="sample.pdf",
                source="sample.pdf",
                page_number=1,
                chunk_index=0,
                text="Layers of network stack.",
                score=0.9,
            ),
            SearchResult(
                chunk_id="c02",
                document_id="doc1",
                filename="sample.pdf",
                source="sample.pdf",
                page_number=1,
                chunk_index=1,
                text="Transport layer.",
                score=0.8,
            ),
        ]

        evaluator = RetrievalEvaluator(retriever=mock_retriever)
        item = {
            "id": "q1",
            "query": "What are the network layers?",
            "expected_chunks": ["c01"],
        }
        res = evaluator.evaluate_query(item, mode="keyword", top_k=2)
        self.assertTrue(res.hit)
        self.assertEqual(res.reciprocal_rank, 1.0)
        self.assertEqual(res.precision_at_k, 0.5)

    def test_grounding_evaluator_fact_matching(self) -> None:
        mock_retriever = MagicMock()
        mock_retriever.retrieve.return_value = [
            SearchResult(
                chunk_id="c01",
                document_id="doc1",
                filename="sample.pdf",
                source="sample.pdf",
                page_number=1,
                chunk_index=0,
                text="Transport layer uses TCP, UDP, and QUIC protocols for segments.",
                score=0.9,
            )
        ]
        grounding = ContextGroundingEvaluator(retriever=mock_retriever)
        summary = grounding.evaluate_grounding(top_k=2)
        self.assertGreater(summary.total_queries, 0)
        self.assertGreater(summary.avg_grounding_score, 0.0)


class TestRAGPipelineAndService(unittest.TestCase):
    """Tests high-level RAGPipeline facade and backend RAGService adapter."""

    def setUp(self) -> None:
        self.mock_retriever = MagicMock()
        self.mock_retriever.retrieve.return_value = [
            SearchResult(
                chunk_id="c01",
                document_id="doc1",
                filename="sample.pdf",
                source="sample.pdf",
                page_number=1,
                chunk_index=0,
                section="Transport Layer",
                content_type="text",
                table_present=False,
                text="Transport layer provides end-to-end communication via TCP and UDP.",
                score=0.92,
                blob_url="https://blob.mock/documents/sample.pdf",
            )
        ]

    def test_pipeline_retrieve_chunks_and_context(self) -> None:
        from rag.retrieval.pipeline import RAGPipeline
        pipeline = RAGPipeline(retriever=self.mock_retriever)
        
        chunks = pipeline.retrieve_chunks("What is TCP?", top_k=2, rerank=True)
        self.assertEqual(len(chunks), 1)
        self.assertEqual(chunks[0].chunk_id, "c01")

        ctx = pipeline.retrieve_context("What is TCP?", top_k=2)
        self.assertEqual(ctx.chunk_count, 1)
        self.assertIn("[Source 1]", ctx.formatted_context)
        self.assertEqual(len(ctx.citations), 1)
        self.assertEqual(ctx.citations[0].document_name, "sample.pdf")

    def test_backend_rag_service_adapter(self) -> None:
        from rag.retrieval.pipeline import RAGPipeline
        from server.app.services.rag_service import RAGService
        
        pipeline = RAGPipeline(retriever=self.mock_retriever)
        service = RAGService(pipeline=pipeline)

        grounded = service.get_grounded_context("What is TCP?")
        self.assertIn("[Source 1]", grounded.formatted_context)

        chunks = service.search_chunks("What is TCP?")
        self.assertEqual(len(chunks), 1)

        citations = service.get_citations("What is TCP?")
        self.assertEqual(len(citations), 1)
        self.assertEqual(citations[0]["citation_id"], "[Source 1]")
        self.assertEqual(citations[0]["page_number"], 1)


if __name__ == "__main__":
    unittest.main()
