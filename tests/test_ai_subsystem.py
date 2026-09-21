"""
Unit Test Suite for AI / LLM Subsystem (Member 1).
Runs 100% offline using mock mode (0 Azure Credits spent).
"""

import unittest
import os
import json
from unittest.mock import MagicMock, patch

from ai.llm.model_config import AIModelConfig
from ai.llm.structured_output import (
    ExplanationResponse,
    QuizResponse,
    FlashcardResponse,
    RecommendationResponse,
    SourceCitation,
    extract_and_parse_json,
)
from ai.llm.azure_openai import AzureOpenAIService
from ai.generation.explanation_generator import ExplanationGenerator
from ai.generation.quiz_generator import QuizGenerator
from ai.generation.flashcard_generator import FlashcardGenerator
from ai.generation.recommendation_generator import RecommendationGenerator
from ai.evaluation.llm_evaluation import LLMEvaluator


class TestAIModelConfig(unittest.TestCase):
    """Tests for AIModelConfig loader."""

    def test_default_config(self):
        config = AIModelConfig.from_env()
        self.assertIsNotNone(config.chat_deployment)
        self.assertIsNotNone(config.api_version)
        self.assertIsInstance(config.temperature, float)
        self.assertIsInstance(config.max_tokens, int)

    def test_is_configured_false_by_default(self):
        config = AIModelConfig(
            endpoint="https://your-openai-resource.openai.azure.com/",
            api_key="your_azure_openai_api_key",
            chat_deployment="gpt-4o-mini",
            api_version="2024-08-01-preview",
            temperature=0.3,
            max_tokens=1500,
        )
        self.assertFalse(config.is_configured())


class TestStructuredOutput(unittest.TestCase):
    """Tests for structured output schemas and JSON extraction utility."""

    def test_extract_and_parse_json_markdown_fenced(self):
        raw_llm_output = """
        Here is the requested explanation:
        ```json
        {
            "title": "Deadlock Overview",
            "summary": "Deadlock happens when processes block each other.",
            "detailed_explanation": "Detailed steps...",
            "key_concepts": ["Mutex", "Circular Wait"],
            "analogy": "Traffic intersection gridlock",
            "citations": [],
            "follow_up_questions": ["How to prevent deadlock?"],
            "difficulty_level": "Intermediate"
        }
        ```
        """
        parsed = extract_and_parse_json(raw_llm_output, ExplanationResponse)
        self.assertEqual(parsed.title, "Deadlock Overview")
        self.assertEqual(len(parsed.key_concepts), 2)
        self.assertEqual(parsed.difficulty_level, "Intermediate")

    def test_extract_and_parse_json_plain(self):
        raw_json = json.dumps({
            "title": "Operating Systems",
            "topic": "Processes",
            "total_cards": 1,
            "cards": [
                {
                    "card_id": 1,
                    "front_question": "What is PCB?",
                    "back_answer": "Process Control Block",
                    "hint": "Data structure",
                    "topic": "OS",
                    "difficulty": "Easy"
                }
            ]
        })
        parsed = extract_and_parse_json(raw_json, FlashcardResponse)
        self.assertEqual(parsed.total_cards, 1)
        self.assertEqual(parsed.cards[0].front_question, "What is PCB?")


class TestAzureOpenAIService(unittest.TestCase):
    """Tests for AzureOpenAIService wrapper and mock mode."""

    def setUp(self):
        self.service = AzureOpenAIService(force_mock=True)

    def test_render_prompt(self):
        rendered = self.service.render_prompt(
            "tutor.txt",
            difficulty="Beginner",
            query="Explain deadlocks",
            context="Document context passage",
        )
        self.assertIn("Explain deadlocks", rendered)
        self.assertIn("Document context passage", rendered)

    def test_generate_chat_completion_mock(self):
        messages = [{"role": "user", "content": "Hello"}]
        content, latency, tokens = self.service.generate_chat_completion(messages)
        self.assertIn("MOCK", content)
        self.assertGreater(latency, 0.0)
        self.assertGreater(tokens, 0)

    def test_generate_structured_output_mock(self):
        result, latency, tokens = self.service.generate_structured_output(
            prompt="Explain deadlocks",
            response_model=ExplanationResponse,
        )
        self.assertIsInstance(result, ExplanationResponse)
        self.assertIsNotNone(result.title)
        self.assertGreater(len(result.key_concepts), 0)


class TestExplanationGenerator(unittest.TestCase):
    """Tests for ExplanationGenerator pipeline."""

    def setUp(self):
        self.llm_service = AzureOpenAIService(force_mock=True)
        self.generator = ExplanationGenerator(llm_service=self.llm_service)

    def test_generate_explanation(self):
        chunks = [
            {
                "source": "OS_Unit3.pdf",
                "page_number": 42,
                "section": "Deadlocks",
                "text": "Deadlock occurs when processes hold resources while waiting for others.",
            }
        ]
        # Monkeypatch the mock to return empty citations to test the fallback logic
        original_mock = self.llm_service._generate_mock_instance
        def mock_no_citations(model_cls, prompt):
            instance = original_mock(model_cls, prompt)
            if model_cls.__name__ == "ExplanationResponse":
                instance.citations = []
            return instance
        self.llm_service._generate_mock_instance = mock_no_citations

        res = self.generator.generate_explanation(
            query="Explain deadlock",
            context_chunks=chunks,
            difficulty="Intermediate",
        )
        self.assertIsInstance(res, ExplanationResponse)
        self.assertIsNotNone(res.title)
        self.assertGreater(len(res.citations), 0)
        self.assertEqual(res.citations[0].page_number, 42)
        self.llm_service._generate_mock_instance = original_mock


class TestQuizGenerator(unittest.TestCase):
    """Tests for QuizGenerator pipeline."""

    def setUp(self):
        self.llm_service = AzureOpenAIService(force_mock=True)
        self.generator = QuizGenerator(llm_service=self.llm_service)

    def test_generate_quiz(self):
        chunks = [{"text": "Process synchronization requires mutual exclusion.", "page_number": 10}]
        quiz = self.generator.generate_quiz(
            topic="Process Synchronization",
            context_chunks=chunks,
            num_questions=2,
            difficulty="Medium",
        )
        self.assertIsInstance(quiz, QuizResponse)
        self.assertGreaterEqual(len(quiz.questions), 1)
        q1 = quiz.questions[0]
        self.assertGreaterEqual(len(q1.options), 4)
        self.assertIn(q1.correct_option_id, ["A", "B", "C", "D"])


class TestFlashcardGenerator(unittest.TestCase):
    """Tests for FlashcardGenerator pipeline."""

    def setUp(self):
        self.llm_service = AzureOpenAIService(force_mock=True)
        self.generator = FlashcardGenerator(llm_service=self.llm_service)

    def test_generate_flashcards(self):
        chunks = [{"text": "Semaphore is a synchronization tool.", "page_number": 15}]
        deck = self.generator.generate_flashcards(
            topic="Semaphores",
            context_chunks=chunks,
            num_cards=2,
        )
        self.assertIsInstance(deck, FlashcardResponse)
        self.assertGreaterEqual(len(deck.cards), 1)
        self.assertIsNotNone(deck.cards[0].front_question)
        self.assertIsNotNone(deck.cards[0].back_answer)


class TestRecommendationGenerator(unittest.TestCase):
    """Tests for RecommendationGenerator and weak topic detection."""

    def setUp(self):
        self.llm_service = AzureOpenAIService(force_mock=True)
        self.generator = RecommendationGenerator(llm_service=self.llm_service)
        self.quiz_gen = QuizGenerator(llm_service=self.llm_service)

    def test_evaluate_quiz_submission_high_score(self):
        quiz = self.quiz_gen.generate_quiz(topic="OS Deadlocks")
        # All correct user answers
        user_answers = {q.question_id: q.correct_option_id for q in quiz.questions}

        recommendations = self.generator.evaluate_quiz_submission(quiz, user_answers)
        self.assertIsInstance(recommendations, RecommendationResponse)
        self.assertEqual(recommendations.accuracy_percentage, 100.0)
        self.assertEqual(recommendations.suggested_difficulty_adjustment, "Increase")

    def test_evaluate_quiz_submission_low_score(self):
        quiz = self.quiz_gen.generate_quiz(topic="OS Deadlocks")
        # All wrong user answers
        user_answers = {q.question_id: "Z" for q in quiz.questions}

        recommendations = self.generator.evaluate_quiz_submission(quiz, user_answers)
        self.assertEqual(recommendations.accuracy_percentage, 0.0)
        self.assertEqual(recommendations.suggested_difficulty_adjustment, "Decrease")


class TestLLMEvaluator(unittest.TestCase):
    """Tests for LLMEvaluator metrics."""

    def test_evaluate_grounding(self):
        response = "Deadlock occurs when processes wait indefinitely for resources."
        context = "A deadlock occurs when a set of processes are blocked because each process holds a resource and waits for another resource."
        score = LLMEvaluator.evaluate_grounding(response, context)
        self.assertGreater(score, 0.4)

    def test_evaluate_schema_compliance(self):
        raw_valid = json.dumps({
            "title": "Title",
            "summary": "Summary",
            "detailed_explanation": "Details",
            "key_concepts": [],
            "citations": [],
            "follow_up_questions": [],
            "difficulty_level": "Easy"
        })
        is_valid, err = LLMEvaluator.evaluate_schema_compliance(raw_valid, ExplanationResponse)
        self.assertTrue(is_valid)
        self.assertIsNone(err)


if __name__ == "__main__":
    unittest.main()
