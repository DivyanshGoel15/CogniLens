import React, { useState, useRef, useEffect } from 'react';
import { RotateCw, Sparkles, BookOpen, Check, ThumbsUp, AlertCircle, Volume2, VolumeX } from 'lucide-react';
import { Flashcard, FlashcardConfidence } from '../../types/flashcard';
import { useApp } from '../../context/AppContext';
import { multimodalVisionService } from '../../services/multimodalVisionService';

interface FlashcardCardProps {
  card: Flashcard;
  currentIndex: number;
  totalCards: number;
  onRateConfidence: (confidence: FlashcardConfidence) => void;
  onNext: () => void;
  onPrev: () => void;
  hasNext: boolean;
  hasPrev: boolean;
}

export const FlashcardCard: React.FC<FlashcardCardProps> = ({
  card,
  currentIndex,
  totalCards,
  onRateConfidence,
  onNext,
  onPrev,
  hasNext,
  hasPrev
}) => {
  const { openDocumentViewer } = useApp();
  const [isFlipped, setIsFlipped] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const ttsStopRef = useRef<(() => void) | null>(null);

  const stopAudio = () => {
    if (ttsStopRef.current) {
      ttsStopRef.current();
      ttsStopRef.current = null;
    }
    setIsSpeaking(false);
  };

  useEffect(() => {
    stopAudio();
    setIsFlipped(false);
  }, [card.id]);

  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, []);

  const handleFlip = () => {
    stopAudio();
    setIsFlipped(!isFlipped);
  };

  const handleToggleAudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSpeaking) {
      stopAudio();
      return;
    }

    const textToRead = isFlipped ? card.back : card.front;
    const controller = multimodalVisionService.speakText(
      textToRead,
      () => setIsSpeaking(true),
      () => setIsSpeaking(false),
      () => setIsSpeaking(false)
    );
    ttsStopRef.current = controller.stop;
  };

  const handleRate = (confidence: FlashcardConfidence, e: React.MouseEvent) => {
    e.stopPropagation();
    stopAudio();
    onRateConfidence(confidence);
    setIsFlipped(false);
  };

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', perspective: '1000px' }}>
      {/* Progress & Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="badge badge-primary" style={{ fontSize: '0.75rem' }}>
            {card.course} • {card.topic}
          </span>
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Card {currentIndex + 1} of {totalCards}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button 
            onClick={(e) => { e.stopPropagation(); onPrev(); setIsFlipped(false); }} 
            disabled={!hasPrev}
            className="btn btn-ghost btn-sm"
            style={{ padding: '4px 8px', fontSize: '0.75rem', opacity: hasPrev ? 1 : 0.4 }}
          >
            &larr; Prev
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onNext(); setIsFlipped(false); }} 
            disabled={!hasNext}
            className="btn btn-ghost btn-sm"
            style={{ padding: '4px 8px', fontSize: '0.75rem', opacity: hasNext ? 1 : 0.4 }}
          >
            Next &rarr;
          </button>
        </div>
      </div>

      {/* 3D Flip Card Container */}
      <div
        onClick={handleFlip}
        style={{
          minHeight: '320px',
          backgroundColor: 'var(--bg-surface)',
          border: '1.5px solid var(--border-default)',
          borderRadius: 'var(--radius-xl)',
          padding: '32px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          cursor: 'pointer',
          boxShadow: 'var(--shadow-md)',
          transition: 'all 240ms cubic-bezier(0.16, 1, 0.3, 1)',
          position: 'relative'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--accent-primary-border)';
          e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--border-default)';
          e.currentTarget.style.boxShadow = 'var(--shadow-md)';
        }}
      >
        {/* Card Side Pill & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              className={`badge ${isFlipped ? 'badge-primary' : 'badge-neutral'}`}
              style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}
            >
              {isFlipped ? 'Answer & Core Points' : 'Recall Question'}
            </span>

            {/* Read Aloud Button */}
            <button
              type="button"
              onClick={handleToggleAudio}
              className={`btn ${isSpeaking ? 'btn-danger' : 'btn-ghost'} btn-sm`}
              style={{ padding: '2px 8px', fontSize: '0.7rem', gap: '4px', height: '24px' }}
              title={isSpeaking ? 'Stop audio' : 'Listen to card out loud'}
            >
              {isSpeaking ? (
                <>
                  <VolumeX size={12} className="animate-pulse" />
                  <span>Stop</span>
                </>
              ) : (
                <>
                  <Volume2 size={12} color="var(--accent-primary)" />
                  <span>Listen</span>
                </>
              )}
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.725rem', color: 'var(--text-tertiary)' }}>
            <RotateCw size={12} />
            <span>Click to flip</span>
          </div>
        </div>

        {/* Card Text Content (Dynamic Layout for High-Detail Answers) */}
        <div
          style={{
            margin: 'auto 0',
            padding: '14px 4px',
            textAlign: isFlipped ? 'left' : 'center',
            maxHeight: '400px',
            overflowY: 'auto'
          }}
        >
          {isFlipped ? (
            <div
              style={{
                fontSize: '0.9rem',
                color: 'var(--text-primary)',
                lineHeight: 1.65,
                whiteSpace: 'pre-wrap',
                fontWeight: 450,
                fontFamily: 'var(--font-sans)',
                letterSpacing: '-0.005em'
              }}
            >
              {card.back}
            </div>
          ) : (
            <h3
              style={{
                fontSize: '1.25rem',
                fontWeight: 650,
                color: 'var(--text-primary)',
                lineHeight: 1.45,
                whiteSpace: 'pre-line'
              }}
            >
              {card.front}
            </h3>
          )}
        </div>

        {/* Footer Meta / Citations */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.725rem', color: 'var(--text-tertiary)' }}>
            <BookOpen size={12} color="var(--accent-primary)" />
            <span>{card.sourceDoc} {card.sourcePage ? `(p. ${card.sourcePage})` : ''}</span>
          </div>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            Reviewed {card.repetitionCount}x
          </span>
        </div>
      </div>

      {/* Confidence Rating Bar (Enabled when card is flipped) */}
      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '10px' }}>
          How well did you know this? (Leitner Interval)
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
          <button
            onClick={(e) => handleRate('again', e)}
            className="btn btn-secondary btn-sm"
            style={{
              borderColor: 'var(--color-danger-border)',
              backgroundColor: 'var(--color-danger-subtle)',
              color: 'var(--color-danger-text)',
              fontSize: '0.785rem',
              fontWeight: 600,
              flexDirection: 'column',
              padding: '8px 4px'
            }}
          >
            <span>Again</span>
            <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>&lt; 1 min</span>
          </button>

          <button
            onClick={(e) => handleRate('hard', e)}
            className="btn btn-secondary btn-sm"
            style={{
              borderColor: 'var(--color-warning-border)',
              backgroundColor: 'var(--color-warning-subtle)',
              color: 'var(--color-warning-text)',
              fontSize: '0.785rem',
              fontWeight: 600,
              flexDirection: 'column',
              padding: '8px 4px'
            }}
          >
            <span>Hard</span>
            <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>12 hours</span>
          </button>

          <button
            onClick={(e) => handleRate('good', e)}
            className="btn btn-secondary btn-sm"
            style={{
              borderColor: 'var(--accent-primary-border)',
              backgroundColor: 'var(--accent-primary-light)',
              color: 'var(--accent-primary)',
              fontSize: '0.785rem',
              fontWeight: 600,
              flexDirection: 'column',
              padding: '8px 4px'
            }}
          >
            <span>Good</span>
            <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>1 day</span>
          </button>

          <button
            onClick={(e) => handleRate('easy', e)}
            className="btn btn-secondary btn-sm"
            style={{
              borderColor: 'var(--color-success-border)',
              backgroundColor: 'var(--color-success-subtle)',
              color: 'var(--color-success-text)',
              fontSize: '0.785rem',
              fontWeight: 600,
              flexDirection: 'column',
              padding: '8px 4px'
            }}
          >
            <span>Easy</span>
            <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>3 days</span>
          </button>
        </div>
      </div>
    </div>
  );
};
