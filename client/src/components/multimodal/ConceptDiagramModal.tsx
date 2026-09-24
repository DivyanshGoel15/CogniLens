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
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Copy,
  Check,
  Cpu,
  Layers,
  Activity,
  ArrowRightLeft,
  Share2,
  Lightbulb,
  MessageSquare,
  Send,
  Mic,
  MicOff,
  HelpCircle
} from 'lucide-react';
import mermaid from 'mermaid';
import { multimodalVisionService } from '../../services/multimodalVisionService';

export interface ConceptDiagramModalProps {
  isOpen: boolean;
  onClose: () => void;
  textContent: string;
  topic?: string;
  topics?: string[];
  filename?: string;
  initialDiagramType?: string;
}

// Initialize mermaid with dark theme and balanced render configurations
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
  topics = [],
  filename,
  initialDiagramType
}) => {
  // Determine initial recommended diagram type from topic
  const getRecommendedType = (currentTopic: string): string => {
    const t = currentTopic.toLowerCase();
    if (/(tcp|handshake|protocol|message|network|api|client|server|exchange|interaction|oauth)/.test(t)) {
      return 'sequence';
    }
    if (/(state|lifecycle|transition|phase|scheduler|process state|fsm|automata)/.test(t)) {
      return 'stateDiagram';
    }
    if (/(tree|graph|class|object|entity|schema|table|database|structure|oop)/.test(t)) {
      return 'class';
    }
    if (/(concept|overview|theory|principles|taxonomy|classification|hierarchy|taxonomy|fundamentals)/.test(t)) {
      return 'mindmap';
    }
    return 'flowchart';
  };

  const initialTopic = topic || topics[0] || 'Core Concept';
  const [customTopic, setCustomTopic] = useState<string>(initialTopic);
  const [diagramType, setDiagramType] = useState<string>(
    initialDiagramType || getRecommendedType(initialTopic)
  );
  const [direction, setDirection] = useState<'TD' | 'LR'>('TD');
  const [isGenerating, setIsGenerating] = useState(false);
  const [mermaidCode, setMermaidCode] = useState<string | null>(null);
  const [diagramTitle, setDiagramTitle] = useState<string>('');
  const [diagramDescription, setDiagramDescription] = useState<string>('');
  const [simplifiedExplanation, setSimplifiedExplanation] = useState<string | null>(null);
  const [keyTakeaways, setKeyTakeaways] = useState<string[]>([]);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [showCode, setShowCode] = useState<boolean>(false);
  const diagramContainerRef = useRef<HTMLDivElement>(null);

  // In-Diagram Q&A state
  const [questionText, setQuestionText] = useState<string>('');
  const [isAsking, setIsAsking] = useState<boolean>(false);
  const [qaAnswer, setQaAnswer] = useState<{
    answer: string;
    layman_explanation?: string;
    key_points: string[];
  } | null>(null);
  const [isListeningMic, setIsListeningMic] = useState<boolean>(false);
  const sttStopRef = useRef<(() => void) | null>(null);

  const handleAskDiagramQuestion = async (overrideQ?: string) => {
    const q = (overrideQ || questionText).trim();
    if (!q || isAsking) return;
    setIsAsking(true);
    try {
      const res = await multimodalVisionService.askDiagramQuestion({
        topic: customTopic || initialTopic,
        question: q,
        contextText: textContent,
        diagramCode: mermaidCode || undefined,
        isLayman: true
      });
      setQaAnswer(res);
      setQuestionText('');
    } catch (err: any) {
      console.error('Failed asking diagram question:', err);
    } finally {
      setIsAsking(false);
    }
  };

  const handleToggleMic = () => {
    if (isListeningMic) {
      if (sttStopRef.current) {
        sttStopRef.current();
        sttStopRef.current = null;
      }
      setIsListeningMic(false);
      return;
    }
    setIsListeningMic(true);
    const controller = multimodalVisionService.startSpeechRecognition(
      (spoken) => {
        setQuestionText(prev => prev ? `${prev} ${spoken}` : spoken);
      },
      () => {
        setIsListeningMic(false);
      },
      () => {
        setIsListeningMic(false);
      }
    );
    sttStopRef.current = controller.stop;
  };

  // Recommended type for the currently selected topic
  const recommendedType = getRecommendedType(customTopic || initialTopic);

  // Derive suggested topic pills from topics or text
  const topicPills = React.useMemo(() => {
    const list = [...topics];
    if (topic && !list.includes(topic)) list.unshift(topic);
    if (list.length === 0 && textContent) {
      // Extract brief topic phrases from text
      const extracted = textContent
        .split('\n')
        .map(l => l.replace(/^[- *•0-9.)]+/, '').trim())
        .filter(l => l.length >= 8 && l.length <= 40 && !l.startsWith('http'));
      if (extracted.length > 0) {
        list.push(...extracted.slice(0, 4));
      }
    }
    return Array.from(new Set(list)).slice(0, 6);
  }, [topics, topic, textContent]);

  // Generate diagram
  const handleGenerate = useCallback(async (overrideTopic?: string, overrideType?: string, overrideDir?: 'TD' | 'LR') => {
    setIsGenerating(true);
    setRenderError(null);
    const activeTopic = overrideTopic ?? customTopic ?? topic ?? 'Core Concept';
    const activeType = overrideType ?? diagramType;
    const activeDir = overrideDir ?? direction;

    try {
      const result = await multimodalVisionService.generateDiagramFromText(
        textContent,
        activeTopic,
        activeType,
        activeDir
      );
      setMermaidCode(result.mermaid_code);
      setDiagramTitle(result.title);
      setDiagramDescription(result.description);
      setSimplifiedExplanation(result.simplified_explanation || null);
      setKeyTakeaways(result.key_takeaways || []);
    } catch (err: any) {
      setRenderError(err?.message || 'Failed to generate diagram. Please retry.');
    } finally {
      setIsGenerating(false);
    }
  }, [textContent, topic, customTopic, diagramType, direction]);

  // Auto-generate on open
  useEffect(() => {
    if (isOpen && !mermaidCode && !isGenerating) {
      handleGenerate();
    }
  }, [isOpen]);

  // Render mermaid when code changes
  useEffect(() => {
    if (!mermaidCode || !diagramContainerRef.current) return;

    let isMounted = true;
    const renderDiagram = async () => {
      try {
        if (!diagramContainerRef.current) return;
        diagramContainerRef.current.innerHTML = '';
        setRenderError(null);

        // Sanitize code if needed
        const cleanCode = mermaidCode
          .replace(/```mermaid/g, '')
          .replace(/```/g, '')
          .trim();

        const uniqueId = `mermaid-${Date.now()}`;
        const { svg } = await mermaid.render(uniqueId, cleanCode);

        if (isMounted && diagramContainerRef.current) {
          diagramContainerRef.current.innerHTML = svg;
          const svgEl = diagramContainerRef.current.querySelector('svg');
          if (svgEl) {
            svgEl.style.maxWidth = '100%';
            svgEl.style.height = 'auto';
            svgEl.style.borderRadius = '10px';
            svgEl.style.transition = 'transform 0.2s ease-out';
          }
        }
      } catch (err: any) {
        console.warn('Mermaid render error:', err);
        if (isMounted) {
          setRenderError('Could not render syntax cleanly. Click Regenerate to refresh with auto-synthesizer.');
          if (diagramContainerRef.current) {
            diagramContainerRef.current.innerHTML = `<pre style="color:#a1a1aa;font-size:0.8rem;white-space:pre-wrap;padding:16px;background:#1e1e2e;border-radius:8px;">${mermaidCode}</pre>`;
          }
        }
      }
    };

    renderDiagram();
    return () => { isMounted = false; };
  }, [mermaidCode]);

  // Apply zoom level to rendered SVG
  useEffect(() => {
    if (!diagramContainerRef.current) return;
    const svgEl = diagramContainerRef.current.querySelector('svg');
    if (svgEl) {
      svgEl.style.transform = `scale(${zoomLevel})`;
      svgEl.style.transformOrigin = 'center top';
    }
  }, [zoomLevel]);

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

  // Copy code to clipboard
  const handleCopyCode = async () => {
    if (!mermaidCode) return;
    try {
      await navigator.clipboard.writeText(mermaidCode);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleSelectType = (newType: string) => {
    if (newType === diagramType) return;
    setDiagramType(newType);
    setZoomLevel(1);
    handleGenerate(customTopic, newType, direction);
  };

  const handleSelectPill = (pillTopic: string) => {
    setCustomTopic(pillTopic);
    const autoType = getRecommendedType(pillTopic);
    setDiagramType(autoType);
    setZoomLevel(1);
    handleGenerate(pillTopic, autoType, direction);
  };

  const handleToggleDirection = (newDir: 'TD' | 'LR') => {
    setDirection(newDir);
    setZoomLevel(1);
    handleGenerate(customTopic, diagramType, newDir);
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 5, 12, 0.78)',
        backdropFilter: 'blur(8px)',
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
          maxWidth: '960px',
          maxHeight: '94vh',
          overflowY: 'auto',
          padding: '28px',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          boxShadow: '0 30px 60px -12px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)',
          borderRadius: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '16px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 16px rgba(124, 58, 237, 0.35)'
              }}
            >
              <Network size={24} color="#ffffff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  Concept Diagram Generator
                </h3>
                <span
                  style={{
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    padding: '2px 8px',
                    borderRadius: '20px',
                    backgroundColor: 'rgba(124, 58, 237, 0.15)',
                    color: '#a78bfa',
                    border: '1px solid rgba(124, 58, 237, 0.3)'
                  }}
                >
                  Topic-Aligned
                </span>
              </div>
              <p style={{ fontSize: '0.78125rem', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                {filename ? `Material: ${filename}` : 'Converts dense study material into structured diagrams'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ padding: '8px', borderRadius: '10px' }}>
            <X size={20} />
          </button>
        </div>

        {/* Topic Pills Bar (if available) */}
        {topicPills.length > 0 && (
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Layers size={13} color="var(--accent-primary)" />
              <span>Explore Material Subtopics:</span>
            </div>
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'thin' }}>
              {topicPills.map((p, idx) => {
                const isActive = customTopic.toLowerCase() === p.toLowerCase();
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectPill(p)}
                    style={{
                      padding: '5px 12px',
                      fontSize: '0.75rem',
                      fontWeight: isActive ? 700 : 500,
                      borderRadius: '16px',
                      whiteSpace: 'nowrap',
                      cursor: 'pointer',
                      border: isActive ? '1px solid #7c3aed' : '1px solid var(--border-subtle)',
                      backgroundColor: isActive ? 'rgba(124, 58, 237, 0.18)' : 'var(--bg-surface-subtle)',
                      color: isActive ? '#a78bfa' : 'var(--text-secondary)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Diagram Type Switcher Tabs (5 distinct types) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Select Diagram Architecture & Paradigm:
            </label>
            {recommendedType === diagramType && (
              <span style={{ fontSize: '0.7rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Sparkles size={12} />
                <span>Recommended for this topic</span>
              </span>
            )}
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: '8px'
            }}
          >
            {[
              {
                id: 'flowchart',
                label: 'Flowchart',
                sub: 'Process & Logic Flow',
                icon: GitBranch
              },
              {
                id: 'mindmap',
                label: 'Mind Map',
                sub: 'Concept Hierarchy',
                icon: Network
              },
              {
                id: 'sequence',
                label: 'Sequence',
                sub: 'Actor Interactions',
                icon: ArrowRightLeft
              },
              {
                id: 'stateDiagram',
                label: 'State Machine',
                sub: 'Lifecycles & Triggers',
                icon: Activity
              },
              {
                id: 'class',
                label: 'Class Architecture',
                sub: 'Data Structures & Schema',
                icon: Cpu
              }
            ].map(typeItem => {
              const Icon = typeItem.icon;
              const isSelected = diagramType === typeItem.id;
              const isRec = recommendedType === typeItem.id;

              return (
                <button
                  key={typeItem.id}
                  type="button"
                  onClick={() => handleSelectType(typeItem.id)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    border: isSelected
                      ? '1px solid #7c3aed'
                      : isRec
                      ? '1px dashed rgba(16, 185, 129, 0.4)'
                      : '1px solid var(--border-subtle)',
                    backgroundColor: isSelected
                      ? 'rgba(124, 58, 237, 0.16)'
                      : 'var(--bg-surface-subtle)',
                    color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.18s ease',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Icon size={16} color={isSelected ? '#a78bfa' : '#94a3b8'} />
                      <span style={{ fontSize: '0.8125rem', fontWeight: isSelected ? 700 : 600 }}>
                        {typeItem.label}
                      </span>
                    </div>
                    {isRec && !isSelected && (
                      <span style={{ fontSize: '0.625rem', color: '#10b981', fontWeight: 700 }}>
                        TOPIC FIT
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                    {typeItem.sub}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Input & Action Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 16px',
            backgroundColor: 'var(--bg-surface-subtle)',
            borderRadius: '14px',
            border: '1px solid var(--border-subtle)',
            flexWrap: 'wrap'
          }}
        >
          <div style={{ flex: '1 1 240px' }}>
            <input
              type="text"
              className="input-text"
              placeholder="Topic or Concept to visualize (e.g. Deadlock Detection, TCP Handshake)..."
              value={customTopic}
              onChange={(e) => setCustomTopic(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleGenerate(); }}
              style={{ width: '100%', fontSize: '0.875rem' }}
            />
          </div>

          {/* Orientation Toggle for Flowchart */}
          {diagramType === 'flowchart' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: 'var(--bg-surface)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <button
                type="button"
                onClick={() => handleToggleDirection('TD')}
                style={{
                  padding: '4px 8px',
                  fontSize: '0.75rem',
                  fontWeight: direction === 'TD' ? 700 : 500,
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: direction === 'TD' ? '#7c3aed' : 'transparent',
                  color: direction === 'TD' ? '#fff' : 'var(--text-secondary)',
                  cursor: 'pointer'
                }}
                title="Top-to-Bottom Layout"
              >
                Top-Down
              </button>
              <button
                type="button"
                onClick={() => handleToggleDirection('LR')}
                style={{
                  padding: '4px 8px',
                  fontSize: '0.75rem',
                  fontWeight: direction === 'LR' ? 700 : 500,
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: direction === 'LR' ? '#7c3aed' : 'transparent',
                  color: direction === 'LR' ? '#fff' : 'var(--text-secondary)',
                  cursor: 'pointer'
                }}
                title="Left-to-Right Layout"
              >
                Left-Right
              </button>
            </div>
          )}

          <button
            onClick={() => handleGenerate()}
            disabled={isGenerating}
            className="btn btn-primary btn-md"
            style={{ gap: '6px', flexShrink: 0 }}
          >
            {isGenerating ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Synthesizing...</span>
              </>
            ) : mermaidCode ? (
              <>
                <RefreshCw size={16} />
                <span>Regenerate Aligned Map</span>
              </>
            ) : (
              <>
                <Sparkles size={16} />
                <span>Generate Diagram</span>
              </>
            )}
          </button>
        </div>

        {/* Render Error Alert */}
        {renderError && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              fontSize: '0.8125rem',
              color: '#ef4444'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={16} />
              <span>{renderError}</span>
            </div>
            <button
              onClick={() => handleGenerate()}
              className="btn btn-secondary btn-sm"
              style={{ padding: '3px 8px', fontSize: '0.75rem' }}
            >
              Retry
            </button>
          </div>
        )}

        {/* Title, Meta and Canvas Controls */}
        {diagramTitle && !isGenerating && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <GitBranch size={16} color="var(--accent-primary)" />
                <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  {diagramTitle}
                </h4>
              </div>
              {diagramDescription && (
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                  {diagramDescription}
                </p>
              )}
            </div>

            {/* Canvas Toolbar Controls */}
            {mermaidCode && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {/* Zoom Controls */}
                <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: '8px', border: '1px solid var(--border-subtle)', padding: '2px' }}>
                  <button
                    onClick={() => setZoomLevel(prev => Math.max(0.6, prev - 0.15))}
                    className="btn btn-ghost btn-sm"
                    style={{ padding: '4px 6px' }}
                    title="Zoom Out"
                  >
                    <ZoomOut size={14} />
                  </button>
                  <button
                    onClick={() => setZoomLevel(1)}
                    className="btn btn-ghost btn-sm"
                    style={{ padding: '4px 6px', fontSize: '0.75rem', minWidth: '42px', textAlign: 'center' }}
                    title="Reset Zoom"
                  >
                    {Math.round(zoomLevel * 100)}%
                  </button>
                  <button
                    onClick={() => setZoomLevel(prev => Math.min(1.8, prev + 0.15))}
                    className="btn btn-ghost btn-sm"
                    style={{ padding: '4px 6px' }}
                    title="Zoom In"
                  >
                    <ZoomIn size={14} />
                  </button>
                </div>

                {/* Copy Mermaid Code */}
                <button
                  onClick={handleCopyCode}
                  className="btn btn-secondary btn-sm"
                  style={{ gap: '6px' }}
                  title="Copy Mermaid Syntax Code"
                >
                  {isCopied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                  <span>{isCopied ? 'Copied!' : 'Code'}</span>
                </button>

                {/* Download SVG */}
                <button
                  onClick={handleDownloadSVG}
                  className="btn btn-secondary btn-sm"
                  style={{ gap: '6px' }}
                  title="Download Diagram as Vector SVG"
                >
                  <Download size={14} />
                  <span>SVG</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Simplified Concept Explanation Card for struggling students */}
        {simplifiedExplanation && !isGenerating && (
          <div
            style={{
              padding: '18px 20px',
              borderRadius: '16px',
              backgroundColor: 'var(--bg-surface-subtle)',
              border: '1px solid var(--border-default)',
              borderLeft: '4px solid #7c3aed',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '8px',
                  backgroundColor: '#7c3aed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(124, 58, 237, 0.35)',
                  flexShrink: 0
                }}
              >
                <Lightbulb size={16} color="#ffffff" />
              </div>
              <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Intuitive Layman's Terms & Analogy
              </h4>
              <span
                style={{
                  fontSize: '0.71875rem',
                  color: '#7c3aed',
                  backgroundColor: 'rgba(124, 58, 237, 0.1)',
                  border: '1px solid rgba(124, 58, 237, 0.25)',
                  padding: '3px 10px',
                  borderRadius: '12px',
                  fontWeight: 600,
                  marginLeft: 'auto'
                }}
              >
                Zero-Jargon Real World Intuition
              </span>
            </div>

            <p
              style={{
                fontSize: '0.875rem',
                lineHeight: '1.65',
                color: 'var(--text-primary)',
                fontWeight: 500,
                margin: 0
              }}
            >
              {simplifiedExplanation}
            </p>

            {keyTakeaways && keyTakeaways.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
                {keyTakeaways.map((takeaway, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '7px',
                      fontSize: '0.8125rem',
                      fontWeight: 500,
                      color: 'var(--text-primary)',
                      backgroundColor: 'var(--bg-surface)',
                      padding: '7px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-default)',
                      boxShadow: 'var(--shadow-xs)'
                    }}
                  >
                    <Check size={14} color="#10b981" style={{ flexShrink: 0, marginTop: '3px' }} />
                    <span>{takeaway}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Diagram Canvas */}
        <div
          style={{
            minHeight: '360px',
            backgroundColor: '#0c0c1a',
            borderRadius: '16px',
            padding: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(255,255,255,0.07)',
            boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.4)',
            overflow: 'auto',
            position: 'relative'
          }}
        >
          {isGenerating ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
              <div
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.25), rgba(37, 99, 235, 0.25))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 14px'
                }}
              >
                <Loader2 size={30} color="#7c3aed" className="animate-spin" />
              </div>
              <p style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#f1f5f9', margin: 0 }}>
                Generating {diagramType} for "{customTopic}"...
              </p>
              <p style={{ fontSize: '0.78125rem', color: '#94a3b8', marginTop: '6px' }}>
                CogniLens AI is analyzing mechanisms, relationships, and invariants
              </p>
            </div>
          ) : mermaidCode ? (
            <div
              ref={diagramContainerRef}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'visible'
              }}
            />
          ) : (
            <div style={{ textAlign: 'center', color: '#64748b' }}>
              <BookOpen size={40} style={{ marginBottom: '10px', opacity: 0.4 }} />
              <p style={{ fontSize: '0.9375rem' }}>Select a topic and click Generate Diagram</p>
            </div>
          )}
        </div>

        {/* Interactive In-Diagram Q&A Box */}
        {mermaidCode && !isGenerating && (
          <div
            style={{
              padding: '18px 20px',
              borderRadius: '16px',
              backgroundColor: 'var(--bg-surface-subtle)',
              border: '1px solid var(--border-default)',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(37, 99, 235, 0.12)',
                    color: 'var(--accent-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <MessageSquare size={15} />
                </div>
                <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  Ask About This Diagram
                </h4>
              </div>
              <span style={{ fontSize: '0.71875rem', color: 'var(--text-secondary)' }}>
                Answers strictly aligned to your topic & study material
              </span>
            </div>

            {/* Quick question suggestion chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {[
                'Explain in simple layman terms',
                'What is the most critical step in this flow?',
                'What happens if a failure or error occurs?',
                'How does this relate to real-world applications?'
              ].map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleAskDiagramQuestion(chip)}
                  disabled={isAsking}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-default)',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--accent-primary)';
                    e.currentTarget.style.color = 'var(--accent-primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-default)';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }}
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Input + Speech-to-text + Submit */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="text"
                className="input-text"
                placeholder="Ask any question about this diagram..."
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAskDiagramQuestion();
                }}
                disabled={isAsking}
                style={{ flex: 1, fontSize: '0.84375rem' }}
              />

              {/* Voice Mic Toggle (STT) */}
              <button
                type="button"
                onClick={handleToggleMic}
                className={`btn ${isListeningMic ? 'btn-danger' : 'btn-secondary'} btn-sm`}
                style={{ padding: '8px 12px' }}
                title={isListeningMic ? 'Stop microphone' : 'Speak question into microphone'}
              >
                {isListeningMic ? <MicOff size={16} className="animate-pulse" /> : <Mic size={16} />}
              </button>

              <button
                type="button"
                onClick={() => handleAskDiagramQuestion()}
                disabled={!questionText.trim() || isAsking}
                className="btn btn-primary btn-sm"
                style={{ gap: '6px', padding: '8px 14px' }}
              >
                {isAsking ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>Thinking...</span>
                  </>
                ) : (
                  <>
                    <Send size={15} />
                    <span>Ask</span>
                  </>
                )}
              </button>
            </div>

            {/* In-diagram Answer Display */}
            {qaAnswer && (
              <div
                style={{
                  marginTop: '6px',
                  padding: '14px 16px',
                  borderRadius: '12px',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-default)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>
                    Tutor Answer
                  </span>
                  <span style={{ fontSize: '0.78125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Topic: {qaAnswer.topic}
                  </span>
                </div>

                <p style={{ fontSize: '0.84375rem', lineHeight: '1.6', color: 'var(--text-primary)', margin: 0 }}>
                  {qaAnswer.answer}
                </p>

                {qaAnswer.layman_explanation && (
                  <div
                    style={{
                      padding: '10px 14px',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(124, 58, 237, 0.08)',
                      border: '1px solid rgba(124, 58, 237, 0.25)',
                      fontSize: '0.8125rem',
                      lineHeight: '1.55',
                      color: 'var(--text-primary)'
                    }}
                  >
                    <strong style={{ color: '#a78bfa' }}>Layman's Analogy: </strong>
                    {qaAnswer.layman_explanation}
                  </div>
                )}

                {qaAnswer.key_points && qaAnswer.key_points.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {qaAnswer.key_points.map((pt, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '0.78125rem', color: 'var(--text-secondary)' }}>
                        <Check size={13} color="#10b981" style={{ flexShrink: 0, marginTop: '3px' }} />
                        <span>{pt}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}


        {/* Collapsible Source Code Viewer */}
        {mermaidCode && !isGenerating && (
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '10px' }}>
            <button
              type="button"
              onClick={() => setShowCode(!showCode)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                fontSize: '0.78125rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 0'
              }}
            >
              <Share2 size={13} />
              <span>{showCode ? 'Hide Mermaid Code' : 'View Raw Mermaid Code'}</span>
            </button>

            {showCode && (
              <pre
                style={{
                  backgroundColor: '#070712',
                  padding: '16px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '0.75rem',
                  fontFamily: 'var(--font-mono)',
                  color: '#93c5fd',
                  overflowX: 'auto',
                  whiteSpace: 'pre-wrap',
                  maxHeight: '220px',
                  marginTop: '8px'
                }}
              >
                {mermaidCode}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
