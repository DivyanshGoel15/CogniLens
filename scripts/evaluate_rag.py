"""CLI script to run full RAG retrieval and context evaluation suite.

Usage:
    python scripts/evaluate_rag.py
    python scripts/evaluate_rag.py --top-k 5
"""

import argparse
import logging
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

from rag.evaluation.evaluate_answers import ContextGroundingEvaluator
from rag.evaluation.evaluate_retrieval import RetrievalEvaluator


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Execute full RAG Retrieval & Grounding Evaluation Suite.")
    parser.add_argument(
        "--top-k",
        "-k",
        type=int,
        default=3,
        help="Evaluation Top-K threshold (default: 3).",
    )
    parser.add_argument(
        "--output-file",
        type=str,
        default="rag/evaluation/evaluation_results.md",
        help="Path to output markdown report file.",
    )
    parser.add_argument(
        "--verbose",
        "-v",
        action="store_true",
        help="Enable verbose debug logging.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.WARNING,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    )

    print("=" * 65)
    print("RAG & Knowledge Engineering — Comprehensive Evaluation Suite")
    print("=" * 65)
    print(f"Top-K Threshold : {args.top_k}")
    print(f"Output Report   : {args.output_file}")
    print("-" * 65)

    try:
        # Part 1: Retrieval Evaluation across 4 Modes
        print("Running Part 1: Retrieval Modes Benchmark (Keyword vs Vector vs Hybrid vs Reranked)...")
        evaluator = RetrievalEvaluator()
        report = evaluator.run_benchmark(
            modes=["keyword", "vector", "hybrid", "hybrid_reranked"],
            top_k=args.top_k,
        )

        print("\n" + "=" * 65)
        print("Summary of Retrieval Modes")
        print("=" * 65)
        print(f"{'Mode':<20} | {'Hit Rate @ K':<14} | {'MRR':<8} | {'Precision':<10} | {'Latency':<10}")
        print("-" * 65)
        for mode, s in report.summaries.items():
            mode_name = mode.replace("_", " ").title()
            print(f"{mode_name:<20} | {s.hit_rate_at_k * 100:>11.1f}% | {s.mean_reciprocal_rank:>8.4f} | {s.mean_precision_at_k:>10.4f} | {s.avg_latency_ms:>7.1f} ms")
        print("=" * 65)

        # Part 2: Context Grounding Evaluation
        print("\nRunning Part 2: Context Factual Grounding Verification...")
        grounding_evaluator = ContextGroundingEvaluator()
        grounding_summary = grounding_evaluator.evaluate_grounding(top_k=args.top_k)

        print(f"Total Queries Evaluated : {grounding_summary.total_queries}")
        print(f"Average Grounding Score  : {grounding_summary.avg_grounding_score * 100:.1f}%")
        print(f"Total Facts Matched     : {grounding_summary.total_matched_facts} / {grounding_summary.total_expected_facts}")

        # Save Markdown Report
        md_content = evaluator.generate_markdown_report(report)
        md_content += f"\n## 4. Context Grounding Completeness\n"
        md_content += f"- **Average Fact Grounding Score**: `{grounding_summary.avg_grounding_score * 100:.1f}%`\n"
        md_content += f"- **Facts Verified**: `{grounding_summary.total_matched_facts} / {grounding_summary.total_expected_facts}`\n\n"
        md_content += "| Query ID | Query | Expected Facts | Matched Facts | Grounding Score |\n"
        md_content += "| :--- | :--- | :--- | :--- | :---: |\n"
        for c in grounding_summary.detailed_checks:
            short_q = c.query if len(c.query) <= 40 else c.query[:37] + "..."
            md_content += f"| `{c.query_id}` | {short_q} | {', '.join(c.expected_facts)} | {', '.join(c.matched_facts)} | {c.grounding_score * 100:.0f}% |\n"

        out_path = Path(args.output_file)
        out_path.parent.mkdir(parents=True, exist_ok=True)
        with open(out_path, "w", encoding="utf-8") as f:
            f.write(md_content)

        print(f"\n[SUCCESS] Comprehensive report written to: {out_path}")
        return 0

    except Exception as e:
        print(f"\n[EVALUATION ERROR] Evaluation failed: {e}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
