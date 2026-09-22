import { LearningProgressState } from '../types/progress';
import { ApiResponse } from './apiTypes';

const getTodayDateStr = (date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getYesterdayDateStr = (): string => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return getTodayDateStr(d);
};

const getPastDateStrs = (count: number): string[] => {
  const dates: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(getTodayDateStr(d));
  }
  return dates;
};

export const INITIAL_PROGRESS_STATE: LearningProgressState = {
  overallMastery: 78,
  totalStudyHours: 14.5,
  quizAccuracy: 84,
  currentStreakDays: 6,
  lastActiveDate: getTodayDateStr(),
  activeDaysHistory: getPastDateStrs(6),
  totalQuestionsAnswered: 48,
  flashcardsMastered: 32,
  lastStudied: {
    materialId: 'mat-ml-linear',
    title: 'Machine Learning — Linear Regression & Cost Functions',
    filename: 'Machine Learning — Linear Regression.pdf',
    course: 'Machine Learning',
    page: 4,
    totalPages: 28,
    sectionTitle: 'Section: Mean Squared Error Loss Formulation (p. 4)',
    progressPercentage: 72,
    lastUpdated: '15m ago'
  },
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

const STORAGE_KEY = 'cognilens_progress';

class ProgressService {
  private progress: LearningProgressState = { ...INITIAL_PROGRESS_STATE };

  constructor() {
    this.loadProgress();
  }

  private loadProgress() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === 'object') {
          this.progress = { ...INITIAL_PROGRESS_STATE, ...parsed };
          this.verifyStreakIntegrity();
          return;
        }
      }
    } catch (e) {
      console.warn('Failed to load progress from localStorage', e);
    }
    this.progress = { ...INITIAL_PROGRESS_STATE };
    this.saveProgress();
  }

  private verifyStreakIntegrity() {
    const today = getTodayDateStr();
    const yesterday = getYesterdayDateStr();

    if (!this.progress.lastActiveDate) {
      this.progress.lastActiveDate = today;
    }
    if (!Array.isArray(this.progress.activeDaysHistory) || this.progress.activeDaysHistory.length === 0) {
      this.progress.activeDaysHistory = getPastDateStrs(Math.max(1, this.progress.currentStreakDays || 6));
    }

    const lastActive = this.progress.lastActiveDate;
    if (lastActive !== today && lastActive !== yesterday) {
      // Missed 2+ days without activity -> streak breaks
      this.progress.currentStreakDays = 0;
    }
  }

  private saveProgress() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.progress));
    } catch (e) {
      console.warn('Failed to save progress to localStorage', e);
    }
  }

  public recordDailyActivity(activityLabel?: string): LearningProgressState {
    const today = getTodayDateStr();
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const lastActive = this.progress.lastActiveDate;

    if (!Array.isArray(this.progress.activeDaysHistory)) {
      this.progress.activeDaysHistory = [];
    }

    if (!this.progress.activeDaysHistory.includes(today)) {
      this.progress.activeDaysHistory.push(today);
    }

    if (lastActive === today) {
      // Activity already recorded today, ensure streak is at least 1
      if (this.progress.currentStreakDays < 1) {
        this.progress.currentStreakDays = 1;
      }
    } else if (lastActive === yesterday) {
      // Continuous daily activity! Increment streak
      this.progress.currentStreakDays += 1;
      this.progress.lastActiveDate = today;
    } else {
      // Re-starting a new streak today
      this.progress.currentStreakDays = 1;
      this.progress.lastActiveDate = today;
    }

    if (activityLabel) {
      const actTitle = `Studied: ${activityLabel}`;
      if (!this.progress.recentActivities.some(a => a.title === actTitle && a.timestamp === 'Just now')) {
        this.progress.recentActivities.unshift({
          id: `act-${Date.now()}`,
          title: actTitle,
          type: 'chat',
          timestamp: 'Just now',
          resultSnippet: 'Active learning streak recorded'
        });
        if (this.progress.recentActivities.length > 10) {
          this.progress.recentActivities.pop();
        }
      }
    }

    this.saveProgress();
    return { ...this.progress };
  }

  async getProgress(): Promise<ApiResponse<LearningProgressState>> {
    this.verifyStreakIntegrity();
    return {
      success: true,
      data: { ...this.progress },
      metadata: { latencyMs: 40 }
    };
  }

  async recordDocumentProgress(
    materialId: string,
    title: string,
    filename: string,
    course: string,
    page: number,
    totalPages: number,
    sectionTitle?: string
  ): Promise<ApiResponse<LearningProgressState>> {
    this.recordDailyActivity(title);
    const pct = Math.min(100, Math.max(1, Math.round((page / totalPages) * 100)));
    const sectionStr = sectionTitle || `Section: Page ${page} of ${totalPages}`;

    this.progress.lastStudied = {
      materialId,
      title,
      filename,
      course,
      page,
      totalPages,
      sectionTitle: sectionStr,
      progressPercentage: pct,
      lastUpdated: 'Just now'
    };

    // Increment study time slightly for active reading
    this.progress.totalStudyHours = parseFloat((this.progress.totalStudyHours + 0.05).toFixed(1));

    // Update recent activity if top item isn't already this page
    const topAct = this.progress.recentActivities[0];
    const actTitle = `Studied ${title} (Page ${page})`;
    if (!topAct || topAct.title !== actTitle) {
      this.progress.recentActivities.unshift({
        id: `act-${Date.now()}`,
        title: actTitle,
        type: 'material',
        timestamp: 'Just now',
        resultSnippet: `Read page ${page} of ${totalPages} (${pct}% complete)`
      });
      if (this.progress.recentActivities.length > 10) {
        this.progress.recentActivities.pop();
      }
    }

    this.saveProgress();
    return {
      success: true,
      data: { ...this.progress },
      metadata: { latencyMs: 30 }
    };
  }

  async recordMaterialUpload(
    materialId: string,
    title: string,
    filename: string,
    course: string,
    pagesCount: number = 15
  ): Promise<ApiResponse<LearningProgressState>> {
    this.recordDailyActivity(`Uploaded ${filename}`);
    this.progress.lastStudied = {
      materialId,
      title,
      filename,
      course,
      page: 1,
      totalPages: pagesCount,
      sectionTitle: `${title} — Overview & Introduction (p. 1)`,
      progressPercentage: Math.round((1 / pagesCount) * 100),
      lastUpdated: 'Just now'
    };

    let targetCourse = this.progress.courses.find(c => c.course === course);
    if (targetCourse) {
      targetCourse.totalTopics += 1;
    } else {
      this.progress.courses.push({
        course,
        masteryPercentage: 65,
        topicsCompleted: 1,
        totalTopics: 3,
        strongTopics: [title],
        weakTopics: [],
        recentScore: 80
      });
    }

    this.progress.recentActivities.unshift({
      id: `act-${Date.now()}`,
      title: `Uploaded & Indexed ${filename}`,
      type: 'material',
      timestamp: 'Just now',
      resultSnippet: `${pagesCount} pages vectorized and indexed into ${course}`
    });

    this.saveProgress();
    return {
      success: true,
      data: { ...this.progress },
      metadata: { latencyMs: 30 }
    };
  }

  async recordQuizCompletion(scorePct: number, course: string, weakTopic?: string): Promise<ApiResponse<LearningProgressState>> {
    this.recordDailyActivity(`Quiz on ${course}`);
    this.progress.totalQuestionsAnswered += 5;
    this.progress.totalStudyHours = parseFloat((this.progress.totalStudyHours + 0.25).toFixed(1));
    this.progress.quizAccuracy = Math.round((this.progress.quizAccuracy * 4 + scorePct) / 5);

    const targetCourse = this.progress.courses.find(c => c.course === course);
    if (targetCourse) {
      targetCourse.recentScore = scorePct;
      targetCourse.masteryPercentage = Math.min(100, Math.round((targetCourse.masteryPercentage + scorePct) / 2));
      if (scorePct >= 80 && !targetCourse.strongTopics.includes(course)) {
        targetCourse.topicsCompleted = Math.min(targetCourse.totalTopics, targetCourse.topicsCompleted + 1);
      }
      if (weakTopic && !targetCourse.weakTopics.includes(weakTopic)) {
        targetCourse.weakTopics.push(weakTopic);
      }
    }

    // Update overall mastery based on course average
    const totalMastery = this.progress.courses.reduce((acc, c) => acc + c.masteryPercentage, 0);
    this.progress.overallMastery = Math.round(totalMastery / this.progress.courses.length);

    this.progress.recentActivities.unshift({
      id: `act-${Date.now()}`,
      title: `Completed ${course} Practice Quiz`,
      type: 'quiz',
      timestamp: 'Just now',
      resultSnippet: `Score: ${scorePct}% (${Math.round((scorePct / 100) * 5)}/5 correct)`
    });

    this.saveProgress();
    return {
      success: true,
      data: { ...this.progress },
      metadata: { latencyMs: 40 }
    };
  }

  async resetProgressData(): Promise<ApiResponse<LearningProgressState>> {
    const today = getTodayDateStr();
    this.progress = {
      ...INITIAL_PROGRESS_STATE,
      currentStreakDays: 1,
      lastActiveDate: today,
      activeDaysHistory: [today]
    };
    this.saveProgress();
    return {
      success: true,
      data: { ...this.progress },
      metadata: { latencyMs: 10 }
    };
  }
}

export const progressService = new ProgressService();
