import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  Loader2,
  Sparkles,
  GitBranch,
  Download,
  RefreshCw,
  Network,
  BookOpen,
  AlertTriangle
} from 'lucide-react';
import mermaid from 'mermaid';
import { multimodalVisionService } from '../../services/multimodalVisionService';

interface ConceptDiagramModalProps {
  isOpen: boolean;
  onClose: () => void;
  textContent: string;
  topic?: string;
  filename?: string;
}

// Initialize mermaid with dark theme
mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  securityLevel: 'loose',
  flowchart: {
    useMaxWidth: true,
    htmlLabels: true,
    curve: 'basis'
  },
  fontFamily: 'Inter, system-ui, sans-serif'
});

export const ConceptDiagramModal: React.FC<ConceptDiagramModalProps> = ({
  isOpen,
  onClose,
  textContent,
  topic,
  filename
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [mermaidCode, setMermaidCode] = useState<string | null>(null);
  const [diagramTitle, setDiagramTitle] = useState<string>('');
  const [diagramDescription, setDiagramDescription] = useState<string>('');
  const [renderError, setRenderError] = useState<string | null>(null);
  const [diagramType, setDiagramType] = useState<string>('flowchart');
  const [customTopic, setCustomTopic] = useState<string>(topic || '');
  const diagramContainerRef = useRef<HTMLDivElement>(null);

  // Generate diagram
  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    setRenderError(null);
    try {
      const result = await multimodalVisionService.generateDiagramFromText(
        textContent,
        customTopic || topic,
        diagramType
      );
      setMermaidCode(result.mermaid_code);
      setDiagramTitle(result.title);
      setDiagramDescription(result.description);
    } catch (err: any) {
      setRenderError(err?.message || 'Failed to generate diagram.');
    } finally {
      setIsGenerating(false);
    }
  }, [textContent, topic, customTopic, diagramType]);

  // Auto-generate on open
  useEffect(() => {
    if (isOpen && !mermaidCode && !isGenerating) {
      handleGenerate();
    }
  }, [isOpen]);

  // Render mermaid when code changes
  useEffect(() => {
    if (!mermaidCode || !diagramContainerRef.current) return;

    const renderDiagram = async () => {
      try {
        // Clear previous
        diagramContainerRef.current!.innerHTML = '';
        setRenderError(null);

        const uniqueId = `mermaid-${Date.now()}`;
        const { svg } = await mermaid.render(uniqueId, mermaidCode);
        if (diagramContainerRef.current) {
          diagramContainerRef.current.innerHTML = svg;
          // Style the SVG to fit
          const svgEl = diagramContainerRef.current.querySelector('svg');
          if (svgEl) {
            svgEl.style.maxWidth = '100%';
            svgEl.style.height = 'auto';
            svgEl.style.borderRadius = '8px';
          }
        }
      } catch (err: any) {
        console.warn('Mermaid render error:', err);
        setRenderError('Failed to render diagram. The generated syntax may be invalid. Try regenerating.');
        // Show code as fallback
        if (diagramContainerRef.current) {
          diagramContainerRef.current.innerHTML = `<pre style="color:#a1a1aa;font-size:0.8rem;white-space:pre-wrap;padding:16px;background:#1e1e2e;border-radius:8px;">${mermaidCode}</pre>`;
        }
      }
    };

    renderDiagram();
  }, [mermaidCode]);

  // Download SVG
  const handleDownloadSVG = () => {
    if (!diagramContainerRef.current) return;
    const svg = diagramContainerRef.current.querySelector('svg');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(diagramTitle || 'concept-diagram').replace(/[^a-zA-Z0-9]/g, '_')}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 200,
        padding: '20px'
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '820px',
          maxHeight: '92vh',
          overflowY: 'auto',
          padding: '28px',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          boxShadow: '0 24px 48px -12px rgba(0,0,0,0.4)',
          borderRadius: '20px'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)'
              }}
            >
              <Network size={22} color="#ffffff" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Concept Diagram Generator
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
                {filename ? `From: ${filename}` : 'Visualize concepts with AI-generated diagrams'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ padding: '6px' }}>
            <X size={20} />
          </button>
        </div>

        {/* Controls Row */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: '12px',
          marginBottom: '20px',
          padding: '16px',
          backgroundColor: 'var(--bg-surface-subtle)',
          borderRadius: '12px',
          border: '1px solid var(--border-subtle)',
          flexWrap: 'wrap'
        }}>
          <div style={{ flex: '1 1 200px' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Focus Topic
            </label>
            <input
              type="text"
              className="input-text"
              placeholder="e.g. Deadlock Prevention, Binary Search"
              value={customTopic}
              onChange={(e) => setCustomTopic(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ flex: '0 0 160px' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Diagram Style
            </label>
            <select
              className="input-text"
              value={diagramType}
              onChange={(e) => setDiagramType(e.target.value)}
              style={{ width: '100%' }}
            >
              <option value="flowchart">Flowchart</option>
              <option value="mindmap">Mind Map</option>
              <option value="sequence">Sequence</option>
              <option value="class">Class Diagram</option>
            </select>
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="btn btn-primary btn-md"
            style={{ gap: '6px', flexShrink: 0 }}
          >
            {isGenerating ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Generating...</span>
              </>
            ) : mermaidCode ? (
              <>
                <RefreshCw size={16} />
                <span>Regenerate</span>
              </>
            ) : (
              <>
                <Sparkles size={16} />
                <span>Generate Diagram</span>
              </>
            )}
          </button>
        </div>

        {/* Render Error */}
        {renderError && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 14px',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            marginBottom: '16px',
            fontSize: '0.8125rem',
            color: '#ef4444'
          }}>
            <AlertTriangle size={16} />
            <span>{renderError}</span>
          </div>
        )}

        {/* Diagram Title & Description */}
        {diagramTitle && !isGenerating && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <GitBranch size={16} color="var(--accent-primary)" />
                <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  {diagramTitle}
                </h4>
              </div>
              {mermaidCode && (
                <button
                  onClick={handleDownloadSVG}
                  className="btn btn-secondary btn-sm"
                  style={{ gap: '6px' }}
                  title="Download as SVG"
                >
                  <Download size={14} />
                  <span>SVG</span>
                </button>
              )}
            </div>
            {diagramDescription && (
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                {diagramDescription}
              </p>
            )}
          </div>
        )}

        {/* Diagram Canvas */}
        <div
          style={{
            minHeight: '300px',
            backgroundColor: '#0f0f23',
            borderRadius: '14px',
            padding: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(255,255,255,0.06)',
            boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.3)',
            overflow: 'auto'
          }}
        >
          {isGenerating ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.2), rgba(37, 99, 235, 0.2))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px'
                }}
              >
                <Loader2 size={28} color="#7c3aed" className="animate-spin" />
              </div>
              <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#a1a1aa' }}>
                Generating concept diagram...
              </p>
              <p style={{ fontSize: '0.75rem', color: '#71717a', marginTop: '4px' }}>
                AI is analyzing the text and building a visual representation
              </p>
            </div>
          ) : mermaidCode ? (
            <div ref={diagramContainerRef} style={{ width: '100%', textAlign: 'center' }} />
          ) : (
            <div style={{ textAlign: 'center', color: '#71717a' }}>
              <BookOpen size={36} style={{ marginBottom: '8px', opacity: 0.5 }} />
              <p style={{ fontSize: '0.875rem' }}>Diagram will appear here</p>
            </div>
          )}
        </div>

        {/* Mermaid Source Code (collapsible) */}
        {mermaidCode && !isGenerating && (
          <details style={{ marginTop: '16px' }}>
            <summary style={{
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '8px 0'
            }}>
              View Mermaid Source Code
            </summary>
            <pre style={{
              backgroundColor: 'var(--bg-surface-subtle)',
              padding: '14px',
              borderRadius: '8px',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.75rem',
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-secondary)',
              overflowX: 'auto',
              whiteSpace: 'pre-wrap',
              maxHeight: '200px'
            }}>
              {mermaidCode}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
};
