export interface StudyPlanItem {
  id: string;
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  dateStr: string;
  topic: string;
  course: string;
  durationMinutes: number;
  activityType: 'read' | 'practice_quiz' | 'flashcard_review' | 'diagram_analysis';
  status: 'pending' | 'in_progress' | 'completed';
  materialRefId?: string;
  materialName?: string;
  aiRationale: string;
}

export interface WeeklyStudyPlan {
  id: string;
  weekRange: string;
  targetFocus: string;
  totalStudyHoursPlanned: number;
  completedMinutes: number;
  items: StudyPlanItem[];
  generatedPrompt?: string;
}
