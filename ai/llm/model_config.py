"""
Model Configuration module for Azure OpenAI and LLM Generation Subsystem.
Member 1 - AI / LLM Engineer
"""

import os
from dataclasses import dataclass
from typing import Optional
from dotenv import load_dotenv

# Load environment variables from .env file if present
load_dotenv()


@dataclass
class AIModelConfig:
    """Configuration container for Azure OpenAI chat model parameters."""
    endpoint: str
    api_key: str
    chat_deployment: str
    api_version: str
    temperature: float
    max_tokens: int

    @classmethod
    def from_env(cls) -> "AIModelConfig":
        """Instantiate config from environment variables with fallback defaults."""
        endpoint = (
            os.getenv("AZURE_OPENAI_ENDPOINT")
            or os.getenv("AZURE_FOUNDRY_ENDPOINT")
            or os.getenv("AZURE_EMBEDDING_ENDPOINT")
            or ""
        )
        api_key = (
            os.getenv("AZURE_OPENAI_KEY")
            or os.getenv("AZURE_FOUNDRY_API_KEY")
            or os.getenv("AZURE_EMBEDDING_API_KEY")
            or ""
        )
        chat_deployment = (
            os.getenv("AZURE_OPENAI_CHAT_DEPLOYMENT")
            or os.getenv("AZURE_FOUNDRY_DEPLOYMENT")
            or "gpt-4.1-mini"
        )
        api_version = (
            os.getenv("AZURE_OPENAI_API_VERSION")
            or "2024-02-15-preview"
        )
        
        try:
            temperature = float(os.getenv("DEFAULT_TEMPERATURE", "0.3"))
        except ValueError:
            temperature = 0.3

        try:
            max_tokens = int(os.getenv("MAX_TOKENS", "1500"))
        except ValueError:
            max_tokens = 1500

        return cls(
            endpoint=endpoint,
            api_key=api_key,
            chat_deployment=chat_deployment,
            api_version=api_version,
            temperature=temperature,
            max_tokens=max_tokens,
        )

    def is_configured(self) -> bool:
        """Check if required Azure OpenAI credentials are validly populated."""
        invalid_keys = {"", "your_azure_openai_api_key", "your_account", "your_key"}
        invalid_endpoints = {"", "https://your-openai-resource.openai.azure.com/", "https://your-openai-resource.openai.azure.com"}

        return (
            bool(self.endpoint)
            and bool(self.api_key)
            and self.api_key not in invalid_keys
            and self.endpoint not in invalid_endpoints
        )
