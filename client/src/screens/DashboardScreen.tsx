import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Upload,
  HelpCircle,
  Clock,
  CheckCircle2,
  TrendingUp,
  Flame,
  ArrowRight,
  BookOpen,
  FileText,
  ScanEye,
  Layers,
  ChevronRight
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { progressService } from '../services/progressService';
import { LearningProgressState } from '../types/progress';
import { MaterialCard } from '../components/materials/MaterialCard';
import { MaterialUploadModal } from '../components/materials/MaterialUploadModal';

export const DashboardScreen: React.FC = () => {
  const {
    materials,
    setCurrentRoute,
    setPrefilledPrompt,
    openDocumentViewer,
    startQuiz
  } = useApp();

  const [progress, setProgress] = useState<LearningProgressState | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  useEffect(() => {
    progressService.getProgress().then(res => {
      if (res.success) setProgress(res.data);
    });
  }, []);

  const handleAskAIQuick = () => {
    setCurrentRoute('ai-tutor');
  };

  const handleCreateQuizQuick = () => {
    startQuiz({
      course: 'Operating Systems',
      topic: 'Deadlock',
      questionCount: 5,
      difficulty: 'intermediate',
      questionType: 'all'
    });
  };

  return (
    <div style={{ padding: '28px 32px', maxWidth: '1300px', margin: '0 auto' }}>
      {/* 1. Header Greeting & Primary Action Bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '20px',
          marginBottom: '28px'
        }}
      >
        <div>
          <span className="badge badge-primary" style={{ fontSize: '0.75rem', marginBottom: '6px' }}>
            Term 1 • Academic Year 2026
          </span>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Good morning, Student.
          </h1>
          <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            What would you like to learn today? Your multimodal study workspace is synchronized.
          </p>
        </div>

        {/* 3 Main Quick Action Buttons */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="btn btn-secondary btn-md"
            style={{ gap: '8px' }}
          >
            <Upload size={16} />
            <span>Upload Material</span>
          </button>

          <button
            onClick={handleAskAIQuick}
            className="btn btn-primary btn-md"
            style={{ gap: '8px' }}
          >
            <Sparkles size={16} />
            <span>Ask AI Tutor</span>
          </button>

          <button
            onClick={handleCreateQuizQuick}
            className="btn btn-secondary btn-md"
            style={{ gap: '8px' }}
          >
            <HelpCircle size={16} color="var(--color-warning)" />
            <span>Create Quiz</span>
          </button>
        </div>
      </div>

      {/* 2. Intelligent AI Recommendation Banner */}
      {progress && (
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--accent-primary-border)',
            borderRadius: 'var(--radius-xl)',
            padding: '20px 24px',
            marginBottom: '28px',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', maxWidth: '800px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: 'var(--accent-primary-light)',
                color: 'var(--accent-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Sparkles size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
                  AI Recommendation
                </span>
                <span className="badge badge-warning" style={{ fontSize: '0.6875rem' }}>
                  Action Needed
                </span>
              </div>
              <p style={{ fontSize: '0.84375rem', color: 'var(--text-secondary)', marginTop: '3px', lineHeight: 1.45 }}>
                {progress.activeRecommendation.description}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              if (progress.activeRecommendation.targetRoute === 'quiz') {
                startQuiz(progress.activeRecommendation.targetPayload);
              } else {
                setCurrentRoute('ai-tutor');
              }
            }}
            className="btn btn-primary btn-sm"
            style={{ gap: '6px', padding: '9px 16px' }}
          >
            <span>{progress.activeRecommendation.actionLabel}</span>
            <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* 3. Continue Learning & Learning Progress Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', marginBottom: '28px' }}>
        {/* Continue Learning Card */}
        <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Continue Learning
              </div>
              <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>
                Resume Reading
              </span>
            </div>

            <div style={{ display: 'flex', gap: '14px', alignItems: 'center', marginBottom: '16px' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--accent-primary-light)',
                  color: 'var(--accent-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <BookOpen size={22} />
              </div>

              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Machine Learning — Linear Regression
                </h3>
                <div style={{ fontSize: '0.785rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Section: Mean Squared Error Loss Formulation (p. 4)
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                <span>Topic Completion</span>
                <span>72% completed</span>
              </div>
              <div style={{ width: '100%', height: '7px', backgroundColor: 'var(--border-subtle)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                <div style={{ width: '72%', height: '100%', backgroundColor: 'var(--accent-primary)', borderRadius: 'var(--radius-full)' }} />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px', gap: '8px' }}>
            <button
              onClick={() => openDocumentViewer('mat-ml-linear', 4)}
              className="btn btn-secondary btn-sm"
              style={{ gap: '6px' }}
            >
              <span>Jump to Page 4</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Learning Progress Metrics (Clean, non-cluttered) */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '14px' }}>
            Learning Progress
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            {/* Study Time */}
            <div style={{ backgroundColor: 'var(--bg-surface-subtle)', padding: '12px 14px', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>
                <Clock size={13} />
                <span>Study Time</span>
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
                {progress?.totalStudyHours || 14.5} hrs
              </div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--color-success)', marginTop: '2px' }}>
                +2.4 hrs this week
              </div>
            </div>

            {/* Topics Completed */}
            <div style={{ backgroundColor: 'var(--bg-surface-subtle)', padding: '12px 14px', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>
                <CheckCircle2 size={13} />
                <span>Topics Mastered</span>
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
                30 / 38
              </div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--accent-primary)', marginTop: '2px' }}>
                78% course completion
              </div>
            </div>

            {/* Quiz Accuracy */}
            <div style={{ backgroundColor: 'var(--bg-surface-subtle)', padding: '12px 14px', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>
                <TrendingUp size={13} />
                <span>Quiz Accuracy</span>
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
                {progress?.quizAccuracy || 84}%
              </div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--color-success)', marginTop: '2px' }}>
                Top 10% in cohort
              </div>
            </div>

            {/* Streak */}
            <div style={{ backgroundColor: 'var(--bg-surface-subtle)', padding: '12px 14px', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>
                <Flame size={13} color="var(--color-warning)" />
                <span>Current Streak</span>
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
                {progress?.currentStreakDays || 6} Days
              </div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--color-warning-text)', marginTop: '2px' }}>
                Keep it going today!
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Your Materials Grid */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Your Materials
            </h3>
            <p style={{ fontSize: '0.785rem', color: 'var(--text-secondary)' }}>
              Recent grounded lecture slides, notes, and multimodal diagrams.
            </p>
          </div>

          <button
            onClick={() => setCurrentRoute('materials')}
            className="btn btn-ghost btn-sm"
            style={{ gap: '4px', color: 'var(--accent-primary)', fontSize: '0.8125rem' }}
          >
            <span>View all ({materials.length})</span>
            <ChevronRight size={14} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {materials.slice(0, 4).map((mat) => (
            <MaterialCard key={mat.id} material={mat} />
          ))}
        </div>
      </div>

      {isUploadModalOpen && (
        <MaterialUploadModal onClose={() => setIsUploadModalOpen(false)} />
      )}
    </div>
  );
};
