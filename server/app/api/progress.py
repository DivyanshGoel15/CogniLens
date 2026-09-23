"""FastAPI router for Learning Analytics, Progress Tracking, and Activities."""

import logging
from typing import List, Optional, Any, Dict
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from server.app.database.connection import get_db
from server.app.database import repository
from server.app.api.auth import get_current_user_optional
from server.app.models.user import UserModel

logger = logging.getLogger("cognilens.progress")

router = APIRouter(prefix="/api/progress", tags=["Learning Analytics"])


class CourseMasterySchema(BaseModel):
    course: str
    masteryPercentage: int
    topicsCompleted: int
    totalTopics: int
    strongTopics: List[str]
    weakTopics: List[str]
    recentScore: int


class LastStudiedSchema(BaseModel):
    materialId: str
    title: str
    filename: str
    course: str
    page: int
    totalPages: int
    sectionTitle: str
    progressPercentage: int
    lastUpdated: str


class ActivitySchema(BaseModel):
    id: str
    title: str
    type: str
    timestamp: str
    resultSnippet: Optional[str] = None


class ProgressStateSchema(BaseModel):
    overallMastery: int
    totalStudyHours: float
    quizAccuracy: int
    currentStreakDays: int
    totalQuestionsAnswered: int
    flashcardsMastered: int
    lastStudied: Optional[LastStudiedSchema] = None
    courses: List[CourseMasterySchema]
    recentActivities: List[ActivitySchema]


class ProgressUpdatePayload(BaseModel):
    overallMastery: Optional[int] = None
    totalStudyHours: Optional[float] = None
    quizAccuracy: Optional[int] = None
    currentStreakDays: Optional[int] = None
    totalQuestionsAnswered: Optional[int] = None
    flashcardsMastered: Optional[int] = None
    lastStudied: Optional[Dict[str, Any]] = None
    courses: Optional[List[Dict[str, Any]]] = None


class LogActivityPayload(BaseModel):
    title: str
    type: str
    resultSnippet: Optional[str] = None


@router.get("", response_model=ProgressStateSchema)
def get_progress(
    user: Optional[UserModel] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
) -> ProgressStateSchema:
    """Get real-time learning progress and mastery metrics from Azure Database."""
    user_id = user.id if user else "guest"
    prog = repository.get_or_create_user_progress(db, user_id=user_id)
    activities = repository.get_user_activities(db, user_id=user_id, limit=10)

    # Format courses
    courses_data = []
    for c in prog.courses or []:
        if isinstance(c, dict):
            courses_data.append(
                CourseMasterySchema(
                    course=c.get("course", "General"),
                    masteryPercentage=int(c.get("masteryPercentage", 70)),
                    topicsCompleted=int(c.get("topicsCompleted", 1)),
                    totalTopics=int(c.get("totalTopics", 5)),
                    strongTopics=c.get("strongTopics", []),
                    weakTopics=c.get("weakTopics", []),
                    recentScore=int(c.get("recentScore", 80)),
                )
            )

    # Format activities
    acts_data = []
    for a in activities:
        acts_data.append(
            ActivitySchema(
                id=a.id,
                title=a.title,
                type=a.type,
                timestamp=a.timestamp_str,
                resultSnippet=a.result_snippet,
            )
        )

    last_studied = None
    if prog.last_studied and isinstance(prog.last_studied, dict):
        last_studied = LastStudiedSchema(
            materialId=prog.last_studied.get("materialId", "mat-1"),
            title=prog.last_studied.get("title", "Lecture Notes"),
            filename=prog.last_studied.get("filename", "notes.pdf"),
            course=prog.last_studied.get("course", "General"),
            page=int(prog.last_studied.get("page", 1)),
            totalPages=int(prog.last_studied.get("totalPages", 10)),
            sectionTitle=prog.last_studied.get("sectionTitle", "Introduction"),
            progressPercentage=int(prog.last_studied.get("progressPercentage", 10)),
            lastUpdated=prog.last_studied.get("lastUpdated", "Just now"),
        )

    return ProgressStateSchema(
        overallMastery=prog.overall_mastery,
        totalStudyHours=prog.total_study_hours,
        quizAccuracy=prog.quiz_accuracy,
        currentStreakDays=prog.current_streak_days,
        totalQuestionsAnswered=prog.total_questions_answered,
        flashcardsMastered=prog.flashcards_mastered,
        lastStudied=last_studied,
        courses=courses_data,
        recentActivities=acts_data,
    )


@router.post("/update", response_model=ProgressStateSchema)
def update_progress(
    payload: ProgressUpdatePayload,
    user: Optional[UserModel] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
) -> ProgressStateSchema:
    """Save updated learning progress metrics to Azure Database."""
    user_id = user.id if user else "guest"
    fields = {}
    if payload.overallMastery is not None:
        fields["overall_mastery"] = payload.overallMastery
    if payload.totalStudyHours is not None:
        fields["total_study_hours"] = payload.totalStudyHours
    if payload.quizAccuracy is not None:
        fields["quiz_accuracy"] = payload.quizAccuracy
    if payload.currentStreakDays is not None:
        fields["current_streak_days"] = payload.currentStreakDays
    if payload.totalQuestionsAnswered is not None:
        fields["total_questions_answered"] = payload.totalQuestionsAnswered
    if payload.flashcardsMastered is not None:
        fields["flashcards_mastered"] = payload.flashcardsMastered
    if payload.lastStudied is not None:
        fields["last_studied"] = payload.lastStudied
    if payload.courses is not None:
        fields["courses"] = payload.courses

    repository.update_user_progress(db, user_id=user_id, update_data=fields)
    return get_progress(user=user, db=db)


@router.post("/activity", response_model=ActivitySchema)
def log_activity(
    payload: LogActivityPayload,
    user: Optional[UserModel] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
) -> ActivitySchema:
    """Record a user learning activity log."""
    user_id = user.id if user else "guest"
    act = repository.record_user_activity(
        db=db,
        user_id=user_id,
        title=payload.title,
        activity_type=payload.type,
        result_snippet=payload.resultSnippet,
    )
    return ActivitySchema(
        id=act.id,
        title=act.title,
        type=act.type,
        timestamp=act.timestamp_str,
        resultSnippet=act.result_snippet,
    )
