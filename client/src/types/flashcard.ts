export type FlashcardConfidence = 'again' | 'hard' | 'good' | 'easy';

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  codeSnippet?: string;
  topic: string;
  course: string;
  sourceDoc: string;
  sourcePage?: number;
  confidence?: FlashcardConfidence;
  repetitionCount: number;
}

export interface FlashcardDeck {
  id: string;
  title: string;
  course: string;
  description: string;
  cards: Flashcard[];
  totalCards: number;
  reviewedCount: number;
}
