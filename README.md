# CogniLens — Multimodal Learning Agent
## RAG & Knowledge Engineering Subsystem

[![Tests](https://img.shields.io/badge/Unit%20Tests-50%20Passed-brightgreen)](tests/)
[![Azure](https://img.shields.io/badge/Azure%20AI%20Search-HNSW%20%2B%20BM25-blue)](rag/search/)
[![Embeddings](https://img.shields.io/badge/Embeddings-text--embedding--3--small%20(1536d)-orange)](rag/embeddings/)
[![Python](https://img.shields.io/badge/Python-3.11+-informational)](https://python.org)

An enterprise-grade, budget-optimized **Retrieval-Augmented Generation (RAG) & Knowledge Engineering Subsystem** powering the **Multimodal Learning Agent** (CogniLens).

Grounds downstream educational tutoring, cognitive evaluations, quiz synthesis, and student dialogue on verified academic sources with deterministic citations, sub-second hybrid retrieval, and zero-hallucination context construction.

---

## 1. End-to-End Pipeline Architecture

```
                       [ Educational PDF Source ]
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ Stage 1: Ingestion & Storage                                           │
│ • Cryptographic SHA-256 validation & MIME magic byte verification       │
│ • Azure Blob Storage (mlagentdivyansh01 / documents)                   │
│ • Azure AI Document Intelligence (prebuilt-layout model)                │
└──────────────────────────────────┬──────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ Stage 2: Normalization & Semantic Chunking                             │
│ • Unicode NFKC normalization, de-hyphenation, equation preservation    │
│ • Page-isolated chunking (strict attribution without page bleed)       │
│ • Dedicated table chunks formatted in clean GitHub Markdown            │
│ • Heading & section boundary detection with token budgeting (tiktoken) │
└──────────────────────────────────┬──────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ Stage 3: Embedding & Indexing                                          │
│ • Azure OpenAI / Foundry: text-embedding-3-small (1536 dimensions)     │
│ • In-memory SHA-256 caching & pre-computed vector reuse                │
│ • Azure AI Search: HNSW Cosine vector profile + BM25 inverted index    │
└──────────────────────────────────┬──────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ Stage 4: Query Processing & Retrieval                                   │
│ • QueryRewriter: deterministic normalization & technical acronym expansion│
│ • Hybrid Retrieval: Vector similarity + BM25 via Reciprocal Rank Fusion │
│ • HeuristicReranker: phrase matching, section alignment, table/formula │
└──────────────────────────────────┬──────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ Stage 5: Context Construction & Citations                              │
│ • ContextBuilder: Deduplication, token budget enforcement               │
│ • Structured [Source N] markdown blocks with exact page numbers & URLs  │
│ • First-class SourceCitation metadata ready for downstream LLM / Agent  │
└──────────────────────────────────┬──────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ Stage 6: Evaluation & Grounding Benchmarks                             │
│ • Hit Rate @ K (Recall), Mean Reciprocal Rank (MRR), Precision @ K     │
│ • Factual completeness & context grounding verification (97.3% score)  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Azure Cloud Architecture & Multi-Region Rationale

To operate reliably within an **Azure for Students** subscription while avoiding quota limits:

| Azure Resource | Resource Name | Region | Purpose / Role |
| :--- | :--- | :--- | :--- |
| **Azure Blob Storage** | `mlagentdivyansh01` | Central India | Immutable document repository; persistent reference URLs for UI citations. Container: `documents`. |
| **Azure AI Document Intelligence** | `mlagent-document-intelligence` | Central India | High-accuracy layout extraction, reading order, line bounds, and multi-column table parsing (`prebuilt-layout`). |
| **Azure AI Search** | `mlagent-search-divyansh` | Central India | Vector, keyword, and hybrid indexing on `learning-agent-chunks` with HNSW vector profile (Cosine metric) and BM25 full-text indexing. |
| **Microsoft Foundry (LLM)** | `mlagent-foundry-divyansh` | Central India | Reserved for downstream agent orchestration, quiz synthesis, and student chat. |
| **Microsoft Foundry (Embeddings)** | `mlagent-foundry-uae` | **UAE North** | Generates 1536-dimensional dense vector representations via `text-embedding-3-small`. |

> [!IMPORTANT]
> **Why UAE North for Embeddings?**
> The Azure for Students subscription enforces regional model availability policies. The `text-embedding-3-small` model was unavailable for deployment in Central India within this subscription tier, requiring deployment in **UAE North**. All adapters transparently manage this cross-region routing.

---

## 3. Subsystem Components Breakdown

### A. Document Ingestion & Preprocessing (`rag/ingestion/`, `rag/preprocessing/`)
- `DocumentLoader`: Validates file existence, size (>0 bytes), `.pdf` extension, and `%PDF-` magic header bytes before computing deterministic SHA-256 document IDs.
- `BlobStorageService`: Idempotently uploads documents to container `documents` and generates persistent access URLs.
- `DocumentIntelligenceProcessor`: Calls Azure Document Intelligence (`prebuilt-layout`), extracting per-page text and multi-column markdown tables.
- `TextCleaner` & `TextNormalizer`: Cleans non-printable control artifacts, normalizes unicode (NFKC), fixes hyphenated linebreaks, and strictly preserves math symbols (`≤`, `×`, `√`, `=`).

### B. Semantic Chunking (`rag/chunking/`)
- **Page Isolation**: Chunks strictly never cross page boundaries, guaranteeing 100% accurate page citations.
- **Dedicated Table Chunks**: Multi-column tables extracted by Document Intelligence are chunked as discrete `content_type="table"` units with header context.
- **Section Detection**: Automatically identifies numbered sections (e.g. `1. Introduction`, `4. Congestion Control`) and review question lists.
- **Token Budgeting**: Configured via `CHUNK_SIZE=500`, `CHUNK_OVERLAP=50`, and `MIN_CHUNK_SIZE=50` using `tiktoken`.

### C. Embeddings & Index Schema (`rag/embeddings/`, `rag/search/`)
- **Model**: `text-embedding-3-small` producing dense vectors of **1536 dimensions**.
- **Student Budget Safeguard**: In-memory SHA-256 hash caching and pre-computed vector check prevents re-embedding identical text strings.
- **Azure AI Search Schema (`learning-agent-chunks`)**:
  - `chunk_id` (`Edm.String`, Key, Filterable, Sortable)
  - `document_id` (`Edm.String`, Filterable, Facetable)
  - `filename` (`Edm.String`, Searchable, Filterable, Sortable)
  - `source` (`Edm.String`, Filterable)
  - `page_number` (`Edm.Int32`, Filterable, Sortable)
  - `chunk_index` (`Edm.Int32`, Filterable, Sortable)
  - `section` (`Edm.String`, Searchable, Filterable)
  - `content_type` (`Edm.String`, Filterable, Facetable: `'text'` or `'table'`)
  - `table_present` (`Edm.Boolean`, Filterable, Facetable)
  - `blob_url` (`Edm.String`)
  - `text` (`Edm.String`, Searchable)
  - `embedding` (`Collection(Edm.Single)`, 1536 dimensions, HNSW Cosine Profile)

### D. Multi-Mode Retrieval (`rag/search/retriever.py`, `rag/search/hybrid_search.py`)
- **Hybrid Retrieval** (Default): Combines BM25 keyword matching on `text` and `section` with `VectorizedQuery` cosine similarity via Reciprocal Rank Fusion (RRF).
- **Vector Retrieval**: Pure dense vector similarity search.
- **Keyword Retrieval**: Pure BM25 full-text search without generating embeddings (saves API credits and network latency).

### E. Query Preprocessing & Rewriting (`rag/retrieval/query_rewriter.py`)
- **Deterministic**: 100% offline, zero LLM calls, zero cost.
- **Acronym Expansion**: Expands technical acronyms (e.g. `BDP` $\rightarrow$ `Bandwidth-Delay Product`, `TCP` $\rightarrow$ `Transmission Control Protocol`, `SACK` $\rightarrow$ `Selective Acknowledgments`, `AIMD` $\rightarrow$ `Additive-Increase Multiplicative-Decrease`).
- **Keyword Extraction**: Filters stopwords while preserving high-information domain tokens.
- **Filter Hint Detection**: Extracts page references (e.g. `"on page 2"` $\rightarrow$ `page_number=2`) and table requests.

### F. Heuristic Reranking (`rag/retrieval/reranker.py`)
- Enhances Top-K precision by applying:
  1. Exact continuous phrase match bonus across combined text and section titles.
  2. Section heading alignment bonus.
  3. Keyword overlap bonus for domain entities.
  4. Table intent matching (boosts `content_type="table"` when queries ask for matrices or tables).
  5. Mathematical formula matching (boosts chunks with math notation when queries ask for equations or throughput).
  6. Page targeting alignment.

### G. Context Construction & Source Citations (`rag/retrieval/context_builder.py`)
- Deduplicates chunks across ID and content text.
- Enforces strict token budgets (`max_tokens=2000`) using `tiktoken`.
- Assembles structured markdown blocks:
  ```markdown
  [Source 1]
  Document: sample.pdf
  Page: 1
  Section: 2. Mathematical Formulation of Throughput
  Content:
  ...
  ```
- Generates typed `SourceCitation` objects containing direct Azure Blob Storage URLs, page numbers, and excerpts.

---

## 4. Evaluation Benchmark Results

Evaluated against `rag/evaluation/dataset.json` (8 technical questions derived from `sample.pdf`):

| Retrieval Mode | Hit Rate @ 3 (Recall) | Mean Reciprocal Rank (MRR) | Precision @ 3 | Avg Latency (ms) |
| :--- | :---: | :---: | :---: | :---: |
| **Keyword (BM25)** | 100.0% | 0.9167 | 0.3333 | 214.9 ms |
| **Vector (Cosine)** | 100.0% | 0.9375 | 0.4583 | 790.4 ms |
| **Hybrid (RRF)** | **100.0%** | **1.0000** | **0.4583** | **105.8 ms** |
| **Hybrid + Reranked** | **100.0%** | **1.0000** | **0.4583** | **245.5 ms** |

- **Context Factual Grounding Completeness**: **97.3%** of all expected academic facts and equations were verified present in the constructed context (36 / 37 facts matched).
- Full detailed breakdown saved at: [`rag/evaluation/evaluation_results.md`](file:///c:/Users/divya_y6vjlfl/OneDrive/Desktop/CogniLens/rag/evaluation/evaluation_results.md).

---

## 5. How to Run & Verify

### 1. Environment Configuration
Verify that `.env` contains the required Azure endpoints and credentials (see `.env.example`):
```bash
# Azure Storage
AZURE_STORAGE_CONNECTION_STRING=...
AZURE_STORAGE_CONTAINER=documents

# Azure AI Document Intelligence
AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT=https://mlagent-document-intelligence.cognitiveservices.azure.com/
AZURE_DOCUMENT_INTELLIGENCE_KEY=...

# Azure AI Search (Central India)
AZURE_SEARCH_ENDPOINT=https://mlagent-search-divyansh.search.windows.net
AZURE_SEARCH_API_KEY=...
AZURE_SEARCH_INDEX_NAME=learning-agent-chunks

# Azure OpenAI Embeddings (UAE North)
AZURE_EMBEDDING_ENDPOINT=https://mlagent-foundry-uae.services.ai.azure.com
AZURE_EMBEDDING_API_KEY=...
AZURE_EMBEDDING_DEPLOYMENT=text-embedding-3-small
AZURE_EMBEDDING_DIMENSIONS=1536
```

### 2. Run Local Pipeline Verification
Runs 5 automated checks across the environment, corpus, schema, query rewriter, reranker, and context builder:
```bash
python scripts/verify_pipeline.py
```

### 3. Run Full Offline Test Suite (0 Azure Credits)
Runs all 50 unit and pipeline tests completely offline using mocks:
```bash
python -m unittest discover -s tests -p "test_*.py" -v
```

### 4. Create or Update Azure AI Search Index
```bash
python scripts/create_search_index.py
```

### 5. Index Pre-Embedded Chunks
Indexes all 7 embedded chunks without spending re-embedding credits:
```bash
python scripts/index_chunks.py data/processed/chunks/sample.pdf_chunks_embedded.json
```

### 6. Query the Knowledge Base (CLI)
- **Hybrid Search with Reranking and Context Building**:
  ```bash
  python scripts/search_documents.py "How does Bandwidth-Delay Product affect TCP?" --rerank --build-context
  ```
- **Pure Keyword Search (Zero API calls)**:
  ```bash
  python scripts/search_documents.py "Bandwidth-Delay Product" --keyword-only
  ```
- **Pure Vector Similarity Search**:
  ```bash
  python scripts/search_documents.py "throughput Mathis formula" --vector-only
  ```

### 7. Run Comprehensive RAG Evaluation
Benchmarks all 4 retrieval modes and context grounding against the golden evaluation dataset:
```bash
python scripts/evaluate_rag.py
```

---

## 6. Project Directory Structure

```
CogniLens/
├── data/
│   ├── processed/
│   │   ├── sample.pdf_72e815ea.json              # Processed document JSON
│   │   └── chunks/
│   │       ├── sample.pdf_chunks.json            # 7 semantic chunks
│   │       └── sample.pdf_chunks_embedded.json   # 7 chunks with 1536d vectors
│   └── sample_documents/
│       └── sample.pdf                            # 2-page educational source PDF
├── rag/
│   ├── chunking/                                 # Semantic chunking & metadata models
│   ├── embeddings/                               # Azure OpenAI embedding adapter & cache
│   ├── evaluation/                               # Retrieval benchmark & grounding checks
│   │   ├── dataset.json                          # 8 curated evaluation queries
│   │   ├── evaluate_answers.py                   # Context grounding fact checker
│   │   ├── evaluate_retrieval.py                 # 4-mode benchmark runner
│   │   └── evaluation_results.md                 # Markdown evaluation report
│   ├── ingestion/                                # DocumentLoader & Document Intelligence
│   ├── preprocessing/                            # TextCleaner & TextNormalizer
│   ├── retrieval/                                # Advanced retrieval pipeline
│   │   ├── context_builder.py                    # Budget-aware context & SourceCitation
│   │   ├── query_rewriter.py                     # Acronym expansion & preprocessing
│   │   └── reranker.py                           # Heuristic relevance reranker
│   └── search/                                   # Azure AI Search indexing & hybrid retriever
│       ├── index_creator.py                      # SearchIndexManager schema definitions
│       ├── retriever.py                          # Retriever (hybrid, vector, keyword)
│       └── search_service.py                     # Batch document indexing service
├── scripts/
│   ├── chunk_document.py                         # PDF chunking CLI
│   ├── create_search_index.py                    # Search index creation CLI
│   ├── evaluate_rag.py                           # Evaluation suite runner CLI
│   ├── index_chunks.py                           # Embedding & indexing CLI
│   ├── ingest_document.py                        # PDF ingestion CLI
│   ├── search_documents.py                       # Knowledge search CLI with citations
│   └── verify_pipeline.py                        # End-to-end verification script
└── tests/
    ├── test_day1_pipeline.py                     # Day 1 ingestion tests
    ├── test_day2_day3_pipeline.py                # Day 2 & 3 chunking and search tests
    └── test_retrieval_and_rag.py                 # Retrieval, reranker, context & eval tests
```

---

## 7. Cost Control & Student Budget Management
- **Zero Azure Calls in Automated Tests**: All 50 unit tests utilize offline mocks, guaranteeing zero Azure credit spend in CI/CD.
- **Pre-computed Embedding Reuse**: `EmbeddingService` checks chunk vector presence before making API requests, preventing duplicate embedding charges for already-embedded documents.
- **Keyword Search Option**: The `--keyword-only` mode enables local testing of text retrieval without invoking Azure OpenAI embeddings.
- **HNSW Cosine Vector Profile**: Configured with standard basic search parameters, avoiding costly semantic ranker add-ons while achieving 100% Hit Rate and 1.0000 MRR.
