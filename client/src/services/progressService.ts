import { LearningProgressState } from '../types/progress';
import { ApiResponse } from './apiTypes';
import { apiClient } from './apiClient';

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
  overallMastery: 0,
  totalStudyHours: 0,
  quizAccuracy: 0,
  currentStreakDays: 0,
  lastActiveDate: getTodayDateStr(),
  activeDaysHistory: [],
  totalQuestionsAnswered: 0,
  flashcardsMastered: 0,
  lastStudied: undefined,
  courses: [],
  recentActivities: [],
  activeRecommendation: {
    title: 'Welcome to CogniLens',
    description: 'Upload your study notes or textbook PDF to begin personalized AI learning and quiz generation.',
    actionLabel: 'Upload Material',
    targetRoute: 'materials',
    reason: 'Start by grounding the AI assistant in your courses.'
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
    if (!Array.isArray(this.progress.activeDaysHistory)) {
      this.progress.activeDaysHistory = [];
    }
    // Only backfill streak dates if streak > 0 (real streak from backend)
    if (this.progress.activeDaysHistory.length === 0 && this.progress.currentStreakDays > 0) {
      this.progress.activeDaysHistory = getPastDateStrs(this.progress.currentStreakDays);
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
    this.syncToBackend();
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

  public resetProgress() {
    this.progress = { ...INITIAL_PROGRESS_STATE };
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }

  private async syncToBackend() {
    try {
      const isOnline = await apiClient.isServerOnline();
      if (isOnline && apiClient.getToken()) {
        await apiClient.updateProgress({
          overallMastery: this.progress.overallMastery,
          totalStudyHours: this.progress.totalStudyHours,
          quizAccuracy: this.progress.quizAccuracy,
          currentStreakDays: this.progress.currentStreakDays,
          totalQuestionsAnswered: this.progress.totalQuestionsAnswered,
          flashcardsMastered: this.progress.flashcardsMastered,
          lastStudied: this.progress.lastStudied,
          courses: this.progress.courses,
        });
      }
    } catch (e) {
      // Background sync, suppress errors
    }
  }

  async getProgress(): Promise<ApiResponse<LearningProgressState>> {
    try {
      const isOnline = await apiClient.isServerOnline();
      if (isOnline && apiClient.getToken()) {
        const backendProg = await apiClient.getProgress();
        if (backendProg && typeof backendProg.overallMastery === 'number') {
          this.progress = {
            ...this.progress,
            overallMastery: backendProg.overallMastery,
            totalStudyHours: backendProg.totalStudyHours,
            quizAccuracy: backendProg.quizAccuracy,
            currentStreakDays: backendProg.currentStreakDays,
            totalQuestionsAnswered: backendProg.totalQuestionsAnswered,
            flashcardsMastered: backendProg.flashcardsMastered,
            lastStudied: backendProg.lastStudied || undefined,
            courses: Array.isArray(backendProg.courses) ? backendProg.courses : [],
            recentActivities: Array.isArray(backendProg.recentActivities) ? backendProg.recentActivities : [],
          };
          this.saveProgress();
        }
      }
    } catch (e) {
      console.warn('Failed fetching progress from backend, using local store', e);
    }

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
        masteryPercentage: 0,
        topicsCompleted: 0,
        totalTopics: 1,
        strongTopics: [],
        weakTopics: [],
        recentScore: 0
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
