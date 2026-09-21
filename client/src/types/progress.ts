export interface CourseMastery {
  course: string;
  masteryPercentage: number;
  topicsCompleted: number;
  totalTopics: number;
  strongTopics: string[];
  weakTopics: string[];
  recentScore: number;
}

export interface LearningProgressState {
  overallMastery: number;
  totalStudyHours: number;
  quizAccuracy: number;
  currentStreakDays: number;
  totalQuestionsAnswered: number;
  flashcardsMastered: number;
  courses: CourseMastery[];
  recentActivities: {
    id: string;
    title: string;
    type: 'quiz' | 'chat' | 'flashcards' | 'material';
    timestamp: string;
    resultSnippet?: string;
  }[];
  activeRecommendation: {
    title: string;
    description: string;
    actionLabel: string;
    targetRoute: string;
    targetPayload?: any;
    reason: string;
  };
}
