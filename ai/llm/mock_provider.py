"""Deterministic Mock LLM Provider for unit testing and offline development.

Allows running full conversational, explanation, quiz, and flashcard generation
without internet access, API keys, or consuming token quotas.
"""

from typing import Any, Dict, Optional, Type, TypeVar
from pydantic import BaseModel

from ai.llm.base_provider import BaseLLMProvider
from ai.llm.structured_output import (
    ExplanationResponse,
    FlashcardItem,
    FlashcardResponse,
    QuizOption,
    QuizQuestion,
    QuizResponse,
    SourceCitation,
)

T = TypeVar("T", bound=BaseModel)


class MockLLMProvider(BaseLLMProvider):
    """Mock LLM Provider returning predictable, grounded responses."""

    def __init__(self, canned_response: Optional[str] = None) -> None:
        """Initialize MockLLMProvider with optional canned response text."""
        self.canned_response = canned_response
        self.last_prompt: Optional[str] = None
        self.last_system_instruction: Optional[str] = None

    def generate(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        temperature: float = 0.2,
        max_tokens: int = 1500,
    ) -> str:
        """Generate deterministic text response."""
        self.last_prompt = prompt
        self.last_system_instruction = system_instruction

        if self.canned_response is not None:
            return self.canned_response

        # Grounded default text
        return (
            "Based on the provided academic context [Source 1], "
            "TCP congestion control uses AIMD (Additive Increase / Multiplicative Decrease) "
            "to regulate packet transmission rates and prevent buffer overflow at bottleneck routers. "
            "When packet loss is detected via duplicate ACKs, the congestion window is halved [Source 2]."
        )

    def generate_structured(
        self,
        prompt: str,
        schema: Type[T],
        system_instruction: Optional[str] = None,
        temperature: float = 0.1,
        max_tokens: int = 2000,
    ) -> T:
        """Generate deterministic Pydantic schema instances for tests."""
        self.last_prompt = prompt
        self.last_system_instruction = system_instruction

        schema_name = schema.__name__

        if schema_name == "ExplanationResponse" or issubclass(schema, ExplanationResponse):
            inst = ExplanationResponse(
                title="TCP Congestion Control Mechanism",
                summary="TCP congestion control prevents network collapse by dynamically adjusting window sizes.",
                detailed_explanation=(
                    "Congestion control in TCP comprises Slow Start, Congestion Avoidance, "
                    "Fast Retransmit, and Fast Recovery [Source 1]. Slow start doubles the window "
                    "every round-trip time until reaching the ssthresh threshold [Source 2]."
                ),
                key_concepts=["AIMD", "Slow Start", "ssthresh", "Congestion Window"],
                analogy="Like cars merging onto a highway: traffic speeds up gradually, but slows down sharply if there is a backup.",
                citations=[
                    SourceCitation(
                        page_number=1,
                        section="Congestion Control",
                        snippet="TCP uses Additive Increase Multiplicative Decrease to control window sizing.",
                        relevance_score=0.96,
                    )
                ],
                follow_up_questions=[
                    "What happens during Fast Retransmit?",
                    "How does Tahoe differ from Reno?",
                ],
                difficulty_level="Intermediate",
            )
            return inst  # type: ignore

        elif schema_name == "QuizResponse" or issubclass(schema, QuizResponse):
            inst = QuizResponse(
                title="TCP Congestion Control Assessment",
                topic="Computer Networks",
                total_questions=2,
                target_difficulty="Medium",
                questions=[
                    QuizQuestion(
                        question_id=1,
                        question_text="What does AIMD stand for in TCP congestion control?",
                        options=[
                            QuizOption(option_id="A", text="Additive Increase Multiplicative Decrease", explanation="Correct standard term in RFC 5681."),
                            QuizOption(option_id="B", text="Adaptive Internet Multicast Distribution", explanation="Incorrect."),
                            QuizOption(option_id="C", text="Asynchronous Interface Mode Device", explanation="Incorrect."),
                            QuizOption(option_id="D", text="Automatic Increment Maximum Delay", explanation="Incorrect."),
                        ],
                        correct_option_id="A",
                        explanation="AIMD regulates congestion window growth linearly and cuts it multiplicatively upon packet loss.",
                        difficulty="Medium",
                        topic="Congestion Control",
                    ),
                    QuizQuestion(
                        question_id=2,
                        question_text="When TCP enters Slow Start, by what factor does cwnd grow each RTT?",
                        options=[
                            QuizOption(option_id="A", text="Adds 1 MSS", explanation="Incorrect: this is congestion avoidance."),
                            QuizOption(option_id="B", text="Doubles (exponential growth)", explanation="Correct: each ACK increments cwnd by 1 MSS."),
                            QuizOption(option_id="C", text="Halves", explanation="Incorrect: halving occurs on packet loss."),
                            QuizOption(option_id="D", text="Remains constant", explanation="Incorrect."),
                        ],
                        correct_option_id="B",
                        explanation="In slow start, cwnd doubles each round trip time as an ACK is returned for each segment.",
                        difficulty="Medium",
                        topic="Slow Start",
                    ),
                ],
            )
            return inst  # type: ignore

        elif schema_name == "FlashcardResponse" or issubclass(schema, FlashcardResponse):
            inst = FlashcardResponse(
                title="TCP Congestion Control Flashcards",
                topic="Computer Networks",
                total_cards=2,
                cards=[
                    FlashcardItem(
                        card_id=1,
                        front_question="What is the primary role of ssthresh in TCP?",
                        back_answer="ssthresh (Slow Start Threshold) dictates the boundary where TCP transitions from exponential Slow Start to linear Congestion Avoidance.",
                        hint="Threshold variable",
                        topic="Congestion Control",
                        difficulty="Medium",
                    ),
                    FlashcardItem(
                        card_id=2,
                        front_question="How does Multiplicative Decrease adjust cwnd upon detecting packet loss?",
                        back_answer="It reduces the congestion window to half of its current value (cwnd = cwnd / 2).",
                        hint="AIMD decrease rule",
                        topic="Congestion Control",
                        difficulty="Medium",
                    ),
                ],
            )
            return inst  # type: ignore

        # Fallback to model instantiation with dummy data
        data: Dict[str, Any] = {}
        for name, field in schema.model_fields.items() if hasattr(schema, "model_fields") else schema.__fields__.items():
            ann = field.annotation
            if ann == str:
                data[name] = f"Mock {name}"
            elif ann == int:
                data[name] = 1
            elif ann == float:
                data[name] = 1.0
            elif ann == bool:
                data[name] = True
            elif getattr(ann, "__origin__", None) == list:
                data[name] = []
            else:
                data[name] = None
        if hasattr(schema, "model_validate"):
            return schema.model_validate(data)
        return schema.parse_obj(data)
