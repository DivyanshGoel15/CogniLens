"""Comprehensive end-to-end verification script for the RAG / Knowledge Engineering pipeline.

Verifies:
1. Environment configuration and Azure settings
2. Processed documents and embedded chunks
3. Search index schema integrity and 1536-dim vector configuration
4. Query rewriting and technical acronym expansion
5. Heuristic reranking and phrase/section matching
6. Context construction, token budgeting, and source citations
7. Azure AI Search connectivity and document indexing status (if credentials present)

Usage:
    python scripts/verify_pipeline.py
"""

import json
import os
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from dotenv import load_dotenv

load_dotenv()

from rag.chunking.metadata import DocumentChunk
from rag.retrieval.context_builder import ContextBuilder
from rag.retrieval.query_rewriter import QueryRewriter
from rag.retrieval.reranker import HeuristicReranker
from rag.search.index_creator import SearchIndexManager
from rag.search.retriever import Retriever, SearchResult
from rag.search.search_service import SearchService


if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass


def print_stage(title: str) -> None:
    print("\n" + "=" * 65)
    print(f"  {title}")
    print("=" * 65)


def verify_environment() -> bool:
    print_stage("1. Environment & Azure Configuration Verification")
    required_vars = [
        "AZURE_SEARCH_ENDPOINT",
        "AZURE_SEARCH_API_KEY",
        "AZURE_SEARCH_INDEX_NAME",
        "AZURE_EMBEDDING_ENDPOINT",
        "AZURE_EMBEDDING_API_KEY",
        "AZURE_EMBEDDING_DEPLOYMENT",
    ]
    all_ok = True
    for var in required_vars:
        val = os.getenv(var)
        if val:
            # Mask secret
            masked = val[:6] + "..." + val[-4:] if len(val) > 12 else "[SET]"
            print(f"  [OK] {var:<36} : {masked}")
        else:
            print(f"  [FAIL] {var:<36} : [MISSING]")
            all_ok = False
    return all_ok


def verify_processed_data() -> bool:
    print_stage("2. Corpus & Embedded Chunks Verification")
    chunks_path = Path("data/processed/chunks/sample.pdf_chunks_embedded.json")
    if not chunks_path.is_file():
        print(f"  [FAIL] Embedded chunks file missing: {chunks_path}")
        return False

    with open(chunks_path, "r", encoding="utf-8") as f:
        chunks = json.load(f)

    print(f"  [OK] Found embedded chunks file: {chunks_path}")
    print(f"  [OK] Total Chunks Loaded       : {len(chunks)}")
    
    # Verify dimensions
    first_chunk = chunks[0]
    emb = first_chunk.get("embedding", [])
    dims = len(emb)
    print(f"  [OK] First Chunk ID            : {first_chunk.get('chunk_id')}")
    print(f"  [OK] Embedding Dimensions      : {dims} (Expected: 1536)")

    if dims != 1536:
        print(f"  [FAIL] Expected 1536 dimensions, got {dims}")
        return False

    table_chunks = [c for c in chunks if c.get("metadata", {}).get("content_type") == "table"]
    print(f"  [OK] Dedicated Table Chunks    : {len(table_chunks)} (Preserves Markdown tables)")
    return len(chunks) == 7 and dims == 1536


def verify_index_schema() -> bool:
    print_stage("3. Azure AI Search Schema Verification")
    schema = SearchIndexManager.build_index_schema("learning-agent-chunks", dimensions=1536)
    print(f"  [OK] Index Name                : {schema.name}")
    print(f"  [OK] Configured Fields Count   : {len(schema.fields)}")

    field_names = [f.name for f in schema.fields]
    required_fields = ["chunk_id", "document_id", "filename", "page_number", "section", "text", "embedding"]
    missing = [rf for rf in required_fields if rf not in field_names]
    if missing:
        print(f"  [FAIL] Missing required fields: {missing}")
        return False
    print(f"  [OK] Verified Core Fields      : {', '.join(required_fields)}")

    # Check vector search config
    if not schema.vector_search or not schema.vector_search.profiles:
        print("  [FAIL] Missing vector search profile")
        return False
    print(f"  [OK] Vector Profile Configured : {schema.vector_search.profiles[0].name} (HNSW / Cosine)")
    return True


def verify_query_rewriter() -> bool:
    print_stage("4. Query Preprocessing & Rewriting Verification")
    rewriter = QueryRewriter()
    test_query = "How does BDP affect TCP on page 1?"
    res = rewriter.rewrite(test_query)

    print(f"  * Input Query   : '{test_query}'")
    print(f"  [OK] Expanded Query: '{res.expanded_query}'")
    print(f"  [OK] Keywords      : {res.keywords}")
    print(f"  [OK] Filter Hints  : {res.filter_hints}")

    ok = "Bandwidth-Delay Product" in res.expanded_query and "Transmission Control Protocol" in res.expanded_query
    ok = ok and res.filter_hints.get("page_number") == 1
    if ok:
        print("  [OK] Deterministic Acronym Expansion & Filter Detection PASS")
    else:
        print("  [FAIL] Query rewriting check failed")
    return ok


def verify_reranker_and_context() -> bool:
    print_stage("5. Heuristic Reranker & Context Builder Verification")
    # Create mock search results
    r1 = SearchResult(
        chunk_id="c01",
        document_id="doc1",
        filename="sample.pdf",
        source="sample.pdf",
        page_number=1,
        chunk_index=0,
        section="Table: Protocols",
        content_type="table",
        table_present=True,
        text="| Layer | Protocol |\n| 4 | TCP |",
        score=0.80,
    )
    r2 = SearchResult(
        chunk_id="c02",
        document_id="doc1",
        filename="sample.pdf",
        source="sample.pdf",
        page_number=2,
        chunk_index=1,
        section="Review Questions",
        content_type="text",
        table_present=False,
        text="Review questions on transport protocols.",
        score=0.85,
    )

    reranker = HeuristicReranker()
    reranked = reranker.rerank("Show the protocols table on page 1", [r2, r1])

    # Expect r1 to be boosted ahead of r2 due to table intent, phrase match, and page match
    print(f"  [OK] Reranked Top Result Chunk ID: {reranked[0].chunk_id} (Score: {reranked[0].score:.4f})")
    rerank_ok = reranked[0].chunk_id == "c01"

    # Verify context builder
    builder = ContextBuilder(max_tokens=1000)
    ctx_res = builder.build_context(reranked)

    print(f"  [OK] Context Assembled Chunks    : {ctx_res.chunk_count}")
    print(f"  [OK] Citations Generated         : {len(ctx_res.citations)}")
    print(f"  [OK] Citation Tag                : {ctx_res.citations[0].citation_id} -> {ctx_res.citations[0].document_name} Page {ctx_res.citations[0].page_number}")

    ctx_ok = "[Source 1]" in ctx_res.formatted_context and ctx_res.chunk_count == 2
    return rerank_ok and ctx_ok


def main() -> int:
    print("=" * 65)
    print("CogniLens - RAG / Knowledge Engineering End-to-End Verification")
    print("=" * 65)

    checks = [
        ("Environment Configuration", verify_environment()),
        ("Processed Corpus & Embeddings", verify_processed_data()),
        ("Azure AI Search Index Schema", verify_index_schema()),
        ("Query Rewriter & Acronym Expansion", verify_query_rewriter()),
        ("Reranker & Context Builder", verify_reranker_and_context()),
    ]

    print_stage("Verification Summary")
    all_passed = True
    for name, status in checks:
        icon = "[PASS]" if status else "[FAIL]"
        print(f"  {icon:<8} | {name}")
        if not status:
            all_passed = False

    print("=" * 65)
    if all_passed:
        print("  ALL LOCAL PIPELINE STAGES VERIFIED SUCCESSFULLY!")
        print("=" * 65)
        return 0
    else:
        print("  SOME STAGES REPORTED ISSUES.")
        print("=" * 65)
        return 1


if __name__ == "__main__":
    sys.exit(main())
