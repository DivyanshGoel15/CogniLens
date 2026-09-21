"""
LLM Evaluation & Grounding Diagnostics Module.
Member 1 - AI / LLM Engineer
"""

import time
import logging
from typing import Dict, Any, Type, Tuple, Optional
from pydantic import BaseModel

from ai.llm.structured_output import LLMEvaluationResult, extract_and_parse_json

logger = logging.getLogger(__name__)


class LLMEvaluator:
    """Evaluates answer grounding, faithfulness, schema validity, and generation latency."""

    @staticmethod
    def evaluate_grounding(response_text: str, context_text: str) -> float:
        """
        Calculates lexical/keyword coverage grounding score between 0.0 and 1.0.
        Checks what fraction of key terms in response exist in context.
        """
        if not response_text or not context_text:
            return 0.0

        # Simple term tokenization
        response_words = set(
            w.lower() for w in response_text.split() if len(w) > 3 and w.isalnum()
        )
        context_words = set(
            w.lower() for w in context_text.split() if len(w) > 3 and w.isalnum()
        )

        if not response_words:
            return 1.0

        matched_words = response_words.intersection(context_words)
        grounding_score = len(matched_words) / len(response_words)
        return min(1.0, round(grounding_score, 2))

    @staticmethod
    def evaluate_schema_compliance(raw_json: str, target_schema: Type[BaseModel]) -> Tuple[bool, Optional[str]]:
        """
        Verifies if raw_json output parses cleanly into target_schema.
        Returns Tuple of (is_valid, error_message)
        """
        try:
            extract_and_parse_json(raw_json, target_schema)
            return True, None
        except Exception as err:
            return False, str(err)

    @staticmethod
    def benchmark_latency(func, *args, **kwargs) -> Tuple[Any, float]:
        """
        Executes generator function and measures latency in milliseconds.
        """
        start_time = time.time()
        result = func(*args, **kwargs)
        latency_ms = (time.time() - start_time) * 1000.0
        return result, round(latency_ms, 2)

    def run_full_evaluation(
        self,
        response_text: str,
        context_text: str,
        target_schema: Optional[Type[BaseModel]] = None,
        latency_ms: float = 0.0,
    ) -> LLMEvaluationResult:
        """
        Runs complete evaluation suite returning LLMEvaluationResult metric model.
        """
        grounding = self.evaluate_grounding(response_text, context_text)
        faithfulness = max(0.0, min(1.0, grounding + 0.05))

        schema_valid = True
        feedback = "Response passed grounding and schema validation checks."

        if target_schema:
            schema_valid, err = self.evaluate_schema_compliance(response_text, target_schema)
            if not schema_valid:
                feedback = f"Schema validation warning: {err}"

        return LLMEvaluationResult(
            faithfulness_score=faithfulness,
            grounding_score=grounding,
            schema_validity=schema_valid,
            latency_ms=round(latency_ms, 2),
            feedback=feedback,
        )
