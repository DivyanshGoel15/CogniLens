import { LearningProgressState } from '../types/progress';
import { ApiResponse } from './apiTypes';

export const INITIAL_PROGRESS_STATE: LearningProgressState = {
  overallMastery: 78,
  totalStudyHours: 14.5,
  quizAccuracy: 84,
  currentStreakDays: 6,
  totalQuestionsAnswered: 48,
  flashcardsMastered: 32,
  courses: [
    {
      course: 'Operating Systems',
      masteryPercentage: 74,
      topicsCompleted: 6,
      totalTopics: 8,
      strongTopics: ['Process Synchronization', 'Semaphores', 'CPU Scheduling'],
      weakTopics: ['Deadlock Detection', 'Banker Algorithm Safe States'],
      recentScore: 80
    },
    {
      course: 'Machine Learning',
      masteryPercentage: 82,
      topicsCompleted: 7,
      totalTopics: 9,
      strongTopics: ['Linear Regression', 'Cost Functions', 'Overfitting'],
      weakTopics: ['Gradient Descent Convergence', 'Learning Rate Tuning'],
      recentScore: 90
    },
    {
      course: 'DBMS',
      masteryPercentage: 79,
      topicsCompleted: 5,
      totalTopics: 7,
      strongTopics: ['1NF', '2NF', 'Relational Algebra'],
      weakTopics: ['BCNF Decomposition', 'Lossless Joins'],
      recentScore: 82
    },
    {
      course: 'Java OOP',
      masteryPercentage: 88,
      topicsCompleted: 8,
      totalTopics: 8,
      strongTopics: ['Polymorphism', 'Interfaces', 'Abstract Classes', 'Encapsulation'],
      weakTopics: [],
      recentScore: 95
    },
    {
      course: 'Computer Networks',
      masteryPercentage: 70,
      topicsCompleted: 4,
      totalTopics: 6,
      strongTopics: ['OSI Layers', 'IP Addressing'],
      weakTopics: ['TCP 3-Way Handshake', 'Congestion Window'],
      recentScore: 75
    }
  ],
  recentActivities: [
    {
      id: 'act-1',
      title: 'Practiced OS Deadlocks & Coffman Conditions Quiz',
      type: 'quiz',
      timestamp: '2 hours ago',
      resultSnippet: 'Score: 80% (4/5 correct)'
    },
    {
      id: 'act-2',
      title: 'AI Grounded Analysis: Mean Squared Error in Linear Regression',
      type: 'chat',
      timestamp: 'Yesterday at 4:30 PM',
      resultSnippet: 'Verified citations from ML_Linear_Regression.pdf (p. 4)'
    },
    {
      id: 'act-3',
      title: 'Reviewed 12 Spaced Repetition Flashcards on DBMS Normalization',
      type: 'flashcards',
      timestamp: '2 days ago',
      resultSnippet: 'Mastery rating: 92%'
    },
    {
      id: 'act-4',
      title: 'Uploaded & Indexed OS — Unit 3 Deadlocks.pdf',
      type: 'material',
      timestamp: '3 days ago',
      resultSnippet: '42 pages vectorized and indexed'
    }
  ],
  activeRecommendation: {
    title: 'Review Deadlock Detection in OS Notes',
    description: "You've reviewed the Coffman conditions, but your last quiz indicated hesitation on Resource Allocation Graph cycle detection for single vs multi-instance resources.",
    actionLabel: 'Practice Weak Topic',
    targetRoute: 'quiz',
    targetPayload: { course: 'Operating Systems', topic: 'Deadlock Detection', count: 5 },
    reason: 'Identified as a recurring weak point in your recent OS evaluation.'
  }
};

class ProgressService {
  private progress: LearningProgressState = { ...INITIAL_PROGRESS_STATE };

  async getProgress(): Promise<ApiResponse<LearningProgressState>> {
    return {
      success: true,
      data: { ...this.progress },
      metadata: { latencyMs: 50 }
    };
  }

  async recordQuizCompletion(scorePct: number, course: string, weakTopic?: string): Promise<ApiResponse<LearningProgressState>> {
    this.progress.totalQuestionsAnswered += 5;
    this.progress.quizAccuracy = Math.round((this.progress.quizAccuracy * 4 + scorePct) / 5);

    const targetCourse = this.progress.courses.find(c => c.course === course);
    if (targetCourse) {
      targetCourse.recentScore = scorePct;
      targetCourse.masteryPercentage = Math.min(100, Math.round((targetCourse.masteryPercentage + scorePct) / 2));
      if (weakTopic && !targetCourse.weakTopics.includes(weakTopic)) {
        targetCourse.weakTopics.push(weakTopic);
      }
    }

    this.progress.recentActivities.unshift({
      id: `act-${Date.now()}`,
      title: `Completed ${course} Practice Quiz`,
      type: 'quiz',
      timestamp: 'Just now',
      resultSnippet: `Score: ${scorePct}%`
    });

    return {
      success: true,
      data: { ...this.progress },
      metadata: { latencyMs: 40 }
    };
  }
}

export const progressService = new ProgressService();
