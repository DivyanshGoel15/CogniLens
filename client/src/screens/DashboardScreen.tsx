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
  ChevronRight,
  Award
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
    startQuiz,
    progress,
    userProfile,
    startNewStudySession
  } = useApp();

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const handleAskAIQuick = () => {
    startNewStudySession();
  };

  const handleCreateQuizQuick = () => {
    const course = materials[0]?.course || 'General Studies';
    const topic = materials[0]?.topics?.[0] || materials[0]?.title || 'Core Concepts';
    startQuiz({
      course,
      topic,
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
            Academic Workspace • 2026
          </span>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Good day, {userProfile?.fullName || 'Student'}.
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
      {(() => {
        const lastItem = progress?.lastStudied || (materials.length > 0 ? {
          materialId: materials[0].id,
          title: materials[0].title,
          filename: materials[0].filename,
          course: materials[0].course,
          page: 1,
          totalPages: materials[0].pagesCount || 10,
          sectionTitle: materials[0].sections?.[0]?.title || `${materials[0].title} — Page 1`,
          progressPercentage: Math.round((1 / (materials[0].pagesCount || 10)) * 100),
          lastUpdated: 'Recently'
        } : null);

        const topicsDone = progress ? progress.courses.reduce((acc, c) => acc + c.topicsCompleted, 0) : 0;
        const topicsTotal = progress ? progress.courses.reduce((acc, c) => acc + c.totalTopics, 0) : 0;
        const completionPct = progress?.overallMastery || 0;

        return (
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

                {lastItem ? (
                  <>
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
                          {lastItem.title}
                        </h3>
                        <div style={{ fontSize: '0.785rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          {lastItem.sectionTitle}
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                        <span>Reading Progress</span>
                        <span>{lastItem.progressPercentage}% completed (p. {lastItem.page}/{lastItem.totalPages})</span>
                      </div>
                      <div style={{ width: '100%', height: '7px', backgroundColor: 'var(--border-subtle)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                        <div style={{ width: `${lastItem.progressPercentage}%`, height: '100%', backgroundColor: 'var(--accent-primary)', borderRadius: 'var(--radius-full)', transition: 'width 300ms ease' }} />
                      </div>
                    </div>
                  </>
                ) : (
                  <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    No material open yet. Select a document below to begin reading.
                  </div>
                )}
              </div>

              {lastItem && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px', gap: '8px' }}>
                  <button
                    onClick={() => openDocumentViewer(lastItem.materialId, lastItem.page)}
                    className="btn btn-secondary btn-sm"
                    style={{ gap: '6px' }}
                  >
                    <span>Jump to Page {lastItem.page}</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </div>

            {/* Learning Progress Metrics (Specific to the active Continue Learning course/topic) */}
            {(() => {
              const activeCourseName = lastItem?.course || null;
              const courseObj = (activeCourseName && progress?.courses.find(c => c.course === activeCourseName)) || {
                course: activeCourseName || 'No course yet',
                masteryPercentage: 0,
                topicsCompleted: 0,
                totalTopics: 0,
                strongTopics: [],
                weakTopics: [],
                recentScore: 0
              };

              return (
                <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Learning Progress
                      </div>
                      <span className="badge badge-secondary" style={{ fontSize: '0.7rem', fontWeight: 600 }}>
                        {activeCourseName}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '14px' }}>
                      {/* Course Mastery */}
                      <div style={{ backgroundColor: 'var(--bg-surface-subtle)', padding: '12px 14px', borderRadius: 'var(--radius-md)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>
                          <Award size={13} color="var(--accent-primary)" />
                          <span>Course Mastery</span>
                        </div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
                          {courseObj.masteryPercentage}%
                        </div>
                        <div style={{ fontSize: '0.6875rem', color: 'var(--color-success)', marginTop: '2px' }}>
                          {activeCourseName} performance
                        </div>
                      </div>

                      {/* Topics Completed in Course */}
                      <div style={{ backgroundColor: 'var(--bg-surface-subtle)', padding: '12px 14px', borderRadius: 'var(--radius-md)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>
                          <CheckCircle2 size={13} color="var(--color-success)" />
                          <span>Topics Mastered</span>
                        </div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
                          {courseObj.topicsCompleted} / {courseObj.totalTopics}
                        </div>
                        <div style={{ fontSize: '0.6875rem', color: 'var(--accent-primary)', marginTop: '2px' }}>
                          In {activeCourseName}
                        </div>
                      </div>

                      {/* Quiz Score in Course */}
                      <div style={{ backgroundColor: 'var(--bg-surface-subtle)', padding: '12px 14px', borderRadius: 'var(--radius-md)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>
                          <TrendingUp size={13} color="var(--color-warning)" />
                          <span>Quiz Accuracy</span>
                        </div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
                          {courseObj.recentScore}%
                        </div>
                        <div style={{ fontSize: '0.6875rem', color: 'var(--color-success)', marginTop: '2px' }}>
                          Recent quiz score
                        </div>
                      </div>

                      {/* Active Streak */}
                      <div style={{ backgroundColor: 'var(--bg-surface-subtle)', padding: '12px 14px', borderRadius: 'var(--radius-md)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>
                          <Flame size={13} color="var(--color-warning)" />
                          <span>Active Streak</span>
                        </div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
                          {(() => {
                            const count = progress?.currentStreakDays ?? 0;
                            return `${count} ${count === 1 ? 'Day' : 'Days'}`;
                          })()}
                        </div>
                        <div style={{ fontSize: '0.6875rem', color: 'var(--color-warning-text)', marginTop: '2px' }}>
                          Consistent study
                        </div>
                      </div>
                    </div>

                    {/* Specific Concept Badges for this course */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.75rem' }}>
                      <div style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
                        {activeCourseName} Concept Breakdown:
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {courseObj.strongTopics.map((st, idx) => (
                          <span key={`s-${idx}`} className="badge badge-success" style={{ fontSize: '0.65rem' }}>
                            ✓ {st}
                          </span>
                        ))}
                        {courseObj.weakTopics.map((wt, idx) => (
                          <span key={`w-${idx}`} className="badge badge-warning" style={{ fontSize: '0.65rem' }}>
                            • {wt}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        );
      })()}

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

        {materials.length === 0 ? (
          <div
            className="card"
            style={{
              padding: '36px 20px',
              textAlign: 'center',
              backgroundColor: 'var(--bg-surface-subtle)',
              borderRadius: 'var(--radius-xl)',
              border: '1.5px dashed var(--border-subtle)'
            }}
          >
            <FileText size={32} color="var(--text-muted)" style={{ margin: '0 auto 10px' }} />
            <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              No study materials uploaded yet
            </h4>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '4px', marginBottom: '16px' }}>
              Upload your textbook PDF, lecture notes, or diagrams to activate grounded AI Tutoring and quizzes.
            </p>
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="btn btn-primary btn-sm"
              style={{ gap: '6px', margin: '0 auto' }}
            >
              <Upload size={14} />
              <span>Upload Your First Material</span>
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {materials.slice(0, 4).map((mat) => (
              <MaterialCard key={mat.id} material={mat} />
            ))}
          </div>
        )}
      </div>

      {isUploadModalOpen && (
        <MaterialUploadModal onClose={() => setIsUploadModalOpen(false)} />
      )}
    </div>
  );
};
