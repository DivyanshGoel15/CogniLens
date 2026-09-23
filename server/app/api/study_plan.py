"""FastAPI router for AI-generated personalized Study Plans."""

import json
import logging
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ai.llm.llm_service import get_llm_provider
from server.app.services.rag_service import RAGService
from server.app.database.connection import get_db
from server.app.database import repository
from server.app.api.auth import get_current_user_optional
from server.app.models.user import UserModel

logger = logging.getLogger("cognilens.study_plan")

router = APIRouter(prefix="/api/study-plan", tags=["Study Plan"])

_rag_service = RAGService()
_llm_provider = get_llm_provider()


class StudyPlanRequest(BaseModel):
    courses: List[str] = []
    weak_topics: List[str] = []
    available_hours: float = 2.0
    goal: str = "exam_preparation"


class StudyBlock(BaseModel):
    id: Optional[str] = None
    time_slot: str
    topic: str
    course: str
    activity: str
    duration_min: int
    priority: str
    status: Optional[str] = "pending"  # pending | completed


class StudyPlanResponse(BaseModel):
    id: Optional[str] = None
    title: str
    summary: str
    week_range: Optional[str] = "Next 7 Days"
    total_study_hours_planned: Optional[float] = 5.0
    completed_minutes: Optional[int] = 0
    blocks: List[StudyBlock]
    tips: List[str] = []


@router.get("", response_model=StudyPlanResponse)
def get_current_study_plan(
    user: Optional[UserModel] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
) -> StudyPlanResponse:
    """Retrieve saved study plan for user from Azure Database."""
    user_id = user.id if user else "guest"
    plan_record = repository.get_user_study_plan(db, user_id=user_id)
    if not plan_record:
        # Default starter study plan
        default_blocks = [
            StudyBlock(
                id="block-1",
                time_slot="Monday 10:00 AM",
                topic="Operating Systems Deadlock Detection & Coffman Conditions",
                course="Operating Systems",
                activity="Read notes & solve RAG cycle graph exercises",
                duration_min=45,
                priority="high",
                status="completed"
            ),
            StudyBlock(
                id="block-2",
                time_slot="Tuesday 2:00 PM",
                topic="Linear Regression & Cost Function Formulation",
                course="Machine Learning",
                activity="Review MSE derivations and gradient descent step rules",
                duration_min=45,
                priority="high",
                status="completed"
            ),
            StudyBlock(
                id="block-3",
                time_slot="Wednesday 11:00 AM",
                topic="Banker's Safe State Algorithm Practice",
                course="Operating Systems",
                activity="Interactive quiz assessment",
                duration_min=30,
                priority="medium",
                status="pending"
            ),
            StudyBlock(
                id="block-4",
                time_slot="Thursday 3:30 PM",
                topic="Gradient Descent Convergence & Learning Rate Tuning",
                course="Machine Learning",
                activity="Diagram analysis & handwritten notes review",
                duration_min=50,
                priority="medium",
                status="pending"
            ),
            StudyBlock(
                id="block-5",
                time_slot="Friday 10:00 AM",
                topic="Multi-topic Comprehensive Assessment",
                course="General Studies",
                activity="Active recall flashcard mastery",
                duration_min=35,
                priority="high",
                status="pending"
            )
        ]
        return StudyPlanResponse(
            id="plan-default",
            title="Midterm Mastery & Core Foundations",
            summary="Personalized adaptive study plan prioritizing your weak areas.",
            week_range="Current Academic Week",
            total_study_hours_planned=5.5,
            completed_minutes=90,
            blocks=default_blocks,
            tips=[
                "Review theoretical definitions before taking practice quizzes.",
                "Dedicate 15 minutes to spaced repetition flashcards daily.",
                "Verify Coffman conditions using Resource Allocation Graph diagrams."
            ]
        )

    raw_items = plan_record.items or []
    blocks = []
    for item in raw_items:
        if isinstance(item, dict):
            blocks.append(
                StudyBlock(
                    id=item.get("id"),
                    time_slot=item.get("time_slot", "Flexible Slot"),
                    topic=item.get("topic", "General Topic"),
                    course=item.get("course", "Academic Studies"),
                    activity=item.get("activity", "Review material"),
                    duration_min=int(item.get("duration_min", 30)),
                    priority=item.get("priority", "medium"),
                    status=item.get("status", "pending"),
                )
            )

    return StudyPlanResponse(
        id=plan_record.id,
        title=plan_record.target_focus or "Personalized AI Study Plan",
        summary="Your active weekly academic preparation schedule.",
        week_range=plan_record.week_range,
        total_study_hours_planned=plan_record.total_study_hours_planned,
        completed_minutes=plan_record.completed_minutes,
        blocks=blocks,
        tips=[
            "Focus on high-priority blocks first during peak concentration hours.",
            "Complete a 5-question diagnostic quiz after each reading session.",
        ],
    )


@router.post("", response_model=StudyPlanResponse)
def generate_study_plan(
    request: StudyPlanRequest,
    user: Optional[UserModel] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
) -> StudyPlanResponse:
    """Generate and persist a personalized AI study plan based on courses and weak topics."""
    try:
        courses_str = ", ".join(request.courses) if request.courses else "Operating Systems, Machine Learning"
        weak_str = ", ".join(request.weak_topics) if request.weak_topics else "Deadlock Avoidance, Gradient Descent"

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

        # Parse JSON
        clean = response_text.strip()
        if clean.startswith("```"):
            clean = clean.split("\n", 1)[1] if "\n" in clean else clean[3:]
            if clean.endswith("```"):
                clean = clean[:-3]
            clean = clean.strip()
            if clean.startswith("json"):
                clean = clean[4:].strip()

        parsed = {}
        try:
            parsed = json.loads(clean)
        except Exception:
            parsed = {
                "title": f"Adaptive Study Plan: {courses_str}",
                "summary": f"Structured preparation covering {courses_str} with priority on {weak_str}.",
                "blocks": [
                    {
                        "id": "b1",
                        "time_slot": "Day 1 — Morning",
                        "topic": f"High Priority: {weak_str}",
                        "course": request.courses[0] if request.courses else "Operating Systems",
                        "activity": "Read core notes and formulate key concept summary",
                        "duration_min": 45,
                        "priority": "high",
                        "status": "pending"
                    },
                    {
                        "id": "b2",
                        "time_slot": "Day 2 — Afternoon",
                        "topic": "Algorithmic Invariants & Proofs",
                        "course": request.courses[-1] if request.courses else "Machine Learning",
                        "activity": "Solve practice questions and verify derivation steps",
                        "duration_min": 45,
                        "priority": "medium",
                        "status": "pending"
                    },
                    {
                        "id": "b3",
                        "time_slot": "Day 3 — Evening",
                        "topic": "Comprehensive Topic Retrieval",
                        "course": "General",
                        "activity": "Active recall diagnostic quiz",
                        "duration_min": 30,
                        "priority": "high",
                        "status": "pending"
                    }
                ],
                "tips": [
                    "Active testing outperforms passive rereading.",
                    "Review incorrect quiz options to reinforce reasoning.",
                ]
            }

        blocks = []
        raw_blocks = parsed.get("blocks", [])
        for idx, b in enumerate(raw_blocks):
            blocks.append(
                StudyBlock(
                    id=b.get("id") or f"sb-{idx+1}",
                    time_slot=b.get("time_slot", f"Session {idx+1}"),
                    topic=b.get("topic", "Targeted Concept"),
                    course=b.get("course", "Academic Course"),
                    activity=b.get("activity", "Study session"),
                    duration_min=int(b.get("duration_min", 30)),
                    priority=b.get("priority", "medium"),
                    status="pending",
                )
            )

        user_id = user.id if user else "guest"
        saved_items = [b.dict() for b in blocks]
        plan_record = repository.save_user_study_plan(
            db=db,
            user_id=user_id,
            week_range="Next 7 Days",
            target_focus=parsed.get("title", f"AI Study Plan: {courses_str}"),
            total_study_hours_planned=request.available_hours,
            completed_minutes=0,
            items=saved_items,
        )

        return StudyPlanResponse(
            id=plan_record.id,
            title=plan_record.target_focus,
            summary=parsed.get("summary", "Personalized study schedule optimized for exam readiness."),
            week_range=plan_record.week_range,
            total_study_hours_planned=plan_record.total_study_hours_planned,
            completed_minutes=0,
            blocks=blocks,
            tips=parsed.get("tips", ["Consistent daily review yields higher long-term retention."]),
        )

    except Exception as exc:
        logger.exception("Error in /api/study-plan: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Study plan generation failed: {str(exc)}",
        )


@router.patch("/task/{task_id}", response_model=StudyPlanResponse)
def toggle_task_status(
    task_id: str,
    user: Optional[UserModel] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
) -> StudyPlanResponse:
    """Toggle completion status of a study plan block and update database."""
    user_id = user.id if user else "guest"
    plan = repository.get_user_study_plan(db, user_id=user_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Study plan not found.")

    items = plan.items or []
    completed_mins = 0
    for it in items:
        if str(it.get("id")) == str(task_id):
            curr = it.get("status", "pending")
            it["status"] = "completed" if curr != "completed" else "pending"
        if it.get("status") == "completed":
            completed_mins += int(it.get("duration_min", 30))

    plan.items = items
    plan.completed_minutes = completed_mins
    db.commit()
    db.refresh(plan)
    return get_current_study_plan(user=user, db=db)
