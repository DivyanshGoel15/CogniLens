export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';
export type QuestionType = 'mcq' | 'true_false' | 'conceptual' | 'short_answer';

export interface QuizQuestion {
  id: string;
  questionText: string;
  type: QuestionType;
  options?: string[];
  correctOptionIndex?: number;
  explanation: string;
  sourceDoc?: string;
  sourcePage?: number;
  topic: string;
  course: string;
}

export interface QuizConfig {
  sourceId?: string;
  course?: string;
  topic?: string;
  contextText?: string;
  timestamp?: number;
  questionCount: number;
  difficulty: DifficultyLevel;
  questionType: QuestionType | 'all';
}

export interface QuizSubmission {
  questionId: string;
  selectedOptionIndex?: number;
  userAnswerText?: string;
  isCorrect: boolean;
  timeSpentSec: number;
}

export interface QuizResult {
  id: string;
  title: string;
  date: string;
  totalQuestions: number;
  correctAnswers: number;
  scorePercentage: number;
  timeSpentSec: number;
  difficulty: DifficultyLevel;
  strongTopics: string[];
  weakTopics: string[];
  recommendedRevision: {
    topic: string;
    action: string;
    sourceDoc: string;
    sourcePage?: number;
  }[];
  answers: QuizSubmission[];
}
