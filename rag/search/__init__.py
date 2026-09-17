"""Search package for Azure AI Search indexing, vector profiles, and hybrid retrieval."""

from rag.search.index_creator import SearchIndexManager, SearchIndexConfigError, SearchIndexError
from rag.search.search_service import SearchService, SearchIndexingError
from rag.search.retriever import Retriever, SearchResult, RetrievalError
from rag.search.hybrid_search import HybridSearchService

__all__ = [
    "SearchIndexManager",
    "SearchIndexConfigError",
    "SearchIndexError",
    "SearchService",
    "SearchIndexingError",
    "Retriever",
    "SearchResult",
    "RetrievalError",
    "HybridSearchService",
]
