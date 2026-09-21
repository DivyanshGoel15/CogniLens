"""Google Gemini LLM Provider Implementation.

Implements BaseLLMProvider using the standard Google Gemini REST API.
Does not require external heavy SDKs and works cleanly with httpx or requests.
"""

import json
import logging
import os
import re
from typing import Any, Dict, Optional, Type, TypeVar
import httpx
from pydantic import BaseModel

from ai.llm.base_provider import (
    BaseLLMProvider,
    LLMAPIError,
    LLMConfigError,
    LLMError,
    RateLimitError,
)
from ai.llm.structured_output import extract_and_parse_json

T = TypeVar("T", bound=BaseModel)
logger = logging.getLogger(__name__)

GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"


class GeminiProvider(BaseLLMProvider):
    """Google Gemini API provider implementing BaseLLMProvider."""

    def __init__(
        self,
        api_key: Optional[str] = None,
        model_name: Optional[str] = None,
        timeout: float = 30.0,
    ) -> None:
        """Initialize the Gemini LLM provider.

        Args:
            api_key: Gemini API key. Defaults to GEMINI_API_KEY environment variable.
            model_name: Gemini model name. Defaults to GEMINI_MODEL env var or 'gemini-1.5-flash'.
            timeout: HTTP request timeout in seconds.
        """
        self.api_key = api_key if api_key is not None else os.getenv("GEMINI_API_KEY", "").strip()
        self.model_name = model_name if model_name is not None else os.getenv("GEMINI_MODEL", "gemini-1.5-flash").strip()
        self.timeout = timeout

    def _validate_config(self) -> None:
        """Validate that API key is configured."""
        if not self.api_key or self.api_key == "your_actual_key_here":
            raise LLMConfigError(
                "GEMINI_API_KEY is not configured or is a placeholder. "
                "Set a valid GEMINI_API_KEY in your environment or .env file."
            )

    def _build_url(self) -> str:
        """Build the endpoint URL."""
        return GEMINI_API_URL.format(model=self.model_name) + f"?key={self.api_key}"

    def generate(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        temperature: float = 0.2,
        max_tokens: int = 1500,
    ) -> str:
        """Generate a natural language text response via Gemini REST API."""
        self._validate_config()

        payload: Dict[str, Any] = {
            "contents": [
                {
                    "role": "user",
                    "parts": [{"text": prompt}],
                }
            ],
            "generationConfig": {
                "temperature": temperature,
                "maxOutputTokens": max_tokens,
            },
        }

        if system_instruction:
            payload["systemInstruction"] = {
                "parts": [{"text": system_instruction}]
            }

        headers = {"Content-Type": "application/json"}
        url = self._build_url()

        try:
            with httpx.Client(timeout=self.timeout) as client:
                response = client.post(url, json=payload, headers=headers)
        except Exception as exc:
            raise LLMAPIError(f"HTTP request to Gemini API failed: {exc}") from exc

        if response.status_code == 429:
            raise RateLimitError(
                f"Gemini API rate limit exceeded (429): {response.text}"
            )
        elif response.status_code != 200:
            raise LLMAPIError(
                f"Gemini API returned error {response.status_code}: {response.text}"
            )

        data = response.json()
        try:
            candidates = data.get("candidates", [])
            if not candidates:
                # Check for content filter or empty response
                prompt_feedback = data.get("promptFeedback", {})
                block_reason = prompt_feedback.get("blockReason")
                if block_reason:
                    raise LLMAPIError(f"Gemini response blocked: {block_reason}")
                return ""

            first_candidate = candidates[0]
            parts = first_candidate.get("content", {}).get("parts", [])
            if not parts:
                return ""

            return parts[0].get("text", "")
        except (KeyError, IndexError, TypeError) as exc:
            raise LLMAPIError(f"Failed to parse Gemini response: {exc}") from exc

    def generate_structured(
        self,
        prompt: str,
        schema: Type[T],
        system_instruction: Optional[str] = None,
        temperature: float = 0.1,
        max_tokens: int = 2000,
    ) -> T:
        """Generate a validated structured Pydantic object matching schema."""
        self._validate_config()

        # Augment prompt with schema definition
        schema_json = json.dumps(schema.model_json_schema() if hasattr(schema, "model_json_schema") else schema.schema(), indent=2)
        structured_prompt = (
            f"{prompt}\n\n"
            f"You MUST return ONLY a valid JSON object matching this schema:\n"
            f"```json\n{schema_json}\n```\n"
            f"Output raw JSON only. Do not include introductory or concluding commentary."
        )

        payload: Dict[str, Any] = {
            "contents": [
                {
                    "role": "user",
                    "parts": [{"text": structured_prompt}],
                }
            ],
            "generationConfig": {
                "temperature": temperature,
                "maxOutputTokens": max_tokens,
                "responseMimeType": "application/json",
            },
        }

        if system_instruction:
            payload["systemInstruction"] = {
                "parts": [{"text": system_instruction}]
            }

        headers = {"Content-Type": "application/json"}
        url = self._build_url()

        try:
            with httpx.Client(timeout=self.timeout) as client:
                response = client.post(url, json=payload, headers=headers)
        except Exception as exc:
            raise LLMAPIError(f"HTTP request to Gemini API failed: {exc}") from exc

        if response.status_code == 429:
            raise RateLimitError(
                f"Gemini API rate limit exceeded (429): {response.text}"
            )
        elif response.status_code != 200:
            raise LLMAPIError(
                f"Gemini API returned error {response.status_code}: {response.text}"
            )

        data = response.json()
        try:
            candidates = data.get("candidates", [])
            if not candidates:
                raise LLMAPIError("Gemini returned no candidates for structured generation.")

            first_candidate = candidates[0]
            parts = first_candidate.get("content", {}).get("parts", [])
            if not parts:
                raise LLMAPIError("Gemini candidate contains no parts.")

            raw_text = parts[0].get("text", "")
            return extract_and_parse_json(raw_text, schema)
        except Exception as exc:
            if isinstance(exc, LLMError):
                raise
            raise LLMAPIError(f"Failed to parse structured Gemini output: {exc}") from exc
