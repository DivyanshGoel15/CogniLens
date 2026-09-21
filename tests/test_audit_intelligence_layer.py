#!/usr/bin/env python3
"""
===========================================================================
COMPREHENSIVE AUDIT TEST SUITE — Member 1 Intelligence Layer
Senior Azure AI Engineer & Code Auditor
===========================================================================
Zero Azure credits consumed. 100% offline mocked tests.
Covers: Configuration, Azure OpenAI integration, Prompt engineering,
        Explanation generation, Quiz generation, Flashcard generation,
        Difficulty adaptation, Structured JSON responses, Agent logic,
        Error handling, Edge cases, and Schema robustness.
===========================================================================
"""

import unittest
import json
import os
import sys
import time
from unittest.mock import patch, MagicMock, PropertyMock
from typing import Dict, Any

# Ensure project root is on path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from ai.llm.model_config import AIModelConfig
from ai.llm.structured_output import (
    ExplanationResponse, QuizResponse, FlashcardResponse,
    RecommendationResponse, WeakTopic, SourceCitation,
    QuizQuestion, QuizOption, FlashcardItem,
    LLMEvaluationResult, extract_and_parse_json,
)
from ai.llm.azure_openai import AzureOpenAIService
from ai.generation.explanation_generator import ExplanationGenerator
from ai.generation.quiz_generator import QuizGenerator
from ai.generation.flashcard_generator import FlashcardGenerator
from ai.generation.recommendation_generator import RecommendationGenerator
from ai.evaluation.llm_evaluation import LLMEvaluator


# ===========================================================================
# SECTION 3: AZURE OPENAI INTEGRATION TESTS
# ===========================================================================
class TestAzureConfigValidation(unittest.TestCase):
    """Test A: Configuration Validation (Section 3)"""

    def test_from_env_returns_config_instance(self):
        config = AIModelConfig.from_env()
        self.assertIsInstance(config, AIModelConfig)
        self.assertIsInstance(config.endpoint, str)
        self.assertIsInstance(config.api_key, str)
        self.assertIsInstance(config.chat_deployment, str)
        self.assertIsInstance(config.api_version, str)
        self.assertIsInstance(config.temperature, float)
        self.assertIsInstance(config.max_tokens, int)

    def test_placeholder_credentials_detected_as_unconfigured(self):
        config = AIModelConfig(
            endpoint="https://your-openai-resource.openai.azure.com/",
            api_key="your_azure_openai_api_key",
            chat_deployment="gpt-4o-mini",
            api_version="2024-08-01-preview",
            temperature=0.3, max_tokens=1500,
        )
        self.assertFalse(config.is_configured())

    def test_empty_credentials_detected_as_unconfigured(self):
        config = AIModelConfig(
            endpoint="", api_key="",
            chat_deployment="gpt-4o-mini",
            api_version="2024-08-01-preview",
            temperature=0.3, max_tokens=1500,
        )
        self.assertFalse(config.is_configured())

    def test_real_credentials_detected_as_configured(self):
        config = AIModelConfig(
            endpoint="https://my-real-resource.openai.azure.com/",
            api_key="abc123realkey",
            chat_deployment="gpt-4o-mini",
            api_version="2024-08-01-preview",
            temperature=0.3, max_tokens=1500,
        )
        self.assertTrue(config.is_configured())

    def test_temperature_parsing_with_invalid_env(self):
        with patch.dict(os.environ, {"DEFAULT_TEMPERATURE": "notanumber"}):
            config = AIModelConfig.from_env()
            self.assertEqual(config.temperature, 0.3)

    def test_max_tokens_parsing_with_invalid_env(self):
        with patch.dict(os.environ, {"MAX_TOKENS": "notanumber"}):
            config = AIModelConfig.from_env()
            self.assertEqual(config.max_tokens, 1500)

    def test_fallback_from_embedding_keys(self):
        with patch.dict(os.environ, {
            "AZURE_OPENAI_ENDPOINT": "",
            "AZURE_OPENAI_KEY": "",
            "AZURE_EMBEDDING_ENDPOINT": "https://fallback.openai.azure.com/",
            "AZURE_EMBEDDING_API_KEY": "fallback_key",
        }, clear=False):
            config = AIModelConfig.from_env()
            self.assertEqual(config.endpoint, "https://fallback.openai.azure.com/")
            self.assertEqual(config.api_key, "fallback_key")


class TestAzureOpenAIConnection(unittest.TestCase):
    """Test B: LLM Connection (Section 3)"""

    def test_mock_mode_activates_without_credentials(self):
        service = AzureOpenAIService(force_mock=True)
        self.assertTrue(service.force_mock)
        self.assertIsNone(service.client)

    def test_mock_mode_activates_with_placeholder_credentials(self):
        config = AIModelConfig(
            endpoint="https://your-openai-resource.openai.azure.com/",
            api_key="your_azure_openai_api_key",
            chat_deployment="gpt-4o-mini",
            api_version="2024-08-01-preview",
            temperature=0.3, max_tokens=1500,
        )
        service = AzureOpenAIService(config=config)
        self.assertTrue(service.force_mock)

    def test_mock_chat_completion_returns_valid_tuple(self):
        service = AzureOpenAIService(force_mock=True)
        content, latency, tokens = service.generate_chat_completion(
            [{"role": "user", "content": "Test"}]
        )
        self.assertIsInstance(content, str)
        self.assertIn("MOCK", content)
        self.assertIsInstance(latency, float)
        self.assertGreater(latency, 0)
        self.assertIsInstance(tokens, int)
        self.assertGreater(tokens, 0)


class TestAzureResponseValidation(unittest.TestCase):
    """Test C: Response Validation (Section 3)"""

    def test_structured_output_returns_valid_pydantic_model(self):
        service = AzureOpenAIService(force_mock=True)
        result, latency, tokens = service.generate_structured_output(
            prompt="Explain deadlock", response_model=ExplanationResponse
        )
        self.assertIsInstance(result, ExplanationResponse)
        self.assertIsInstance(result.title, str)
        self.assertIsInstance(result.summary, str)
        self.assertIsInstance(result.detailed_explanation, str)
        self.assertIsInstance(result.key_concepts, list)

    def test_structured_output_returns_valid_quiz(self):
        service = AzureOpenAIService(force_mock=True)
        result, _, _ = service.generate_structured_output(
            prompt="Generate quiz", response_model=QuizResponse
        )
        self.assertIsInstance(result, QuizResponse)
        self.assertGreater(len(result.questions), 0)
        for q in result.questions:
            self.assertEqual(len(q.options), 4)

    def test_structured_output_returns_valid_flashcards(self):
        service = AzureOpenAIService(force_mock=True)
        result, _, _ = service.generate_structured_output(
            prompt="Generate flashcards", response_model=FlashcardResponse
        )
        self.assertIsInstance(result, FlashcardResponse)
        self.assertGreater(len(result.cards), 0)

    def test_structured_output_returns_valid_recommendations(self):
        service = AzureOpenAIService(force_mock=True)
        result, _, _ = service.generate_structured_output(
            prompt="Analyze performance", response_model=RecommendationResponse
        )
        self.assertIsInstance(result, RecommendationResponse)
        self.assertIn(result.suggested_difficulty_adjustment, ["Increase", "Maintain", "Decrease"])


# ===========================================================================
# SECTION 4: PROMPT ENGINEERING TESTS
# ===========================================================================
class TestPromptEngineering(unittest.TestCase):
    """Tests prompt templates (Section 4)"""

    def setUp(self):
        self.service = AzureOpenAIService(force_mock=True)

    def test_system_prompt_loads(self):
        prompt = self.service.render_prompt("system.txt")
        self.assertIn("CogniLens", prompt)
        self.assertIn("grounded", prompt.lower())
        self.assertIn("hallucinate", prompt.lower())

    def test_tutor_prompt_with_easy_question(self):
        prompt = self.service.render_prompt("tutor.txt",
            query="What is a variable?", context="Variables store data.", difficulty="Beginner")
        self.assertIn("What is a variable?", prompt)
        self.assertIn("Beginner", prompt)

    def test_tutor_prompt_with_hard_question(self):
        prompt = self.service.render_prompt("tutor.txt",
            query="Explain Raft consensus algorithm with failure modes",
            context="Raft is a consensus protocol...", difficulty="Advanced")
        self.assertIn("Raft consensus", prompt)
        self.assertIn("Advanced", prompt)

    def test_tutor_prompt_with_empty_query(self):
        prompt = self.service.render_prompt("tutor.txt",
            query="", context="Some context", difficulty="Intermediate")
        self.assertIn("Student Query: ", prompt)

    def test_quiz_prompt_injects_all_parameters(self):
        prompt = self.service.render_prompt("quiz.txt",
            topic="Data Structures", context="Arrays and linked lists...",
            num_questions=5, difficulty="Hard")
        self.assertIn("Data Structures", prompt)
        self.assertIn("5", prompt)
        self.assertIn("Hard", prompt)

    def test_flashcard_prompt_injects_parameters(self):
        prompt = self.service.render_prompt("flashcards.txt",
            topic="Sorting Algorithms", context="Merge sort and quicksort...", num_cards=3)
        self.assertIn("Sorting Algorithms", prompt)
        self.assertIn("3", prompt)

    def test_explanation_prompt_loads(self):
        prompt = self.service.render_prompt("explanation.txt",
            topic="Binary Trees", context="A binary tree...", difficulty="ELI5")
        self.assertIn("Binary Trees", prompt)
        self.assertIn("ELI5", prompt)

    def test_recommendation_prompt_loads(self):
        prompt = self.service.render_prompt("recommendations.txt",
            assessment_data='{"total_questions": 5, "correct_count": 3}')
        self.assertIn("total_questions", prompt)

    def test_nonexistent_template_raises_error(self):
        with self.assertRaises(FileNotFoundError):
            self.service.render_prompt("nonexistent_prompt.txt")

    def test_prompt_with_missing_key_uses_fallback(self):
        """Tests that render_prompt falls back gracefully on KeyError."""
        # tutor.txt has {difficulty}, {query}, {context}
        # Passing only 'query' should trigger fallback
        prompt = self.service.render_prompt("tutor.txt", query="test")
        self.assertIn("test", prompt)


# ===========================================================================
# SECTION 5: EXPLANATION GENERATION TESTS
# ===========================================================================
class TestExplanationGeneration(unittest.TestCase):
    """Tests explanation generation (Section 5)"""

    def setUp(self):
        self.llm = AzureOpenAIService(force_mock=True)
        self.gen = ExplanationGenerator(llm_service=self.llm)

    def test_simple_programming_question(self):
        chunks = [{"text": "A for loop iterates over a sequence.", "page_number": 5, "section": "Loops"}]
        res = self.gen.generate_explanation("What is a for loop?", chunks, "Beginner")
        self.assertIsInstance(res, ExplanationResponse)
        self.assertEqual(res.difficulty_level, "Beginner")
        self.assertIsNotNone(res.title)
        self.assertIsNotNone(res.summary)

    def test_data_structures_question(self):
        chunks = [{"text": "A stack is a LIFO data structure.", "page_number": 12, "section": "Stacks"}]
        
        # Monkeypatch the mock to return empty citations to test the fallback logic
        original_mock = self.llm._generate_mock_instance
        def mock_no_citations(model_cls, prompt):
            instance = original_mock(model_cls, prompt)
            if model_cls.__name__ == "ExplanationResponse":
                instance.citations = []
            return instance
        self.llm._generate_mock_instance = mock_no_citations
        
        res = self.gen.generate_explanation("Explain stacks", chunks, "Intermediate")
        self.assertIsInstance(res, ExplanationResponse)
        self.assertGreater(len(res.citations), 0)
        self.assertEqual(res.citations[0].page_number, 12)
        self.llm._generate_mock_instance = original_mock

    def test_without_context_chunks(self):
        """NOTE: Mock mode returns hardcoded citations even without context chunks.
        In live Azure mode with no chunks, the LLM would produce zero citations,
        but the mock always injects its hardcoded ExplanationResponse which has 1 citation.
        This test documents that behavior."""
        res = self.gen.generate_explanation("What is AI?", difficulty="ELI5")
        self.assertIsInstance(res, ExplanationResponse)
        # Mock mode returns 1 hardcoded citation; live mode would return 0.
        self.assertEqual(len(res.citations), 1)

    def test_format_context_with_multiple_chunks(self):
        chunks = [
            {"source": "a.pdf", "page_number": 1, "section": "S1", "text": "Text A"},
            {"source": "b.pdf", "page_number": 2, "section": "S2", "text": "Text B"},
        ]
        formatted = self.gen.format_context(chunks)
        self.assertIn("[Source 1]", formatted)
        self.assertIn("[Source 2]", formatted)
        self.assertIn("Text A", formatted)
        self.assertIn("Text B", formatted)

    def test_format_context_empty(self):
        formatted = self.gen.format_context([])
        self.assertEqual(formatted, "No document context provided.")


# ===========================================================================
# SECTION 6: QUIZ GENERATION TESTS
# ===========================================================================
class TestQuizGeneration(unittest.TestCase):
    """Tests quiz generation (Section 6)"""

    def setUp(self):
        self.llm = AzureOpenAIService(force_mock=True)
        self.gen = QuizGenerator(llm_service=self.llm)

    def test_quiz_default_params(self):
        quiz = self.gen.generate_quiz(topic="Operating Systems")
        self.assertIsInstance(quiz, QuizResponse)
        self.assertGreater(len(quiz.questions), 0)

    def test_quiz_structure_validity(self):
        quiz = self.gen.generate_quiz(topic="Networks", num_questions=2)
        for q in quiz.questions:
            self.assertIsInstance(q.question_id, int)
            self.assertIsInstance(q.question_text, str)
            self.assertGreater(len(q.question_text), 0)
            self.assertEqual(len(q.options), 4)
            self.assertIn(q.correct_option_id, ["A", "B", "C", "D"])
            for opt in q.options:
                self.assertIn(opt.option_id, ["A", "B", "C", "D"])
                self.assertIsInstance(opt.text, str)

    def test_quiz_difficulty_parameter_respected(self):
        quiz = self.gen.generate_quiz(topic="OS", difficulty="Hard")
        self.assertEqual(quiz.target_difficulty, "Hard")

    def test_quiz_with_context(self):
        chunks = [{"text": "TCP uses three-way handshake.", "page_number": 30}]
        quiz = self.gen.generate_quiz(topic="TCP/IP", context_chunks=chunks)
        self.assertIsInstance(quiz, QuizResponse)

    def test_quiz_without_context(self):
        quiz = self.gen.generate_quiz(topic="General Knowledge")
        self.assertIsInstance(quiz, QuizResponse)

    def test_quiz_json_serializable(self):
        quiz = self.gen.generate_quiz(topic="Math")
        json_str = json.dumps(quiz.model_dump())
        self.assertIsInstance(json.loads(json_str), dict)

    def test_quiz_correct_answer_is_among_options(self):
        quiz = self.gen.generate_quiz(topic="OS")
        for q in quiz.questions:
            option_ids = [o.option_id for o in q.options]
            self.assertIn(q.correct_option_id, option_ids)


# ===========================================================================
# SECTION 7: FLASHCARD GENERATION TESTS
# ===========================================================================
class TestFlashcardGeneration(unittest.TestCase):
    """Tests flashcard generation (Section 7)"""

    def setUp(self):
        self.llm = AzureOpenAIService(force_mock=True)
        self.gen = FlashcardGenerator(llm_service=self.llm)

    def test_flashcard_generation(self):
        deck = self.gen.generate_flashcards(topic="Algorithms")
        self.assertIsInstance(deck, FlashcardResponse)
        self.assertGreater(len(deck.cards), 0)

    def test_flashcard_structure(self):
        deck = self.gen.generate_flashcards(topic="Databases")
        for card in deck.cards:
            self.assertIsInstance(card.card_id, int)
            self.assertIsInstance(card.front_question, str)
            self.assertGreater(len(card.front_question), 0)
            self.assertIsInstance(card.back_answer, str)
            self.assertGreater(len(card.back_answer), 0)

    def test_flashcard_with_context(self):
        chunks = [{"text": "Normalization reduces data redundancy.", "page_number": 20}]
        deck = self.gen.generate_flashcards(topic="Database Normalization", context_chunks=chunks)
        self.assertIsInstance(deck, FlashcardResponse)

    def test_flashcard_json_serializable(self):
        deck = self.gen.generate_flashcards(topic="OS")
        json_str = json.dumps(deck.model_dump())
        self.assertIsInstance(json.loads(json_str), dict)


# ===========================================================================
# SECTION 8: DIFFICULTY ADAPTATION TESTS
# ===========================================================================
class TestDifficultyAdaptation(unittest.TestCase):
    """Tests difficulty adaptation logic (Section 8)"""

    def setUp(self):
        self.llm = AzureOpenAIService(force_mock=True)
        self.quiz_gen = QuizGenerator(llm_service=self.llm)
        self.rec_gen = RecommendationGenerator(llm_service=self.llm)

    def _get_quiz(self):
        return self.quiz_gen.generate_quiz(topic="OS Deadlocks", num_questions=2)

    def test_scenario1_low_performance_decrease(self):
        """0% accuracy → Decrease difficulty"""
        quiz = self._get_quiz()
        answers = {q.question_id: "Z" for q in quiz.questions}
        rec = self.rec_gen.evaluate_quiz_submission(quiz, answers)
        self.assertEqual(rec.accuracy_percentage, 0.0)
        self.assertEqual(rec.suggested_difficulty_adjustment, "Decrease")

    def test_scenario2_high_performance_increase(self):
        """100% accuracy → Increase difficulty"""
        quiz = self._get_quiz()
        answers = {q.question_id: q.correct_option_id for q in quiz.questions}
        rec = self.rec_gen.evaluate_quiz_submission(quiz, answers)
        self.assertEqual(rec.accuracy_percentage, 100.0)
        self.assertEqual(rec.suggested_difficulty_adjustment, "Increase")

    def test_scenario3_mixed_performance_maintain(self):
        """50% accuracy → Maintain difficulty"""
        quiz = self._get_quiz()
        answers = {}
        for i, q in enumerate(quiz.questions):
            if i == 0:
                answers[q.question_id] = q.correct_option_id
            else:
                answers[q.question_id] = "Z"
        rec = self.rec_gen.evaluate_quiz_submission(quiz, answers)
        self.assertIn(rec.suggested_difficulty_adjustment, ["Maintain", "Decrease"])
        self.assertGreater(rec.accuracy_percentage, 0.0)
        self.assertLess(rec.accuracy_percentage, 100.0)

    def test_empty_quiz_edge_case(self):
        """Zero questions submitted"""
        empty_quiz = QuizResponse(
            title="Empty", topic="None", total_questions=0,
            questions=[], target_difficulty="Medium"
        )
        rec = self.rec_gen.evaluate_quiz_submission(empty_quiz, {})
        self.assertEqual(rec.accuracy_percentage, 0.0)
        self.assertEqual(rec.suggested_difficulty_adjustment, "Maintain")

    def test_missing_answers_treated_as_wrong(self):
        """Unanswered questions count as incorrect"""
        quiz = self._get_quiz()
        rec = self.rec_gen.evaluate_quiz_submission(quiz, {})
        self.assertEqual(rec.accuracy_percentage, 0.0)
        self.assertEqual(rec.suggested_difficulty_adjustment, "Decrease")

    def test_difficulty_is_hardcoded_override_not_llm_dependent(self):
        """Verify the code at L102-108 overrides whatever the LLM returns"""
        quiz = self._get_quiz()
        # All correct
        answers_perfect = {q.question_id: q.correct_option_id for q in quiz.questions}
        rec = self.rec_gen.evaluate_quiz_submission(quiz, answers_perfect)
        # The code always overrides to "Increase" for >= 80%
        self.assertEqual(rec.suggested_difficulty_adjustment, "Increase")


# ===========================================================================
# SECTION 9: STRUCTURED JSON RESPONSE TESTS
# ===========================================================================
class TestStructuredJSONResponses(unittest.TestCase):
    """Tests structured JSON parsing robustness (Section 9)"""

    def test_valid_json_parses(self):
        raw = json.dumps({"title": "T", "summary": "S", "detailed_explanation": "D",
                          "key_concepts": [], "citations": [], "follow_up_questions": [],
                          "difficulty_level": "Easy"})
        result = extract_and_parse_json(raw, ExplanationResponse)
        self.assertEqual(result.title, "T")

    def test_markdown_fenced_json(self):
        raw = '```json\n{"title":"T","summary":"S","detailed_explanation":"D"}\n```'
        result = extract_and_parse_json(raw, ExplanationResponse)
        self.assertEqual(result.title, "T")

    def test_json_with_prefix_text(self):
        raw = 'Here is the explanation:\n{"title":"T","summary":"S","detailed_explanation":"D"}'
        result = extract_and_parse_json(raw, ExplanationResponse)
        self.assertEqual(result.title, "T")

    def test_invalid_json_raises(self):
        with self.assertRaises(Exception):
            extract_and_parse_json("not json at all", ExplanationResponse)

    def test_missing_required_field_raises(self):
        raw = json.dumps({"title": "T"})  # missing summary, detailed_explanation
        with self.assertRaises(Exception):
            extract_and_parse_json(raw, ExplanationResponse)

    def test_wrong_type_raises_validation_error(self):
        """Pydantic v2 in strict mode rejects int where str is expected.
        This is GOOD behavior — validates schema strictly."""
        raw = json.dumps({"title": 123, "summary": "S", "detailed_explanation": "D"})
        with self.assertRaises(Exception):
            extract_and_parse_json(raw, ExplanationResponse)

    def test_empty_response_raises(self):
        with self.assertRaises(Exception):
            extract_and_parse_json("", ExplanationResponse)

    def test_extra_fields_ignored(self):
        raw = json.dumps({"title": "T", "summary": "S", "detailed_explanation": "D",
                          "extra_field": "should be ignored"})
        result = extract_and_parse_json(raw, ExplanationResponse)
        self.assertEqual(result.title, "T")

    def test_truncated_json_raises(self):
        raw = '{"title": "T", "summary": "S", "detailed_explan'
        with self.assertRaises(Exception):
            extract_and_parse_json(raw, ExplanationResponse)

    def test_quiz_schema_full_validation(self):
        raw = json.dumps({
            "title": "Quiz", "topic": "OS", "total_questions": 1,
            "target_difficulty": "Easy",
            "questions": [{
                "question_id": 1, "question_text": "Q?",
                "options": [
                    {"option_id": "A", "text": "Opt A"},
                    {"option_id": "B", "text": "Opt B"},
                    {"option_id": "C", "text": "Opt C"},
                    {"option_id": "D", "text": "Opt D"},
                ],
                "correct_option_id": "A", "explanation": "Because A",
            }]
        })
        result = extract_and_parse_json(raw, QuizResponse)
        self.assertEqual(len(result.questions), 1)
        self.assertEqual(len(result.questions[0].options), 4)

    def test_flashcard_schema_full_validation(self):
        raw = json.dumps({
            "title": "Deck", "topic": "Math", "total_cards": 1,
            "cards": [{"card_id": 1, "front_question": "Q?", "back_answer": "A"}]
        })
        result = extract_and_parse_json(raw, FlashcardResponse)
        self.assertEqual(len(result.cards), 1)

    def test_recommendation_schema_full_validation(self):
        raw = json.dumps({
            "overall_performance_summary": "Good", "accuracy_percentage": 80.0,
            "weak_topics": [], "recommended_next_steps": ["Study more"],
            "suggested_difficulty_adjustment": "Increase"
        })
        result = extract_and_parse_json(raw, RecommendationResponse)
        self.assertEqual(result.accuracy_percentage, 80.0)

    def test_all_schemas_are_json_serializable_roundtrip(self):
        for model_name in ["ExplanationResponse", "QuizResponse", "FlashcardResponse", "RecommendationResponse"]:
            service = AzureOpenAIService(force_mock=True)
            model_cls = {"ExplanationResponse": ExplanationResponse,
                         "QuizResponse": QuizResponse,
                         "FlashcardResponse": FlashcardResponse,
                         "RecommendationResponse": RecommendationResponse}[model_name]
            instance, _, _ = service.generate_structured_output("test", model_cls)
            dumped = json.dumps(instance.model_dump())
            loaded = json.loads(dumped)
            self.assertIsInstance(loaded, dict)


# ===========================================================================
# SECTION 10: AGENT LOGIC TESTS
# ===========================================================================
class TestAgentLogic(unittest.TestCase):
    """Tests agent/orchestration logic (Section 10).
    NOTE: No standalone agent orchestrator class exists.
    The generators serve as direct function-call agents.
    This section tests the dispatch/selection pattern.
    """

    def setUp(self):
        self.llm = AzureOpenAIService(force_mock=True)

    def test_explanation_request_dispatches_correctly(self):
        gen = ExplanationGenerator(llm_service=self.llm)
        result = gen.generate_explanation("What is deadlock?")
        self.assertIsInstance(result, ExplanationResponse)

    def test_quiz_request_dispatches_correctly(self):
        gen = QuizGenerator(llm_service=self.llm)
        result = gen.generate_quiz(topic="OS")
        self.assertIsInstance(result, QuizResponse)

    def test_flashcard_request_dispatches_correctly(self):
        gen = FlashcardGenerator(llm_service=self.llm)
        result = gen.generate_flashcards(topic="OS")
        self.assertIsInstance(result, FlashcardResponse)

    def test_recommendation_request_dispatches_correctly(self):
        quiz_gen = QuizGenerator(llm_service=self.llm)
        quiz = quiz_gen.generate_quiz(topic="OS")
        rec_gen = RecommendationGenerator(llm_service=self.llm)
        result = rec_gen.evaluate_quiz_submission(quiz, {1: "A"})
        self.assertIsInstance(result, RecommendationResponse)

    def test_no_standalone_agent_router_exists(self):
        """Verifies that server/app/services/agent_service.py is empty (0 bytes)."""
        path = os.path.join(os.path.dirname(__file__), "..", "server", "app", "services", "agent_service.py")
        if os.path.exists(path):
            size = os.path.getsize(path)
            self.assertEqual(size, 0, "agent_service.py exists but is empty — no agent router implemented")


# ===========================================================================
# SECTION 11: EVALUATION METRICS TESTS
# ===========================================================================
class TestLLMEvaluationMetrics(unittest.TestCase):
    """Tests evaluation module (Section 11)"""

    def test_grounding_high_overlap(self):
        ctx = "Deadlock occurs when processes hold resources and wait for others."
        resp = "Deadlock occurs when processes wait for resources held by others."
        score = LLMEvaluator.evaluate_grounding(resp, ctx)
        self.assertGreater(score, 0.4)

    def test_grounding_zero_overlap(self):
        score = LLMEvaluator.evaluate_grounding("Apple banana cherry", "XYZ quantum physics")
        self.assertLessEqual(score, 0.1)

    def test_grounding_empty_inputs(self):
        self.assertEqual(LLMEvaluator.evaluate_grounding("", "context"), 0.0)
        self.assertEqual(LLMEvaluator.evaluate_grounding("response", ""), 0.0)

    def test_schema_compliance_valid(self):
        raw = json.dumps({"title": "T", "summary": "S", "detailed_explanation": "D"})
        valid, err = LLMEvaluator.evaluate_schema_compliance(raw, ExplanationResponse)
        self.assertTrue(valid)
        self.assertIsNone(err)

    def test_schema_compliance_invalid(self):
        valid, err = LLMEvaluator.evaluate_schema_compliance("not json", ExplanationResponse)
        self.assertFalse(valid)
        self.assertIsNotNone(err)

    def test_benchmark_latency(self):
        result, latency = LLMEvaluator.benchmark_latency(lambda: "hello")
        self.assertEqual(result, "hello")
        self.assertGreaterEqual(latency, 0.0)

    def test_full_evaluation_returns_valid_result(self):
        evaluator = LLMEvaluator()
        result = evaluator.run_full_evaluation("resp words match", "resp words match context", latency_ms=100.0)
        self.assertIsInstance(result, LLMEvaluationResult)
        self.assertGreater(result.grounding_score, 0.0)
        self.assertTrue(result.schema_validity)
        self.assertEqual(result.latency_ms, 100.0)


# ===========================================================================
# SECTION 12: BUG & EDGE CASE DETECTION TESTS
# ===========================================================================
class TestBugsAndEdgeCases(unittest.TestCase):
    """Tests for bugs, edge cases, and missing implementation (Section 12)"""

    def test_init_py_exists_in_ai_packages(self):
        """Verify that ai/ packages have __init__.py files."""
        ai_dir = os.path.join(os.path.dirname(__file__), "..", "ai")
        for pkg in ["", "llm", "generation", "evaluation"]:
            init_path = os.path.join(ai_dir, pkg, "__init__.py")
            self.assertTrue(os.path.exists(init_path), f"Expected __init__.py in {pkg}/")

    def test_explanation_generator_does_not_overwrite_llm_citations(self):
        """Verify ExplanationGenerator respects LLM citations if present."""
        llm = AzureOpenAIService(force_mock=True)
        gen = ExplanationGenerator(llm_service=llm)
        chunks = [{"text": "Test", "page_number": 99, "section": "TestSec"}]
        result = gen.generate_explanation("test", chunks)
        # Mock LLM returns citation with page_number=1. It should NOT be overwritten to 99.
        self.assertEqual(result.citations[0].page_number, 1)

    def test_recommendation_respects_llm_difficulty(self):
        """Verify recommendation_generator.py respects LLM output if not 'Maintain'."""
        llm = AzureOpenAIService(force_mock=True)
        # Mock RecommendationResponse returns suggested_difficulty_adjustment = "Maintain"
        # Since it is "Maintain", the fallback logic WILL override it to "Increase" because accuracy is 100%.
        quiz_gen = QuizGenerator(llm_service=llm)
        rec_gen = RecommendationGenerator(llm_service=llm)
        quiz = quiz_gen.generate_quiz(topic="test")
        all_correct = {q.question_id: q.correct_option_id for q in quiz.questions}
        rec = rec_gen.evaluate_quiz_submission(quiz, all_correct)
        self.assertEqual(rec.suggested_difficulty_adjustment, "Increase")
        
        # Test that if LLM returned "Decrease", it wouldn't be overridden even if accuracy was 100%.
        # We can simulate this by monkeypatching the LLM mock logic temporarily.
        original_mock = llm._generate_mock_instance
        def mock_with_decrease(model_cls, prompt):
            instance = original_mock(model_cls, prompt)
            if model_cls.__name__ == "RecommendationResponse":
                instance.suggested_difficulty_adjustment = "Decrease"
            return instance
        llm._generate_mock_instance = mock_with_decrease
        rec2 = rec_gen.evaluate_quiz_submission(quiz, all_correct)
        self.assertEqual(rec2.suggested_difficulty_adjustment, "Decrease")
        llm._generate_mock_instance = original_mock

    def test_quiz_generator_respects_num_questions_in_mock(self):
        """Verify Mock mode dynamically respects num_questions parameter."""
        llm = AzureOpenAIService(force_mock=True)
        gen = QuizGenerator(llm_service=llm)
        quiz = gen.generate_quiz(topic="OS", num_questions=5)
        self.assertEqual(len(quiz.questions), 5,
            "Mock mode should return 5 questions when requested")

    def test_flashcard_generator_respects_num_cards_in_mock(self):
        """Verify Mock mode dynamically respects num_cards parameter."""
        llm = AzureOpenAIService(force_mock=True)
        gen = FlashcardGenerator(llm_service=llm)
        deck = gen.generate_flashcards(topic="OS", num_cards=7)
        self.assertEqual(len(deck.cards), 7,
            "Mock mode should return 7 cards when requested")

    def test_explanation_prompt_is_used_by_generators(self):
        """Verify explanation.txt is used by ExplanationGenerator."""
        llm = AzureOpenAIService(force_mock=True)
        gen = ExplanationGenerator(llm_service=llm)
        # We can intercept render_prompt to see which file is loaded
        original_render = llm.render_prompt
        called_prompts = []
        def intercept_render(template_name, **kwargs):
            called_prompts.append(template_name)
            return original_render(template_name, **kwargs)
        llm.render_prompt = intercept_render
        
        gen.generate_explanation("test")
        self.assertIn("explanation.txt", called_prompts)


if __name__ == "__main__":
    unittest.main(verbosity=2)
