"""CLI script to search indexed document evidence using Azure AI Search.

Supports Vector, Keyword, and Hybrid search modes, with deterministic query rewriting,
heuristic reranking, and structured context assembly with source citations.

Usage:
    python scripts/search_documents.py "How does Bandwidth-Delay Product affect TCP?"
    python scripts/search_documents.py "OSI model transport layer" --keyword-only --top-k 3
    python scripts/search_documents.py "TCP Tahoe and Reno" --rerank --build-context
"""

import argparse
import logging
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from dotenv import load_dotenv

load_dotenv()

if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

from rag.embeddings.embedding_service import EmbeddingConfigError, EmbeddingServiceError
from rag.retrieval.context_builder import ContextBuilder
from rag.retrieval.query_rewriter import QueryRewriter
from rag.retrieval.reranker import HeuristicReranker
from rag.search.retriever import RetrievalError, Retriever


def setup_logging(verbose: bool = False) -> None:
    level = logging.DEBUG if verbose else logging.WARNING
    logging.basicConfig(
        level=level,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        datefmt="%H:%M:%S",
    )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Query indexed educational evidence from Azure AI Search.")
    parser.add_argument(
        "query",
        type=str,
        help="Search query or question.",
    )
    parser.add_argument(
        "--top-k",
        "-k",
        type=int,
        default=5,
        help="Number of top results to retrieve (default: 5).",
    )
    parser.add_argument(
        "--vector-only",
        action="store_true",
        help="Use pure vector search instead of hybrid search.",
    )
    parser.add_argument(
        "--keyword-only",
        action="store_true",
        help="Use pure keyword (BM25) search without computing embeddings.",
    )
    parser.add_argument(
        "--no-rewrite",
        action="store_true",
        help="Disable automatic query preprocessing and acronym expansion.",
    )
    parser.add_argument(
        "--rerank",
        action="store_true",
        help="Apply heuristic reranking for phrase, section, and table alignment.",
    )
    parser.add_argument(
        "--build-context",
        action="store_true",
        help="Format retrieved results into a deduplicated, cited context block ready for LLM.",
    )
    parser.add_argument(
        "--filter",
        type=str,
        default=None,
        help="Optional OData filter expression (e.g. \"filename eq 'sample.pdf'\").",
    )
    parser.add_argument(
        "--verbose",
        "-v",
        action="store_true",
        help="Enable verbose debug logging.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    setup_logging(args.verbose)

    # Determine mode
    if args.keyword_only:
        search_mode = "keyword"
    elif args.vector_only:
        search_mode = "vector"
    else:
        search_mode = "hybrid"

    print("=" * 65)
    print("Azure AI Search — Knowledge Retrieval Subsystem")
    print("=" * 65)
    print(f"Original Query : \"{args.query}\"")
    print(f"Search Mode    : {search_mode.upper()}")
    print(f"Top K Limit    : {args.top_k}")
    if args.filter:
        print(f"OData Filter   : {args.filter}")
    print("-" * 65)

    try:
        # Step 1: Query Preprocessing & Rewriting
        effective_query = args.query
        if not args.no_rewrite:
            rewriter = QueryRewriter()
            rewritten = rewriter.rewrite(args.query)
            effective_query = rewritten.expanded_query
            if effective_query != args.query:
                print(f"Expanded Query : \"{effective_query}\"")
            if rewritten.keywords:
                print(f"Key Terms      : {', '.join(rewritten.keywords)}")
            if rewritten.filter_hints:
                print(f"Inferred Hints : {rewritten.filter_hints}")
            print("-" * 65)

        # Step 2: Execute Retrieval
        retriever = Retriever(top_k=args.top_k)
        initial_k = args.top_k + 3 if args.rerank else args.top_k
        results = retriever.retrieve(
            query=effective_query,
            top_k=initial_k,
            filter_expr=args.filter,
            mode=search_mode,
        )

        if not results:
            print("\nNo matching evidence found in Azure AI Search for this query.")
            return 0

        # Step 3: Optional Reranking
        if args.rerank:
            print(f"Applying heuristic reranking across {len(results)} candidate passages...")
            reranker = HeuristicReranker()
            results = reranker.rerank(args.query, results, top_k=args.top_k)
            print("-" * 65)

        print(f"\nRetrieved {len(results)} relevant evidence passage(s):\n")

        for idx, item in enumerate(results, 1):
            print(f"Result #{idx} (Score: {item.score:.4f})")
            print(f"  Source   : {item.source} (Page {item.page_number}, Chunk #{item.chunk_index})")
            sec = item.section or "[General]"
            print(f"  Section  : {sec}")
            print(f"  Type     : {item.content_type.upper()} {'(Table Present)' if item.table_present else ''}")
            if item.blob_url:
                print(f"  Blob Ref : {item.blob_url}")
            print("  Text Snippet:")
            for line in item.text.split("\n")[:6]:
                print(f"    {line}")
            if len(item.text.split("\n")) > 6:
                print("    ...")
            print("-" * 65)

        # Step 4: Optional Context Construction & Citations
        if args.build_context:
            print("\n" + "=" * 65)
            print("Assembled LLM Context & Citations")
            print("=" * 65)
            builder = ContextBuilder(max_tokens=2000)
            context_result = builder.build_context(results)
            print(context_result.formatted_context)
            print("\n" + "-" * 65)
            print(f"Context Statistics: {context_result.chunk_count} chunk(s), ~{context_result.total_tokens} tokens")
            print(f"Citations Available: {len(context_result.citations)}")
            for cit in context_result.citations:
                print(f"  • {cit.citation_id}: {cit.document_name}, Page {cit.page_number} ({cit.section or 'General'})")
            print("=" * 65)

        return 0

    except EmbeddingConfigError as e:
        print(f"\n[EMBEDDING CONFIG ERROR] {e}", file=sys.stderr)
        print("Please configure AZURE_EMBEDDING_ENDPOINT and AZURE_EMBEDDING_API_KEY in .env", file=sys.stderr)
        return 1
    except EmbeddingServiceError as e:
        print(f"\n[EMBEDDING ERROR] {e}", file=sys.stderr)
        return 2
    except RetrievalError as e:
        print(f"\n[RETRIEVAL ERROR] {e}", file=sys.stderr)
        print("Please verify your AZURE_SEARCH_ENDPOINT and AZURE_SEARCH_API_KEY in .env", file=sys.stderr)
        return 3
    except Exception as e:
        print(f"\n[UNEXPECTED ERROR] Search failed: {e}", file=sys.stderr)
        return 99


if __name__ == "__main__":
    sys.exit(main())
