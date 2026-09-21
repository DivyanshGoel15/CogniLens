"""AI / LLM Intelligence Layer Package.

Provides provider abstractions, Gemini REST implementation, mock providers, and schemas.
"""

from ai.llm.base_provider import (
    BaseLLMProvider,
    InsufficientContextError,
    LLMAPIError,
    LLMConfigError,
    LLMError,
    RateLimitError,
)
from ai.llm.gemini_provider import GeminiProvider
from ai.llm.llm_service import get_llm_provider
from ai.llm.mock_provider import MockLLMProvider
from ai.llm.structured_output import (
    ExplanationResponse,
    FlashcardItem,
    FlashcardResponse,
    LLMEvaluationResult,
    QuizOption,
    QuizQuestion,
    QuizResponse,
    RecommendationResponse,
    SourceCitation,
    extract_and_parse_json,
)

__all__ = [
    "BaseLLMProvider",
    "GeminiProvider",
    "MockLLMProvider",
    "get_llm_provider",
    "LLMError",
    "LLMConfigError",
    "LLMAPIError",
    "RateLimitError",
    "InsufficientContextError",
    "ExplanationResponse",
    "FlashcardItem",
    "FlashcardResponse",
    "QuizOption",
    "QuizQuestion",
    "QuizResponse",
    "RecommendationResponse",
    "SourceCitation",
    "LLMEvaluationResult",
    "extract_and_parse_json",
]
