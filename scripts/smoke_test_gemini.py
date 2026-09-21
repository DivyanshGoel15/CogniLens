"""Isolated smoke test for Gemini API integration.

Verifies end-to-end connectivity, credential loading, and minimal completion.
Follows strict output formatting and zero-key-leakage constraints.
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Safe UTF-8 console output for Windows terminals
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))
load_dotenv(PROJECT_ROOT / ".env")

from ai.llm.gemini_provider import GeminiProvider


def main():
    # 1. Load GEMINI_API_KEY from .env
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key:
        print("Error: GEMINI_API_KEY not found in .env")
        sys.exit(1)

    # 2. Load GEMINI_MODEL from .env
    model_name = os.getenv("GEMINI_MODEL", "gemini-3.1-flash-lite").strip()

    # 3. Initialize provider
    try:
        provider = GeminiProvider(api_key=api_key, model_name=model_name)
    except Exception as exc:
        print(f"Error initializing provider: {exc}")
        sys.exit(1)

    print("provider initialized")
    print(f"model name: {model_name}")

    # 4. Make one minimal chat completion request (never printing the key)
    try:
        response = provider.generate("Say hello in 5 words or less.", max_tokens=50)
        print("request successful")
        print(f"short response: {response.strip()}")
    except Exception as exc:
        print(f"Request failed: {exc}")
        sys.exit(1)


if __name__ == "__main__":
    main()
