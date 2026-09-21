import React from 'react';
import { FileText, ExternalLink, Bookmark } from 'lucide-react';
import { SourceReference as SourceRefType } from '../../types/chat';
import { useApp } from '../../context/AppContext';

interface SourceReferenceProps {
  source: SourceRefType;
  compact?: boolean;
}

export const SourceReference: React.FC<SourceReferenceProps> = ({ source, compact = false }) => {
  const { openDocumentViewer } = useApp();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (source.documentId) {
      openDocumentViewer(source.documentId, source.page || 1);
    }
  };

  if (compact) {
    return (
      <button
        onClick={handleClick}
        className="badge badge-primary"
        title={source.snippet}
        style={{
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          fontWeight: 600,
          fontSize: '0.75rem',
          padding: '2px 7px',
          margin: '0 2px',
          verticalAlign: 'middle',
          transition: 'all 0.15s ease'
        }}
      >
        <FileText size={11} />
        <span>{source.filename || source.documentTitle}</span>
        {source.page && <span style={{ opacity: 0.8 }}>p. {source.page}</span>}
      </button>
    );
  }

  return (
    <div
      onClick={handleClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        padding: '10px 12px',
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        cursor: 'pointer',
        transition: 'all var(--transition-fast)',
        boxShadow: 'var(--shadow-xs)'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--accent-primary-border)';
        e.currentTarget.style.transform = 'translateY(-1px)';
        e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-subtle)';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'var(--shadow-xs)';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
          <FileText size={14} color="var(--accent-primary)" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {source.filename || source.documentTitle}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          {source.page && (
            <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>
              Page {source.page}
            </span>
          )}
          <ExternalLink size={12} color="var(--text-tertiary)" />
        </div>
      </div>

      {source.snippet && (
        <div style={{
          fontSize: '0.75rem',
          color: 'var(--text-secondary)',
          lineHeight: 1.45,
          fontStyle: 'italic',
          borderLeft: '2px solid var(--accent-primary-border)',
          paddingLeft: '8px',
          marginTop: '2px',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        }}>
          "{source.snippet}"
        </div>
      )}

      {source.confidence && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            <Bookmark size={10} color="var(--color-success)" /> Verified Citation
          </span>
          <span style={{ fontFamily: 'var(--font-mono)' }}>{Math.round(source.confidence * 100)}% match</span>
        </div>
      )}
    </div>
  );
};
