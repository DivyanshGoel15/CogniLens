#!/usr/bin/env python3
"""End-to-End RAG + LLM Integration Demo for CogniLens.

Demonstrates seamless orchestration between Azure RAG retrieval and LLM generation:
1. Grounded Question Answering with Inline Citations
2. Multi-Level Pedagogical Concept Explanation
3. Multiple-Choice Quiz Generation with Options A-D
4. Active-Recall Flashcards with Antecedent Resolution ("it" -> previous topic)

Usage:
    python scripts/demo_rag_llm.py --provider mock
    python scripts/demo_rag_llm.py --provider gemini
"""

import argparse
import json
import os
import sys
from typing import Optional

# Safe UTF-8 console output for Windows terminals
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Ensure workspace root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from dotenv import load_dotenv
load_dotenv()

from ai.chat.chat_engine import ChatEngine, ChatMessage
from ai.llm.llm_service import get_llm_provider
from server.app.services.rag_service import RAGService


def print_separator(title: str = ""):
    width = 78
    if title:
        line = f"=== {title} "
        line += "=" * max(0, width - len(line))
        print(f"\n{line}")
    else:
        print("=" * width)


def main():
    parser = argparse.ArgumentParser(description="CogniLens RAG + LLM Integration Demo")
    parser.add_argument(
        "--provider",
        choices=["auto", "mock", "gemini"],
        default="auto",
        help="LLM provider: auto (uses gemini if key present, else mock), mock, or gemini",
    )
    args = parser.parse_args()

    # Determine provider
    provider_name = args.provider
    if provider_name == "auto":
        gemini_key = os.getenv("GEMINI_API_KEY", "").strip()
        if gemini_key and gemini_key != "your_actual_key_here":
            provider_name = "gemini"
        else:
            provider_name = "mock"

    print_separator("COGNILENS MULTIMODAL LEARNING AGENT — RAG + LLM DEMO")
    print(f" [OK] Active LLM Provider: {provider_name.upper()}")
    print(f" [OK] RAG Index: learning-agent-chunks (Azure AI Search)")
    print_separator()

    llm_provider = get_llm_provider(provider_name)
    rag_service = RAGService()
    chat_engine = ChatEngine(llm_provider=llm_provider, rag_service=rag_service)

    # --------------------------------------------------------------------------
    # DEMO TURN 1: Grounded Explanation
    # Query: "Explain TCP congestion control in simple terms."
    # --------------------------------------------------------------------------
    query1 = "Explain TCP congestion control in simple terms."
    print_separator("TURN 1: CONCEPT EXPLANATION")
    print(f"User: \"{query1}\"")
    print("Agent: Thinking, retrieving grounded context, and classifying intent...")

    resp1 = chat_engine.chat(query1)

    print(f"\n[Detected Intent]    : {resp1.intent.upper()}")
    print(f"[Extracted Topic]    : {resp1.topic}")
    print(f"[Generation Latency] : {resp1.latency_ms:.1f} ms")
    print(f"[Provider]           : {resp1.provider}")
    print("\n--- Model Response ---")
    print(resp1.message)

    if resp1.citations:
        print("\n--- Verified Source Citations ---")
        for idx, cit in enumerate(resp1.citations, 1):
            doc = cit.get("document_name", cit.get("source", "Course Material"))
            page = cit.get("page_number", "N/A")
            sec = cit.get("section", "General")
            snip = cit.get("snippet", cit.get("excerpt", ""))[:120]
            print(f" [{idx}] File: {doc} | Page: {page} | Section: {sec}")
            if snip:
                print(f"     Quote: \"{snip}...\"")

    # --------------------------------------------------------------------------
    # DEMO TURN 2: Assessment Quiz
    # Query: "Quiz me on TCP congestion control."
    # --------------------------------------------------------------------------
    query2 = "Quiz me on TCP congestion control."
    print_separator("TURN 2: GROUNDED ASSESSMENT QUIZ")
    print(f"User: \"{query2}\"")
    print("Agent: Constructing curriculum-aligned multiple-choice questions...")

    # Maintain history from Turn 1
    history = [
        ChatMessage(role="user", content=query1),
        ChatMessage(role="assistant", content=resp1.message, citations=resp1.citations),
    ]

    resp2 = chat_engine.chat(query2, history=history)

    print(f"\n[Detected Intent]    : {resp2.intent.upper()}")
    print(f"[Extracted Topic]    : {resp2.topic}")
    print(f"[Generation Latency] : {resp2.latency_ms:.1f} ms")
    print(f"\nSummary: {resp2.message}")

    if resp2.structured_payload and "questions" in resp2.structured_payload:
        quiz_data = resp2.structured_payload
        print(f"\nQuiz Title: {quiz_data.get('title', 'Assessment')}")
        print(f"Difficulty: {quiz_data.get('target_difficulty', 'Medium')}")
        for q in quiz_data.get("questions", []):
            print(f"\nQ{q.get('question_id')}: {q.get('question_text')}")
            for opt in q.get("options", []):
                marker = "(*)" if opt.get("option_id") == q.get("correct_option_id") else "   "
                print(f"  {marker} {opt.get('option_id')}. {opt.get('text')}")
            print(f"  --> Explanation: {q.get('explanation')}")

    # --------------------------------------------------------------------------
    # DEMO TURN 3: Context-Aware Referent Resolution & Flashcards
    # Query: "Can you give me 3 flashcards on it?"
    # Demonstrates: Resolving "it" to "TCP congestion control" using turn history!
    # --------------------------------------------------------------------------
    query3 = "Can you give me 3 flashcards on it?"
    print_separator("TURN 3: CONVERSATIONAL REFERENT RESOLUTION & FLASHCARDS")
    print(f"User: \"{query3}\"")
    print("Agent: Resolving pronoun 'it' to antecedent in conversation history...")

    resolved_q = chat_engine.resolve_referents(query3, history)
    print(f"[Resolved Query]     : \"{resolved_q}\"")

    history.extend([
        ChatMessage(role="user", content=query2),
        ChatMessage(role="assistant", content=resp2.message),
    ])

    resp3 = chat_engine.chat(query3, history=history)

    print(f"[Detected Intent]    : {resp3.intent.upper()}")
    print(f"[Resolved Topic]     : {resp3.topic}")
    print(f"[Generation Latency] : {resp3.latency_ms:.1f} ms")
    print(f"\nSummary: {resp3.message}")

    if resp3.structured_payload and "cards" in resp3.structured_payload:
        deck_data = resp3.structured_payload
        print(f"\nDeck Title: {deck_data.get('title', 'Flashcard Deck')}")
        for card in deck_data.get("cards", []):
            print(f"\nCard #{card.get('card_id')}:")
            print(f"  [Front Question] : {card.get('front_question')}")
            print(f"  [Back Answer]    : {card.get('back_answer')}")
            if card.get("hint"):
                print(f"  [Memory Hint]    : {card.get('hint')}")

    print_separator("DEMO COMPLETED SUCCESSFULLY [OK]")


if __name__ == "__main__":
    main()
