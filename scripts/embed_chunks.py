import json
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from dotenv import load_dotenv

load_dotenv()

from rag.embeddings.embedding_service import EmbeddingService


INPUT_FILE = Path("data/processed/chunks/sample.pdf_chunks.json")


def main():
    print(f"Loading chunks from: {INPUT_FILE}")

    with open(INPUT_FILE, "r", encoding="utf-8") as f:
        chunks_data = json.load(f)

    # Handle the existing chunk file structure
    if isinstance(chunks_data, dict):
        chunks = chunks_data.get("chunks", [])
    else:
        chunks = chunks_data

    print(f"Found {len(chunks)} chunks.")

    if not chunks:
        raise ValueError("No chunks found in the input file.")

    service = EmbeddingService()

    # Your existing EmbeddingService expects DocumentChunk objects,
    # so for this first test we embed the text directly.
    texts = [chunk["text"] for chunk in chunks]

    embeddings = []

    for i, text in enumerate(texts, start=1):
        print(f"Embedding chunk {i}/{len(texts)}...")

        embedding = service.embed_text(text)
        embeddings.append(embedding)

        print(f"  Dimensions: {len(embedding)}")

    output = []

    for chunk, embedding in zip(chunks, embeddings):
        chunk_with_embedding = dict(chunk)
        chunk_with_embedding["embedding"] = embedding
        output.append(chunk_with_embedding)

    output_file = Path(
        "data/processed/chunks/sample.pdf_chunks_embedded.json"
    )

    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    print("\nEmbedding complete!")
    print(f"Chunks embedded: {len(output)}")
    print(f"Vector dimensions: {len(output[0]['embedding'])}")
    print(f"Saved to: {output_file}")


if __name__ == "__main__":
    main()