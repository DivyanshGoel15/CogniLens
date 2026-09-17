"""Azure AI Search Index Creator and Schema Manager.

Defines and provisions vector-enabled search indices tailored for educational
document chunks with HNSW vector search profiles and rich citation metadata.
"""

import logging
import os
from typing import Optional

from azure.core.credentials import AzureKeyCredential
from azure.core.exceptions import AzureError, ResourceNotFoundError
from azure.search.documents.indexes import SearchIndexClient
from azure.search.documents.indexes.models import (
    HnswAlgorithmConfiguration,
    HnswParameters,
    SearchField,
    SearchFieldDataType,
    SearchIndex,
    SearchableField,
    SimpleField,
    VectorSearch,
    VectorSearchAlgorithmMetric,
    VectorSearchProfile,
)

logger = logging.getLogger(__name__)


class SearchIndexConfigError(Exception):
    """Raised when Azure AI Search configuration or credentials are missing."""
    pass


class SearchIndexError(Exception):
    """Raised when Azure AI Search index operations fail."""
    pass


class SearchIndexManager:
    """Manages Azure AI Search index schema definition and provisioning."""

    def __init__(
        self,
        endpoint: Optional[str] = None,
        api_key: Optional[str] = None,
        index_name: Optional[str] = None,
        dimensions: Optional[int] = None,
        client: Optional[SearchIndexClient] = None,
    ) -> None:
        """Initialize SearchIndexManager.

        Args:
            endpoint: Azure AI Search endpoint URL. Defaults to AZURE_SEARCH_ENDPOINT env var.
            api_key: Azure AI Search admin API key. Defaults to AZURE_SEARCH_API_KEY env var.
            index_name: Target search index name. Defaults to AZURE_SEARCH_INDEX_NAME or 'learning-agent-chunks'.
            dimensions: Vector embedding dimensions. Defaults to AZURE_EMBEDDING_DIMENSIONS or 1536.
            client: Optional pre-configured SearchIndexClient instance.
        """
        self.endpoint = endpoint or os.getenv("AZURE_SEARCH_ENDPOINT")
        self.api_key = api_key or os.getenv("AZURE_SEARCH_API_KEY")
        self.index_name = (
            index_name
            or os.getenv("AZURE_SEARCH_INDEX_NAME")
            or "learning-agent-chunks"
        )
        dim_env = os.getenv("AZURE_EMBEDDING_DIMENSIONS", "1536")
        self.dimensions = dimensions or int(dim_env)

        self._client = client

    def _get_client(self) -> SearchIndexClient:
        """Lazily initialize and validate SearchIndexClient."""
        if self._client is not None:
            return self._client

        if not self.endpoint:
            raise SearchIndexConfigError(
                "Missing Azure AI Search endpoint. Set 'AZURE_SEARCH_ENDPOINT' environment variable."
            )
        if not self.api_key:
            raise SearchIndexConfigError(
                "Missing Azure AI Search API key. Set 'AZURE_SEARCH_API_KEY' environment variable."
            )

        try:
            credential = AzureKeyCredential(self.api_key)
            self._client = SearchIndexClient(endpoint=self.endpoint, credential=credential)
            return self._client
        except Exception as e:
            raise SearchIndexConfigError(f"Failed to initialize SearchIndexClient: {e}") from e

    @classmethod
    def build_index_schema(
        cls,
        index_name: str,
        dimensions: int = 1536,
    ) -> SearchIndex:
        """Build the declarative SearchIndex schema.

        This method is purely local and deterministic, allowing 100% offline verification.

        Args:
            index_name: Name of the index.
            dimensions: Embedding vector dimensions (e.g. 1536 for text-embedding-3-small).

        Returns:
            SearchIndex object configured with HNSW vector profile and metadata fields.
        """
        # Configure HNSW algorithm and profile
        hnsw_params = HnswParameters(metric=VectorSearchAlgorithmMetric.COSINE)
        hnsw_config = HnswAlgorithmConfiguration(name="hnsw-config", parameters=hnsw_params)
        vector_profile = VectorSearchProfile(
            name="vector-profile",
            algorithm_configuration_name="hnsw-config",
        )
        vector_search = VectorSearch(
            algorithms=[hnsw_config],
            profiles=[vector_profile],
        )

        # Declare fields
        fields = [
            # Primary Key
            SimpleField(
                name="chunk_id",
                type=SearchFieldDataType.String,
                key=True,
                filterable=True,
                sortable=True,
            ),
            # Document Attribution
            SimpleField(
                name="document_id",
                type=SearchFieldDataType.String,
                filterable=True,
                facetable=True,
            ),
            SearchableField(
                name="filename",
                type=SearchFieldDataType.String,
                filterable=True,
                sortable=True,
            ),
            SimpleField(
                name="source",
                type=SearchFieldDataType.String,
                filterable=True,
            ),
            # Structural Ordering & Citations
            SimpleField(
                name="page_number",
                type=SearchFieldDataType.Int32,
                filterable=True,
                sortable=True,
            ),
            SimpleField(
                name="chunk_index",
                type=SearchFieldDataType.Int32,
                filterable=True,
                sortable=True,
            ),
            SearchableField(
                name="section",
                type=SearchFieldDataType.String,
                filterable=True,
            ),
            SimpleField(
                name="content_type",
                type=SearchFieldDataType.String,
                filterable=True,
                facetable=True,
            ),
            SimpleField(
                name="table_present",
                type=SearchFieldDataType.Boolean,
                filterable=True,
                facetable=True,
            ),
            SimpleField(
                name="blob_url",
                type=SearchFieldDataType.String,
            ),
            # Text Content for Full-Text Search
            SearchableField(
                name="text",
                type=SearchFieldDataType.String,
            ),
            # Dense Vector for Similarity Search
            SearchField(
                name="embedding",
                type=SearchFieldDataType.Collection(SearchFieldDataType.Single),
                searchable=True,
                vector_search_dimensions=dimensions,
                vector_search_profile_name="vector-profile",
            ),
        ]

        return SearchIndex(
            name=index_name,
            fields=fields,
            vector_search=vector_search,
        )

    def index_exists(self, index_name: Optional[str] = None) -> bool:
        """Check whether a search index exists in Azure AI Search.

        Args:
            index_name: Name of index to check (defaults to configured index_name).

        Returns:
            True if index exists, False otherwise.
        """
        target = index_name or self.index_name
        client = self._get_client()
        try:
            client.get_index(target)
            return True
        except ResourceNotFoundError:
            return False
        except AzureError as e:
            raise SearchIndexError(f"Failed to check existence for index '{target}': {e}") from e

    def create_or_update_index(
        self,
        index_name: Optional[str] = None,
        dimensions: Optional[int] = None,
    ) -> SearchIndex:
        """Create or update the Azure AI Search index without dropping existing documents.

        Args:
            index_name: Target index name.
            dimensions: Vector embedding dimensions.

        Returns:
            Created or existing SearchIndex instance.
        """
        target = index_name or self.index_name
        dims = dimensions or self.dimensions

        client = self._get_client()
        schema = self.build_index_schema(index_name=target, dimensions=dims)

        try:
            logger.info("Ensuring Azure AI Search index '%s' exists (dimensions=%d)...", target, dims)
            result = client.create_or_update_index(schema)
            logger.info("Search index '%s' ready.", result.name)
            return result
        except AzureError as e:
            raise SearchIndexError(f"Failed to create/update search index '{target}': {e}") from e
