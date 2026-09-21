import React, { useState } from 'react';
import {
  Sparkles,
  User,
  Copy,
  Check,
  FileText,
  Image as ImageIcon,
  ArrowRight,
  HelpCircle,
  Layers,
  BookOpen,
  Eye
} from 'lucide-react';
import { ChatMessage as ChatMessageType } from '../../types/chat';
import { AgentActivityTimeline } from './AgentActivityTimeline';
import { SourceReference } from '../common/SourceReference';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';

interface ChatMessageProps {
  message: ChatMessageType;
  onExecuteAction?: (action: NonNullable<ChatMessageType['suggestedActions']>[0]) => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, onExecuteAction }) => {
  const isUser = message.role === 'user';
  const { startQuiz, openDocumentViewer, setCurrentRoute } = useApp();
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    showToast('Copied to clipboard', 'Response text ready to paste', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAction = (action: NonNullable<ChatMessageType['suggestedActions']>[0]) => {
    if (onExecuteAction) {
      onExecuteAction(action);
      return;
    }

    if (action.actionType === 'create_quiz') {
      startQuiz({
        course: action.payload?.course || 'Operating Systems',
        topic: action.payload?.topic || 'Deadlock',
        questionCount: action.payload?.count || 5,
        difficulty: 'intermediate',
        questionType: 'all'
      });
    } else if (action.actionType === 'create_flashcards') {
      setCurrentRoute('flashcards');
    } else if (action.actionType === 'open_source') {
      if (action.payload?.documentId) {
        openDocumentViewer(action.payload.documentId, action.payload.page || 1);
      } else if (action.payload?.diagram) {
        setCurrentRoute('image-analysis');
      }
    }
  };

  // Helper to render bold markdown and paragraphs cleanly
  const renderFormattedContent = (content: string) => {
    return content.split('\n\n').map((paragraph, pIdx) => {
      // Check if heading
      if (paragraph.startsWith('### ')) {
        return (
          <h4 key={pIdx} style={{ fontSize: '0.95rem', fontWeight: 700, margin: '12px 0 6px', color: 'var(--text-primary)' }}>
            {paragraph.replace('### ', '')}
          </h4>
        );
      }

      // Check if unordered list
      if (paragraph.includes('\n- ') || paragraph.startsWith('- ') || paragraph.includes('\n1. ')) {
        const lines = paragraph.split('\n');
        return (
          <ul key={pIdx} style={{ margin: '6px 0', paddingLeft: '20px', listStyleType: 'disc' }}>
            {lines.map((line, lIdx) => {
              const clean = line.replace(/^-\s+|\d+\.\s+/, '');
              return (
                <li key={lIdx} style={{ margin: '3px 0', fontSize: '0.875rem', lineHeight: 1.5 }}>
                  <span dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(clean) }} />
                </li>
              );
            })}
          </ul>
        );
      }

      return (
        <p key={pIdx} style={{ margin: '6px 0', fontSize: '0.875rem', lineHeight: 1.6 }}
           dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(paragraph) }}
        />
      );
    });
  };

  const formatInlineMarkdown = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code style="background-color: var(--bg-surface-subtle); padding: 1px 4px; border-radius: 4px; font-family: var(--font-mono); font-size: 0.8125rem;">$1</code>');
  };

  return (
    <div
      style={{
        display: 'flex',
        gap: '14px',
        padding: '16px 20px',
        borderBottom: '1px solid var(--border-subtle)',
        backgroundColor: isUser ? 'transparent' : 'var(--bg-surface)',
        animation: 'fadeIn 180ms ease'
      }}
    >
      {/* Avatar */}
      <div
        style={{
          width: '30px',
          height: '30px',
          borderRadius: isUser ? '50%' : '8px',
          backgroundColor: isUser ? 'var(--bg-sidebar-surface)' : 'var(--accent-primary-light)',
          color: isUser ? 'var(--text-sidebar-primary)' : 'var(--accent-primary)',
          border: isUser ? '1px solid var(--border-sidebar)' : '1px solid var(--accent-primary-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          marginTop: '2px'
        }}
      >
        {isUser ? <User size={16} /> : <Sparkles size={16} />}
      </div>

      {/* Message Content Container */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Header line */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: 600, fontSize: '0.84375rem', color: 'var(--text-primary)' }}>
              {isUser ? 'You' : 'CogniLens Agent'}
            </span>
            <span style={{ fontSize: '0.725rem', color: 'var(--text-tertiary)' }}>
              {message.timestamp}
            </span>
            {!isUser && (
              <span className="badge badge-primary" style={{ fontSize: '0.65rem', padding: '1px 6px' }}>
                Grounded Azure AI
              </span>
            )}
          </div>

          {!isUser && (
            <button
              onClick={handleCopy}
              className="btn btn-ghost btn-sm"
              style={{ padding: '3px 6px', color: 'var(--text-tertiary)', fontSize: '0.725rem' }}
              title="Copy message"
            >
              {copied ? <Check size={13} color="var(--color-success)" /> : <Copy size={13} />}
            </button>
          )}
        </div>

        {/* User Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
            {message.attachments.map((att) => (
              <div
                key={att.id}
                className="badge badge-neutral"
                style={{ padding: '4px 8px', gap: '6px', fontSize: '0.75rem', borderRadius: '6px' }}
              >
                {att.type === 'pdf' ? <FileText size={13} color="var(--accent-primary)" /> : <ImageIcon size={13} color="var(--color-purple)" />}
                <span>{att.name}</span>
              </div>
            ))}
          </div>
        )}

        {/* Agent Task Activity Timeline (if present) */}
        {message.agentActivity && (
          <AgentActivityTimeline activity={message.agentActivity} />
        )}

        {/* Main Text Content */}
        <div style={{ color: 'var(--text-primary)', wordBreak: 'break-word' }}>
          {renderFormattedContent(message.content)}
        </div>

        {/* Sources Section */}
        {message.sources && message.sources.length > 0 && (
          <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
              Verified Sources & Citations ({message.sources.length})
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '8px' }}>
              {message.sources.map((src) => (
                <SourceReference key={src.id} source={src} />
              ))}
            </div>
          </div>
        )}

        {/* Suggested Next Steps / Actions */}
        {message.suggestedActions && message.suggestedActions.length > 0 && (
          <div style={{ marginTop: '14px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {message.suggestedActions.map((act) => (
              <button
                key={act.id}
                onClick={() => handleAction(act)}
                className="btn btn-secondary btn-sm"
                style={{
                  gap: '6px',
                  backgroundColor: 'var(--bg-surface-subtle)',
                  borderColor: 'var(--border-subtle)',
                  fontSize: '0.785rem'
                }}
              >
                {act.actionType === 'create_quiz' && <HelpCircle size={13} color="var(--color-warning)" />}
                {act.actionType === 'create_flashcards' && <Layers size={13} color="var(--color-purple)" />}
                {act.actionType === 'open_source' && <BookOpen size={13} color="var(--accent-primary)" />}
                {act.actionType === 'explain_further' && <ArrowRight size={13} color="var(--accent-primary)" />}
                <span>{act.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
