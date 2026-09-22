export interface UserProfile {
  fullName: string;
  email: string;
  avatarInitials: string;
  avatarBgColor: string;
  major: string;
  academicYear: string;
  bio: string;
  dailyGoalMinutes: number;
  aiPersona: 'detailed' | 'socratic' | 'concise' | 'exam_prep';
  spacedRepetitionEnabled: boolean;
  emailNotifications: boolean;
  streakReminders: boolean;
}

export const INITIAL_USER_PROFILE: UserProfile = {
  fullName: 'Student Member',
  email: 'student@cognilens.edu',
  avatarInitials: 'S',
  avatarBgColor: '#3b82f6',
  major: 'Computer Science',
  academicYear: 'Year 3',
  bio: 'Mastering Computer Science, Operating Systems, Machine Learning, and DBMS algorithms.',
  dailyGoalMinutes: 30,
  aiPersona: 'socratic',
  spacedRepetitionEnabled: true,
  emailNotifications: true,
  streakReminders: true
};

export interface CourseMastery {
  course: string;
  masteryPercentage: number;
  topicsCompleted: number;
  totalTopics: number;
  strongTopics: string[];
  weakTopics: string[];
  recentScore: number;
}

export interface LastStudiedItem {
  materialId: string;
  title: string;
  filename: string;
  course: string;
  page: number;
  totalPages: number;
  sectionTitle: string;
  progressPercentage: number;
  lastUpdated: string;
}

export interface LearningProgressState {
  overallMastery: number;
  totalStudyHours: number;
  quizAccuracy: number;
  currentStreakDays: number;
  lastActiveDate: string;
  activeDaysHistory: string[];
  totalQuestionsAnswered: number;
  flashcardsMastered: number;
  lastStudied?: LastStudiedItem;
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

