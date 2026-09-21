import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Award,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Flame,
  ArrowRight,
  HelpCircle
} from 'lucide-react';
import { progressService } from '../services/progressService';
import { LearningProgressState } from '../types/progress';
import { useApp } from '../context/AppContext';

export const ProgressScreen: React.FC = () => {
  const { startQuiz, setCurrentRoute, setPrefilledPrompt } = useApp();
  const [progress, setProgress] = useState<LearningProgressState | null>(null);

  useEffect(() => {
    progressService.getProgress().then(res => {
      if (res.success) setProgress(res.data);
    });
  }, []);

  const handlePracticeWeakTopic = (course: string, topic: string) => {
    startQuiz({
      course,
      topic,
      questionCount: 5,
      difficulty: 'intermediate',
      questionType: 'all'
    });
  };

  const handleAskAIAboutTopic = (topic: string) => {
    setCurrentRoute('ai-tutor');
    setPrefilledPrompt(`Can you explain why "${topic}" is tricky and how I can master it?`);
  };

  return (
    <div style={{ padding: '28px 32px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '24px' }}>
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
            <TrendingUp size={18} />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Learning Analytics & Topic Mastery
          </h1>
        </div>
        <p style={{ fontSize: '0.84375rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
          Real-time diagnostic insight: Track conceptual retention and target weak points before exams.
        </p>
      </div>

      {/* Top 4 Metrics Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        <div className="card" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-tertiary)', fontSize: '0.785rem' }}>
            <Award size={14} color="var(--accent-primary)" />
            <span>Overall Knowledge Mastery</span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
            {progress?.overallMastery || 78}%
          </div>
          <div style={{ width: '100%', height: '5px', backgroundColor: 'var(--border-subtle)', borderRadius: 'var(--radius-full)', marginTop: '8px', overflow: 'hidden' }}>
            <div style={{ width: `${progress?.overallMastery || 78}%`, height: '100%', backgroundColor: 'var(--accent-primary)' }} />
          </div>
        </div>

        <div className="card" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-tertiary)', fontSize: '0.785rem' }}>
            <TrendingUp size={14} color="var(--color-success)" />
            <span>Quiz Accuracy</span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
            {progress?.quizAccuracy || 84}%
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-success)', marginTop: '6px' }}>
            {progress?.totalQuestionsAnswered || 48} questions solved
          </div>
        </div>

        <div className="card" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-tertiary)', fontSize: '0.785rem' }}>
            <Clock size={14} color="var(--color-purple)" />
            <span>Active Study Hours</span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
            {progress?.totalStudyHours || 14.5} hrs
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
            Across 5 courses
          </div>
        </div>

        <div className="card" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-tertiary)', fontSize: '0.785rem' }}>
            <Flame size={14} color="var(--color-warning)" />
            <span>Consecutive Day Streak</span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
            {progress?.currentStreakDays || 6} Days
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-warning-text)', marginTop: '6px' }}>
            Study goal on track
          </div>
        </div>
      </div>

      {/* Course Breakdown List */}
      <div style={{ marginBottom: '28px' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px' }}>
          Subject Mastery & Diagnostic Breakdown
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {progress?.courses.map((courseItem) => (
            <div
              key={courseItem.course}
              className="card"
              style={{
                padding: '20px 24px',
                display: 'grid',
                gridTemplateColumns: '260px 1fr 1fr auto',
                alignItems: 'center',
                gap: '20px'
              }}
            >
              {/* Course Title & Progress Bar */}
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
                  {courseItem.course}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                  <div style={{ width: '120px', height: '6px', backgroundColor: 'var(--border-subtle)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${courseItem.masteryPercentage}%`,
                        height: '100%',
                        backgroundColor: courseItem.masteryPercentage >= 80 ? 'var(--color-success)' : 'var(--accent-primary)'
                      }}
                    />
                  </div>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                    {courseItem.masteryPercentage}%
                  </span>
                </div>
                <div style={{ fontSize: '0.725rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                  {courseItem.topicsCompleted} of {courseItem.totalTopics} topics complete
                </div>
              </div>

              {/* Strong Topics */}
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Strong Concepts:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {courseItem.strongTopics.map((s, idx) => (
                    <span key={idx} className="badge badge-success" style={{ fontSize: '0.6875rem' }}>
                      ✓ {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Weak Topics (Needs Practice) */}
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Needs Practice:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {courseItem.weakTopics.length > 0 ? (
                    courseItem.weakTopics.map((w, idx) => (
                      <span key={idx} className="badge badge-warning" style={{ fontSize: '0.6875rem' }}>
                        • {w}
                      </span>
                    ))
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-success-text)' }}>
                      All tested topics solid
                    </span>
                  )}
                </div>
              </div>

              {/* Targeted Practice Button */}
              <div>
                {courseItem.weakTopics.length > 0 ? (
                  <button
                    onClick={() => handlePracticeWeakTopic(courseItem.course, courseItem.weakTopics[0])}
                    className="btn btn-secondary btn-sm"
                    style={{ gap: '6px', fontSize: '0.75rem' }}
                  >
                    <HelpCircle size={13} color="var(--color-warning)" />
                    <span>Practice Weak Area</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handlePracticeWeakTopic(courseItem.course, courseItem.strongTopics[0] || 'General')}
                    className="btn btn-subtle btn-sm"
                    style={{ gap: '6px', fontSize: '0.75rem' }}
                  >
                    <span>Challenge Quiz</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Learning Activity Log */}
      <div>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px' }}>
          Recent Activity Timeline
        </h3>

        <div className="card" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {progress?.recentActivities.map((act) => (
            <div
              key={act.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 0',
                borderBottom: '1px solid var(--border-subtle)',
                fontSize: '0.8125rem'
              }}
            >
              <div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{act.title}</div>
                {act.resultSnippet && (
                  <div style={{ fontSize: '0.725rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {act.resultSnippet}
                  </div>
                )}
              </div>
              <div style={{ fontSize: '0.725rem', color: 'var(--text-tertiary)' }}>{act.timestamp}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
