"""FastAPI router for AI-generated personalized Study Plans."""

import logging
from typing import List, Optional
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from ai.llm.llm_service import get_llm_provider
from server.app.services.rag_service import RAGService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/study-plan", tags=["Study Plan"])

_rag_service = RAGService()
_llm_provider = get_llm_provider()


class StudyPlanRequest(BaseModel):
    courses: List[str] = []
    weak_topics: List[str] = []
    available_hours: float = 2.0
    goal: str = "exam_preparation"


class StudyBlock(BaseModel):
    time_slot: str
    topic: str
    course: str
    activity: str
    duration_min: int
    priority: str


class StudyPlanResponse(BaseModel):
    title: str
    summary: str
    blocks: List[StudyBlock]
    tips: List[str]


@router.post("", response_model=StudyPlanResponse)
def generate_study_plan(request: StudyPlanRequest) -> StudyPlanResponse:
    """Generate a personalized AI study plan based on courses, weak topics, and available time."""
    try:
        courses_str = ", ".join(request.courses) if request.courses else "General Academic Studies"
        weak_str = ", ".join(request.weak_topics) if request.weak_topics else "core concepts"

        prompt = (
            f"Create a structured study plan for a student preparing for exams.\n"
            f"Courses: {courses_str}\n"
            f"Weak topics to prioritize: {weak_str}\n"
            f"Available study time: {request.available_hours} hours\n"
            f"Goal: {request.goal}\n\n"
            f"Respond with a JSON object containing:\n"
            f"- title: plan title\n"
            f"- summary: brief overview\n"
            f"- blocks: array of study blocks, each with time_slot, topic, course, activity, duration_min, priority\n"
            f"- tips: array of study tips\n"
            f"Return ONLY valid JSON, no markdown."
        )

        context = _rag_service.get_grounded_context(
            query=f"study plan for {courses_str} focusing on {weak_str}",
            top_k=3,
        )

        full_prompt = f"{prompt}\n\nContext from student materials:\n{context.formatted_context}"

        response_text = _llm_provider.generate(
            prompt=full_prompt,
            system_instruction="You are an expert academic study planner. Generate structured JSON study plans.",
            temperature=0.4,
        )

        # Try parsing the LLM response as JSON
        import json
        try:
            # Strip markdown code fences if present
            clean = response_text.strip()
            if clean.startswith("```"):
                clean = clean.split("\n", 1)[1] if "\n" in clean else clean[3:]
                if clean.endswith("```"):
                    clean = clean[:-3]
                clean = clean.strip()
                if clean.startswith("json"):
                    clean = clean[4:].strip()

            parsed = json.loads(clean)
            return StudyPlanResponse(
                title=parsed.get("title", "AI Study Plan"),
                summary=parsed.get("summary", "Personalized study plan based on your courses and weak areas."),
                blocks=[
                    StudyBlock(
                        time_slot=b.get("time_slot", ""),
                        topic=b.get("topic", ""),
                        course=b.get("course", ""),
                        activity=b.get("activity", ""),
                        duration_min=b.get("duration_min", 30),
                        priority=b.get("priority", "medium"),
                    )
                    for b in parsed.get("blocks", [])
                ],
                tips=parsed.get("tips", []),
            )
        except (json.JSONDecodeError, KeyError, TypeError):
            logger.warning("Failed to parse study plan JSON from LLM, returning template")

        # Fallback structured response
        hours = request.available_hours
        blocks = []
        slot_idx = 0
        for course in (request.courses or ["General"]):
            for topic in (request.weak_topics or ["Core Concepts"])[:2]:
                blocks.append(StudyBlock(
                    time_slot=f"Session {slot_idx + 1}",
                    topic=topic,
                    course=course,
                    activity="Review notes & practice problems",
                    duration_min=int((hours * 60) / max(1, len(request.courses or [1]) * 2)),
                    priority="high" if topic in (request.weak_topics or []) else "medium",
                ))
                slot_idx += 1

        return StudyPlanResponse(
            title=f"Study Plan: {courses_str}",
            summary=f"Focus on weak areas: {weak_str}. Total time: {hours}h.",
            blocks=blocks,
            tips=[
                "Use active recall and spaced repetition for maximum retention.",
                "Take 5-minute breaks every 25 minutes (Pomodoro technique).",
                "Review weak topics first when your energy is highest.",
            ],
        )

    except Exception as exc:
        logger.exception("Error generating study plan: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Study plan generation error: {str(exc)}",
        )
