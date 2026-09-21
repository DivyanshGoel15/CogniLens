"""
Structured Output Schemas & Robust JSON Extraction Utilities.
Member 1 - AI / LLM Engineer
"""

import json
import re
from typing import List, Optional, Type, TypeVar, Dict, Any
from pydantic import BaseModel, Field

T = TypeVar("T", bound=BaseModel)


# ==============================================================================
# Grounded Citation & Source Tracking
# ==============================================================================
class SourceCitation(BaseModel):
    """Citation metadata linking generated statements back to verified RAG sources."""
    page_number: Optional[int] = Field(None, description="Page number in the original document")
    section: Optional[str] = Field(None, description="Section heading or title")
    snippet: Optional[str] = Field(None, description="Direct supporting text quote from the document")
    relevance_score: Optional[float] = Field(None, description="Similarity or relevance score")


# ==============================================================================
# Explanation Generation Schemas
# ==============================================================================
class ExplanationResponse(BaseModel):
    """Structured response for grounded concept explanations."""
    title: str = Field(..., description="Clear concept title")
    summary: str = Field(..., description="High-level 2-3 sentence overview")
    detailed_explanation: str = Field(..., description="Comprehensive step-by-step breakdown")
    key_concepts: List[str] = Field(default_factory=list, description="Core terms and key takeaways")
    analogy: Optional[str] = Field(None, description="Intuitive real-world analogy to simplify understanding")
    citations: List[SourceCitation] = Field(default_factory=list, description="Grounding source citations")
    follow_up_questions: List[str] = Field(default_factory=list, description="Suggested next questions for deeper study")
    difficulty_level: str = Field("Intermediate", description="Target difficulty level (Beginner, Intermediate, Advanced, ELI5)")


# ==============================================================================
# Quiz Generation Schemas
# ==============================================================================
class QuizOption(BaseModel):
    """Individual option for a multiple-choice question."""
    option_id: str = Field(..., description="Option identifier (A, B, C, D)")
    text: str = Field(..., description="Option text description")
    explanation: Optional[str] = Field(None, description="Why this option is correct or incorrect")


class QuizQuestion(BaseModel):
    """Individual question inside a generated quiz."""
    question_id: int = Field(..., description="1-indexed question identifier")
    question_text: str = Field(..., description="Clear question stem")
    options: List[QuizOption] = Field(..., description="List of options (typically 4 choices)")
    correct_option_id: str = Field(..., description="The correct option ID (e.g. A, B, C, D)")
    explanation: str = Field(..., description="Detailed pedagogical explanation of the correct answer")
    difficulty: str = Field("Medium", description="Question difficulty: Easy, Medium, Hard")
    topic: str = Field("General", description="Subtopic or concept tested")


class QuizResponse(BaseModel):
    """Structured response containing a full generated quiz deck."""
    title: str = Field(..., description="Quiz title based on context")
    topic: str = Field(..., description="Main subject area")
    total_questions: int = Field(..., description="Total number of questions in quiz")
    questions: List[QuizQuestion] = Field(..., description="List of quiz questions")
    target_difficulty: str = Field("Medium", description="Target difficulty level of the quiz")


# ==============================================================================
# Flashcard Deck Schemas
# ==============================================================================
class FlashcardItem(BaseModel):
    """Individual active-recall flashcard."""
    card_id: int = Field(..., description="1-indexed card identifier")
    front_question: str = Field(..., description="Front side: Atomic question or prompt")
    back_answer: str = Field(..., description="Back side: Concise, precise answer")
    hint: Optional[str] = Field(None, description="Optional hint for active recall")
    topic: str = Field("General", description="Concept tag for spaced repetition categorization")
    difficulty: str = Field("Medium", description="Card difficulty level: Easy, Medium, Hard")


class FlashcardResponse(BaseModel):
    """Structured response containing a generated flashcard deck."""
    title: str = Field(..., description="Deck title")
    topic: str = Field(..., description="Main subject area")
    total_cards: int = Field(..., description="Total number of flashcards")
    cards: List[FlashcardItem] = Field(..., description="List of flashcards")


# ==============================================================================
# Assessment & Recommendation Schemas
# ==============================================================================
class WeakTopic(BaseModel):
    """Details regarding a topic area where the student performed poorly."""
    topic: str = Field(..., description="Name of the weak topic")
    score_percentage: float = Field(..., description="Student accuracy percentage on this topic")
    identified_gaps: List[str] = Field(default_factory=list, description="Specific conceptual gaps or misunderstandings detected")
    recommended_action: str = Field(..., description="Targeted remediation step (e.g., re-read Section 3, practice easy flashcards)")


class RecommendationResponse(BaseModel):
    """Structured personalized learning recommendations based on assessment."""
    overall_performance_summary: str = Field(..., description="Executive summary of student's progress and quiz results")
    accuracy_percentage: float = Field(..., description="Overall quiz score percentage")
    weak_topics: List[WeakTopic] = Field(default_factory=list, description="Identified weak topics")
    recommended_next_steps: List[str] = Field(default_factory=list, description="Prioritized list of actionable next study steps")
    suggested_difficulty_adjustment: str = Field("Maintain", description="Adaptation recommendation: Increase, Maintain, or Decrease difficulty")


# ==============================================================================
# LLM Evaluation Metric Schemas
# ==============================================================================
class LLMEvaluationResult(BaseModel):
    """Metric evaluation results for an LLM response."""
    faithfulness_score: float = Field(..., description="Score 0.0 to 1.0 indicating grounding against context")
    grounding_score: float = Field(..., description="Score 0.0 to 1.0 checking whether claims are supported by source")
    schema_validity: bool = Field(..., description="True if output parsed cleanly into target Pydantic schema")
    latency_ms: float = Field(..., description="End-to-end response generation latency in milliseconds")
    token_count: Optional[int] = Field(None, description="Total tokens consumed")
    feedback: str = Field("", description="Diagnostic summary or notes")


# ==============================================================================
# JSON Extraction & Fallback Parsing Utility
# ==============================================================================
def extract_and_parse_json(text: str, model_cls: Type[T]) -> T:
    """
    Robustly extracts JSON from raw LLM text output (handling ```json fences)
    and parses it using the target Pydantic model.
    """
    cleaned = text.strip()

    # 1. Strip markdown fences if present
    if "```json" in cleaned:
        cleaned = re.sub(r"```json\s*", "", cleaned)
        cleaned = re.sub(r"```\s*$", "", cleaned)
    elif "```" in cleaned:
        cleaned = re.sub(r"```\s*", "", cleaned)

    cleaned = cleaned.strip()

    # 2. Extract substring enclosed by first '{' and last '}' or '[' and ']'
    json_match = re.search(r"(\{.*\}|\[.*\])", cleaned, re.DOTALL)
    if json_match:
        json_str = json_match.group(1)
    else:
        json_str = cleaned

    # 3. Parse JSON dictionary
    data = json.loads(json_str)

    # 4. Validate with Pydantic
    if hasattr(model_cls, "model_validate"):
        return model_cls.model_validate(data)
    else:
        return model_cls.parse_obj(data)
