"""CLI script to create or verify the Azure AI Search index.

Usage:
    python scripts/create_search_index.py
    python scripts/create_search_index.py --index-name custom-index-name
"""

import argparse
import logging
import sys
from pathlib import Path

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from dotenv import load_dotenv

load_dotenv()

from rag.search.index_creator import SearchIndexManager, SearchIndexConfigError, SearchIndexError


def setup_logging(verbose: bool = False) -> None:
    level = logging.DEBUG if verbose else logging.INFO
    logging.basicConfig(
        level=level,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        datefmt="%H:%M:%S",
    )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Create or update the Azure AI Search index.")
    parser.add_argument(
        "--index-name",
        type=str,
        default=None,
        help="Target index name (defaults to AZURE_SEARCH_INDEX_NAME in .env).",
    )
    parser.add_argument(
        "--dimensions",
        type=int,
        default=None,
        help="Vector dimensions (defaults to AZURE_EMBEDDING_DIMENSIONS or 1536).",
    )
    parser.add_argument(
        "--verbose",
        "-v",
        action="store_true",
        help="Enable verbose logging.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    setup_logging(args.verbose)

    print("=" * 60)
    print("Azure AI Search Index Manager")
    print("=" * 60)

    try:
        manager = SearchIndexManager(
            index_name=args.index_name,
            dimensions=args.dimensions,
        )
        print(f"Target Search Endpoint : {manager.endpoint or '[NOT SET]'}")
        print(f"Target Index Name      : {manager.index_name}")
        print(f"Embedding Dimensions   : {manager.dimensions}")
        print("-" * 60)

        index = manager.create_or_update_index()
        print(f"\n[SUCCESS] Search index '{index.name}' is ready in Azure AI Search!")
        print(f"Total Fields Configured: {len(index.fields)}")
        for field in index.fields:
            type_name = getattr(field.type, "value", str(field.type))
            print(f"  • {field.name:15} : {type_name}")
        print("=" * 60)
        return 0

    except SearchIndexConfigError as e:
        print(f"\n[CONFIG ERROR] {e}", file=sys.stderr)
        print("Please check your .env file for AZURE_SEARCH_ENDPOINT and AZURE_SEARCH_API_KEY.", file=sys.stderr)
        return 1
    except SearchIndexError as e:
        print(f"\n[AZURE ERROR] Search index creation failed: {e}", file=sys.stderr)
        return 2
    except Exception as e:
        print(f"\n[UNEXPECTED ERROR] {e}", file=sys.stderr)
        return 99


if __name__ == "__main__":
    sys.exit(main())
