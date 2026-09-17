# Azure Configuration & Architecture Reference

This document outlines the Azure cloud architecture for the **Multimodal Learning Agent**, documenting services implemented across Day 1, Day 2, and Day 3.

---

## 1. Architectural Philosophy: Provider-Independent Abstractions

To ensure resilience, rapid local testing, and strict cost controls:
- All Azure services are accessed strictly through **isolated adapter classes**:
  - `BlobStorageService` (`rag/ingestion/blob_storage.py`)
  - `DocumentIntelligenceProcessor` (`rag/ingestion/pdf_processor.py`)
  - `EmbeddingService` (`rag/embeddings/embedding_service.py`)
  - `SearchIndexManager` (`rag/search/index_creator.py`)
  - `SearchService` (`rag/search/search_service.py`)
  - `Retriever` (`rag/search/retriever.py`)
- The internal domain models (`DocumentChunk`, `ChunkMetadata`, `ProcessedDocument`, `SearchResult`) remain standard Python Pydantic structures.
- Automated unit testing operates 100% offline with zero external network dependencies, ensuring that CI/CD and developer tests never deplete student Azure credits.

---

## 2. Implemented Azure Services Breakdown

### A. Azure Blob Storage (Day 1)
- **Resource Type**: Storage Account (Standard General Purpose v2, LRS)
- **Container Name**: `learning-agent-documents` (configurable via `AZURE_STORAGE_CONTAINER`)
- **Role**:
  - Acts as the immutable source-of-truth document store for uploaded educational material.
  - Generates persistent URLs stored in chunk metadata for downstream UI citations and document previews.

### B. Azure AI Document Intelligence (Day 1)
- **Resource Type**: Azure AI Services Multi-service or Cognitive Services Document Intelligence
- **Model Used**: `prebuilt-layout`
- **Role**:
  - Extracts raw text, reading order, and line boundaries.
  - Automatically identifies, extracts, and structures multi-column data tables into headers, cells, and markdown tables.

### C. Azure OpenAI / Foundry Embeddings (Day 3)
- **Resource Type**: Azure OpenAI Service
- **Deployment Name**: Configurable via `AZURE_EMBEDDING_DEPLOYMENT` (default: `text-embedding-3-small`)
- **Dimensions**: 1536
- **Role**:
  - Encodes document chunk text into dense mathematical vectors for semantic similarity search.
  - Encodes user queries at inference time for vector similarity matching.
- **Cost Controls**:
  - SHA-256 in-memory caching prevents duplicate embedding calls for identical text.
  - Batching (default 16 texts per request) reduces HTTP overhead.

### D. Azure AI Search (Day 3)
- **Resource Type**: Azure AI Search (Basic or Standard tier)
- **Index Name**: `learning-agent-chunks` (configurable via `AZURE_SEARCH_INDEX_NAME`)
- **Vector Algorithm**: HNSW with Cosine distance metric.
- **Search Capabilities**:
  - Vector similarity search on the `embedding` field.
  - Keyword full-text BM25 search on `text`, `filename`, and `section`.
  - Hybrid search combining keyword and vector scoring via Reciprocal Rank Fusion (RRF).
  - Metadata filtering by `document_id`, `page_number`, and `content_type`.

### E. Future Planned Azure Services (Days 4–5)
- **Azure OpenAI Chat Models (`gpt-4o`)**: Grounded answer generation, quiz synthesis, and student dialogue.

---

## 3. Environment Configuration

```bash
# Azure Storage
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=...;AccountKey=...;EndpointSuffix=core.windows.net
AZURE_STORAGE_CONTAINER=learning-agent-documents

# Azure AI Document Intelligence
AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT=https://<your-docintel-resource>.cognitiveservices.azure.com/
AZURE_DOCUMENT_INTELLIGENCE_KEY=<your-key>

# Azure AI Search
AZURE_SEARCH_ENDPOINT=https://<your-search-service>.search.windows.net
AZURE_SEARCH_API_KEY=<search-admin-key>
AZURE_SEARCH_INDEX_NAME=learning-agent-chunks

# Azure OpenAI Embeddings
AZURE_EMBEDDING_ENDPOINT=https://<your-openai-resource>.openai.azure.com/
AZURE_EMBEDDING_API_KEY=<openai-key>
AZURE_EMBEDDING_DEPLOYMENT=text-embedding-3-small
AZURE_EMBEDDING_API_VERSION=2024-02-01
AZURE_EMBEDDING_DIMENSIONS=1536
```

---

## 4. Cost Control & Student Budget Management
With an approximate $100 budget:
1. **Zero Azure Calls in Unit Tests**: Always mock API clients in tests.
2. **Deterministic Chunk Hashing**: Identical chunk texts are resolved via cache rather than re-requesting vector embeddings.
3. **Use `--vector-only` or Hybrid Search Prudently**: Hybrid search uses standard Search unit queries without requiring high-tier semantic rankers if budget is tight.
