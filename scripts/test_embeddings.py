import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from dotenv import load_dotenv

load_dotenv()

from rag.embeddings.embedding_service import EmbeddingService


def main():
    service = EmbeddingService()

    text = "The transport layer provides end-to-end communication between applications."

    embedding = service.embed_text(text)

    print("\nEmbedding test successful!")
    print(f"Dimensions: {len(embedding)}")
    print(f"First 5 values: {embedding[:5]}")


if __name__ == "__main__":
    main()