#!/usr/bin/env python3
"""
CLI Demonstration Script for AI / LLM Subsystem (Member 1).
Demonstrates Explanation, Quiz, Flashcards, and Recommendation pipelines.
Runs in offline mock mode by default (0 Azure credits spent).
"""

import sys
import os
import argparse
from typing import List, Dict, Any

# Ensure workspace root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from ai.llm.azure_openai import AzureOpenAIService
from ai.generation.explanation_generator import ExplanationGenerator
from ai.generation.quiz_generator import QuizGenerator
from ai.generation.flashcard_generator import FlashcardGenerator
from ai.generation.recommendation_generator import RecommendationGenerator
from ai.evaluation.llm_evaluation import LLMEvaluator


def get_sample_rag_chunks() -> List[Dict[str, Any]]:
    """Sample RAG context chunks representing extracted textbook passages."""
    return [
        {
            "source": "OS_Unit3_Deadlocks.pdf",
            "page_number": 42,
            "section": "3.1 Definition of Deadlock",
            "text": "A deadlock occurs when a set of processes are blocked because each process holds a resource and waits for another resource held by some other process in the set.",
            "relevance_score": 0.96,
        },
        {
            "source": "OS_Unit3_Deadlocks.pdf",
            "page_number": 43,
            "section": "3.2 Necessary Conditions for Deadlock",
            "text": "Four Coffman conditions must hold simultaneously for deadlock: 1. Mutual Exclusion, 2. Hold and Wait, 3. No Preemption, 4. Circular Wait.",
            "relevance_score": 0.94,
        },
    ]


def main():
    parser = argparse.ArgumentParser(description="Multimodal Learning Agent - AI Subsystem Demo")
    parser.add_argument("--mode", choices=["mock", "azure"], default="mock", help="Execution mode (default: mock)")
    parser.add_argument("--topic", default="Deadlocks in Operating Systems", help="Target topic")
    args = parser.parse_args()

    force_mock = (args.mode == "mock")
    llm_service = AzureOpenAIService(force_mock=force_mock)
    evaluator = LLMEvaluator()

    print("=" * 80)
    print(" 🧠 COGNILENS MULTIMODAL LEARNING AGENT — AI / LLM DEMO (Member 1)")
    print(f" Mode: {'MOCK (0 Azure Credits)' if force_mock else 'AZURE OPENAI'}")
    print(f" Target Topic: {args.topic}")
    print("=" * 80)

    chunks = get_sample_rag_chunks()

    # --------------------------------------------------------------------------
    # 1. Grounded Explanation Generation
    # --------------------------------------------------------------------------
    print("\n--- 📖 1. GROUNDED EXPLANATION GENERATOR ---")
    explanation, latency = evaluator.benchmark_latency(
        exp_gen := ExplanationGenerator(llm_service=llm_service).generate_explanation,
        query="What is a deadlock and what conditions cause it?",
        context_chunks=chunks,
        difficulty="Intermediate",
    )

    print(f"Title: {explanation.title}")
    print(f"Summary: {explanation.summary}")
    print(f"Analogy: {explanation.analogy}")
    print(f"Key Concepts: {', '.join(explanation.key_concepts)}")
    if explanation.citations:
        print(f"Citations: Page {explanation.citations[0].page_number} ({explanation.citations[0].section})")
    print(f"Latency: {latency} ms")

    # --------------------------------------------------------------------------
    # 2. Multiple Choice Quiz Generation
    # --------------------------------------------------------------------------
    print("\n--- 📝 2. ADAPTIVE QUIZ GENERATOR ---")
    quiz, latency = evaluator.benchmark_latency(
        quiz_gen := QuizGenerator(llm_service=llm_service).generate_quiz,
        topic=args.topic,
        context_chunks=chunks,
        num_questions=2,
        difficulty="Medium",
    )

    print(f"Quiz Title: {quiz.title}")
    print(f"Total Questions: {quiz.total_questions}")
    for q in quiz.questions:
        print(f"\n  Q{q.question_id}: {q.question_text}")
        for opt in q.options:
            marker = "[✓]" if opt.option_id == q.correct_option_id else "[ ]"
            print(f"    {marker} {opt.option_id}. {opt.text}")
        print(f"    Explanation: {q.explanation}")
    print(f"Latency: {latency} ms")

    # --------------------------------------------------------------------------
    # 3. Active Recall Flashcards
    # --------------------------------------------------------------------------
    print("\n--- 🎴 3. FLASHCARD DECK GENERATOR ---")
    deck, latency = evaluator.benchmark_latency(
        flash_gen := FlashcardGenerator(llm_service=llm_service).generate_flashcards,
        topic=args.topic,
        context_chunks=chunks,
        num_cards=2,
    )

    print(f"Deck Title: {deck.title}")
    for card in deck.cards:
        print(f"  Card #{card.card_id}:")
        print(f"    Front (Q): {card.front_question}")
        print(f"    Back  (A): {card.back_answer}")
        print(f"    Hint     : {card.hint}")
    print(f"Latency: {latency} ms")

    # --------------------------------------------------------------------------
    # 4. Recommendation & Weak Topic Assessment
    # --------------------------------------------------------------------------
    print("\n--- 🎯 4. ASSESSMENT & RECOMMENDATION GENERATOR ---")
    rec_gen = RecommendationGenerator(llm_service=llm_service)
    user_simulated_answers = {1: "A", 2: "C"}  # Simulated student quiz submission

    recommendation, latency = evaluator.benchmark_latency(
        rec_gen.evaluate_quiz_submission,
        quiz=quiz,
        user_answers=user_simulated_answers,
    )

    print(f"Overall Accuracy: {recommendation.accuracy_percentage}%")
    print(f"Suggested Adaptation: {recommendation.suggested_difficulty_adjustment}")
    print("Recommended Next Steps:")
    for step in recommendation.recommended_next_steps:
        print(f"  - {step}")
    print(f"Latency: {latency} ms")

    # --------------------------------------------------------------------------
    # 5. LLM Grounding & Evaluation Metrics
    # --------------------------------------------------------------------------
    print("\n--- 📊 5. LLM GROUNDING & EVALUATION SUITE ---")
    eval_metric = evaluator.run_full_evaluation(
        response_text=explanation.summary,
        context_text=chunks[0]["text"],
        latency_ms=latency,
    )
    print(f"Faithfulness Score: {eval_metric.faithfulness_score * 100}%")
    print(f"Grounding Score   : {eval_metric.grounding_score * 100}%")
    print(f"Schema Validity   : {'PASS' if eval_metric.schema_validity else 'FAIL'}")
    print("=" * 80)
    print(" ✅ Member 1 AI Subsystem Pipeline Execution Complete!\n")


if __name__ == "__main__":
    main()
