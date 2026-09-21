"""Deterministic Intent Router for CogniLens AI.

Classifies incoming student queries into operational modalities:
- QA (Grounded factual question answering)
- Explanation (Multi-level concept explanation)
- Quiz (Multiple-choice assessment)
- Flashcards (Active recall deck)
"""

import re
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


class IntentType(str, Enum):
    """Supported interaction intent types."""
    QA = "qa"
    EXPLANATION = "explanation"
    QUIZ = "quiz"
    FLASHCARDS = "flashcards"


class QueryIntent(BaseModel):
    """Classification result with extracted intent parameters."""
    intent: IntentType = Field(..., description="Classified intent modality")
    topic: str = Field(..., description="Normalized topic extracted from query")
    difficulty: str = Field("Intermediate", description="Target difficulty level")
    count: Optional[int] = Field(None, description="Optional requested item count")
    confidence: float = Field(1.0, description="Routing confidence score")


class IntentRouter:
    """Classifies user queries into interaction modalities."""

    QUIZ_PATTERNS = [
        r"\b(quiz|test me|mcq|practice questions|assessment|questions for practice)\b",
        r"\b(give me (a )?quiz|create (a )?quiz)\b",
    ]

    FLASHCARD_PATTERNS = [
        r"\b(flashcard|flash card|flashcards|flash cards|revision card|revision deck|cards for revision)\b",
        r"\b(give me (a )?deck|create flashcards)\b",
    ]

    EXPLANATION_PATTERNS = [
        r"\b(explain|in simple terms|eli5|break down|how does .* work|walk me through|clarify|teach me|simplif(y|ied))\b",
    ]

    DIFFICULTY_PATTERNS = {
        "Beginner": [r"\b(beginner|simple|easy|basics?|fundament(al|als)|eli5|child)\b"],
        "Technical": [r"\b(technical|advanced|deep dive|rigorous|in-depth|under the hood)\b"],
        "Intermediate": [r"\b(intermediate|standard|moderate)\b"],
    }

    def classify(self, query: str) -> QueryIntent:
        """Classify user query and extract intent metadata.

        Args:
            query: Raw user message.

        Returns:
            QueryIntent object.
        """
        clean_q = query.strip().lower()

        # 1. Detect difficulty level
        detected_difficulty = "Intermediate"
        for diff_level, patterns in self.DIFFICULTY_PATTERNS.items():
            if any(re.search(pat, clean_q) for pat in patterns):
                detected_difficulty = diff_level
                break

        # 2. Detect item count if specified (e.g., "5 questions", "3 flashcards")
        count_match = re.search(r"\b(\d+)\s*(question|card|item)s?\b", clean_q)
        item_count = int(count_match.group(1)) if count_match else None

        # 3. Detect intent by order of specificity: Quiz -> Flashcards -> Explanation -> QA
        for pat in self.QUIZ_PATTERNS:
            if re.search(pat, clean_q):
                topic = self._extract_topic(query, ["quiz", "test me", "practice", "on", "about", "for"])
                return QueryIntent(
                    intent=IntentType.QUIZ,
                    topic=topic or query,
                    difficulty=detected_difficulty,
                    count=item_count or 3,
                    confidence=0.95,
                )

        for pat in self.FLASHCARD_PATTERNS:
            if re.search(pat, clean_q):
                topic = self._extract_topic(query, ["flashcards", "flashcard", "cards", "deck", "on", "about", "for"])
                return QueryIntent(
                    intent=IntentType.FLASHCARDS,
                    topic=topic or query,
                    difficulty=detected_difficulty,
                    count=item_count or 5,
                    confidence=0.95,
                )

        for pat in self.EXPLANATION_PATTERNS:
            if re.search(pat, clean_q):
                topic = self._extract_topic(query, ["explain", "break down", "how does", "what is", "about", "in simple terms", "eli5"])
                return QueryIntent(
                    intent=IntentType.EXPLANATION,
                    topic=topic or query,
                    difficulty=detected_difficulty,
                    count=None,
                    confidence=0.90,
                )

        # Default fallback to standard grounded QA
        return QueryIntent(
            intent=IntentType.QA,
            topic=query,
            difficulty=detected_difficulty,
            count=None,
            confidence=0.85,
        )

    def _extract_topic(self, query: str, trigger_words: list[str]) -> str:
        """Extract core subject from query by stripping trigger patterns."""
        result = query.strip()
        # Remove trailing punctuation
        result = re.sub(r"[?!.]+$", "", result)
        for tw in trigger_words:
            pattern = re.compile(rf"\b{re.escape(tw)}\b", re.IGNORECASE)
            result = pattern.sub("", result)
        # Strip common conversational request prefixes
        result = re.sub(r"^(can you\s+)?(give me\s+|show me\s+|make me\s+|create\s+|generate\s+)?(\d+\s+)?(flashcards?|cards?|questions?|quiz\s+me|quiz)?\s*", "", result, flags=re.IGNORECASE).strip()
        result = re.sub(r"^(me\s+)?(on|about|for|to|the|a|an)\s+", "", result, flags=re.IGNORECASE).strip()
        result = re.sub(r"^(on|about|for|to|the|a|an)\s+", "", result, flags=re.IGNORECASE).strip()
        return result if len(result) > 2 else query
