"""FastAPI router for Flashcard Decks and Spaced Repetition."""

import uuid
import logging
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from server.app.database.connection import get_db
from server.app.database import repository
from server.app.api.auth import get_current_user_optional, get_current_user
from server.app.models.user import UserModel
from ai.llm.llm_service import get_llm_provider
from server.app.services.rag_service import RAGService

logger = logging.getLogger("cognilens.flashcards")

router = APIRouter(prefix="/api/flashcards", tags=["Flashcards"])

_rag_service = RAGService()
_llm_provider = get_llm_provider()


class FlashcardItem(BaseModel):
    id: str
    subtopic: str
    question: str
    detailedAnswer: str
    difficulty: str = "Medium"
    confidence: str = "unreviewed"
    intervalDays: int = 1
    nextReviewDate: Optional[str] = None
    repetitions: int = 0
    easeFactor: float = 2.5
    lastReviewed: Optional[str] = None


class FlashcardDeckSchema(BaseModel):
    id: str
    title: str
    course: str
    description: Optional[str] = None
    totalCards: int = 0
    reviewedCount: int = 0
    cards: List[FlashcardItem] = []


class CreateDeckRequest(BaseModel):
    id: Optional[str] = None
    title: str
    course: str
    description: Optional[str] = None
    cards: List[Dict[str, Any]] = []


class GenerateDeckRequest(BaseModel):
    topic: str
    course: Optional[str] = "General"
    num_cards: int = 5


class UpdateConfidenceRequest(BaseModel):
    deck_id: str
    card_id: str
    confidence: str


@router.get("/decks", response_model=List[FlashcardDeckSchema])
def get_user_decks(
    user: Optional[UserModel] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
) -> List[FlashcardDeckSchema]:
    """Retrieve all flashcard decks belonging to current user from Azure Database."""
    if not user:
        return []
    
    decks = repository.get_user_flashcard_decks(db, user_id=user.id)
    results = []
    for d in decks:
        raw_cards = d.cards or []
        card_items = []
        for c in raw_cards:
            if isinstance(c, dict):
                card_items.append(
                    FlashcardItem(
                        id=c.get("id", str(uuid.uuid4())[:8]),
                        subtopic=c.get("subtopic", d.title),
                        question=c.get("question", ""),
                        detailedAnswer=c.get("detailedAnswer") or c.get("detailed_answer", ""),
                        difficulty=c.get("difficulty", "Medium"),
                        confidence=c.get("confidence", "unreviewed"),
                        intervalDays=c.get("intervalDays", 1),
                        nextReviewDate=c.get("nextReviewDate"),
                        repetitions=c.get("repetitions", 0),
                        easeFactor=c.get("easeFactor", 2.5),
                        lastReviewed=c.get("lastReviewed"),
                    )
                )
        results.append(
            FlashcardDeckSchema(
                id=d.id,
                title=d.title,
                course=d.course,
                description=d.description or "",
                totalCards=len(card_items),
                reviewedCount=d.reviewed_count or 0,
                cards=card_items,
            )
        )
    return results


@router.post("/decks", response_model=FlashcardDeckSchema)
def save_user_deck(
    payload: CreateDeckRequest,
    user: Optional[UserModel] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
) -> FlashcardDeckSchema:
    """Create or update a flashcard deck in Azure Database."""
    user_id = user.id if user else "guest"
    
    deck = repository.save_flashcard_deck(
        db=db,
        user_id=user_id,
        deck_id=payload.id or None,
        title=payload.title,
        course=payload.course,
        description=payload.description or "",
        cards=payload.cards,
    )

    raw_cards = deck.cards or []
    card_items = [
        FlashcardItem(
            id=c.get("id", str(uuid.uuid4())[:8]),
            subtopic=c.get("subtopic", deck.title),
            question=c.get("question", ""),
            detailedAnswer=c.get("detailedAnswer") or c.get("detailed_answer", ""),
            difficulty=c.get("difficulty", "Medium"),
            confidence=c.get("confidence", "unreviewed"),
            intervalDays=c.get("intervalDays", 1),
            nextReviewDate=c.get("nextReviewDate"),
            repetitions=c.get("repetitions", 0),
            easeFactor=c.get("easeFactor", 2.5),
            lastReviewed=c.get("lastReviewed"),
        )
        for c in raw_cards if isinstance(c, dict)
    ]

    return FlashcardDeckSchema(
        id=deck.id,
        title=deck.title,
        course=deck.course,
        description=deck.description or "",
        totalCards=len(card_items),
        reviewedCount=deck.reviewed_count or 0,
        cards=card_items,
    )


@router.delete("/decks/{deck_id}")
def delete_user_deck(
    deck_id: str,
    user: Optional[UserModel] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    """Delete a flashcard deck from database."""
    user_id = user.id if user else "guest"
    success = repository.delete_flashcard_deck(db, deck_id=deck_id, user_id=user_id)
    if not success:
        raise HTTPException(status_code=404, detail="Deck not found or access denied.")
    return {"success": True, "message": "Deck deleted successfully."}


@router.post("/card/confidence")
def update_card_confidence(
    payload: UpdateConfidenceRequest,
    user: Optional[UserModel] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    """Record mastery / spaced repetition confidence for a specific card."""
    user_id = user.id if user else "guest"
    decks = repository.get_user_flashcard_decks(db, user_id=user_id)
    target_deck = next((d for d in decks if d.id == payload.deck_id), None)
    if not target_deck:
        raise HTTPException(status_code=404, detail="Deck not found.")

    cards = list(target_deck.cards or [])
    for c in cards:
        if isinstance(c, dict) and c.get("id") == payload.card_id:
            c["confidence"] = payload.confidence
            c["repetitions"] = c.get("repetitions", 0) + 1
            if payload.confidence == "easy":
                c["intervalDays"] = max(4, c.get("intervalDays", 1) * 2)
            elif payload.confidence == "good":
                c["intervalDays"] = max(2, c.get("intervalDays", 1) + 1)
            else:
                c["intervalDays"] = 1
            break

    target_deck.cards = cards
    target_deck.reviewed_count = sum(1 for c in cards if isinstance(c, dict) and c.get("confidence") in ["good", "easy"])
    db.commit()

    if user:
        repository.record_user_activity(
            db,
            user_id=user.id,
            title=f"Reviewed Flashcard in {target_deck.title}",
            activity_type="flashcards",
            result_snippet=f"Confidence marked as {payload.confidence}."
        )

    return {"success": True, "message": "Card confidence updated."}
