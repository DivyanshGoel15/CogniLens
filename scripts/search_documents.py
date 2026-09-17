"""CLI script to search indexed document evidence using Azure AI Search.

Usage:
    python scripts/search_documents.py "How does Bandwidth-Delay Product affect TCP?"
    python scripts/search_documents.py "OSI model transport layer" --top-k 3
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

from rag.embeddings.embedding_service import EmbeddingConfigError, EmbeddingServiceError
from rag.search.retriever import Retriever, RetrievalError


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

    print("=" * 60)
    print("Azure AI Search - Knowledge Retrieval (Day 3)")
    print("=" * 60)
    print(f"Query : \"{args.query}\"")
    print(f"Top K : {args.top_k}")
    print(f"Mode  : {'Vector Only' if args.vector_only else 'Hybrid (Keyword + Vector)'}")
    if args.filter:
        print(f"Filter: {args.filter}")
    print("=" * 60)

    try:
        retriever = Retriever(top_k=args.top_k)
        results = retriever.retrieve(
            query=args.query,
            top_k=args.top_k,
            filter_expr=args.filter,
            use_hybrid=not args.vector_only,
        )

        if not results:
            print("\nNo matching evidence found for this query.")
            return 0

        print(f"\nRetrieved {len(results)} relevant evidence passage(s):\n")

        for idx, item in enumerate(results, 1):
            print(f"Result {idx}")
            print(f"Score   : {item.score:.4f}")
            print(f"Source  : {item.source} (Page {item.page_number})")
            sec = item.section or "[General]"
            print(f"Section : {sec}")
            print(f"Type    : {item.content_type.upper()}")
            if item.blob_url:
                print(f"Blob Ref: {item.blob_url}")
            print("\nText:")
            # Indent text slightly for readability
            for line in item.text.split("\n"):
                print(f"  {line}")
            print("-" * 60)

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
