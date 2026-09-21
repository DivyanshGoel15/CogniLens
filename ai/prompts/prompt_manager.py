"""Prompt Manager & Template Renderer for CogniLens AI.

Manages system instructions, grounded Q&A templates, multi-level explanations,
quizzes, and flashcards with strict academic grounding constraints.
"""

import os
from typing import Any, Dict, List, Optional

PROMPTS_DIR = os.path.dirname(__file__)

DEFAULT_SYSTEM_INSTRUCTION = """You are CogniLens AI, an expert, encouraging, and academically rigorous Multimodal Cognitive Learning Assistant.

Academic & Grounding Guardrails:
1. Provide accurate, clear, and grounded answers strictly based on verified source materials provided in the context.
2. Cite supporting facts inline using source references (e.g. [Source 1], [Source 2]).
3. If the provided document context is missing or does not contain enough information to answer the question, explicitly state: "The provided document context does not contain enough information to answer this question accurately." Do not invent facts.
4. Adapt explanations to the student's target difficulty level (Beginner, Intermediate, Technical/Advanced).
5. Maintain a supportive, instructional tone suitable for university and STEM students."""


def load_template(filename: str) -> str:
    """Load prompt template text from disk."""
    path = os.path.join(PROMPTS_DIR, filename)
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            return f.read()
    return ""


def render_prompt(template_name: str, **kwargs: Any) -> str:
    """Load and format a template with kwargs."""
    raw = load_template(template_name)
    if not raw:
        return ""
    # Safe substitution avoiding curly brace collision with JSON schemas
    result = raw
    for k, v in kwargs.items():
        result = result.replace(f"{{{k}}}", str(v))
    return result


def build_grounded_qa_prompt(
    query: str,
    context: str,
    conversation_history: Optional[List[Dict[str, str]]] = None,
) -> str:
    """Build grounded question-answering prompt with history and context."""
    history_section = ""
    if conversation_history:
        formatted_history = []
        for msg in conversation_history[-6:]:  # Last 6 turns
            role = msg.get("role", "user").capitalize()
            content = msg.get("content", "")
            formatted_history.append(f"{role}: {content}")
        history_section = "Conversation History:\n" + "\n".join(formatted_history) + "\n\n"

    return (
        f"{history_section}"
        f"Grounded Document Context:\n"
        f"---\n"
        f"{context.strip() if context else 'No document context available.'}\n"
        f"---\n\n"
        f"Student Question: {query}\n\n"
        f"Instructions:\n"
        f"1. Answer the question using ONLY the provided context above.\n"
        f"2. Cite your sources inline using [Source 1], [Source 2], etc.\n"
        f"3. If the context does not contain sufficient details to answer, state that the provided material does not cover this topic.\n"
        f"4. Be structured, clear, and pedagogically helpful."
    )


def build_explanation_prompt(
    topic: str,
    context: str,
    difficulty: str = "Intermediate",
) -> str:
    """Build multi-level concept explanation prompt."""
    style_guidance = {
        "beginner": "Use simple language, intuitive analogies, and avoid heavy jargon. Explain fundamentals first.",
        "intermediate": "Balance clarity with technical correctness. Cover operational mechanics and key concepts.",
        "technical": "Provide deep technical rigor, architectural mechanisms, protocol steps, and exact trade-offs.",
        "eli5": "Explain like I'm 5 years old: ultra-simple terms with playful, vivid real-world analogies.",
    }.get(difficulty.lower(), "Balance clarity with technical correctness.")

    return (
        f"Topic: {topic}\n"
        f"Target Difficulty: {difficulty.capitalize()}\n"
        f"Pedagogical Focus: {style_guidance}\n\n"
        f"Grounded Document Context:\n"
        f"---\n"
        f"{context.strip() if context else 'General academic knowledge.'}\n"
        f"---\n\n"
        f"Create a structured explanation in valid JSON matching the ExplanationResponse schema."
    )
