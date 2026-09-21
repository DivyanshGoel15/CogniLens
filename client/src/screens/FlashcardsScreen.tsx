import React, { useState, useEffect } from 'react';
import { Layers, RotateCcw, Plus, CheckCircle2, ChevronRight, BookOpen } from 'lucide-react';
import { flashcardService } from '../services/flashcardService';
import { Flashcard, FlashcardConfidence, FlashcardDeck } from '../types/flashcard';
import { FlashcardCard } from '../components/flashcards/FlashcardCard';
import { useToast } from '../context/ToastContext';

export const FlashcardsScreen: React.FC = () => {
  const { showToast } = useToast();
  const [decks, setDecks] = useState<FlashcardDeck[]>([]);
  const [activeDeckId, setActiveDeckId] = useState<string>('deck-os');
  const [currentCardIndex, setCurrentCardIndex] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  useEffect(() => {
    flashcardService.getDecks().then(res => {
      if (res.success) {
        setDecks(res.data);
      }
    });
  }, []);

  const activeDeck = decks.find(d => d.id === activeDeckId) || decks[0];

  const handleRateConfidence = async (confidence: FlashcardConfidence) => {
    if (!activeDeck) return;
    const currentCard = activeDeck.cards[currentCardIndex];

    try {
      await flashcardService.updateCardConfidence(activeDeck.id, currentCard.id, confidence);
      showToast('Mastery Recorded', `Card scheduled according to spaced repetition interval`, 'info');

      if (currentCardIndex < activeDeck.cards.length - 1) {
        setCurrentCardIndex(prev => prev + 1);
      } else {
        setIsCompleted(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleResetDeck = () => {
    setCurrentCardIndex(0);
    setIsCompleted(false);
  };

  return (
    <div style={{ padding: '28px 32px', maxWidth: '1100px', margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'var(--color-purple-subtle)',
                color: 'var(--color-purple)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Layers size={18} />
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Spaced Repetition Flashcards
            </h1>
          </div>
          <p style={{ fontSize: '0.84375rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Active recall intervals generated dynamically from your indexed course materials.
          </p>
        </div>
      </div>

      {/* Deck Selector Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '28px', overflowX: 'auto' }}>
        {decks.map((deck) => (
          <button
            key={deck.id}
            onClick={() => {
              setActiveDeckId(deck.id);
              setCurrentCardIndex(0);
              setIsCompleted(false);
            }}
            style={{
              padding: '12px 16px',
              borderRadius: 'var(--radius-lg)',
              border: `1.5px solid ${activeDeckId === deck.id ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
              backgroundColor: activeDeckId === deck.id ? 'var(--accent-primary-light)' : 'var(--bg-surface)',
              color: activeDeckId === deck.id ? 'var(--accent-primary)' : 'var(--text-primary)',
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              minWidth: '220px',
              transition: 'all var(--transition-fast)'
            }}
          >
            <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{deck.title}</div>
            <div style={{ fontSize: '0.725rem', color: 'var(--text-secondary)' }}>
              {deck.cards.length} cards • {deck.course}
            </div>
          </button>
        ))}
      </div>

      {/* Main Flashcard Card Area */}
      {activeDeck && activeDeck.cards.length > 0 && !isCompleted ? (
        <FlashcardCard
          card={activeDeck.cards[currentCardIndex]}
          currentIndex={currentCardIndex}
          totalCards={activeDeck.cards.length}
          onRateConfidence={handleRateConfidence}
        />
      ) : (
        /* Deck Completed State */
        <div
          className="card"
          style={{
            maxWidth: '580px',
            margin: '0 auto',
            padding: '40px 24px',
            textAlign: 'center',
            backgroundColor: 'var(--bg-surface)'
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-success-subtle)',
              color: 'var(--color-success)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}
          >
            <CheckCircle2 size={32} />
          </div>

          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '6px' }}>
            Deck Review Complete!
          </h3>
          <p style={{ fontSize: '0.84375rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>
            You've reviewed all cards in <strong>{activeDeck?.title}</strong>. Your spaced repetition intervals have been recalculated.
          </p>

          <button onClick={handleResetDeck} className="btn btn-primary btn-md" style={{ gap: '6px' }}>
            <RotateCcw size={16} />
            <span>Practice Deck Again</span>
          </button>
        </div>
      )}
    </div>
  );
};
