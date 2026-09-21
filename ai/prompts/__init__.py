"""Prompt Templates and Prompt Management for CogniLens AI."""

from ai.prompts.prompt_manager import (
    DEFAULT_SYSTEM_INSTRUCTION,
    build_explanation_prompt,
    build_grounded_qa_prompt,
    load_template,
    render_prompt,
)

__all__ = [
    "DEFAULT_SYSTEM_INSTRUCTION",
    "build_explanation_prompt",
    "build_grounded_qa_prompt",
    "load_template",
    "render_prompt",
]
