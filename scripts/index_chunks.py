"""CLI script to embed and index document chunks into Azure AI Search.

Usage:
    python scripts/index_chunks.py data/processed/chunks/sample.pdf_chunks.json
    python scripts/index_chunks.py data/processed/sample.pdf_72e815ea.json --from-document
"""

import argparse
import json
import logging
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from dotenv import load_dotenv

load_dotenv()

from rag.chunking.chunker import SemanticChunker
from rag.chunking.metadata import DocumentChunk
from rag.embeddings.embedding_service import (
    EmbeddingConfigError,
    EmbeddingService,
    EmbeddingServiceError,
)
from rag.search.index_creator import (
    SearchIndexConfigError,
    SearchIndexError,
    SearchIndexManager,
)
from rag.search.search_service import SearchIndexingError, SearchService


def setup_logging(verbose: bool = False) -> None:
    level = logging.DEBUG if verbose else logging.INFO
    logging.basicConfig(
        level=level,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        datefmt="%H:%M:%S",
    )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Embed and index document chunks into Azure AI Search.")
    parser.add_argument(
        "input_path",
        type=str,
        help="Path to chunks JSON file (or processed document JSON if using --from-document).",
    )
    parser.add_argument(
        "--from-document",
        action="store_true",
        help="Treat input_path as a Day 1 ProcessedDocument JSON, running chunking first.",
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=16,
        help="Batch size for embedding generation (default: 16).",
    )
    parser.add_argument(
        "--ensure-index",
        action="store_true",
        default=True,
        help="Automatically create or update the search index if missing (default: True).",
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

    input_path = Path(args.input_path)

    print("=" * 60)
    print("Azure AI Search Indexing Pipeline (Day 2 + Day 3)")
    print("=" * 60)
    print(f"Input File: {input_path}")

    if not input_path.is_file():
        print(f"\n[ERROR] Input file does not exist: {input_path}", file=sys.stderr)
        return 1

    try:
        # Step 1: Obtain chunks
        chunks = []
        if args.from_document:
            print("\nStep 1: Chunking processed document...")
            chunker = SemanticChunker()
            chunks = chunker.chunk_from_file(input_path)
        else:
            print("\nStep 1: Loading chunks from file...")
            with open(input_path, "r", encoding="utf-8") as f:
                raw_data = json.load(f)
            chunks = [DocumentChunk.model_validate(item) for item in raw_data]

        print(f"Loaded {len(chunks)} chunks.")
        if not chunks:
            print("No chunks to process. Exiting.")
            return 0

        # Step 2: Ensure Search Index exists
        if args.ensure_index:
            print("\nStep 2: Checking / Provisioning Azure AI Search Index...")
            index_manager = SearchIndexManager()
            index_manager.create_or_update_index()

        # Step 3: Generate Embeddings
        print("\nStep 3: Generating Azure OpenAI Embeddings...")
        embedder = EmbeddingService()
        chunks = embedder.embed_chunks(chunks, batch_size=args.batch_size)
        print("Embeddings generated successfully.")

        # Step 4: Index into Azure AI Search
        print("\nStep 4: Uploading documents to Azure AI Search...")
        search_service = SearchService()
        indexed_count = search_service.index_chunks(chunks)

        print("-" * 60)
        print("Indexing Complete:")
        print(f"  Total Chunks Processed : {len(chunks)}")
        print(f"  Total Chunks Indexed   : {indexed_count}")
        print(f"  Target Search Index    : {search_service.index_name}")
        print("=" * 60)
        return 0

    except EmbeddingConfigError as e:
        print(f"\n[EMBEDDING CONFIG ERROR] {e}", file=sys.stderr)
        print("Please configure AZURE_EMBEDDING_ENDPOINT and AZURE_EMBEDDING_API_KEY in .env", file=sys.stderr)
        return 2
    except EmbeddingServiceError as e:
        print(f"\n[EMBEDDING ERROR] Failed to generate embeddings: {e}", file=sys.stderr)
        return 3
    except SearchIndexConfigError as e:
        print(f"\n[SEARCH CONFIG ERROR] {e}", file=sys.stderr)
        print("Please configure AZURE_SEARCH_ENDPOINT and AZURE_SEARCH_API_KEY in .env", file=sys.stderr)
        return 4
    except (SearchIndexError, SearchIndexingError) as e:
        print(f"\n[SEARCH INDEXING ERROR] Failed to index chunks: {e}", file=sys.stderr)
        return 5
    except Exception as e:
        print(f"\n[UNEXPECTED ERROR] Pipeline failed: {e}", file=sys.stderr)
        return 99


if __name__ == "__main__":
    sys.exit(main())
