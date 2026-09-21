"""LLM Service Factory & Provider Registry.

Provides unified resolution of LLM providers based on environment configuration.
"""

import os
import logging
from typing import Optional

from ai.llm.base_provider import BaseLLMProvider, LLMConfigError
from ai.llm.gemini_provider import GeminiProvider
from ai.llm.mock_provider import MockLLMProvider

logger = logging.getLogger(__name__)


def get_llm_provider(
    provider_name: Optional[str] = None,
    api_key: Optional[str] = None,
    model_name: Optional[str] = None,
) -> BaseLLMProvider:
    """Instantiate and return the configured LLM provider.

    Args:
        provider_name: Provider identifier ('gemini', 'mock', 'azure').
                       Defaults to LLM_PROVIDER env variable or 'gemini'.
        api_key: Optional explicit API key override.
        model_name: Optional model name override.

    Returns:
        Instance conforming to BaseLLMProvider.
    """
    resolved_provider = (
        provider_name
        or os.getenv("LLM_PROVIDER")
        or ("gemini" if os.getenv("GEMINI_API_KEY") else "mock")
    ).strip().lower()

    if resolved_provider == "gemini":
        return GeminiProvider(
            api_key=api_key or os.getenv("GEMINI_API_KEY"),
            model_name=model_name or os.getenv("GEMINI_MODEL", "gemini-1.5-flash"),
        )
    elif resolved_provider in ("mock", "offline", "test"):
        return MockLLMProvider()
    else:
        logger.warning(
            "Unknown provider '%s', falling back to GeminiProvider.",
            resolved_provider,
        )
        return GeminiProvider(api_key=api_key, model_name=model_name)
