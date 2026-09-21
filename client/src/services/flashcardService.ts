import { Flashcard, FlashcardConfidence, FlashcardDeck } from '../types/flashcard';
import { ApiResponse } from './apiTypes';

export const INITIAL_FLASHCARD_DECKS: FlashcardDeck[] = [
  {
    id: 'deck-os',
    title: 'Operating Systems & Concurrency',
    course: 'Operating Systems',
    description: 'Core concepts covering Coffman conditions, Banker algorithm, semaphores, and memory management.',
    totalCards: 14,
    reviewedCount: 9,
    cards: [
      {
        id: 'fc-os-1',
        topic: 'Deadlock',
        course: 'Operating Systems',
        front: 'What is a Deadlock in Operating Systems?',
        back: 'A state where two or more processes are permanently blocked because each is holding a resource and waiting for another resource held by another process in the set.',
        sourceDoc: 'OS_Unit3_Deadlocks.pdf',
        sourcePage: 18,
        confidence: 'good',
        repetitionCount: 3
      },
      {
        id: 'fc-os-2',
        topic: 'Coffman Conditions',
        course: 'Operating Systems',
        front: 'Name all 4 Coffman conditions required for Deadlock.',
        back: '1. Mutual Exclusion\n2. Hold and Wait\n3. No Preemption\n4. Circular Wait\nAll 4 must hold simultaneously.',
        sourceDoc: 'OS_Unit3_Deadlocks.pdf',
        sourcePage: 18,
        confidence: 'good',
        repetitionCount: 4
      },
      {
        id: 'fc-os-3',
        topic: 'Resource Allocation Graph',
        course: 'Operating Systems',
        front: 'Under what condition does a cycle in a Resource Allocation Graph GUARANTEE a deadlock?',
        back: 'When every resource type in the system has strictly ONE instance. (With multi-instance resources, a cycle is necessary but not sufficient).',
        sourceDoc: 'OS_Unit3_Deadlocks.pdf',
        sourcePage: 42,
        confidence: 'hard',
        repetitionCount: 2
      },
      {
        id: 'fc-os-4',
        topic: 'Banker\'s Algorithm',
        course: 'Operating Systems',
        front: 'What is the primary role of the Banker’s Algorithm?',
        back: 'Deadlock Avoidance: It tests for safety before granting a resource allocation request to ensure the system never enters an unsafe state.',
        sourceDoc: 'OS_Unit3_Deadlocks.pdf',
        sourcePage: 31,
        confidence: 'easy',
        repetitionCount: 5
      }
    ]
  },
  {
    id: 'deck-ml',
    title: 'Machine Learning Mathematics',
    course: 'Machine Learning',
    description: 'Formulas, cost functions, convex optimization, gradient descent, and regularization.',
    totalCards: 16,
    reviewedCount: 11,
    cards: [
      {
        id: 'fc-ml-1',
        topic: 'Cost Functions',
        course: 'Machine Learning',
        front: 'What is the mathematical formulation of Mean Squared Error (MSE) loss?',
        back: 'J(θ) = (1 / 2m) * Σ (h_θ(x^(i)) - y^(i))^2\n\nThe 1/2 factor simplifies calculation during differentiation.',
        sourceDoc: 'Machine Learning — Linear Regression.pdf',
        sourcePage: 4,
        confidence: 'good',
        repetitionCount: 4
      },
      {
        id: 'fc-ml-2',
        topic: 'Gradient Descent',
        course: 'Machine Learning',
        front: 'What is the parameter update equation for Gradient Descent?',
        back: 'θ_j := θ_j - α * (∂ / ∂θ_j) J(θ)\n\nwhere α is the learning rate step size.',
        sourceDoc: 'Machine Learning — Linear Regression.pdf',
        sourcePage: 12,
        confidence: 'good',
        repetitionCount: 3
      }
    ]
  },
  {
    id: 'deck-dbms',
    title: 'DBMS Normalization & Relational Theory',
    course: 'DBMS',
    description: 'Functional dependencies, 1NF, 2NF, 3NF, BCNF, lossless joins, and dependency preservation.',
    totalCards: 12,
    reviewedCount: 8,
    cards: [
      {
        id: 'fc-db-1',
        topic: 'Normalization',
        course: 'DBMS',
        front: 'What is the defining condition for Boyce-Codd Normal Form (BCNF)?',
        back: 'For every non-trivial functional dependency X → A, X must strictly be a Superkey.',
        sourceDoc: 'DBMS — Normalization Notes.pdf',
        sourcePage: 14,
        confidence: 'good',
        repetitionCount: 3
      }
    ]
  }
];

class FlashcardService {
  private decks = [...INITIAL_FLASHCARD_DECKS];

  async getDecks(): Promise<ApiResponse<FlashcardDeck[]>> {
    return {
      success: true,
      data: [...this.decks],
      metadata: { latencyMs: 50 }
    };
  }

  async updateCardConfidence(deckId: string, cardId: string, confidence: FlashcardConfidence): Promise<ApiResponse<Flashcard>> {
    const deck = this.decks.find(d => d.id === deckId);
    if (!deck) throw new Error('Deck not found');
    const card = deck.cards.find(c => c.id === cardId);
    if (!card) throw new Error('Card not found');

    card.confidence = confidence;
    card.repetitionCount += 1;

    return {
      success: true,
      data: { ...card },
      metadata: { latencyMs: 30 }
    };
  }
}

export const flashcardService = new FlashcardService();
