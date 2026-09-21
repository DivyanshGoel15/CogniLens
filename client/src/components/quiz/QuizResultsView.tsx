import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Trophy,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Layers,
  Calendar
} from 'lucide-react';
import { QuizResult } from '../../types/quiz';
import { useApp } from '../../context/AppContext';

interface QuizResultsViewProps {
  result: QuizResult;
  onRetake: () => void;
}

export const QuizResultsView: React.FC<QuizResultsViewProps> = ({ result, onRetake }) => {
  const { setCurrentRoute, setPrefilledPrompt } = useApp();

  useEffect(() => {
    if (result.scorePercentage >= 60) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, [result.scorePercentage]);

  const handleRemediateTopic = (topic: string) => {
    setCurrentRoute('ai-tutor');
    setPrefilledPrompt(`I struggled with "${topic}" on my recent quiz. Please provide a step-by-step conceptual walkthrough.`);
  };

  return (
    <div style={{ maxWidth: '820px', margin: '0 auto', padding: '24px' }}>
      {/* Score Header Card */}
      <div
        className="card"
        style={{
          padding: '32px',
          textAlign: 'center',
          backgroundColor: result.scorePercentage >= 70 ? 'var(--bg-surface)' : 'var(--bg-surface-subtle)',
          marginBottom: '20px'
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: result.scorePercentage >= 70 ? 'var(--color-success-subtle)' : 'var(--color-warning-subtle)',
            color: result.scorePercentage >= 70 ? 'var(--color-success)' : 'var(--color-warning-text)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px'
          }}
        >
          <Trophy size={32} />
        </div>

        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>
          {result.scorePercentage}%
        </h2>

        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          You answered <strong>{result.correctAnswers} of {result.totalQuestions}</strong> questions correctly in {result.title}.
        </p>

        {/* Progress Bar */}
        <div style={{ maxWidth: '360px', margin: '16px auto 0', height: '8px', backgroundColor: 'var(--border-subtle)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
          <div
            style={{
              width: `${result.scorePercentage}%`,
              height: '100%',
              backgroundColor: result.scorePercentage >= 70 ? 'var(--color-success)' : 'var(--color-warning)'
            }}
          />
        </div>
      </div>

      {/* Diagnostics Grid: Strong vs Needs Review */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        {/* Strong Topics */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <CheckCircle2 size={18} color="var(--color-success)" />
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Strong Concepts Mastered
            </h4>
          </div>

          {result.strongTopics.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {result.strongTopics.map((t, idx) => (
                <span key={idx} className="badge badge-success" style={{ fontSize: '0.75rem', padding: '4px 9px' }}>
                  ✓ {t}
                </span>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: '0.785rem', color: 'var(--text-tertiary)' }}>
              Keep practicing to establish mastery on core topics.
            </p>
          )}
        </div>

        {/* Weak Topics / Needs Review */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <AlertTriangle size={18} color="var(--color-warning)" />
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Identified Weak Points (Needs Review)
            </h4>
          </div>

          {result.weakTopics.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {result.weakTopics.map((t, idx) => (
                <span key={idx} className="badge badge-warning" style={{ fontSize: '0.75rem', padding: '4px 9px' }}>
                  • {t}
                </span>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: '0.785rem', color: 'var(--color-success-text)' }}>
              Outstanding! No weak areas detected in this assessment.
            </p>
          )}
        </div>
      </div>

      {/* Recommended Targeted Revision */}
      {result.recommendedRevision.length > 0 && (
        <div className="card" style={{ padding: '20px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Sparkles size={16} color="var(--accent-primary)" />
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Personalized Remediation Recommendations
            </h4>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {result.recommendedRevision.map((rec, rIdx) => (
              <div
                key={rIdx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-surface-subtle)',
                  border: '1px solid var(--border-subtle)',
                  gap: '12px'
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--text-primary)' }}>
                    {rec.topic}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Source: {rec.sourceDoc} {rec.sourcePage ? `(p. ${rec.sourcePage})` : ''}
                  </div>
                </div>

                <button
                  onClick={() => handleRemediateTopic(rec.topic)}
                  className="btn btn-secondary btn-sm"
                  style={{ gap: '4px', fontSize: '0.75rem', flexShrink: 0 }}
                >
                  <Sparkles size={12} color="var(--accent-primary)" />
                  <span>Review with AI</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={onRetake} className="btn btn-secondary btn-sm" style={{ gap: '6px' }}>
          <RotateCcw size={14} />
          <span>Retake Quiz</span>
        </button>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setCurrentRoute('flashcards')}
            className="btn btn-secondary btn-sm"
            style={{ gap: '6px' }}
          >
            <Layers size={14} />
            <span>Practice Flashcards</span>
          </button>

          <button
            onClick={() => setCurrentRoute('study-plan')}
            className="btn btn-primary btn-sm"
            style={{ gap: '6px' }}
          >
            <Calendar size={14} />
            <span>Update Study Plan</span>
          </button>
        </div>
      </div>
    </div>
  );
};
