"""Database Repository layer enforcing strict multi-user isolation."""

import logging
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import or_

from server.app.models.user import UserModel
from server.app.models.document import DocumentModel
from server.app.models.progress import ProgressModel, ActivityLogModel
from server.app.models.quiz import QuizHistoryModel
from server.app.models.flashcard import FlashcardDeckModel
from server.app.models.study_plan import StudyPlanRecord

logger = logging.getLogger("cognilens.repository")


# ==============================================================================
# User Management
# ==============================================================================
def get_user_by_email(db: Session, email: str) -> Optional[UserModel]:
    """Retrieve user entity by email (case-insensitive)."""
    return db.query(UserModel).filter(UserModel.email == email.lower().strip()).first()


def get_user_by_id(db: Session, user_id: str) -> Optional[UserModel]:
    """Retrieve user entity by primary key ID."""
    return db.query(UserModel).filter(UserModel.id == user_id).first()


def create_user(
    db: Session,
    email: str,
    password_hash: str,
    full_name: str,
    major: str = "Computer Science",
    academic_year: str = "Year 3",
) -> UserModel:
    """Create a new registered user and initialize their personal progress state."""
    clean_name = full_name.strip()
    initials = (clean_name[0] if clean_name else "S").upper()
    
    colors = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#06b6d4"]
    avatar_color = colors[len(clean_name) % len(colors)]

    user = UserModel(
        email=email.lower().strip(),
        password_hash=password_hash,
        full_name=clean_name,
        major=major,
        academic_year=academic_year,
        avatar_initials=initials,
        avatar_bg_color=avatar_color,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Initialize user progress state (clean initial state)
    init_progress = ProgressModel(
        user_id=user.id,
        overall_mastery=0,
        total_study_hours=0.0,
        quiz_accuracy=0,
        current_streak_days=0,
        last_active_date=datetime.utcnow().strftime("%Y-%m-%d"),
        active_days_history=[],
        total_questions_answered=0,
        flashcards_mastered=0,
        last_studied=None,
        courses=[],
    )
    db.add(init_progress)

    # Initial Welcome Activity
    welcome_act = ActivityLogModel(
        user_id=user.id,
        title=f"Welcome to CogniLens, {clean_name}!",
        type="user",
        timestamp_str="Just now",
        result_snippet="Upload your study materials to start your personalized learning journey.",
    )
    db.add(welcome_act)

    db.commit()
    return user


def set_password_reset_code(db: Session, email: str, code: str, expires_in_minutes: int = 15) -> bool:
    """Store verification code with expiration for password reset."""
    user = get_user_by_email(db, email)
    if not user:
        return False
    user.reset_code = code
    user.reset_code_expires_at = datetime.utcnow() + timedelta(minutes=expires_in_minutes)
    db.commit()
    return True


def verify_and_reset_password(db: Session, email: str, code: str, new_password_hash: str) -> bool:
    """Verify code and update user password if code is valid and unexpired."""
    user = get_user_by_email(db, email)
    if not user or not user.reset_code or not user.reset_code_expires_at:
        return False

    if user.reset_code_expires_at < datetime.utcnow():
        logger.warning("Reset code for %s has expired.", email)
        return False

    if user.reset_code.strip() != code.strip():
        logger.warning("Invalid reset code attempt for %s.", email)
        return False

    user.password_hash = new_password_hash
    user.reset_code = None
    user.reset_code_expires_at = None
    user.updated_at = datetime.utcnow()
    db.commit()
    return True


def update_user_profile(
    db: Session,
    user_id: str,
    full_name: Optional[str] = None,
    major: Optional[str] = None,
    academic_year: Optional[str] = None,
) -> Optional[UserModel]:
    """Update user profile information."""
    user = get_user_by_id(db, user_id)
    if not user:
        return None
    if full_name:
        user.full_name = full_name.strip()
        user.avatar_initials = user.full_name[0].upper()
    if major:
        user.major = major.strip()
    if academic_year:
        user.academic_year = academic_year.strip()
    user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(user)
    return user


# ==============================================================================
# Document Management
# ==============================================================================
def get_user_documents(db: Session, user_id: Optional[str]) -> List[DocumentModel]:
    """Get all documents accessible by user (their own documents plus global system materials)."""
    if user_id:
        return (
            db.query(DocumentModel)
            .filter(or_(DocumentModel.user_id == user_id, DocumentModel.user_id.is_(None)))
            .order_by(DocumentModel.created_at.desc())
            .all()
        )
    return db.query(DocumentModel).order_by(DocumentModel.created_at.desc()).all()


def get_document_by_id(db: Session, doc_id: str, user_id: Optional[str] = None) -> Optional[DocumentModel]:
    """Retrieve document by ID with user ownership check."""
    q = db.query(DocumentModel).filter(DocumentModel.id == doc_id)
    if user_id:
        q = q.filter(or_(DocumentModel.user_id == user_id, DocumentModel.user_id.is_(None)))
    return q.first()


def create_user_document(
    db: Session,
    user_id: Optional[str],
    title: str,
    filename: str,
    file_type: str,
    pages_count: int,
    size: str,
    course: str,
    topics: List[str],
    content_preview: Optional[str] = None,
    sections: Optional[List[Dict[str, Any]]] = None,
    blob_url: Optional[str] = None,
) -> DocumentModel:
    """Save newly uploaded material tied to user account in the database."""
    doc = DocumentModel(
        user_id=user_id,
        title=title,
        filename=filename,
        type=file_type,
        pages_count=pages_count,
        size=size,
        upload_date=datetime.utcnow().strftime("%b %d, %Y"),
        status="indexed",
        course=course,
        topics=topics,
        content_preview=content_preview,
        sections=sections or [],
        blob_url=blob_url,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc


def delete_user_document(db: Session, doc_id: str, user_id: Optional[str] = None) -> bool:
    """Delete a document if owned by the user."""
    doc = get_document_by_id(db, doc_id, user_id)
    if not doc:
        return False
    db.delete(doc)
    db.commit()
    return True


# ==============================================================================
# Learning Progress & Analytics
# ==============================================================================
def get_or_create_user_progress(db: Session, user_id: str) -> ProgressModel:
    """Fetch user progress record or initialize a new one."""
    prog = db.query(ProgressModel).filter(ProgressModel.user_id == user_id).first()
    if not prog:
        prog = ProgressModel(
            user_id=user_id,
            overall_mastery=0,
            total_study_hours=0.0,
            quiz_accuracy=0,
            current_streak_days=0,
            last_active_date=datetime.utcnow().strftime("%Y-%m-%d"),
            active_days_history=[],
            courses=[],
            total_questions_answered=0,
            flashcards_mastered=0,
            last_studied=None,
        )
        db.add(prog)
        db.commit()
        db.refresh(prog)
    return prog


def update_user_progress(db: Session, user_id: str, update_data: Dict[str, Any]) -> ProgressModel:
    """Update learning progress metrics for user."""
    prog = get_or_create_user_progress(db, user_id)
    for key, value in update_data.items():
        if hasattr(prog, key) and value is not None:
            setattr(prog, key, value)
    prog.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(prog)
    return prog


def record_user_activity(
    db: Session,
    user_id: str,
    title: str,
    activity_type: str,
    result_snippet: Optional[str] = None,
) -> ActivityLogModel:
    """Log an activity entry for user analytics."""
    act = ActivityLogModel(
        user_id=user_id,
        title=title,
        type=activity_type,
        timestamp_str="Just now",
        result_snippet=result_snippet,
    )
    db.add(act)
    db.commit()
    db.refresh(act)
    return act


def get_user_activities(db: Session, user_id: str, limit: int = 15) -> List[ActivityLogModel]:
    """Retrieve recent learning activities for user."""
    return (
        db.query(ActivityLogModel)
        .filter(ActivityLogModel.user_id == user_id)
        .order_by(ActivityLogModel.created_at.desc())
        .limit(limit)
        .all()
    )


# ==============================================================================
# Quiz Submissions & History
# ==============================================================================
def save_quiz_result(
    db: Session,
    user_id: str,
    title: str,
    course: str,
    topic: str,
    score_percentage: int,
    total_questions: int,
    correct_answers: int,
    time_spent_sec: int,
    difficulty: str,
    strong_topics: List[str],
    weak_topics: List[str],
    recommended_revision: List[Dict[str, Any]],
    answers: List[Dict[str, Any]],
) -> QuizHistoryModel:
    """Save graded quiz attempt and update user progress."""
    rec = QuizHistoryModel(
        user_id=user_id,
        title=title,
        course=course,
        topic=topic,
        score_percentage=score_percentage,
        total_questions=total_questions,
        correct_answers=correct_answers,
        time_spent_sec=time_spent_sec,
        difficulty=difficulty,
        strong_topics=strong_topics,
        weak_topics=weak_topics,
        recommended_revision=recommended_revision,
        answers=answers,
    )
    db.add(rec)

    # Log activity
    record_user_activity(
        db,
        user_id,
        f"Completed {course} Practice Quiz: {topic}",
        "quiz",
        f"Score: {score_percentage}% ({correct_answers}/{total_questions} correct)",
    )

    # Update progress
    prog = get_or_create_user_progress(db, user_id)
    prog.total_questions_answered += total_questions
    prog.total_study_hours = round(prog.total_study_hours + round(time_spent_sec / 3600.0, 2), 2)
    prog.quiz_accuracy = round((prog.quiz_accuracy * 4 + score_percentage) / 5)
    db.commit()
    db.refresh(rec)
    return rec


def get_user_quiz_history(db: Session, user_id: str, limit: int = 20) -> List[QuizHistoryModel]:
    """Retrieve quiz submission history for user."""
    return (
        db.query(QuizHistoryModel)
        .filter(QuizHistoryModel.user_id == user_id)
        .order_by(QuizHistoryModel.created_at.desc())
        .limit(limit)
        .all()
    )


# ==============================================================================
# Flashcard Decks
# ==============================================================================
def get_user_flashcard_decks(db: Session, user_id: str) -> List[FlashcardDeckModel]:
    """Retrieve flashcard decks belonging to user."""
    return (
        db.query(FlashcardDeckModel)
        .filter(FlashcardDeckModel.user_id == user_id)
        .order_by(FlashcardDeckModel.updated_at.desc())
        .all()
    )


def save_flashcard_deck(
    db: Session,
    user_id: str,
    deck_id: Optional[str],
    title: str,
    course: str,
    description: str,
    cards: List[Dict[str, Any]],
) -> FlashcardDeckModel:
    """Create or update a flashcard deck for user."""
    deck = None
    if deck_id:
        deck = db.query(FlashcardDeckModel).filter(
            FlashcardDeckModel.id == deck_id, FlashcardDeckModel.user_id == user_id
        ).first()

    if not deck:
        deck = FlashcardDeckModel(
            user_id=user_id,
            title=title,
            course=course,
            description=description,
            total_cards=len(cards),
            reviewed_count=0,
            cards=cards,
        )
        db.add(deck)
    else:
        deck.title = title
        deck.course = course
        deck.description = description
        deck.total_cards = len(cards)
        deck.cards = cards
        deck.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(deck)
    return deck


def delete_flashcard_deck(db: Session, deck_id: str, user_id: str) -> bool:
    """Delete a flashcard deck owned by user."""
    deck = db.query(FlashcardDeckModel).filter(
        FlashcardDeckModel.id == deck_id, FlashcardDeckModel.user_id == user_id
    ).first()
    if not deck:
        return False
    db.delete(deck)
    db.commit()
    return True


# ==============================================================================
# Study Plans
# ==============================================================================
def get_user_study_plan(db: Session, user_id: str) -> Optional[StudyPlanRecord]:
    """Retrieve the current active study plan for user."""
    return (
        db.query(StudyPlanRecord)
        .filter(StudyPlanRecord.user_id == user_id)
        .order_by(StudyPlanRecord.updated_at.desc())
        .first()
    )


def save_user_study_plan(
    db: Session,
    user_id: str,
    week_range: str,
    target_focus: str,
    total_study_hours_planned: float,
    completed_minutes: int,
    items: List[Dict[str, Any]],
) -> StudyPlanRecord:
    """Save or update user weekly study plan."""
    plan = get_user_study_plan(db, user_id)
    if not plan:
        plan = StudyPlanRecord(
            user_id=user_id,
            week_range=week_range,
            target_focus=target_focus,
            total_study_hours_planned=total_study_hours_planned,
            completed_minutes=completed_minutes,
            items=items,
        )
        db.add(plan)
    else:
        plan.week_range = week_range
        plan.target_focus = target_focus
        plan.total_study_hours_planned = total_study_hours_planned
        plan.completed_minutes = completed_minutes
        plan.items = items
        plan.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(plan)
    return plan



