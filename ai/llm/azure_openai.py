"""
Azure OpenAI Service Wrapper & Mock Fallback Handler.
Member 1 - AI / LLM Engineer
"""

import os
import time
import logging
from typing import List, Dict, Any, Type, TypeVar, Optional, Tuple
from pydantic import BaseModel
from openai import AzureOpenAI, APIError

from ai.llm.model_config import AIModelConfig
from ai.llm.structured_output import extract_and_parse_json

T = TypeVar("T", bound=BaseModel)

logger = logging.getLogger(__name__)


class AzureOpenAIService:
    """Wrapper for Azure OpenAI LLM service with prompt rendering and mock support."""

    def __init__(self, config: Optional[AIModelConfig] = None, force_mock: bool = False):
        self.config = config or AIModelConfig.from_env()
        self.force_mock = force_mock or not self.config.is_configured()
        self.client: Optional[AzureOpenAI] = None

        if not self.force_mock:
            try:
                self.client = AzureOpenAI(
                    azure_endpoint=self.config.endpoint,
                    api_key=self.config.api_key,
                    api_version=self.config.api_version,
                )
                logger.info("Initialized AzureOpenAI client with deployment: %s", self.config.chat_deployment)
            except Exception as exc:
                logger.warning("Failed to initialize AzureOpenAI client: %s. Falling back to mock mode.", exc)
                self.force_mock = True

    def render_prompt(self, template_name: str, **kwargs) -> str:
        """Loads prompt template from ai/prompts directory and formats it."""
        prompts_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "prompts")
        file_path = os.path.join(prompts_dir, template_name)
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Prompt template not found: {file_path}")

        with open(file_path, "r", encoding="utf-8") as f:
            template_content = f.read()

        try:
            return template_content.format(**kwargs)
        except KeyError as err:
            logger.warning("Missing key in prompt format kwargs: %s", err)
            # Safe string substitution fallback
            result = template_content
            for k, v in kwargs.items():
                result = result.replace("{" + str(k) + "}", str(v))
            return result

    def generate_chat_completion(
        self,
        messages: List[Dict[str, str]],
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
    ) -> Tuple[str, float, int]:
        """
        Generates chat completion text.
        Returns: Tuple of (response_text, latency_ms, token_count)
        """
        temp = temperature if temperature is not None else self.config.temperature
        tokens = max_tokens if max_tokens is not None else self.config.max_tokens

        start_time = time.time()

        if self.force_mock or self.client is None:
            latency_ms = (time.time() - start_time) * 1000 + 15.0
            mock_text = "[MOCK LLM RESPONSE] Mock output based on prompt context."
            return mock_text, latency_ms, 50

        try:
            response = self.client.chat.completions.create(
                model=self.config.chat_deployment,
                messages=messages,
                temperature=temp,
                max_tokens=tokens,
            )
            latency_ms = (time.time() - start_time) * 1000
            content = response.choices[0].message.content or ""
            total_tokens = response.usage.total_tokens if response.usage else 0
            return content, latency_ms, total_tokens
        except APIError as api_err:
            logger.error("Azure OpenAI API Error: %s", api_err)
            raise
        except Exception as exc:
            logger.error("Unexpected error in LLM generation: %s", exc)
            raise

    def generate_structured_output(
        self,
        prompt: str,
        response_model: Type[T],
        system_prompt: Optional[str] = None,
        temperature: Optional[float] = None,
    ) -> Tuple[T, float, int]:
        """
        Generates and parses a structured response matching target Pydantic model.
        Returns: Tuple of (parsed_pydantic_instance, latency_ms, token_count)
        """
        sys_prompt = (
            system_prompt
            or "You are an expert AI tutor. Output your response strictly in valid JSON matching the requested schema."
        )

        full_user_prompt = f"{prompt}\n\nIMPORTANT: Return ONLY a valid JSON object matching the requested format. Do not include introductory text."

        messages = [
            {"role": "system", "content": sys_prompt},
            {"role": "user", "content": full_user_prompt},
        ]

        if self.force_mock or self.client is None:
            # Generate deterministic fallback model instance for mock execution
            start_time = time.time()
            parsed_instance = self._generate_mock_instance(response_model, prompt)
            latency_ms = (time.time() - start_time) * 1000 + 10.0
            return parsed_instance, latency_ms, 100

        content, latency_ms, token_count = self.generate_chat_completion(
            messages=messages,
            temperature=temperature,
        )

        parsed_instance = extract_and_parse_json(content, response_model)
        return parsed_instance, latency_ms, token_count

    def _generate_mock_instance(self, model_cls: Type[T], prompt: str) -> T:
        """Helper to create dummy valid model instance when running in mock mode."""
        model_name = model_cls.__name__

        if model_name == "ExplanationResponse":
            data = {
                "title": "Concept Explanation (Mock Mode)",
                "summary": "This is a summary explanation generated in mock mode for development.",
                "detailed_explanation": "1. Key point A\n2. Key point B\n3. Conclusion and takeaways.",
                "key_concepts": ["Concept A", "Concept B", "Concept C"],
                "analogy": "Think of this like a library catalog system.",
                "citations": [
                    {
                        "page_number": 1,
                        "section": "Introduction",
                        "snippet": "Verified document passage sample.",
                        "relevance_score": 0.95,
                    }
                ],
                "follow_up_questions": ["How does this scale?", "What are alternative approaches?"],
                "difficulty_level": "Intermediate",
            }
        elif model_name == "QuizResponse":
            import re
            num_match = re.search(r"Number of Questions:\s*(\d+)", prompt)
            num_questions = int(num_match.group(1)) if num_match else 2
            
            questions = []
            for i in range(1, num_questions + 1):
                questions.append({
                    "question_id": i,
                    "question_text": f"Mock Question {i}?",
                    "options": [
                        {"option_id": "A", "text": "Option A", "explanation": "Explanation A"},
                        {"option_id": "B", "text": "Option B", "explanation": "Explanation B"},
                        {"option_id": "C", "text": "Option C", "explanation": "Explanation C"},
                        {"option_id": "D", "text": "Option D", "explanation": "Explanation D"},
                    ],
                    "correct_option_id": "A",
                    "explanation": f"Explanation for question {i}.",
                    "difficulty": "Medium",
                    "topic": "General"
                })

            data = {
                "title": "Sample Assessment Quiz",
                "topic": "General Computer Science",
                "total_questions": num_questions,
                "target_difficulty": "Medium",
                "questions": questions,
            }
        elif model_name == "FlashcardResponse":
            import re
            num_match = re.search(r"Number of Flashcards:\s*(\d+)", prompt)
            num_cards = int(num_match.group(1)) if num_match else 2

            cards = []
            for i in range(1, num_cards + 1):
                cards.append({
                    "card_id": i,
                    "front_question": f"Mock Flashcard Question {i}?",
                    "back_answer": f"Mock Flashcard Answer {i}.",
                    "hint": "Mock Hint",
                    "topic": "General",
                    "difficulty": "Medium",
                })

            data = {
                "title": "Study Deck (Mock)",
                "topic": "Key Concepts",
                "total_cards": num_cards,
                "cards": cards,
            }
        elif model_name == "RecommendationResponse":
            data = {
                "overall_performance_summary": "Good effort! You demonstrated strong baseline understanding.",
                "accuracy_percentage": 75.0,
                "weak_topics": [
                    {
                        "topic": "Resource Allocation Graphs",
                        "score_percentage": 50.0,
                        "identified_gaps": ["Difficulty identifying cycle detection in directed graphs."],
                        "recommended_action": "Review section on Wait-For Graphs and practice cycle detection.",
                    }
                ],
                "recommended_next_steps": [
                    "Study Resource Allocation Graphs in Section 4.",
                    "Take a short 3-question targeted quiz on cycle detection.",
                ],
                "suggested_difficulty_adjustment": "Maintain",
            }
        else:
            # General fallback mock dictionary matching model fields
            data = {}
            for name, field in model_cls.__fields__.items():
                if field.annotation == str:
                    data[name] = f"Mock {name}"
                elif field.annotation == int:
                    data[name] = 1
                elif field.annotation == float:
                    data[name] = 1.0
                elif field.annotation == bool:
                    data[name] = True
                elif getattr(field.annotation, "__origin__", None) == list:
                    data[name] = []

        return extract_and_parse_json(str(data).replace("'", '"'), model_cls)
