"""CLI runner script for the Day 1 document ingestion pipeline.

Usage:
    python scripts/ingest_document.py data/sample_documents/sample.pdf
    python scripts/ingest_document.py path/to/document.pdf --skip-upload
"""

import argparse
import logging
import sys
from pathlib import Path

# Add project root to sys.path to allow absolute imports from any working directory
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from dotenv import load_dotenv

# Load environment variables from .env if present
load_dotenv()

from rag.ingestion.document_loader import DocumentLoaderError
from rag.ingestion.blob_storage import BlobStorageError
from rag.ingestion.pdf_processor import (
    DocumentIntelligenceConfigError,
    DocumentIntelligenceError,
)
from rag.ingestion.ingestion_pipeline import IngestionPipeline


def setup_logging(verbose: bool = False) -> None:
    """Configure terminal logging."""
    level = logging.DEBUG if verbose else logging.INFO
    logging.basicConfig(
        level=level,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        datefmt="%H:%M:%S",
    )


def parse_args() -> argparse.Namespace:
    """Parse command-line arguments."""
    parser = argparse.ArgumentParser(
        description="Ingest an educational PDF document into the RAG subsystem."
    )
    parser.add_argument(
        "pdf_path",
        type=str,
        help="Path to the PDF file to ingest.",
    )
    parser.add_argument(
        "--output-dir",
        "-o",
        type=str,
        default="data/processed",
        help="Directory to save the processed JSON representation (default: data/processed).",
    )
    parser.add_argument(
        "--skip-upload",
        action="store_true",
        help="Skip Azure Blob Storage upload (useful for local dry-runs or cost control).",
    )
    parser.add_argument(
        "--verbose",
        "-v",
        action="store_true",
        help="Enable verbose debug logging.",
    )
    return parser.parse_args()


def main() -> int:
    """Run the ingestion CLI workflow."""
    args = parse_args()
    setup_logging(args.verbose)

    pdf_path = Path(args.pdf_path)
    output_dir = Path(args.output_dir)

    print("=" * 60)
    print("Multimodal Learning Agent - Document Ingestion Pipeline (Day 1)")
    print("=" * 60)
    print(f"Target Document : {pdf_path}")
    print(f"Output Directory: {output_dir}")
    print(f"Skip Blob Upload: {args.skip_upload}")
    print("-" * 60)

    try:
        pipeline = IngestionPipeline(skip_blob_upload=args.skip_upload)
        processed_doc = pipeline.process(
            file_path=pdf_path,
            save_output_dir=output_dir,
        )

        print("-" * 60)
        print("Ingestion Summary:")
        print(f"  Document ID         : {processed_doc.document_id[:16]}...")
        print(f"  Document            : {processed_doc.filename}")
        print(f"  Pages               : {len(processed_doc.pages)}")
        print(f"  Processed Status    : Success")
        print(f"  Tables detected     : {processed_doc.total_tables}")
        print(f"  Characters extracted: {processed_doc.total_chars}")
        print(f"  Words extracted     : {processed_doc.total_words}")
        if processed_doc.metadata.blob_url:
            print(f"  Blob Storage URL    : {processed_doc.metadata.blob_url}")
        print(f"  Local JSON Saved At : {output_dir / f'{processed_doc.filename}_{processed_doc.document_id[:8]}.json'}")
        print("=" * 60)
        return 0

    except DocumentLoaderError as e:
        print(f"\n[ERROR] Document validation failed: {e}", file=sys.stderr)
        return 1
    except BlobStorageError as e:
        print(f"\n[ERROR] Azure Blob Storage operation failed: {e}", file=sys.stderr)
        print("Check that 'AZURE_STORAGE_CONNECTION_STRING' is set in your .env file.", file=sys.stderr)
        return 2
    except DocumentIntelligenceConfigError as e:
        print(f"\n[ERROR] Azure Document Intelligence configuration error: {e}", file=sys.stderr)
        print("Check 'AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT' and 'AZURE_DOCUMENT_INTELLIGENCE_KEY'.", file=sys.stderr)
        return 3
    except DocumentIntelligenceError as e:
        print(f"\n[ERROR] Document analysis failed: {e}", file=sys.stderr)
        return 4
    except Exception as e:
        print(f"\n[UNEXPECTED ERROR] Ingestion failed: {e}", file=sys.stderr)
        return 99


if __name__ == "__main__":
    sys.exit(main())
