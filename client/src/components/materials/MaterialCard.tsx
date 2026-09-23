import React, { useState } from 'react';
import {
  FileText,
  Image as ImageIcon,
  Sparkles,
  HelpCircle,
  Layers,
  MoreVertical,
  BookOpen,
  Calendar,
  CheckCircle,
  Trash2,
  Network
} from 'lucide-react';
import { MaterialSource } from '../../types/material';
import { useApp } from '../../context/AppContext';
import { ConceptDiagramModal } from '../multimodal/ConceptDiagramModal';

interface MaterialCardProps {
  material: MaterialSource;
  onDelete?: (id: string) => void;
}

export const MaterialCard: React.FC<MaterialCardProps> = ({ material, onDelete }) => {
  const { openDocumentViewer, startQuiz, setCurrentRoute, setPrefilledPrompt, deleteMaterial } = useApp();
  const [showDiagramModal, setShowDiagramModal] = useState(false);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(material.id);
    } else {
      deleteMaterial(material.id);
    }
  };

  const handleAskAI = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentRoute('ai-tutor');
    setPrefilledPrompt(`Summarize key concepts from ${material.filename}`);
  };

  const handleCreateQuiz = (e: React.MouseEvent) => {
    e.stopPropagation();
    startQuiz({
      sourceId: material.id,
      course: material.course,
      questionCount: 5,
      difficulty: 'intermediate',
      questionType: 'all'
    });
  };

  const handleOpenDoc = () => {
    if (material.type === 'image') {
      setCurrentRoute('image-analysis');
    } else {
      openDocumentViewer(material.id);
    }
  };

  const getCourseBadgeColor = (course: MaterialSource['course']) => {
    switch (course) {
      case 'Operating Systems': return 'badge-primary';
      case 'Machine Learning': return 'badge-purple';
      case 'DBMS': return 'badge-warning';
      case 'Java OOP': return 'badge-success';
      default: return 'badge-neutral';
    }
  };

  return (
    <div
      className="card card-hover card-interactive"
      onClick={handleOpenDoc}
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        minHeight: '190px'
      }}
    >
      <div>
        {/* Top meta line */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                backgroundColor: material.type === 'image' ? 'var(--color-purple-subtle)' : 'var(--accent-primary-light)',
                color: material.type === 'image' ? 'var(--color-purple)' : 'var(--accent-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {material.type === 'image' ? <ImageIcon size={16} /> : <FileText size={16} />}
            </div>
            <span className={`badge ${getCourseBadgeColor(material.course)}`}>
              {material.course}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>
              <CheckCircle size={10} /> Indexed
            </span>
            <button
              onClick={handleDelete}
              className="btn btn-ghost btn-sm"
              style={{ padding: '4px 6px', color: '#ef4444', borderRadius: '4px' }}
              title="Remove Material"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* File Title */}
        <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px', lineHeight: 1.3 }}>
          {material.title}
        </h4>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.725rem', color: 'var(--text-tertiary)', marginBottom: '8px' }}>
          <span>{material.filename}</span>
          <span>•</span>
          <span>{material.pagesCount ? `${material.pagesCount} pages` : material.size}</span>
          <span>•</span>
          <span>{material.uploadDate}</span>
        </div>

        {/* Topic tags */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '12px' }}>
          {material.topics.slice(0, 3).map((topic, tIdx) => (
            <span
              key={tIdx}
              className="badge badge-neutral"
              style={{ fontSize: '0.6875rem', padding: '1px 6px' }}
            >
              {topic}
            </span>
          ))}
          {material.topics.length > 3 && (
            <span className="badge badge-neutral" style={{ fontSize: '0.6875rem', padding: '1px 6px' }}>
              +{material.topics.length - 3}
            </span>
          )}
        </div>
      </div>

      {/* Action Footer */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: '10px',
          borderTop: '1px solid var(--border-subtle)',
          gap: '6px'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleAskAI}
          className="btn btn-secondary btn-sm"
          style={{ flex: 1, padding: '5px 8px', fontSize: '0.75rem', gap: '4px' }}
        >
          <Sparkles size={12} color="var(--accent-primary)" />
          <span>Ask AI</span>
        </button>

        <button
          onClick={handleCreateQuiz}
          className="btn btn-secondary btn-sm"
          style={{ flex: 1, padding: '5px 8px', fontSize: '0.75rem', gap: '4px' }}
        >
          <HelpCircle size={12} color="var(--color-warning)" />
          <span>Quiz</span>
        </button>

        <button
          onClick={(e) => { e.stopPropagation(); setShowDiagramModal(true); }}
          className="btn btn-secondary btn-sm"
          style={{ flex: 1, padding: '5px 8px', fontSize: '0.75rem', gap: '4px' }}
          title="Generate concept diagram from this material"
        >
          <Network size={12} color="var(--color-purple)" />
          <span>Diagram</span>
        </button>

        <button
          onClick={handleOpenDoc}
          className="btn btn-subtle btn-sm"
          style={{ padding: '5px 8px', fontSize: '0.75rem', gap: '4px' }}
        >
          <BookOpen size={12} />
          <span>Open</span>
        </button>
      </div>

      {/* Concept Diagram Modal */}
      {showDiagramModal && (
        <ConceptDiagramModal
          isOpen={showDiagramModal}
          onClose={() => setShowDiagramModal(false)}
          textContent={material.textContent || material.contentPreview || material.topics.join(', ')}
          topic={material.topics[0] || material.title}
          filename={material.filename}
        />
      )}
    </div>
  );
};
