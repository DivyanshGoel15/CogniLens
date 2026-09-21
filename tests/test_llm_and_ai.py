"""Comprehensive unit tests for the CogniLens LLM & Generative AI Layer.

Fully offline and mocked: 0 external API calls, 0 token consumption.
Validates Gemini REST provider, Mock provider, Prompt manager,
Grounded QA, Explanations, Quizzes, Flashcards, Intent Router,
Chat Engine with referent resolution, and FastAPI REST endpoints.
"""

import json
import unittest
from unittest.mock import MagicMock, patch
import httpx
from fastapi.testclient import TestClient

from ai.chat.chat_engine import ChatEngine, ChatMessage
from ai.generation.explanation_generator import ExplanationGenerator
from ai.generation.flashcard_generator import FlashcardGenerator
from ai.generation.qa_service import GroundedQAService
from ai.generation.quiz_generator import QuizGenerator
from ai.llm.base_provider import (
    BaseLLMProvider,
    LLMAPIError,
    LLMConfigError,
    LLMError,
    RateLimitError,
)
from ai.llm.gemini_provider import GeminiProvider
from ai.llm.llm_service import get_llm_provider
from ai.llm.mock_provider import MockLLMProvider
from ai.llm.structured_output import (
    ExplanationResponse,
    FlashcardResponse,
    QuizResponse,
    SourceCitation,
    extract_and_parse_json,
)
from ai.prompts.prompt_manager import (
    DEFAULT_SYSTEM_INSTRUCTION,
    build_explanation_prompt,
    build_grounded_qa_prompt,
)
from ai.routing.intent_router import IntentRouter, IntentType
from rag.retrieval.context_builder import ContextBuildResult, SourceCitation as RAGCitation
from server.app.main import app


class TestLLMProviders(unittest.TestCase):
    """Unit tests for LLM providers (Gemini REST, Mock, Factory)."""

    def test_gemini_missing_api_key_raises_config_error(self) -> None:
        """Provider should reject empty or placeholder API keys."""
        provider = GeminiProvider(api_key="", model_name="gemini-1.5-flash")
        with self.assertRaises(LLMConfigError):
            provider.generate("Hello world")

        provider_placeholder = GeminiProvider(api_key="your_actual_key_here")
        with self.assertRaises(LLMConfigError):
            provider_placeholder.generate("Hello world")

    @patch("httpx.Client.post")
    def test_gemini_generate_success(self, mock_post: MagicMock) -> None:
        """Provider should send valid payload and parse response text."""
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {
            "candidates": [
                {
                    "content": {
                        "parts": [{"text": "TCP congestion control prevents network collapse."}]
                    }
                }
            ]
        }
        mock_post.return_value = mock_resp

        provider = GeminiProvider(api_key="valid-test-key-123", model_name="gemini-1.5-flash")
        result = provider.generate("Explain TCP", system_instruction="Be concise")

        self.assertEqual(result, "TCP congestion control prevents network collapse.")
        mock_post.assert_called_once()
        call_kwargs = mock_post.call_args[1]
        payload = call_kwargs["json"]
        self.assertEqual(payload["contents"][0]["parts"][0]["text"], "Explain TCP")
        self.assertEqual(payload["systemInstruction"]["parts"][0]["text"], "Be concise")

    @patch("httpx.Client.post")
    def test_gemini_rate_limit_error(self, mock_post: MagicMock) -> None:
        """HTTP 429 should raise RateLimitError."""
        mock_resp = MagicMock()
        mock_resp.status_code = 429
        mock_resp.text = "Resource exhausted: Quota exceeded"
        mock_post.return_value = mock_resp

        provider = GeminiProvider(api_key="valid-test-key-123")
        with self.assertRaises(RateLimitError):
            provider.generate("Test prompt")

    @patch("httpx.Client.post")
    def test_gemini_server_error(self, mock_post: MagicMock) -> None:
        """HTTP 500 should raise LLMAPIError."""
        mock_resp = MagicMock()
        mock_resp.status_code = 500
        mock_resp.text = "Internal Server Error"
        mock_post.return_value = mock_resp

        provider = GeminiProvider(api_key="valid-test-key-123")
        with self.assertRaises(LLMAPIError):
            provider.generate("Test prompt")

    @patch("httpx.Client.post")
    def test_gemini_generate_structured(self, mock_post: MagicMock) -> None:
        """Structured generation should parse into Pydantic schema."""
        raw_json_output = json.dumps({
            "title": "TCP Fast Retransmit",
            "summary": "Retransmits lost packets after 3 duplicate ACKs.",
            "detailed_explanation": "Avoids waiting for retransmission timer to expire.",
            "key_concepts": ["Duplicate ACKs", "RTO"],
            "analogy": "Ordering a replacement immediately when multiple notices arrive.",
            "citations": [],
            "follow_up_questions": ["What follows fast retransmit?"],
            "difficulty_level": "Intermediate",
        })
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        fenced_text = "```json\n" + raw_json_output + "\n```"
        mock_resp.json.return_value = {
            "candidates": [{"content": {"parts": [{"text": fenced_text}]}}]
        }
        mock_post.return_value = mock_resp

        provider = GeminiProvider(api_key="valid-test-key-123")
        res = provider.generate_structured("Explain fast retransmit", ExplanationResponse)

        self.assertIsInstance(res, ExplanationResponse)
        self.assertEqual(res.title, "TCP Fast Retransmit")
        self.assertEqual(len(res.key_concepts), 2)

    def test_mock_provider_generation(self) -> None:
        """MockLLMProvider returns deterministic models without network."""
        provider = MockLLMProvider()
        text = provider.generate("Test query")
        self.assertIn("TCP", text)

        exp = provider.generate_structured("Explain", ExplanationResponse)
        self.assertIsInstance(exp, ExplanationResponse)
        self.assertEqual(exp.title, "TCP Congestion Control Mechanism")

        quiz = provider.generate_structured("Quiz", QuizResponse)
        self.assertIsInstance(quiz, QuizResponse)
        self.assertGreaterEqual(len(quiz.questions), 1)

        cards = provider.generate_structured("Flashcards", FlashcardResponse)
        self.assertIsInstance(cards, FlashcardResponse)
        self.assertGreaterEqual(len(cards.cards), 1)

    def test_llm_factory(self) -> None:
        """Factory function resolves providers correctly."""
        mock_p = get_llm_provider("mock")
        self.assertIsInstance(mock_p, MockLLMProvider)

        gemini_p = get_llm_provider("gemini", api_key="dummy-key")
        self.assertIsInstance(gemini_p, GeminiProvider)


class TestPromptManager(unittest.TestCase):
    """Unit tests for prompt formatting and academic guardrails."""

    def test_build_grounded_qa_prompt(self) -> None:
        prompt = build_grounded_qa_prompt(
            query="How does slow start work?",
            context="[Source 1]: Slow start doubles cwnd every RTT.",
            conversation_history=[
                {"role": "user", "content": "What is TCP?"},
                {"role": "assistant", "content": "TCP is a connection-oriented transport protocol."},
            ],
        )
        self.assertIn("How does slow start work?", prompt)
        self.assertIn("[Source 1]: Slow start doubles cwnd every RTT.", prompt)
        self.assertIn("What is TCP?", prompt)
        self.assertIn("Instructions:", prompt)

    def test_build_explanation_prompt_beginner(self) -> None:
        prompt = build_explanation_prompt(
            topic="Congestion Window",
            context="Context data",
            difficulty="Beginner",
        )
        self.assertIn("Target Difficulty: Beginner", prompt)
        self.assertIn("simple language", prompt)


class TestGenerators(unittest.TestCase):
    """Unit tests for QA, Explanation, Quiz, and Flashcard generators."""

    def setUp(self) -> None:
        self.mock_provider = MockLLMProvider()
        self.mock_rag = MagicMock()

        # Mock RAG context result
        citation = RAGCitation(
            citation_id="[Source 1]",
            document_name="lecture_tcp.pdf",
            page_number=3,
            section="Congestion Control",
            chunk_id="chk_1",
            score=0.95,
            excerpt="TCP uses AIMD to adjust transmission rate dynamically.",
        )
        self.mock_rag.get_grounded_context.return_value = ContextBuildResult(
            formatted_context="[Source 1] (File: lecture_tcp.pdf | Page 3):\nTCP uses AIMD to adjust transmission rate.",
            citations=[citation],
            chunk_count=1,
            estimated_tokens=50,
            query="TCP",
        )

    def test_grounded_qa_service(self) -> None:
        qa_service = GroundedQAService(
            llm_provider=self.mock_provider,
            rag_service=self.mock_rag,
        )
        response = qa_service.answer_question("Explain AIMD")
        self.assertIn("AIMD", response.answer)
        self.assertEqual(len(response.citations), 1)
        self.assertEqual(response.citations[0]["document_name"], "lecture_tcp.pdf")
        self.assertEqual(response.chunks_used, 1)

    def test_explanation_generator(self) -> None:
        exp_gen = ExplanationGenerator(
            llm_provider=self.mock_provider,
            rag_service=self.mock_rag,
        )
        resp = exp_gen.generate_explanation(topic="Congestion Control", difficulty="Beginner")
        self.assertIsInstance(resp, ExplanationResponse)
        self.assertEqual(resp.difficulty_level, "Beginner")
        self.assertIsNotNone(resp.summary)

    def test_quiz_generator(self) -> None:
        quiz_gen = QuizGenerator(
            llm_provider=self.mock_provider,
            rag_service=self.mock_rag,
        )
        resp = quiz_gen.generate_quiz(topic="TCP", num_questions=2, difficulty="Medium")
        self.assertIsInstance(resp, QuizResponse)
        self.assertEqual(len(resp.questions), 2)
        q1 = resp.questions[0]
        self.assertEqual(len(q1.options), 4)
        self.assertIn(q1.correct_option_id, ["A", "B", "C", "D"])

    def test_flashcard_generator(self) -> None:
        card_gen = FlashcardGenerator(
            llm_provider=self.mock_provider,
            rag_service=self.mock_rag,
        )
        resp = card_gen.generate_flashcards(topic="TCP", num_cards=2)
        self.assertIsInstance(resp, FlashcardResponse)
        self.assertEqual(len(resp.cards), 2)
        self.assertTrue(hasattr(resp.cards[0], "front_question"))
        self.assertTrue(hasattr(resp.cards[0], "back_answer"))


class TestIntentRouterAndChatEngine(unittest.TestCase):
    """Unit tests for Intent classification and referent resolution in conversational engine."""

    def setUp(self) -> None:
        self.router = IntentRouter()
        self.mock_provider = MockLLMProvider()
        self.mock_rag = MagicMock()
        self.mock_rag.get_grounded_context.return_value = ContextBuildResult(
            formatted_context="Sample context",
            citations=[],
            chunk_count=1,
            estimated_tokens=20,
            query="test",
        )
        self.chat_engine = ChatEngine(
            llm_provider=self.mock_provider,
            rag_service=self.mock_rag,
        )

    def test_intent_classification(self) -> None:
        intent_quiz = self.router.classify("Give me a 5 question quiz on TCP")
        self.assertEqual(intent_quiz.intent, IntentType.QUIZ)
        self.assertEqual(intent_quiz.count, 5)

        intent_cards = self.router.classify("Create revision flashcards for subnetting")
        self.assertEqual(intent_cards.intent, IntentType.FLASHCARDS)

        intent_exp = self.router.classify("Explain TCP congestion control in simple terms")
        self.assertEqual(intent_exp.intent, IntentType.EXPLANATION)
        self.assertEqual(intent_exp.difficulty, "Beginner")

        intent_qa = self.router.classify("What is the difference between TCP and UDP?")
        self.assertEqual(intent_qa.intent, IntentType.QA)

    def test_chat_referent_resolution(self) -> None:
        """'explain it in simpler terms' should resolve 'it' using prior turn."""
        history = [
            ChatMessage(role="user", content="Explain TCP congestion control"),
            ChatMessage(role="assistant", content="TCP congestion control uses AIMD."),
        ]
        resolved = self.chat_engine.resolve_referents("Can you explain it more simply?", history)
        self.assertIn("congestion control", resolved.lower())

    def test_chat_engine_quiz_dispatch(self) -> None:
        resp = self.chat_engine.chat("Give me a quiz on TCP")
        self.assertEqual(resp.intent, "quiz")
        self.assertIsNotNone(resp.structured_payload)
        self.assertIn("questions", resp.structured_payload)

    def test_chat_engine_explanation_dispatch(self) -> None:
        resp = self.chat_engine.chat("Explain TCP congestion control")
        self.assertEqual(resp.intent, "explanation")
        self.assertIsNotNone(resp.structured_payload)
        self.assertIn("detailed_explanation", resp.structured_payload)


class TestFastAPIEndpoints(unittest.TestCase):
    """Unit tests for backend FastAPI endpoints using TestClient."""

    def setUp(self) -> None:
        self.client = TestClient(app)

    def test_root_endpoint(self) -> None:
        response = self.client.get("/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["name"], "CogniLens API")
        self.assertEqual(data["status"], "operational")

    def test_health_endpoint(self) -> None:
        response = self.client.get("/api/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "healthy")
        self.assertEqual(data["rag_status"], "ready")

    @patch("server.app.api.chat._chat_engine.chat")
    def test_api_chat_endpoint(self, mock_chat: MagicMock) -> None:
        mock_chat.return_value = MagicMock(
            message="TCP congestion control prevents congestion collapse.",
            intent="qa",
            topic="TCP congestion control",
            citations=[{"filename": "tcp.pdf", "page_number": 2}],
            structured_payload=None,
            latency_ms=120.5,
            provider="MockLLMProvider",
        )

        response = self.client.post(
            "/api/chat",
            json={"message": "What is TCP congestion control?"},
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["intent"], "qa")
        self.assertEqual(data["message"], "TCP congestion control prevents congestion collapse.")
        self.assertEqual(len(data["citations"]), 1)

    @patch("server.app.api.chat._quiz_gen.generate_quiz")
    def test_api_quiz_endpoint(self, mock_quiz: MagicMock) -> None:
        mock_quiz.return_value = QuizResponse(
            title="TCP Quiz",
            topic="TCP",
            total_questions=1,
            target_difficulty="Medium",
            questions=[],
        )

        response = self.client.post(
            "/api/quiz",
            json={"topic": "TCP", "num_questions": 1, "difficulty": "Medium"},
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["title"], "TCP Quiz")
        self.assertEqual(data["total_questions"], 1)


if __name__ == "__main__":
    unittest.main()
