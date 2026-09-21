import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Sparkles,
  Clock,
  CheckCircle2,
  Circle,
  BookOpen,
  HelpCircle,
  Layers,
  ScanEye,
  Plus,
  Loader2
} from 'lucide-react';
import { studyPlanService } from '../services/studyPlanService';
import { WeeklyStudyPlan, StudyPlanItem } from '../types/studyPlan';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';

export const StudyPlanScreen: React.FC = () => {
  const { setCurrentRoute, startQuiz } = useApp();
  const { showToast } = useToast();
  const [studyPlan, setStudyPlan] = useState<WeeklyStudyPlan | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customGoal, setCustomGoal] = useState('Operating Systems Midterm Prep & ML Foundations');

  useEffect(() => {
    studyPlanService.getStudyPlan().then(res => {
      if (res.success) setStudyPlan(res.data);
    });
  }, []);

  const handleToggleTask = async (itemId: string) => {
    try {
      const res = await studyPlanService.toggleTaskStatus(itemId);
      if (res.success && studyPlan) {
        setStudyPlan({
          ...studyPlan,
          items: studyPlan.items.map(i => i.id === itemId ? res.data : i)
        });
        showToast(
          res.data.status === 'completed' ? 'Task Completed' : 'Task Unchecked',
          res.data.topic,
          'success'
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleGeneratePlan = async () => {
    setIsGenerating(true);
    try {
      const res = await studyPlanService.generateNewPlan(customGoal);
      if (res.success) {
        setStudyPlan(res.data);
        setIsModalOpen(false);
        showToast('New Study Plan Generated', 'Adaptive roadmap created based on your weak areas', 'success');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleActionClick = (item: StudyPlanItem) => {
    if (item.activityType === 'practice_quiz') {
      startQuiz({
        course: item.course,
        topic: item.topic,
        questionCount: 5,
        difficulty: 'intermediate',
        questionType: 'all'
      });
    } else if (item.activityType === 'flashcard_review') {
      setCurrentRoute('flashcards');
    } else if (item.activityType === 'diagram_analysis') {
      setCurrentRoute('image-analysis');
    } else {
      setCurrentRoute('materials');
    }
  };

  return (
    <div style={{ padding: '28px 32px', maxWidth: '1100px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'var(--accent-primary-light)',
                color: 'var(--accent-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Calendar size={18} />
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Personalized AI Study Roadmap
            </h1>
          </div>
          <p style={{ fontSize: '0.84375rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Adaptive weekly schedule automatically adjusted according to your weak topics and quiz accuracy.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="btn btn-primary btn-md"
          style={{ gap: '6px' }}
        >
          <Sparkles size={16} />
          <span>Regenerate Study Plan</span>
        </button>
      </div>

      {/* Overview Banner */}
      {studyPlan && (
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-xl)',
            padding: '20px 24px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: 'var(--shadow-xs)'
          }}
        >
          <div>
            <span className="badge badge-primary" style={{ fontSize: '0.75rem', marginBottom: '4px' }}>
              {studyPlan.weekRange}
            </span>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
              {studyPlan.targetFocus}
            </h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div>
              <div style={{ fontSize: '0.725rem', color: 'var(--text-tertiary)' }}>Study Progress</div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {Math.round(studyPlan.completedMinutes / 60)} / {studyPlan.totalStudyHoursPlanned} hrs
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Week Day Tasks Timeline */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {studyPlan?.items.map((item) => {
          const isDone = item.status === 'completed';

          return (
            <div
              key={item.id}
              className="card"
              style={{
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
                backgroundColor: isDone ? 'var(--bg-surface-subtle)' : 'var(--bg-surface)',
                borderColor: isDone ? 'var(--border-subtle)' : 'var(--border-default)',
                opacity: isDone ? 0.75 : 1,
                transition: 'all var(--transition-fast)'
              }}
            >
              {/* Left checkbox & Day info */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', flex: 1 }}>
                <button
                  onClick={() => handleToggleTask(item.id)}
                  style={{ marginTop: '2px', color: isDone ? 'var(--color-success)' : 'var(--text-muted)' }}
                  aria-label={isDone ? 'Mark task as incomplete' : 'Mark task as completed'}
                >
                  {isDone ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                </button>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                      {item.day} ({item.dateStr})
                    </span>
                    <span className="badge badge-neutral" style={{ fontSize: '0.6875rem' }}>
                      {item.course}
                    </span>
                    <span style={{ fontSize: '0.725rem', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <Clock size={11} /> {item.durationMinutes} min
                    </span>
                  </div>

                  <h4
                    style={{
                      fontSize: '0.9375rem',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      textDecoration: isDone ? 'line-through' : 'none'
                    }}
                  >
                    {item.topic}
                  </h4>

                  <p style={{ fontSize: '0.785rem', color: 'var(--text-secondary)', marginTop: '3px' }}>
                    <strong>AI Rationale:</strong> {item.aiRationale}
                  </p>
                </div>
              </div>

              {/* Action Shortcut Button */}
              <div>
                <button
                  onClick={() => handleActionClick(item)}
                  className="btn btn-secondary btn-sm"
                  style={{ gap: '6px', fontSize: '0.75rem' }}
                >
                  {item.activityType === 'practice_quiz' && <HelpCircle size={13} color="var(--color-warning)" />}
                  {item.activityType === 'flashcard_review' && <Layers size={13} color="var(--color-purple)" />}
                  {item.activityType === 'diagram_analysis' && <ScanEye size={13} color="var(--accent-primary)" />}
                  {item.activityType === 'read' && <BookOpen size={13} color="var(--accent-primary)" />}
                  <span>Start Task</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal for Generating New Plan */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Generate Adaptive Study Roadmap
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Let the AI agent schedule daily practice based on upcoming exams and weak areas.
              </p>
            </div>

            <div style={{ padding: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Target Study Focus or Upcoming Exam:
              </label>
              <input
                type="text"
                className="input-text"
                value={customGoal}
                onChange={(e) => setCustomGoal(e.target.value)}
                placeholder="e.g. Master Operating Systems Deadlocks before Friday"
              />
            </div>

            <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setIsModalOpen(false)} className="btn btn-ghost btn-sm">
                Cancel
              </button>
              <button onClick={handleGeneratePlan} disabled={isGenerating} className="btn btn-primary btn-sm" style={{ gap: '6px' }}>
                {isGenerating ? <Loader2 size={14} className="spin-icon" /> : <Sparkles size={14} />}
                <span>{isGenerating ? 'Generating Plan...' : 'Generate Plan'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
