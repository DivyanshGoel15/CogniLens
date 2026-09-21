"""Abstract Base Provider for Large Language Models.

Enables swappable LLM backends (Gemini, Azure OpenAI, Foundry) with a uniform interface
for standard text generation and structured schema generation.
"""

from abc import ABC, abstractmethod
from typing import Any, Dict, Optional, Type, TypeVar
from pydantic import BaseModel

T = TypeVar("T", bound=BaseModel)


class LLMError(Exception):
    """Base exception for all LLM service failures."""
    pass


class LLMConfigError(LLMError):
    """Raised when provider configuration or API keys are missing or invalid."""
    pass


class LLMAPIError(LLMError):
    """Raised when external LLM API request returns an error response."""
    pass


class RateLimitError(LLMAPIError):
    """Raised when provider API rate limits are exceeded."""
    pass


class InsufficientContextError(LLMError):
    """Raised when retrieved evidence is strictly insufficient to answer a factual query."""
    pass


class BaseLLMProvider(ABC):
    """Abstract interface defining required LLM generation capabilities."""

    @abstractmethod
    def generate(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        temperature: float = 0.2,
        max_tokens: int = 1500,
    ) -> str:
        """Generate a natural language text response.

        Args:
            prompt: User or combined prompt string.
            system_instruction: Optional system instruction guiding model persona/rules.
            temperature: Sampling temperature (default: 0.2).
            max_tokens: Maximum tokens to generate (default: 1500).

        Returns:
            Generated response string.
        """
        pass

    @abstractmethod
    def generate_structured(
        self,
        prompt: str,
        schema: Type[T],
        system_instruction: Optional[str] = None,
        temperature: float = 0.1,
        max_tokens: int = 2000,
    ) -> T:
        """Generate a validated structured Pydantic object matching schema.

        Args:
            prompt: Prompt requesting structured data.
            schema: Pydantic model class to validate and instantiate.
            system_instruction: Optional system guidance.
            temperature: Sampling temperature (default: 0.1 for deterministic structure).
            max_tokens: Maximum token limit.

        Returns:
            Instance of schema populated with model output.
        """
        pass
