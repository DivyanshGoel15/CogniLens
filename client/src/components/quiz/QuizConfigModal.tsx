import React, { useState } from 'react';
import { HelpCircle, X, Sparkles, BookOpen, Layers } from 'lucide-react';
import { QuizConfig, DifficultyLevel, QuestionType } from '../../types/quiz';
import { useApp } from '../../context/AppContext';

interface QuizConfigModalProps {
  onStart: (config: QuizConfig) => void;
  onClose: () => void;
}

export const QuizConfigModal: React.FC<QuizConfigModalProps> = ({ onStart, onClose }) => {
  const { materials } = useApp();
  const [selectedCourse, setSelectedCourse] = useState<string>('Operating Systems');
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('intermediate');
  const [questionType, setQuestionType] = useState<QuestionType | 'all'>('all');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStart({
      course: selectedCourse,
      questionCount,
      difficulty,
      questionType
    });
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'var(--color-warning-subtle)',
                color: 'var(--color-warning-text)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <HelpCircle size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Configure Knowledge Assessment
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                AI generates grounded questions from your indexed course materials.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-icon" aria-label="Close modal">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Target Course / Subject */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Target Subject:
            </label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="input-text"
            >
              <option value="Operating Systems">Operating Systems (Deadlocks, Scheduling, Memory)</option>
              <option value="Machine Learning">Machine Learning (Linear Regression, Loss, Backprop)</option>
              <option value="DBMS">DBMS (Normalization, 3NF, BCNF, Relational Algebra)</option>
              <option value="Java OOP">Java OOP (Polymorphism, Dynamic Dispatch, Interfaces)</option>
              <option value="Computer Networks">Computer Networks (TCP/IP, Handshake, Congestion)</option>
            </select>
          </div>

          {/* Question Count Selector */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Number of Questions:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {[5, 10, 20].map((count) => (
                <button
                  type="button"
                  key={count}
                  onClick={() => setQuestionCount(count)}
                  style={{
                    padding: '8px',
                    borderRadius: 'var(--radius-md)',
                    border: `1px solid ${questionCount === count ? 'var(--accent-primary)' : 'var(--border-default)'}`,
                    backgroundColor: questionCount === count ? 'var(--accent-primary-light)' : 'var(--bg-surface)',
                    color: questionCount === count ? 'var(--accent-primary)' : 'var(--text-primary)',
                    fontWeight: 600,
                    fontSize: '0.84375rem',
                    cursor: 'pointer'
                  }}
                >
                  {count} Questions
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty Level */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Difficulty Level:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {(['beginner', 'intermediate', 'advanced'] as DifficultyLevel[]).map((level) => (
                <button
                  type="button"
                  key={level}
                  onClick={() => setDifficulty(level)}
                  style={{
                    padding: '8px',
                    borderRadius: 'var(--radius-md)',
                    border: `1px solid ${difficulty === level ? 'var(--accent-primary)' : 'var(--border-default)'}`,
                    backgroundColor: difficulty === level ? 'var(--accent-primary-light)' : 'var(--bg-surface)',
                    color: difficulty === level ? 'var(--accent-primary)' : 'var(--text-primary)',
                    fontWeight: 600,
                    fontSize: '0.8125rem',
                    textTransform: 'capitalize',
                    cursor: 'pointer'
                  }}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* Question Format */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Question Format:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {[
                { id: 'all', label: 'All Types' },
                { id: 'mcq', label: 'Multiple Choice' },
                { id: 'conceptual', label: 'Conceptual / Deep' }
              ].map((fmt) => (
                <button
                  type="button"
                  key={fmt.id}
                  onClick={() => setQuestionType(fmt.id as any)}
                  style={{
                    padding: '8px',
                    borderRadius: 'var(--radius-md)',
                    border: `1px solid ${questionType === fmt.id ? 'var(--accent-primary)' : 'var(--border-default)'}`,
                    backgroundColor: questionType === fmt.id ? 'var(--accent-primary-light)' : 'var(--bg-surface)',
                    color: questionType === fmt.id ? 'var(--accent-primary)' : 'var(--text-primary)',
                    fontWeight: 600,
                    fontSize: '0.785rem',
                    cursor: 'pointer'
                  }}
                >
                  {fmt.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
            <button type="button" onClick={onClose} className="btn btn-ghost btn-sm">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-sm" style={{ gap: '6px' }}>
              <Sparkles size={14} />
              <span>Generate Quiz</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
