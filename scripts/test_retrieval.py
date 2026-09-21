"""Test script validating the mandatory retrieval queries against Azure AI Search.

Tests:
A. "What are the layers of the network stack and what is the PDU of each layer?"
   Expected: The network-layer table chunk from page 1 should be among the top results.
B. "How does TCP congestion control work?"
   Expected: The congestion-control section from page 2 should be among the top results.
C. "What is the role of the physical layer?"
   Expected: The relevant network-layer/physical-layer chunk should be retrieved.

Usage:
    python scripts/test_retrieval.py
"""

import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from dotenv import load_dotenv

load_dotenv()

if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

from rag.retrieval.pipeline import RAGPipeline


def run_tests() -> int:
    pipeline = RAGPipeline()
    failures = 0

    print("=" * 65)
    print("MANDATORY RETRIEVAL TEST SUITE — AZURE AI SEARCH")
    print("=" * 65)

    # Test A
    query_a = "What are the layers of the network stack and what is the PDU of each layer?"
    print(f"\n[TEST A] Query: \"{query_a}\"")
    results_a = pipeline.retrieve_chunks(query=query_a, top_k=3, mode="hybrid", rerank=True)

    print(f"Retrieved {len(results_a)} passage(s):")
    for idx, r in enumerate(results_a, 1):
        print(f"  #{idx} [{r.chunk_id}] (Page {r.page_number}, {r.content_type}): {r.section or 'General'}")
    
    # Check if page 1 table chunk (c01 or c05) is in top results
    chunk_ids_a = [r.chunk_id for r in results_a]
    page_numbers_a = [r.page_number for r in results_a]
    has_table_or_stack = any("c01" in cid or "c05" in cid for cid in chunk_ids_a)
    has_page_1 = 1 in page_numbers_a

    if has_table_or_stack and has_page_1:
        print("  --> [PASS] Table/Protocol Stack chunk on Page 1 is in Top Results.")
    else:
        print("  --> [FAIL] Expected table/stack chunk from Page 1 in top results.")
        failures += 1

    # Test B
    query_b = "How does TCP congestion control work?"
    print(f"\n[TEST B] Query: \"{query_b}\"")
    results_b = pipeline.retrieve_chunks(query=query_b, top_k=3, mode="hybrid", rerank=True)

    print(f"Retrieved {len(results_b)} passage(s):")
    for idx, r in enumerate(results_b, 1):
        print(f"  #{idx} [{r.chunk_id}] (Page {r.page_number}, {r.content_type}): {r.section or 'General'}")

    # Check if page 2 congestion control chunk (c06) is in top results
    chunk_ids_b = [r.chunk_id for r in results_b]
    has_congestion = any("c06" in cid for cid in chunk_ids_b)
    has_page_2 = any(r.page_number == 2 for r in results_b)

    if has_congestion and has_page_2:
        print("  --> [PASS] Congestion control section on Page 2 is in Top Results.")
    else:
        print("  --> [FAIL] Expected congestion control chunk from Page 2 in top results.")
        failures += 1

    # Test C
    query_c = "What is the role of the physical layer?"
    print(f"\n[TEST C] Query: \"{query_c}\"")
    results_c = pipeline.retrieve_chunks(query=query_c, top_k=3, mode="hybrid", rerank=True)

    print(f"Retrieved {len(results_c)} passage(s):")
    for idx, r in enumerate(results_c, 1):
        print(f"  #{idx} [{r.chunk_id}] (Page {r.page_number}, {r.content_type}): {r.section or 'General'}")

    # Check if physical layer / layer chunk (c01, c05, or c03) is retrieved
    has_physical_chunk = any("Physical" in r.text or "c01" in r.chunk_id or "c05" in r.chunk_id for r in results_c)

    if has_physical_chunk:
        print("  --> [PASS] Relevant physical layer evidence passage retrieved.")
    else:
        print("  --> [FAIL] Expected physical layer chunk.")
        failures += 1

    print("\n" + "=" * 65)
    if failures == 0:
        print("ALL MANDATORY RETRIEVAL TESTS PASSED (3 / 3)")
        print("=" * 65)
        return 0
    else:
        print(f"MANDATORY RETRIEVAL TESTS COMPLETED WITH {failures} FAILURE(S)")
        print("=" * 65)
        return 1


if __name__ == "__main__":
    sys.exit(run_tests())
