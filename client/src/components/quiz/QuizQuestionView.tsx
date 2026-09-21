import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle2, AlertCircle, Sparkles, BookOpen, Clock } from 'lucide-react';
import { QuizQuestion, QuizSubmission } from '../../types/quiz';
import { useApp } from '../../context/AppContext';

interface QuizQuestionViewProps {
  questions: QuizQuestion[];
  currentIndex: number;
  submissions: QuizSubmission[];
  onSelectOption: (optionIndex: number) => void;
  onPrev: () => void;
  onNext: () => void;
  onFinish: () => void;
}

export const QuizQuestionView: React.FC<QuizQuestionViewProps> = ({
  questions,
  currentIndex,
  submissions,
  onSelectOption,
  onPrev,
  onNext,
  onFinish
}) => {
  const { openDocumentViewer } = useApp();
  const currentQ = questions[currentIndex];
  const currentSub = submissions[currentIndex];
  const [showExplanation, setShowExplanation] = useState(false);

  const isSelected = currentSub?.selectedOptionIndex !== undefined;
  const isLast = currentIndex === questions.length - 1;
  const progressPct = Math.round(((currentIndex + 1) / questions.length) * 100);

  const handleOptionClick = (idx: number) => {
    onSelectOption(idx);
    setShowExplanation(true);
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px' }}>
      {/* Top Header & Progress */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="badge badge-primary" style={{ fontSize: '0.75rem' }}>
              {currentQ.course}
            </span>
            <span style={{ fontSize: '0.84375rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Question {currentIndex + 1} of {questions.length}
            </span>
          </div>

          <span className="badge badge-neutral" style={{ fontSize: '0.75rem' }}>
            Topic: {currentQ.topic}
          </span>
        </div>

        {/* Progress Bar */}
        <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--border-subtle)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
          <div
            style={{
              width: `${progressPct}%`,
              height: '100%',
              backgroundColor: 'var(--accent-primary)',
              transition: 'width 250ms ease'
            }}
          />
        </div>
      </div>

      {/* Main Question Card */}
      <div className="card" style={{ padding: '28px', marginBottom: '20px' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.4, marginBottom: '24px' }}>
          {currentQ.questionText}
        </h3>

        {/* Options List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {currentQ.options?.map((opt, oIdx) => {
            const isChosen = currentSub?.selectedOptionIndex === oIdx;
            const isCorrect = currentQ.correctOptionIndex === oIdx;
            const hasAnswered = currentSub?.selectedOptionIndex !== undefined;

            let bgColor = 'var(--bg-surface)';
            let borderColor = 'var(--border-default)';
            let textColor = 'var(--text-primary)';

            if (hasAnswered) {
              if (isCorrect) {
                bgColor = 'var(--color-success-subtle)';
                borderColor = 'var(--color-success-border)';
                textColor = 'var(--color-success-text)';
              } else if (isChosen && !isCorrect) {
                bgColor = 'var(--color-danger-subtle)';
                borderColor = 'var(--color-danger-border)';
                textColor = 'var(--color-danger-text)';
              }
            } else if (isChosen) {
              bgColor = 'var(--accent-primary-light)';
              borderColor = 'var(--accent-primary)';
              textColor = 'var(--accent-primary)';
            }

            return (
              <button
                key={oIdx}
                onClick={() => handleOptionClick(oIdx)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px 18px',
                  borderRadius: 'var(--radius-md)',
                  border: `1.5px solid ${borderColor}`,
                  backgroundColor: bgColor,
                  color: textColor,
                  fontSize: '0.875rem',
                  fontWeight: isChosen || (hasAnswered && isCorrect) ? 600 : 400,
                  transition: 'all var(--transition-fast)',
                  textAlign: 'left'
                }}
              >
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    border: `1.5px solid ${borderColor}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    flexShrink: 0
                  }}
                >
                  {String.fromCharCode(65 + oIdx)}
                </div>
                <span style={{ flex: 1 }}>{opt}</span>
                {hasAnswered && isCorrect && <CheckCircle2 size={18} color="var(--color-success)" />}
                {hasAnswered && isChosen && !isCorrect && <AlertCircle size={18} color="var(--color-danger)" />}
              </button>
            );
          })}
        </div>

        {/* Immediate Explanation Drawer */}
        {isSelected && showExplanation && (
          <div
            style={{
              marginTop: '20px',
              padding: '14px 16px',
              backgroundColor: 'var(--bg-surface-subtle)',
              borderLeft: `3px solid ${currentSub?.isCorrect ? 'var(--color-success)' : 'var(--color-warning)'}`,
              borderRadius: '0 var(--radius-md) var(--radius-md) 0',
              animation: 'fadeIn 200ms ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '0.8125rem', color: currentSub?.isCorrect ? 'var(--color-success-text)' : 'var(--color-warning-text)', marginBottom: '4px' }}>
              <Sparkles size={14} />
              <span>{currentSub?.isCorrect ? 'Correct! Concept Breakdown:' : 'Insight & Remediation:'}</span>
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {currentQ.explanation}
            </p>

            {currentQ.sourceDoc && (
              <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--accent-primary)', cursor: 'pointer' }}>
                <BookOpen size={12} />
                <span>Grounded Citation: {currentQ.sourceDoc} (Page {currentQ.sourcePage || 1})</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button
          onClick={onPrev}
          disabled={currentIndex === 0}
          className="btn btn-secondary btn-sm"
          style={{ gap: '6px' }}
        >
          <ChevronLeft size={16} />
          <span>Previous</span>
        </button>

        {isLast ? (
          <button
            onClick={onFinish}
            disabled={!isSelected}
            className="btn btn-primary btn-sm"
            style={{ gap: '6px', padding: '8px 18px' }}
          >
            <span>Complete Assessment</span>
            <CheckCircle2 size={16} />
          </button>
        ) : (
          <button
            onClick={onNext}
            disabled={!isSelected}
            className="btn btn-primary btn-sm"
            style={{ gap: '6px' }}
          >
            <span>Next Question</span>
            <ChevronRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
};
