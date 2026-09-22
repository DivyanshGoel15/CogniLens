import React from 'react';
import {
  TrendingUp,
  Award,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Flame,
  ArrowRight,
  HelpCircle,
  BookOpen,
  Zap,
  Target
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const ProgressScreen: React.FC = () => {
  const { startQuiz, setCurrentRoute, setPrefilledPrompt, progress, recordDailyActivity } = useApp();

  const courses = progress?.courses || [];

  // Dynamic calculations
  const overallMastery = courses.length > 0
    ? Math.round(courses.reduce((acc, c) => acc + c.masteryPercentage, 0) / courses.length)
    : (progress?.overallMastery || 78);

  const totalTopicsCompleted = courses.reduce((acc, c) => acc + c.topicsCompleted, 0);
  const totalTopicsCount = courses.reduce((acc, c) => acc + c.totalTopics, 0);

  // Identify lowest mastery course / weak topic for dynamic recommendation
  const lowestCourse = courses.length > 0
    ? [...courses].sort((a, b) => a.masteryPercentage - b.masteryPercentage)[0]
    : null;

  const activeWeakTopic = lowestCourse?.weakTopics?.[0] || lowestCourse?.strongTopics?.[0] || 'Deadlock Detection';

  const getTodayDateStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const getYesterdayDateStr = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const todayStr = getTodayDateStr();
  const yesterdayStr = getYesterdayDateStr();
  const lastActive = progress?.lastActiveDate || todayStr;

  const isStreakActiveToday = lastActive === todayStr;
  const isStreakActiveYesterday = lastActive === yesterdayStr;

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
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: 'var(--accent-primary-light)',
              color: 'var(--accent-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <TrendingUp size={20} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Learning Analytics & Topic Mastery
            </h1>
            <p style={{ fontSize: '0.84375rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Real-time diagnostic insight: Track conceptual retention and target weak points before exams.
            </p>
          </div>
        </div>
      </div>

      {/* Top 4 Dynamic Metrics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        {/* Card 1: Overall Mastery */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-tertiary)', fontSize: '0.785rem' }}>
            <Award size={16} color="var(--accent-primary)" />
            <span>Overall Knowledge Mastery</span>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '6px' }}>
            {overallMastery}%
          </div>
          <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--border-subtle)', borderRadius: 'var(--radius-full)', marginTop: '10px', overflow: 'hidden' }}>
            <div style={{ width: `${overallMastery}%`, height: '100%', backgroundColor: 'var(--accent-primary)' }} />
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginTop: '6px' }}>
            {totalTopicsCompleted} of {totalTopicsCount} curriculum topics completed
          </div>
        </div>

        {/* Card 2: Quiz Accuracy */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-tertiary)', fontSize: '0.785rem' }}>
            <TrendingUp size={16} color="var(--color-success)" />
            <span>Quiz Diagnostic Accuracy</span>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '6px' }}>
            {progress?.quizAccuracy || 84}%
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-success)', marginTop: '8px', fontWeight: 600 }}>
            {progress?.totalQuestionsAnswered || 48} total questions solved
          </div>
        </div>

        {/* Card 3: Active Study Hours */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-tertiary)', fontSize: '0.785rem' }}>
            <Clock size={16} color="var(--color-purple)" />
            <span>Active Study Hours</span>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '6px' }}>
            {progress?.totalStudyHours || 14.5} hrs
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
            Tracked across {courses.length} courses
          </div>
        </div>

        {/* Card 4: Active Streak Status */}
        <div
          className="card"
          style={{
            padding: '20px',
            background: isStreakActiveToday ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(239, 68, 68, 0.05) 100%)' : 'var(--bg-surface)',
            border: isStreakActiveToday ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid var(--border-default)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#d97706', fontSize: '0.785rem', fontWeight: 700 }}>
              <Flame size={16} color="#f59e0b" />
              <span>Consecutive Streak</span>
            </div>

            {!isStreakActiveToday && (
              <button
                onClick={() => recordDailyActivity('Manual progress check-in')}
                className="btn btn-xs"
                style={{ backgroundColor: '#f59e0b', color: '#ffffff', border: 'none', borderRadius: '4px', fontSize: '0.6875rem', padding: '2px 8px', cursor: 'pointer' }}
              >
                Log Today
              </button>
            )}
          </div>

          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '6px' }}>
            {progress?.currentStreakDays || 1} Days
          </div>

          <div style={{ fontSize: '0.72rem', marginTop: '6px', fontWeight: 600 }}>
            {isStreakActiveToday && <span style={{ color: 'var(--color-success)' }}>🔥 Active Today — Streak Maintained!</span>}
            {!isStreakActiveToday && isStreakActiveYesterday && <span style={{ color: '#d97706' }}>⚡ Active Yesterday — Log study today to extend!</span>}
            {!isStreakActiveToday && !isStreakActiveYesterday && <span style={{ color: 'var(--color-danger)' }}>⚠️ Missed previous day — Log today to start new streak!</span>}
          </div>
        </div>
      </div>

      {/* Dynamic AI Diagnostic Recommendation Box */}
      {lowestCourse && (
        <div
          className="card"
          style={{
            padding: '20px 24px',
            marginBottom: '28px',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(139, 92, 246, 0.05) 100%)',
            border: '1px solid rgba(99, 102, 241, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '20px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                backgroundColor: 'rgba(99, 102, 241, 0.15)',
                color: '#6366f1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Target size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                AI Diagnostic Recommendation
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                Target Review: {lowestCourse.course} — "{activeWeakTopic}"
              </h3>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Your current mastery in {lowestCourse.course} is {lowestCourse.masteryPercentage}%. Practicing "{activeWeakTopic}" will boost your diagnostic mastery score.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
            <button
              onClick={() => handleAskAIAboutTopic(activeWeakTopic)}
              className="btn btn-secondary btn-sm"
              style={{ gap: '6px' }}
            >
              <Sparkles size={14} />
              <span>Ask AI Tutor</span>
            </button>
            <button
              onClick={() => handlePracticeWeakTopic(lowestCourse.course, activeWeakTopic)}
              className="btn btn-primary btn-sm"
              style={{ gap: '6px' }}
            >
              <HelpCircle size={14} />
              <span>Practice Weak Topic</span>
            </button>
          </div>
        </div>
      )}

      {/* Course Breakdown List */}
      <div style={{ marginBottom: '28px' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px' }}>
          Subject Mastery & Diagnostic Breakdown
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {courses.map((courseItem) => (
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
