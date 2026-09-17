"""CLI script to chunk a processed document into semantic chunks.

Usage:
    python scripts/chunk_document.py data/processed/sample.pdf_72e815ea.json
    python scripts/chunk_document.py data/processed/sample.pdf_72e815ea.json --output-dir data/processed/chunks
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

from rag.chunking.chunker import SemanticChunker
from rag.chunking.strategies import ChunkConfig


def setup_logging(verbose: bool = False) -> None:
    level = logging.DEBUG if verbose else logging.INFO
    logging.basicConfig(
        level=level,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        datefmt="%H:%M:%S",
    )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Semantically chunk a Day 1 processed document JSON.")
    parser.add_argument(
        "json_path",
        type=str,
        help="Path to the Day 1 ProcessedDocument JSON file.",
    )
    parser.add_argument(
        "--output-dir",
        "-o",
        type=str,
        default="data/processed/chunks",
        help="Directory to save the chunks JSON (default: data/processed/chunks).",
    )
    parser.add_argument(
        "--chunk-size",
        type=int,
        default=None,
        help="Target max tokens per chunk (default from .env or 500).",
    )
    parser.add_argument(
        "--chunk-overlap",
        type=int,
        default=None,
        help="Overlap tokens between chunks (default from .env or 50).",
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

    json_path = Path(args.json_path)
    output_dir = Path(args.output_dir)

    print("=" * 60)
    print("Semantic Document Chunker (Day 2)")
    print("=" * 60)
    print(f"Input Document JSON : {json_path}")
    print(f"Output Chunks Dir   : {output_dir}")

    config = ChunkConfig.from_env()
    if args.chunk_size is not None:
        config.chunk_size = args.chunk_size
    if args.chunk_overlap is not None:
        config.chunk_overlap = args.chunk_overlap

    print(f"Chunk Size (tokens) : {config.chunk_size}")
    print(f"Chunk Overlap       : {config.chunk_overlap}")
    print("-" * 60)

    try:
        chunker = SemanticChunker(config=config)
        chunks = chunker.chunk_from_file(
            processed_json_path=json_path,
            save_chunks_dir=output_dir,
        )

        print("\nChunking Results Summary:")
        print(f"  Total Chunks Generated : {len(chunks)}")
        table_chunks = [c for c in chunks if c.metadata.content_type == "table"]
        text_chunks = [c for c in chunks if c.metadata.content_type == "text"]
        print(f"  Text Chunks            : {len(text_chunks)}")
        print(f"  Table Chunks           : {len(table_chunks)}")
        pages_covered = sorted(list({c.metadata.page_number for c in chunks}))
        print(f"  Pages Represented      : {pages_covered}")
        print("-" * 60)

        print("Chunks Breakdown:")
        for idx, chunk in enumerate(chunks, 1):
            sec_display = chunk.metadata.section or "[No Section]"
            ctype = chunk.metadata.content_type.upper()
            print(
                f"  [{idx:02d}] ID: {chunk.chunk_id:22} | Pg: {chunk.metadata.page_number} | "
                f"Type: {ctype:5} | Toks: {chunk.token_count:3} | Section: {sec_display[:35]}"
            )

        output_file = output_dir / f"{chunks[0].metadata.filename}_chunks.json" if chunks else ""
        print(f"\nSaved development chunks JSON to: {output_file}")
        print("=" * 60)
        return 0

    except FileNotFoundError as e:
        print(f"\n[ERROR] File not found: {e}", file=sys.stderr)
        return 1
    except Exception as e:
        print(f"\n[UNEXPECTED ERROR] Chunking failed: {e}", file=sys.stderr)
        return 99


if __name__ == "__main__":
    sys.exit(main())
