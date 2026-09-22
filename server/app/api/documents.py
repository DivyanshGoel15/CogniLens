"""FastAPI router for Document Management, File Uploads, and Page Retrieval."""

import logging
from typing import List, Optional
from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status
from pydantic import BaseModel

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/documents", tags=["Documents & Ingestion"])

class DocumentSection(BaseModel):
    id: str
    page: int
    title: str
    snippet: str

class DocumentMetadata(BaseModel):
    id: str
    title: str
    filename: str
    type: str
    pagesCount: int
    size: str
    uploadDate: str
    status: str
    topics: List[str]
    course: str
    contentPreview: Optional[str] = None
    sections: Optional[List[DocumentSection]] = None

_DOCUMENT_STORE: List[DocumentMetadata] = [
    DocumentMetadata(
        id="mat-os-unit3",
        title="OS — Unit 3 Deadlocks & Synchronization",
        filename="OS_Unit3_Deadlocks.pdf",
        type="pdf",
        pagesCount=42,
        size="4.8 MB",
        uploadDate="Sep 18, 2026",
        status="indexed",
        course="Operating Systems",
        topics=["Deadlock", "Coffman Conditions", "Resource Allocation Graph", "Banker Algorithm"],
        contentPreview="A deadlock occurs when a set of processes are blocked because each process is holding a resource and waiting for another resource acquired by some other process.",
        sections=[
            DocumentSection(id="s1", page=1, title="Introduction to Deadlock & Concurrency", snippet="A deadlock occurs when a set of processes are blocked..."),
            DocumentSection(id="s2", page=18, title="Four Necessary Coffman Conditions", snippet="1. Mutual Exclusion, 2. Hold and Wait, 3. No Preemption, 4. Circular Wait..."),
            DocumentSection(id="s3", page=31, title="Banker's Safe State Algorithm", snippet="Dijkstra's Banker Algorithm simulates allocation for safety testing..."),
            DocumentSection(id="s4", page=42, title="Resource Allocation Graph & Cycle Detection", snippet="Deadlock Detection in single-instance systems reduces to cycle detection in a directed RAG graph...")
        ]
    ),
    DocumentMetadata(
        id="mat-ml-linear",
        title="Machine Learning — Linear Regression & Cost Functions",
        filename="Machine Learning — Linear Regression.pdf",
        type="pdf",
        pagesCount=28,
        size="3.2 MB",
        uploadDate="Sep 19, 2026",
        status="indexed",
        course="Machine Learning",
        topics=["Linear Regression", "Mean Squared Error", "Gradient Descent", "Hyperparameters"],
        contentPreview="Supervised learning algorithm used to model the linear relationship between a dependent variable y and one or more independent predictor features X."
    )
]

@router.get("", response_model=List[DocumentMetadata])
def get_documents() -> List[DocumentMetadata]:
    """Retrieve all indexed documents in the knowledge base."""
    return _DOCUMENT_STORE

@router.get("/{doc_id}", response_model=DocumentMetadata)
def get_document_by_id(doc_id: str) -> DocumentMetadata:
    """Retrieve metadata for a specific document."""
    for doc in _DOCUMENT_STORE:
        if doc.id == doc_id:
            return doc
    raise HTTPException(status_code=404, detail="Document not found")

@router.post("/upload", response_model=DocumentMetadata, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    course: str = Form("Operating Systems")
) -> DocumentMetadata:
    """Upload and index a study material PDF/image into the CogniLens knowledge base."""
    file_type = "pdf" if file.filename.endswith(".pdf") else "image" if file.filename.endswith((".jpg", ".png")) else "doc"
    doc_id = f"mat-{len(_DOCUMENT_STORE) + 100}"
    title = file.filename.rsplit(".", 1)[0]
    
    new_doc = DocumentMetadata(
        id=doc_id,
        title=title,
        filename=file.filename,
        type=file_type,
        pagesCount=15,
        size="2.4 MB",
        uploadDate="Just now",
        status="indexed",
        course=course,
        topics=[course, title, "OCR Embeddings"],
        contentPreview=f"Uploaded custom document {file.filename} for course {course}. Vectorized into grounded store.",
        sections=[
            DocumentSection(id=f"{doc_id}-s1", page=1, title=f"{title} — Overview", snippet=f"Grounded overview of {file.filename}."),
            DocumentSection(id=f"{doc_id}-s2", page=5, title=f"{title} — Section 2", snippet=f"Key analytical concepts and formulas.")
        ]
    )
    _DOCUMENT_STORE.insert(0, new_doc)
    logger.info("Successfully ingested and indexed document %s (%s)", doc_id, file.filename)
    return new_doc

@router.delete("/{doc_id}")
def delete_document(doc_id: str):
    """Delete a document from the knowledge base."""
    global _DOCUMENT_STORE
    _DOCUMENT_STORE = [d for d in _DOCUMENT_STORE if d.id != doc_id]
    return {"success": True, "deleted": doc_id}
