import React, { useState, useEffect } from 'react';
import { Layers, RotateCcw, Plus, CheckCircle2, Trash2, BookOpen, Sparkles } from 'lucide-react';
import { flashcardService } from '../services/flashcardService';
import { Flashcard, FlashcardConfidence, FlashcardDeck } from '../types/flashcard';
import { FlashcardCard } from '../components/flashcards/FlashcardCard';
import { CreateFlashcardModal } from '../components/flashcards/CreateFlashcardModal';
import { useToast } from '../context/ToastContext';

export const FlashcardsScreen: React.FC = () => {
  const { showToast } = useToast();
  const [decks, setDecks] = useState<FlashcardDeck[]>([]);
  const [activeDeckId, setActiveDeckId] = useState<string>('deck-os');
  const [currentCardIndex, setCurrentCardIndex] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    flashcardService.getDecks().then(res => {
      if (res.success) {
        setDecks(res.data);
        if (res.data.length > 0) setActiveDeckId(res.data[0].id);
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

  const handleCreateDeck = async (topic: string, cardCount: number) => {
    setIsCreating(true);
    try {
      const res = await flashcardService.generateDeckForTopic(topic, cardCount);
      if (res.success && res.data) {
        const allDecks = await flashcardService.getDecks();
        if (allDecks.success) setDecks(allDecks.data);
        setActiveDeckId(res.data.id);
        setCurrentCardIndex(0);
        setIsCompleted(false);
        setIsModalOpen(false);
        showToast('Deck Created!', `"${res.data.title}" is ready to study.`, 'success');
      }
    } catch (err) {
      showToast('Error', 'Failed to generate deck. Please try again.', 'error');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteDeck = async (deckId: string, deckTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const res = await flashcardService.deleteDeck(deckId);
    if (res.success) {
      const updated = decks.filter(d => d.id !== deckId);
      setDecks(updated);
      if (activeDeckId === deckId && updated.length > 0) {
        setActiveDeckId(updated[0].id);
        setCurrentCardIndex(0);
        setIsCompleted(false);
      }
      showToast('Deck Deleted', `"${deckTitle}" has been removed.`, 'info');
    }
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

        {/* Create new deck button */}
        <button
          onClick={() => setIsModalOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: 'var(--radius-lg)',
            border: 'none',
            background: 'linear-gradient(135deg, var(--color-purple) 0%, var(--accent-primary) 100%)',
            color: '#fff',
            fontWeight: 700,
            fontSize: '0.875rem',
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(139, 92, 246, 0.35)',
            whiteSpace: 'nowrap',
            transition: 'all var(--transition-fast)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
        >
          <Plus size={16} />
          Create New Deck
        </button>
      </div>

      {/* Empty state */}
      {decks.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: '64px 32px',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-xl)',
            border: '1.5px dashed var(--border-subtle)',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-purple-subtle)',
              color: 'var(--color-purple)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <Sparkles size={28} />
          </div>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
            No Flashcard Decks Yet
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>
            Create your first AI-powered deck on any topic you want to master.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn btn-primary btn-md"
            style={{ gap: '6px', margin: '0 auto' }}
          >
            <Plus size={16} />
            Create First Deck
          </button>
        </div>
      )}

      {/* Deck Selector Tabs */}
      {decks.length > 0 && (
        <div style={{ display: 'flex', gap: '10px', marginBottom: '28px', overflowX: 'auto', paddingBottom: '4px' }}>
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
                border: `1.5px solid ${activeDeckId === deck.id ? 'var(--color-purple)' : 'var(--border-subtle)'}`,
                backgroundColor: activeDeckId === deck.id ? 'var(--color-purple-subtle)' : 'var(--bg-surface)',
                color: activeDeckId === deck.id ? 'var(--color-purple)' : 'var(--text-primary)',
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                minWidth: '220px',
                transition: 'all var(--transition-fast)',
                position: 'relative',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '6px' }}>
                <div style={{ fontWeight: 700, fontSize: '0.875rem', lineHeight: 1.3 }}>{deck.title}</div>
                <button
                  onClick={(e) => handleDeleteDeck(deck.id, deck.title, e)}
                  title="Delete deck"
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '2px',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    flexShrink: 0,
                    marginTop: '1px',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-error)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                >
                  <Trash2 size={13} />
                </button>
              </div>
              <div style={{ fontSize: '0.725rem', color: 'var(--text-secondary)' }}>
                {deck.cards.length} cards • {deck.course}
              </div>
            </button>
          ))}

          {/* Add new deck quick-action tab */}
          <button
            onClick={() => setIsModalOpen(true)}
            style={{
              padding: '12px 20px',
              borderRadius: 'var(--radius-lg)',
              border: '1.5px dashed var(--border-subtle)',
              backgroundColor: 'transparent',
              color: 'var(--text-muted)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              minWidth: '120px',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-purple)';
              e.currentTarget.style.color = 'var(--color-purple)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-subtle)';
              e.currentTarget.style.color = 'var(--text-muted)';
            }}
          >
            <Plus size={18} />
            <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>New Deck</span>
          </button>
        </div>
      )}

      {/* Main Flashcard Card Area */}
      {activeDeck && activeDeck.cards.length > 0 && !isCompleted ? (
        <FlashcardCard
          card={activeDeck.cards[currentCardIndex]}
          currentIndex={currentCardIndex}
          totalCards={activeDeck.cards.length}
          onRateConfidence={handleRateConfidence}
          onNext={() => setCurrentCardIndex(prev => Math.min(prev + 1, activeDeck.cards.length - 1))}
          onPrev={() => setCurrentCardIndex(prev => Math.max(prev - 1, 0))}
          hasNext={currentCardIndex < activeDeck.cards.length - 1}
          hasPrev={currentCardIndex > 0}
        />
      ) : activeDeck ? (
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

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={handleResetDeck} className="btn btn-primary btn-md" style={{ gap: '6px' }}>
              <RotateCcw size={16} />
              <span>Practice Deck Again</span>
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="btn btn-secondary btn-md"
              style={{ gap: '6px' }}
            >
              <Plus size={16} />
              <span>Create New Deck</span>
            </button>
          </div>
        </div>
      ) : null}

      {/* Create Flashcard Modal */}
      <CreateFlashcardModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={handleCreateDeck}
        isCreating={isCreating}
      />

      <style>{`
        @keyframes modalSlideIn {
          from { opacity: 0; transform: translateY(-16px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
