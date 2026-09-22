import React, { useState, useRef, useEffect } from 'react';
import { X, Layers, Sparkles, Loader2, BookOpen } from 'lucide-react';

interface CreateFlashcardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (topic: string, cardCount: number) => Promise<void>;
  isCreating: boolean;
}

const SUGGESTED_TOPICS = [
  'Data Structures & Algorithms',
  'Operating System Concepts',
  'Computer Networks',
  'Database Normalization',
  'Machine Learning Basics',
  'Software Engineering Principles',
  'Object-Oriented Programming',
  'Discrete Mathematics',
  'Digital Electronics',
  'Probability & Statistics',
];

const CARD_COUNT_OPTIONS = [5, 8, 10, 15, 20];

export const CreateFlashcardModal: React.FC<CreateFlashcardModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  isCreating,
}) => {
  const [topic, setTopic] = useState('');
  const [cardCount, setCardCount] = useState(10);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTopic('');
      setCardCount(10);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = topic.trim();
    if (!trimmed) return;
    await onCreate(trimmed, cardCount);
  };

  const handleSuggestionClick = (s: string) => {
    setTopic(s);
    inputRef.current?.focus();
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(6px)',
        padding: '16px',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-xl)',
          border: '1.5px solid var(--border-subtle)',
          width: '100%',
          maxWidth: '540px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.35)',
          overflow: 'hidden',
          animation: 'modalSlideIn 0.25s ease',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-subtle)',
            background: 'linear-gradient(135deg, var(--color-purple-subtle) 0%, transparent 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: 'var(--color-purple)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
              }}
            >
              <Layers size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Create New Flashcard Deck
              </h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
                AI-powered active recall cards on any topic
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isCreating}
            style={{
              border: 'none',
              background: 'var(--bg-subtle)',
              borderRadius: '8px',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: isCreating ? 'not-allowed' : 'pointer',
              color: 'var(--text-secondary)',
              opacity: isCreating ? 0.5 : 1,
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          {/* Topic input */}
          <div style={{ marginBottom: '20px' }}>
            <label
              htmlFor="flashcard-topic"
              style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}
            >
              Topic or Subject *
            </label>
            <div style={{ position: 'relative' }}>
              <BookOpen
                size={16}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                  pointerEvents: 'none',
                }}
              />
              <input
                id="flashcard-topic"
                ref={inputRef}
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Quantum Computing, Binary Trees, French Revolution..."
                disabled={isCreating}
                required
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '11px 14px 11px 36px',
                  fontSize: '0.875rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1.5px solid var(--border-subtle)',
                  backgroundColor: 'var(--bg-elevated)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  transition: 'border-color var(--transition-fast)',
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--color-purple)')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
              />
            </div>
          </div>

          {/* Suggested topics */}
          <div style={{ marginBottom: '20px' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 500 }}>
              Quick suggestions
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {SUGGESTED_TOPICS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleSuggestionClick(s)}
                  disabled={isCreating}
                  style={{
                    padding: '4px 10px',
                    fontSize: '0.7rem',
                    borderRadius: '20px',
                    border: '1px solid var(--border-subtle)',
                    backgroundColor: topic === s ? 'var(--color-purple-subtle)' : 'var(--bg-elevated)',
                    color: topic === s ? 'var(--color-purple)' : 'var(--text-secondary)',
                    cursor: isCreating ? 'not-allowed' : 'pointer',
                    transition: 'all var(--transition-fast)',
                    fontWeight: topic === s ? 600 : 400,
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Card count */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
              Number of Cards
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {CARD_COUNT_OPTIONS.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setCardCount(n)}
                  disabled={isCreating}
                  style={{
                    flex: 1,
                    padding: '10px 0',
                    fontSize: '0.875rem',
                    fontWeight: cardCount === n ? 700 : 500,
                    borderRadius: 'var(--radius-md)',
                    border: `1.5px solid ${cardCount === n ? 'var(--color-purple)' : 'var(--border-subtle)'}`,
                    backgroundColor: cardCount === n ? 'var(--color-purple-subtle)' : 'var(--bg-elevated)',
                    color: cardCount === n ? 'var(--color-purple)' : 'var(--text-secondary)',
                    cursor: isCreating ? 'not-allowed' : 'pointer',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isCreating}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                border: '1.5px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-elevated)',
                color: 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: isCreating ? 'not-allowed' : 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating || !topic.trim()}
              style={{
                flex: 2,
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                background: isCreating || !topic.trim()
                  ? 'var(--bg-subtle)'
                  : 'linear-gradient(135deg, var(--color-purple) 0%, var(--accent-primary) 100%)',
                color: isCreating || !topic.trim() ? 'var(--text-muted)' : '#fff',
                fontWeight: 700,
                fontSize: '0.875rem',
                cursor: isCreating || !topic.trim() ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all var(--transition-fast)',
                boxShadow: isCreating || !topic.trim() ? 'none' : '0 4px 16px rgba(139, 92, 246, 0.35)',
              }}
            >
              {isCreating ? (
                <>
                  <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  Generating Deck...
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  Generate {cardCount} Cards
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
