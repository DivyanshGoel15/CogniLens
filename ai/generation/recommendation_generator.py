"""
Recommendation Generator & Weak Topic Assessment Module.
Member 1 - AI / LLM Engineer
"""

import json
import logging
from typing import List, Dict, Any, Optional
from ai.llm.azure_openai import AzureOpenAIService
from ai.llm.structured_output import RecommendationResponse, WeakTopic, QuizResponse

logger = logging.getLogger(__name__)


class RecommendationGenerator:
    """Analyzes quiz performance, identifies weak topics, and recommends adaptive next study steps."""

    def __init__(self, llm_service: Optional[AzureOpenAIService] = None):
        self.llm_service = llm_service or AzureOpenAIService()

    def evaluate_quiz_submission(
        self,
        quiz: QuizResponse,
        user_answers: Dict[int, str],
    ) -> RecommendationResponse:
        """
        Calculates score accuracy and produces personalized study recommendations.
        user_answers: dict mapping question_id -> user_chosen_option_id (e.g. {1: "A", 2: "C"})
        """
        total_questions = len(quiz.questions)
        if total_questions == 0:
            return RecommendationResponse(
                overall_performance_summary="No questions answered.",
                accuracy_percentage=0.0,
                weak_topics=[],
                recommended_next_steps=["Take a diagnostic quiz."],
                suggested_difficulty_adjustment="Maintain",
            )

        correct_count = 0
        topic_stats: Dict[str, Dict[str, Any]] = {}

        assessment_details = []

        for q in quiz.questions:
            chosen = user_answers.get(q.question_id, "NONE")
            is_correct = chosen.upper() == q.correct_option_id.upper()
            if is_correct:
                correct_count += 1

            topic = q.topic or "General"
            if topic not in topic_stats:
                topic_stats[topic] = {"total": 0, "correct": 0}
            topic_stats[topic]["total"] += 1
            if is_correct:
                topic_stats[topic]["correct"] += 1

            assessment_details.append({
                "question_id": q.question_id,
                "topic": topic,
                "question_text": q.question_text,
                "user_answer": chosen,
                "correct_answer": q.correct_option_id,
                "is_correct": is_correct,
                "explanation": q.explanation,
            })

        overall_accuracy = (correct_count / total_questions) * 100.0

        # Construct assessment summary context for LLM prompt
        assessment_summary = {
            "total_questions": total_questions,
            "correct_count": correct_count,
            "overall_accuracy_percentage": round(overall_accuracy, 1),
            "target_difficulty": quiz.target_difficulty,
            "topic_breakdown": {
                t: {
                    "total": stats["total"],
                    "correct": stats["correct"],
                    "accuracy_pct": round((stats["correct"] / stats["total"]) * 100, 1),
                }
                for t, stats in topic_stats.items()
            },
            "detailed_results": assessment_details,
        }

        prompt = self.llm_service.render_prompt(
            "recommendations.txt",
            assessment_data=json.dumps(assessment_summary, indent=2),
        )

        system_prompt = self.llm_service.render_prompt("system.txt")

        recommendations, latency, tokens = self.llm_service.generate_structured_output(
            prompt=prompt,
            response_model=RecommendationResponse,
            system_prompt=system_prompt,
        )

        recommendations.accuracy_percentage = round(overall_accuracy, 1)

        # Fallback adjustment logic if LLM mock mode or default returned
        if not recommendations.suggested_difficulty_adjustment or recommendations.suggested_difficulty_adjustment == "Maintain":
            if overall_accuracy >= 80.0:
                recommendations.suggested_difficulty_adjustment = "Increase"
            elif overall_accuracy < 50.0:
                recommendations.suggested_difficulty_adjustment = "Decrease"
            else:
                recommendations.suggested_difficulty_adjustment = "Maintain"

        return recommendations
