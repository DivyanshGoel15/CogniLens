import { StudyPlanItem, WeeklyStudyPlan } from '../types/studyPlan';
import { ApiResponse } from './apiTypes';

export const INITIAL_STUDY_PLAN: WeeklyStudyPlan = {
  id: 'plan-week-38',
  weekRange: 'Sep 21 – Sep 27, 2026',
  targetFocus: 'Midterm Mastery: Operating Systems & Machine Learning Foundations',
  totalStudyHoursPlanned: 5.5,
  completedMinutes: 135,
  items: [
    {
      id: 'plan-1',
      day: 'Monday',
      dateStr: 'Sep 21',
      topic: 'Linear Regression & Cost Functions',
      course: 'Machine Learning',
      durationMinutes: 45,
      activityType: 'read',
      status: 'completed',
      materialName: 'Machine Learning — Linear Regression.pdf',
      aiRationale: 'Review cost function derivations and gradient descent step rules.'
    },
    {
      id: 'plan-2',
      day: 'Tuesday',
      dateStr: 'Sep 22',
      topic: 'Deadlock Detection & RAG Cycles',
      course: 'Operating Systems',
      durationMinutes: 60,
      activityType: 'read',
      status: 'completed',
      materialName: 'OS — Unit 3 Deadlocks.pdf',
      aiRationale: 'Critical topic: You flagged RAG cycle analysis for review.'
    },
    {
      id: 'plan-3',
      day: 'Wednesday',
      dateStr: 'Sep 23',
      topic: 'Practice Diagnostic Quiz (Deadlocks & ML)',
      course: 'Operating Systems',
      durationMinutes: 30,
      activityType: 'practice_quiz',
      status: 'in_progress',
      aiRationale: 'Target 5-10 adaptive questions to gauge retention of Tuesday lecture notes.'
    },
    {
      id: 'plan-4',
      day: 'Thursday',
      dateStr: 'Sep 24',
      topic: 'DBMS Normalization & BCNF Decomposition',
      course: 'DBMS',
      durationMinutes: 45,
      activityType: 'read',
      status: 'pending',
      materialName: 'DBMS — Normalization Notes.pdf',
      aiRationale: 'Prepare functional dependency rules before Friday lab.'
    },
    {
      id: 'plan-5',
      day: 'Friday',
      dateStr: 'Sep 25',
      topic: 'Java Dynamic Method Dispatch & Polymorphism',
      course: 'Java OOP',
      durationMinutes: 40,
      activityType: 'flashcard_review',
      status: 'pending',
      materialName: 'Java OOP Lecture 08.pdf',
      aiRationale: 'Spaced repetition flashcards on vtable resolution.'
    },
    {
      id: 'plan-6',
      day: 'Saturday',
      dateStr: 'Sep 26',
      topic: 'TCP 3-Way Handshake & Flow Control',
      course: 'Computer Networks',
      durationMinutes: 50,
      activityType: 'diagram_analysis',
      status: 'pending',
      materialName: 'Computer Networks — TCP/IP.pdf',
      aiRationale: 'Visual analysis of SYN-ACK packet timelines and window sizing.'
    },
    {
      id: 'plan-7',
      day: 'Sunday',
      dateStr: 'Sep 27',
      topic: 'Weekly Weak-Area Remediation Review',
      course: 'Operating Systems',
      durationMinutes: 35,
      activityType: 'practice_quiz',
      status: 'pending',
      aiRationale: 'AI synthesis of missed quiz concepts from the past 7 days.'
    }
  ]
};

class StudyPlanService {
  private currentPlan: WeeklyStudyPlan = { ...INITIAL_STUDY_PLAN };

  async getStudyPlan(): Promise<ApiResponse<WeeklyStudyPlan>> {
    return {
      success: true,
      data: { ...this.currentPlan },
      metadata: { latencyMs: 40 }
    };
  }

  async toggleTaskStatus(itemId: string): Promise<ApiResponse<StudyPlanItem>> {
    const item = this.currentPlan.items.find(i => i.id === itemId);
    if (!item) throw new Error('Plan item not found');

    if (item.status === 'completed') {
      item.status = 'pending';
      this.currentPlan.completedMinutes = Math.max(0, this.currentPlan.completedMinutes - item.durationMinutes);
    } else {
      item.status = 'completed';
      this.currentPlan.completedMinutes += item.durationMinutes;
    }

    return {
      success: true,
      data: { ...item },
      metadata: { latencyMs: 20 }
    };
  }

  async generateNewPlan(focusGoal: string): Promise<ApiResponse<WeeklyStudyPlan>> {
    // Dynamic generation
    const newPlan: WeeklyStudyPlan = {
      id: `plan-${Date.now()}`,
      weekRange: 'Next 7 Days',
      targetFocus: focusGoal || 'Personalized Adaptive Recovery',
      totalStudyHoursPlanned: 6.0,
      completedMinutes: 0,
      items: [
        {
          id: `p-${Date.now()}-1`,
          day: 'Monday',
          dateStr: 'Day 1',
          topic: 'Targeted Remediation: Deadlock Recovery',
          course: 'Operating Systems',
          durationMinutes: 45,
          activityType: 'read',
          status: 'pending',
          aiRationale: 'Remediate identified weakness from recent quiz score.'
        },
        {
          id: `p-${Date.now()}-2`,
          day: 'Tuesday',
          dateStr: 'Day 2',
          topic: 'Gradient Descent Convergence Proofs',
          course: 'Machine Learning',
          durationMinutes: 50,
          activityType: 'diagram_analysis',
          status: 'pending',
          aiRationale: 'Deep dive into handwritten notes math.'
        },
        {
          id: `p-${Date.now()}-3`,
          day: 'Wednesday',
          dateStr: 'Day 3',
          topic: 'BCNF Lossless Joins & Functional Dependencies',
          course: 'DBMS',
          durationMinutes: 40,
          activityType: 'practice_quiz',
          status: 'pending',
          aiRationale: 'Reinforce dependency preservation theorems.'
        }
      ]
    };
    this.currentPlan = newPlan;
    return {
      success: true,
      data: newPlan,
      metadata: { latencyMs: 800 }
    };
  }
}

export const studyPlanService = new StudyPlanService();
