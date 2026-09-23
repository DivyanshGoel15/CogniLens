"""FastAPI router for Quiz History, Submissions, and AI Evaluation."""

import uuid
import logging
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from server.app.database.connection import get_db
from server.app.database import repository
from server.app.api.auth import get_current_user_optional
from server.app.models.user import UserModel
from ai.llm.llm_service import get_llm_provider
from server.app.services.rag_service import RAGService

logger = logging.getLogger("cognilens.quiz")

router = APIRouter(prefix="/api/quiz", tags=["Quiz"])

_rag_service = RAGService()
_llm_provider = get_llm_provider()


class QuizSubmissionRequest(BaseModel):
    quizId: Optional[str] = None
    course: str
    topic: str
    score: int  # e.g. 80
    scorePercentage: int
    totalQuestions: int
    correctAnswers: int
    timeSpentSeconds: int
    strongTopics: List[str] = []
    weakTopics: List[str] = []
    recommendedRevision: List[str] = []
    answers: List[Dict[str, Any]] = []


class QuizHistoryResponse(BaseModel):
    id: str
    title: str
    course: str
    topic: str
    scorePercentage: int
    totalQuestions: int
    correctAnswers: int
    timeSpentSec: int
    difficulty: str
    strongTopics: List[str]
    weakTopics: List[str]
    recommendedRevision: List[str]
    created_at: str


@router.get("/history", response_model=List[QuizHistoryResponse])
def get_user_quiz_history(
    user: Optional[UserModel] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
) -> List[QuizHistoryResponse]:
    """Retrieve all submitted quiz attempts for the active user from Azure Database."""
    if not user:
        return []

    history = repository.get_user_quiz_history(db, user_id=user.id)
    results = []
    for h in history:
        results.append(
            QuizHistoryResponse(
                id=h.id,
                title=h.title,
                course=h.course,
                topic=h.topic,
                scorePercentage=h.score_percentage,
                totalQuestions=h.total_questions,
                correctAnswers=h.correct_answers,
                timeSpentSec=h.time_spent_sec,
                difficulty=h.difficulty,
                strongTopics=h.strong_topics or [],
                weakTopics=h.weak_topics or [],
                recommendedRevision=h.recommended_revision or [],
                created_at=h.created_at.strftime("%b %d, %Y %H:%M") if h.created_at else "",
            )
        )
    return results


@router.post("/submit")
def submit_quiz_result(
    payload: QuizSubmissionRequest,
    user: Optional[UserModel] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    """Save quiz submission to database and update student mastery."""
    user_id = user.id if user else "guest"
    
    quiz_res = repository.save_quiz_result(
        db=db,
        user_id=user_id,
        title=f"{payload.course} — {payload.topic} Diagnostic Quiz",
        course=payload.course,
        topic=payload.topic,
        score_percentage=payload.scorePercentage,
        total_questions=payload.totalQuestions,
        correct_answers=payload.correctAnswers,
        time_spent_sec=payload.timeSpentSeconds,
        difficulty="Intermediate",
        strong_topics=payload.strongTopics,
        weak_topics=payload.weakTopics,
        recommended_revision=[{"topic": t} for t in payload.recommendedRevision] if payload.recommendedRevision else [],
        answers=payload.answers,
    )

    return {
        "success": True,
        "quizId": quiz_res.id,
        "scorePercentage": quiz_res.score_percentage,
        "message": "Quiz result recorded successfully in Azure Database."
    }
