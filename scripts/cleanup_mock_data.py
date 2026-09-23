"""
One-time cleanup script: Remove seeded mock OS + ML documents from all user accounts.

These documents (OS_Unit3_Deadlocks.pdf, Machine Learning — Linear Regression.pdf)
were automatically seeded on user creation. This script removes them so users
start with a clean, empty workspace.

Usage:
    python scripts/cleanup_mock_data.py
"""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

from server.app.database.connection import SessionLocal, init_db
from server.app.models.document import DocumentModel

MOCK_FILENAMES = {
    "OS_Unit3_Deadlocks.pdf",
    "Machine Learning — Linear Regression.pdf",
}

MOCK_TITLE_PATTERNS = [
    "OS — Unit 3 Deadlocks",
    "Machine Learning — Linear Regression",
]


def cleanup_mock_documents():
    """Remove all seeded mock documents from every user account."""
    init_db()
    db = SessionLocal()
    try:
        deleted_count = 0
        all_docs = db.query(DocumentModel).all()
        for doc in all_docs:
            should_delete = (
                doc.filename in MOCK_FILENAMES
                or any(doc.title.startswith(p) for p in MOCK_TITLE_PATTERNS)
                or (doc.id and (doc.id.startswith("mat-os-") or doc.id.startswith("mat-ml-")))
            )
            if should_delete:
                print(f"  [DELETE] User: {doc.user_id} | Doc: '{doc.title}' ({doc.filename})")
                db.delete(doc)
                deleted_count += 1

        db.commit()
        print(f"\n[OK] Cleanup complete. Removed {deleted_count} mock document(s) from the database.")
        if deleted_count == 0:
            print("   (No mock documents found -- database may already be clean.)")
    except Exception as e:
        db.rollback()
        print(f"\n[ERROR] Error during cleanup: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    print("=" * 60)
    print("CogniLens -- Mock Data Cleanup Script")
    print("=" * 60)
    print("Scanning for seeded mock OS + ML documents...\n")
    cleanup_mock_documents()
