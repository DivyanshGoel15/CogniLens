# RAG & Knowledge Engineering Subsystem

## 1. Subsystem Purpose
The **RAG & Knowledge Engineering** subsystem provides foundational document intelligence, semantic chunking, embedding generation, and vector/hybrid indexing for the **Multimodal Learning Agent**. It grounds all downstream learning workflows (tutoring, quiz generation, cognitive evaluation, and multimodal assistance) on verified academic source material.

---

## 2. End-to-End Pipeline Architecture (Day 1 + Day 2 + Day 3)

```
[ Educational PDF ]
        │
        ▼ (Day 1: Ingestion)
[ DocumentLoader ] ────► Cryptographic SHA-256 validation & magic byte check
        │
        ▼
[ Azure Blob Storage ] ─► Secure document repository & reference URLs
        │
        ▼
[ Azure Document Intel ]► Prebuilt-layout: page-by-page text, lines, tables
        │
        ▼
[ TextCleaner/Normalizer]► Unicode NFKC, de-hyphenation, equation preservation
        │
        ▼
[ ProcessedDocument ] ──► Structured JSON (data/processed/<file>_<hash>.json)
        │
        ▼ (Day 2: Semantic Chunking)
[ SemanticChunker ] ────► Hierarchical: Doc -> Page -> Section -> Paragraph -> Chunk
        │                 Dedicated Table Chunks with Markdown & headers
        ▼
[ DocumentChunks ] ─────► Development JSON inspection (data/processed/chunks/)
        │
        ▼ (Day 3: Embeddings)
[ EmbeddingService ] ───► Azure OpenAI (text-embedding-3-small) with SHA-256 caching
        │
        ▼ (Day 3: Indexing & Retrieval)
[ Azure AI Search ] ────► HNSW Vector Profile (Cosine) + Inverted Text Index
        │
        ▼
[ Retriever ] ──────────► Top-K Hybrid Search (VectorizedQuery + Keyword full-text)
```

---

## 3. Day 2: Semantic Chunking Architecture

### Chunking Strategy & Hierarchy
Rather than naively splitting text every $N$ characters, the chunker enforces semantic boundaries:
1. **Page Isolation**: Chunks never bridge across separate document pages, ensuring 100% accurate page citations.
2. **Table Preservation**: Multi-column tables extracted by Document Intelligence are chunked as dedicated `content_type="table"` items containing full markdown structure and header context.
3. **Section Detection**: Identifies numbered sections (e.g. `1. Introduction`, `2. Mathematical Formulation`), headings, and bullet question lists via regex heuristics.
4. **Token Budgeting**: Respects configurable token budgets (`CHUNK_SIZE`, `CHUNK_OVERLAP`, `MIN_CHUNK_SIZE`) using `tiktoken` (cl100k_base).

### Chunk Metadata Schema
Every chunk preserves full attribution for future citations and search filtering:
```json
{
  "chunk_id": "72e815ea_p1_c02",
  "document_id": "72e815ea583b3175734f702f1f4e81aa928fd0ea8eeeea97b225b9c87e2227c0",
  "filename": "sample.pdf",
  "source": "sample.pdf",
  "page_number": 1,
  "chunk_index": 1,
  "total_chunks": 5,
  "section": "2. Mathematical Formulation of Throughput",
  "content_type": "text",
  "table_present": false,
  "blob_name": "72e815ea583b_sample.pdf",
  "blob_url": "https://<account>.blob.core.windows.net/documents/72e815ea583b_sample.pdf"
}
```

---

## 4. Day 3: Embedding & Search Architecture

### Embedding Service (`rag/embeddings/embedding_service.py`)
- **Provider**: Azure OpenAI / Microsoft Foundry via official `openai.AzureOpenAI` client.
- **Model / Deployment**: Configurable via `AZURE_EMBEDDING_DEPLOYMENT` (default: `text-embedding-3-small`, 1536 dimensions).
- **Cost Controls**:
  - In-memory SHA-256 hash cache prevents re-embedding identical text strings.
  - Empty or whitespace-only chunks are strictly rejected before hitting the API.
  - Batched requests (configurable `batch_size=16`) minimize HTTP round-trips.

### Azure AI Search Index Schema (`rag/search/index_creator.py`)
Configured with an HNSW vector search algorithm (cosine metric) and rich filterable metadata:

| Field Name | Type | Searchable | Filterable | Sortable | Facetable | Key |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| `chunk_id` | `Edm.String` | | ✓ | ✓ | | **Key** |
| `document_id` | `Edm.String` | | ✓ | | ✓ | |
| `filename` | `Edm.String` | ✓ | ✓ | ✓ | | |
| `source` | `Edm.String` | | ✓ | | | |
| `page_number` | `Edm.Int32` | | ✓ | ✓ | | |
| `chunk_index` | `Edm.Int32` | | ✓ | ✓ | | |
| `section` | `Edm.String` | ✓ | ✓ | | | |
| `content_type`| `Edm.String` | | ✓ | | ✓ | |
| `table_present`| `Edm.Boolean`| | ✓ | | ✓ | |
| `blob_url` | `Edm.String` | | | | | |
| `text` | `Edm.String` | ✓ | | | | |
| `embedding` | `Collection(Edm.Single)` (1536d) | ✓ | | | | |

### Retrieval Engine (`rag/search/retriever.py`)
Executes **Hybrid Retrieval** combining:
- Full-text BM25 keyword matching on `text` and `section`.
- Vector similarity search via `VectorizedQuery` on `embedding` using Reciprocal Rank Fusion (RRF).

---

## 5. How to Run the Subsystem

### 1. Ingest PDF Document (Day 1)
```bash
python scripts/ingest_document.py data/sample_documents/sample.pdf
```

### 2. Semantically Chunk Ingested Document (Day 2)
```bash
python scripts/chunk_document.py data/processed/sample.pdf_72e815ea.json
```
Inspect generated chunks in `data/processed/chunks/sample.pdf_chunks.json`.

### 3. Create or Verify Search Index (Day 3)
```bash
python scripts/create_search_index.py
```

### 4. Embed Chunks and Index into Azure AI Search (Day 3)
```bash
python scripts/index_chunks.py data/processed/chunks/sample.pdf_chunks.json
```

### 5. Execute Test Search Query (Day 3)
```bash
python scripts/search_documents.py "How does Bandwidth-Delay Product affect TCP?"
```

### 6. Run Full Unit Test Suite (0 Azure Credits Spent)
```bash
python -m unittest discover -s tests -p "test_*.py" -v
```

---

## 6. Environment Variables Reference

Declared in `.env.example`:
```bash
# Storage & OCR
AZURE_STORAGE_CONNECTION_STRING=...
AZURE_STORAGE_CONTAINER=learning-agent-documents
AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT=https://...
AZURE_DOCUMENT_INTELLIGENCE_KEY=...

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

# Chunking Configuration
CHUNK_SIZE=500
CHUNK_OVERLAP=50
MIN_CHUNK_SIZE=40
```

---

## 7. Cost Considerations & Student Budget Safeguards
With an approximate $100 budget:
1. **Never call Azure inside unit tests**: Test suite uses mocks and deterministic local assertions.
2. **Embedding Cache**: In-memory SHA-256 hash checks prevent re-embedding identical chunks.
3. **Index Re-use**: `SearchIndexManager` uses `create_or_update_index` to avoid dropped indices and repeated indexing fees.
4. **Local Inspection**: Chunks are persisted to `data/processed/chunks/` for offline inspection prior to spending embedding credits.

---

## 8. Known Limitations (What Belongs to Later Stages)
- **No LLM Generation**: Querying retrieves grounded evidence passages only. Answer synthesis and citation generation belong to Day 4.
- **No Agent Orchestration / Tool Calling**: Multi-turn agent loops and query decomposition belong to Day 5.
