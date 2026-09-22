"""FastAPI router for Learning Analytics, Progress Tracking, and Activities."""

import logging
from typing import List, Optional
from fastapi import APIRouter
from pydantic import BaseModel

logger = logging.getLogger(__name__)

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

_PROGRESS_STATE = ProgressStateSchema(
    overallMastery=78,
    totalStudyHours=14.5,
    quizAccuracy=84,
    currentStreakDays=6,
    totalQuestionsAnswered=48,
    flashcardsMastered=32,
    lastStudied=LastStudiedSchema(
        materialId="mat-ml-linear",
        title="Machine Learning — Linear Regression & Cost Functions",
        filename="Machine Learning — Linear Regression.pdf",
        course="Machine Learning",
        page=4,
        totalPages=28,
        sectionTitle="Section: Mean Squared Error Loss Formulation (p. 4)",
        progressPercentage=72,
        lastUpdated="15m ago"
    ),
    courses=[
        CourseMasterySchema(
            course="Operating Systems",
            masteryPercentage=74,
            topicsCompleted=6,
            totalTopics=8,
            strongTopics=["Process Synchronization", "Semaphores", "CPU Scheduling"],
            weakTopics=["Deadlock Detection", "Banker Algorithm Safe States"],
            recentScore=80
        ),
        CourseMasterySchema(
            course="Machine Learning",
            masteryPercentage=82,
            topicsCompleted=7,
            totalTopics=9,
            strongTopics=["Linear Regression", "Cost Functions", "Overfitting"],
            weakTopics=["Gradient Descent Convergence", "Learning Rate Tuning"],
            recentScore=90
        )
    ],
    recentActivities=[
        ActivitySchema(
            id="act-1",
            title="Practiced OS Deadlocks & Coffman Conditions Quiz",
            type="quiz",
            timestamp="2 hours ago",
            resultSnippet="Score: 80% (4/5 correct)"
        )
    ]
)

@router.get("", response_model=ProgressStateSchema)
def get_progress() -> ProgressStateSchema:
    """Get real-time learning progress and mastery metrics."""
    return _PROGRESS_STATE
