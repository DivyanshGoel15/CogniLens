"""Azure Blob Storage service for managing uploaded educational documents.

Provides secure upload, existence checking, safe naming, and content retrieval
without exposing credentials or requiring public blob access.
"""

import os
import re
from pathlib import Path
from typing import Optional, BinaryIO
import logging

from azure.core.exceptions import AzureError, ResourceNotFoundError
from azure.storage.blob import BlobServiceClient, ContainerClient, BlobClient

logger = logging.getLogger(__name__)


class BlobStorageError(Exception):
    """Base exception for Azure Blob Storage operations."""
    pass


class BlobNotFoundError(BlobStorageError):
    """Raised when the requested blob does not exist in the container."""
    pass


class BlobStorageService:
    """Service wrapper around Azure Blob Storage SDK."""

    def __init__(
        self,
        connection_string: Optional[str] = None,
        container_name: Optional[str] = None,
        create_container_if_missing: bool = True,
    ) -> None:
        """Initialize BlobStorageService.

        Args:
            connection_string: Azure Storage connection string. Defaults to AZURE_STORAGE_CONNECTION_STRING env var.
            container_name: Target blob container name. Defaults to AZURE_STORAGE_CONTAINER env var or 'learning-agent-documents'.
            create_container_if_missing: Whether to auto-create the container if it doesn't exist.
        """
        self.connection_string = connection_string or os.getenv("AZURE_STORAGE_CONNECTION_STRING")
        self.container_name = (
            container_name
            or os.getenv("AZURE_STORAGE_CONTAINER")
            or "learning-agent-documents"
        )

        if not self.connection_string:
            raise BlobStorageError(
                "Missing Azure Storage credentials. Set 'AZURE_STORAGE_CONNECTION_STRING' environment variable."
            )

        try:
            self.service_client: BlobServiceClient = BlobServiceClient.from_connection_string(
                self.connection_string
            )
            self.container_client: ContainerClient = self.service_client.get_container_client(
                self.container_name
            )
            if create_container_if_missing:
                self._ensure_container_exists()
        except AzureError as e:
            raise BlobStorageError(f"Failed to initialize Azure Blob Storage client: {e}") from e

    def _ensure_container_exists(self) -> None:
        """Ensure the target container exists without raising if it's already there."""
        try:
            if not self.container_client.exists():
                self.container_client.create_container()
                logger.info("Created blob container: %s", self.container_name)
        except AzureError as e:
            raise BlobStorageError(f"Failed to verify or create container '{self.container_name}': {e}") from e

    @staticmethod
    def generate_safe_blob_name(filename: str, sha256_prefix: Optional[str] = None) -> str:
        """Generate a sanitised, collision-resistant blob name.

        Args:
            filename: Original filename (e.g. 'Intro to Networks (v1).pdf').
            sha256_prefix: Optional SHA-256 hash prefix for deterministic uniqueness.

        Returns:
            Safe blob name string adhering to Azure Blob naming rules.
        """
        # Remove path traversal or illegal characters
        base = os.path.basename(filename)
        # Normalize non-alphanumeric characters (keep dots, hyphens, underscores)
        safe_name = re.sub(r"[^a-zA-Z0-9._-]", "_", base)
        if sha256_prefix:
            prefix = sha256_prefix[:12]
            return f"{prefix}_{safe_name}"
        return safe_name

    def exists(self, blob_name: str) -> bool:
        """Check whether a blob already exists in the container.

        Args:
            blob_name: Name of the blob.

        Returns:
            True if blob exists, False otherwise.
        """
        try:
            blob_client = self.container_client.get_blob_client(blob_name)
            return blob_client.exists()
        except AzureError as e:
            raise BlobStorageError(f"Failed to check existence for blob '{blob_name}': {e}") from e

    def upload_file(
        self,
        local_path: Path | str,
        blob_name: Optional[str] = None,
        overwrite: bool = False,
    ) -> str:
        """Upload a local file to Azure Blob Storage.

        Args:
            local_path: Path to the local file.
            blob_name: Target blob name (auto-generated if None).
            overwrite: Whether to overwrite an existing blob.

        Returns:
            The blob URL (excluding SAS/keys).
        """
        path = Path(local_path)
        if not path.is_file():
            raise FileNotFoundError(f"File to upload does not exist: {path}")

        target_blob_name = blob_name or self.generate_safe_blob_name(path.name)
        blob_client = self.container_client.get_blob_client(target_blob_name)

        if not overwrite and blob_client.exists():
            logger.info("Blob '%s' already exists in storage. Reusing existing blob.", target_blob_name)
            return blob_client.url

        logger.info("Uploading '%s' to container '%s' as '%s'", path.name, self.container_name, target_blob_name)
        try:
            with open(path, "rb") as data:
                blob_client.upload_blob(data, overwrite=overwrite)
            return blob_client.url
        except AzureError as e:
            raise BlobStorageError(f"Failed to upload '{path.name}' to blob '{target_blob_name}': {e}") from e

    def download_to_file(self, blob_name: str, destination_path: Path | str) -> Path:
        """Download a blob to a local destination file.

        Args:
            blob_name: The name of the blob to download.
            destination_path: Local target file path.

        Returns:
            Path object pointing to the downloaded file.
        """
        dest = Path(destination_path)
        dest.parent.mkdir(parents=True, exist_ok=True)

        blob_client = self.container_client.get_blob_client(blob_name)
        try:
            with open(dest, "wb") as f:
                download_stream = blob_client.download_blob()
                f.write(download_stream.readall())
            return dest
        except ResourceNotFoundError as e:
            raise BlobNotFoundError(f"Blob '{blob_name}' was not found in container '{self.container_name}'.") from e
        except AzureError as e:
            raise BlobStorageError(f"Failed to download blob '{blob_name}': {e}") from e

    def get_blob_url(self, blob_name: str) -> str:
        """Get the direct URL of a blob without credentials embedded."""
        blob_client = self.container_client.get_blob_client(blob_name)
        return blob_client.url
