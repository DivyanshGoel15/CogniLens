"""LLM Service Factory & Provider Registry.

Provides unified resolution of LLM providers based on environment configuration.
"""

import os
import logging
from typing import Optional

from ai.llm.base_provider import BaseLLMProvider, LLMConfigError
from ai.llm.gemini_provider import GeminiProvider
from ai.llm.mock_provider import MockLLMProvider
from ai.llm.azure_openai import AzureOpenAIProvider, AzureOpenAIService

logger = logging.getLogger(__name__)


def get_llm_provider(
    provider_name: Optional[str] = None,
    api_key: Optional[str] = None,
    model_name: Optional[str] = None,
) -> BaseLLMProvider:
    """Instantiate and return the configured LLM provider.

    Args:
        provider_name: Provider identifier ('gemini', 'mock', 'azure').
                       Defaults to LLM_PROVIDER env variable or best available configured provider.
        api_key: Optional explicit API key override.
        model_name: Optional model name override.

    Returns:
        Instance conforming to BaseLLMProvider.
    """
    has_azure = bool(
        (os.getenv("AZURE_FOUNDRY_ENDPOINT") and os.getenv("AZURE_FOUNDRY_API_KEY"))
        or (os.getenv("AZURE_OPENAI_ENDPOINT") and os.getenv("AZURE_OPENAI_KEY"))
    )
    has_gemini = bool(os.getenv("GEMINI_API_KEY"))

    resolved_provider = (
        provider_name
        or os.getenv("LLM_PROVIDER")
        or ("azure" if has_azure else ("gemini" if has_gemini else "mock"))
    ).strip().lower()

    if resolved_provider in ("azure", "openai", "azure_openai", "foundry"):
        return AzureOpenAIProvider()
    elif resolved_provider == "gemini":
        return GeminiProvider(
            api_key=api_key or os.getenv("GEMINI_API_KEY"),
            model_name=model_name or os.getenv("GEMINI_MODEL", "gemini-2.0-flash"),
        )
    elif resolved_provider in ("mock", "offline", "test"):
        return MockLLMProvider()
    else:
        if has_azure:
            return AzureOpenAIProvider()
        return GeminiProvider(api_key=api_key, model_name=model_name)

