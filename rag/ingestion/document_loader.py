"""Document loader for local educational documents.

Validates document existence, formats, computes cryptographic hashes,
and extracts file-level system attributes.
"""

import hashlib
import os
from pathlib import Path
from typing import Dict, Any


class DocumentLoaderError(Exception):
    """Base exception for document loader failures."""
    pass


class DocumentNotFoundError(DocumentLoaderError):
    """Raised when the specified file path does not exist."""
    pass


class InvalidDocumentError(DocumentLoaderError):
    """Raised when the file is not a valid PDF or is empty/corrupt."""
    pass


class LoadedDocumentInfo:
    """Encapsulates validated document file attributes."""

    def __init__(
        self,
        file_path: Path,
        filename: str,
        file_size_bytes: int,
        sha256_hash: str,
        modified_time: float,
    ) -> None:
        self.file_path = file_path
        self.filename = filename
        self.file_size_bytes = file_size_bytes
        self.sha256_hash = sha256_hash
        self.modified_time = modified_time

    def to_dict(self) -> Dict[str, Any]:
        """Convert document info to dictionary representation."""
        return {
            "file_path": str(self.file_path),
            "filename": self.filename,
            "file_size_bytes": self.file_size_bytes,
            "sha256_hash": self.sha256_hash,
            "modified_time": self.modified_time,
        }

    def __repr__(self) -> str:
        return f"<LoadedDocumentInfo filename='{self.filename}' size={self.file_size_bytes}b>"


class DocumentLoader:
    """Validates and loads local document files prior to cloud ingestion."""

    _PDF_MAGIC_BYTES = b"%PDF"

    @classmethod
    def load(cls, file_path_str: str | Path) -> LoadedDocumentInfo:
        """Validate and inspect a local PDF file.

        Args:
            file_path_str: Path to the target document.

        Returns:
            LoadedDocumentInfo containing verified file attributes.

        Raises:
            DocumentNotFoundError: If the path does not point to an existing file.
            InvalidDocumentError: If the file is not a PDF, is 0 bytes, or cannot be read.
        """
        path = Path(file_path_str).resolve()

        if not path.exists():
            raise DocumentNotFoundError(f"Document file not found at path: {path}")

        if not path.is_file():
            raise InvalidDocumentError(f"Path is not a regular file: {path}")

        if path.suffix.lower() != ".pdf":
            raise InvalidDocumentError(
                f"Unsupported file extension '{path.suffix}'. Only .pdf is supported for Day 1 ingestion."
            )

        file_size = path.stat().st_size
        if file_size == 0:
            raise InvalidDocumentError(f"PDF file is empty (0 bytes): {path}")

        # Validate PDF header (magic bytes) to ensure it is actually a PDF binary
        try:
            with open(path, "rb") as f:
                header = f.read(5)
                if not header.startswith(cls._PDF_MAGIC_BYTES):
                    raise InvalidDocumentError(
                        f"File does not have a valid PDF header: {path.name}"
                    )
        except OSError as e:
            raise InvalidDocumentError(f"Failed to read file header: {e}") from e

        # Compute SHA-256 hash in 64KB chunks to avoid reading entire file into memory at once
        sha256 = hashlib.sha256()
        try:
            with open(path, "rb") as f:
                for chunk in iter(lambda: f.read(65536), b""):
                    sha256.update(chunk)
        except OSError as e:
            raise InvalidDocumentError(f"Failed to read file content for hashing: {e}") from e

        return LoadedDocumentInfo(
            file_path=path,
            filename=path.name,
            file_size_bytes=file_size,
            sha256_hash=sha256.hexdigest(),
            modified_time=path.stat().st_mtime,
        )
