import React from 'react';
import { BookOpen, FileText, CheckCircle2, Cpu, ExternalLink, HelpCircle, ArrowUpRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SourceReference as SourceRefType } from '../../types/chat';

interface GroundingContextPanelProps {
  recentSources: SourceRefType[];
}

export const GroundingContextPanel: React.FC<GroundingContextPanelProps> = ({ recentSources }) => {
  const { materials, openDocumentViewer, startQuiz } = useApp();

  const handleLaunchQuiz = () => {
    startQuiz({
      course: 'Operating Systems',
      topic: 'Deadlock',
      questionCount: 5,
      difficulty: 'intermediate',
      questionType: 'all'
    });
  };

  return (
    <aside
      style={{
        width: '320px',
        backgroundColor: 'var(--bg-surface)',
        borderLeft: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflowY: 'auto',
        padding: '16px'
      }}
    >
      {/* Panel Header */}
      <div style={{ marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Knowledge Grounding
          </h3>
          <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>
            <CheckCircle2 size={10} /> Active RAG
          </span>
        </div>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
          Verified documents and citations powering the agent's reasoning.
        </p>
      </div>

      {/* RAG Agent Flow Card */}
      <div
        style={{
          backgroundColor: 'var(--bg-surface-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '10px 12px',
          border: '1px solid var(--border-subtle)',
          marginBottom: '16px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>
          <Cpu size={14} color="var(--accent-primary)" />
          <span>Multimodal Ingestion Pipeline</span>
        </div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: '4px', lineHeight: 1.4 }}>
          OCR Chunking → Semantic Embeddings → Vector Match → LLM Synthesis
        </div>
      </div>

      {/* Recent Citations in Session */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
          Active Session Citations ({recentSources.length})
        </div>

        {recentSources.length === 0 ? (
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '8px 0' }}>
            Ask a question to see citations grounded in your materials.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {recentSources.map((src) => (
              <div
                key={src.id}
                onClick={() => openDocumentViewer(src.documentId, src.page || 1)}
                style={{
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--bg-surface-subtle)',
                  border: '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  transition: 'all var(--transition-fast)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent-primary-border)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{src.filename}</span>
                  {src.page && <span className="badge badge-neutral" style={{ fontSize: '0.65rem' }}>p. {src.page}</span>}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px', lineClamp: 2, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {src.snippet}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pinned Library Materials */}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
          Indexed Course Library ({materials.length})
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {materials.slice(0, 5).map((mat) => (
            <div
              key={mat.id}
              onClick={() => openDocumentViewer(mat.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '7px 8px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--bg-surface-subtle)',
                fontSize: '0.75rem',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                <FileText size={13} color="var(--accent-primary)" />
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {mat.filename}
                </span>
              </div>
              <ArrowUpRight size={12} color="var(--text-muted)" />
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Practice Trigger */}
      <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
        <button
          onClick={handleLaunchQuiz}
          className="btn btn-secondary btn-sm"
          style={{ width: '100%', justifyContent: 'center', fontSize: '0.75rem', gap: '6px' }}
        >
          <HelpCircle size={13} color="var(--color-warning)" />
          <span>Create Practice Quiz</span>
        </button>
      </div>
    </aside>
  );
};
