
import React from 'react';
import { Sparkles, Layers, HelpCircle, Copy, Check } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';

interface SelectionActionHUDProps {
  selectedText: string;
  position: { x: number; y: number };
  onClose: () => void;
}

export const SelectionActionHUD: React.FC<SelectionActionHUDProps> = ({
  selectedText,
  position,
  onClose
}) => {
  const { setCurrentRoute, setPrefilledPrompt, startQuiz } = useApp();
  const { showToast } = useToast();

  const handleExplain = () => {
    setCurrentRoute('ai-tutor');
    setPrefilledPrompt(`Explain this passage from my notes: "${selectedText}"`);
    onClose();
  };

  const handleMakeFlashcard = () => {
    setCurrentRoute('flashcards');
    showToast('Flashcard Generated', `Created new spaced repetition card for: "${selectedText.slice(0, 30)}..."`, 'success');
    onClose();
  };

  const handleCreateQuiz = () => {
    startQuiz({
      topic: selectedText.slice(0, 40),
      questionCount: 5,
      difficulty: 'intermediate',
      questionType: 'all'
    });
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        left: `${Math.max(20, Math.min(position.x - 140, window.innerWidth - 320))}px`,
        top: `${Math.max(70, position.y - 48)}px`,
        zIndex: 500,
        backgroundColor: 'var(--bg-sidebar)',
        borderRadius: 'var(--radius-lg)',
        padding: '4px 6px',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        boxShadow: 'var(--shadow-lg)',
        border: '1px solid var(--border-sidebar)',
        animation: 'scaleUp 140ms ease'
      }}
    >
      <button
        onClick={handleExplain}
        className="btn btn-ghost btn-sm"
        style={{ color: '#ffffff', gap: '4px', fontSize: '0.75rem', padding: '4px 8px' }}
      >
        <Sparkles size={13} color="var(--accent-primary-border)" />
        <span>Explain this</span>
      </button>

      <div style={{ width: '1px', height: '16px', backgroundColor: 'var(--border-sidebar)' }} />

      <button
        onClick={handleMakeFlashcard}
        className="btn btn-ghost btn-sm"
        style={{ color: '#ffffff', gap: '4px', fontSize: '0.75rem', padding: '4px 8px' }}
      >
        <Layers size={13} color="#c084fc" />
        <span>Make Flashcard</span>
      </button>

      <div style={{ width: '1px', height: '16px', backgroundColor: 'var(--border-sidebar)' }} />

      <button
        onClick={handleCreateQuiz}
        className="btn btn-ghost btn-sm"
        style={{ color: '#ffffff', gap: '4px', fontSize: '0.75rem', padding: '4px 8px' }}
      >
        <HelpCircle size={13} color="#fcd34d" />
        <span>Create Quiz</span>
      </button>
    </div>
    
  );
};
