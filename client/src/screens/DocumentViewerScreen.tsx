import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Sparkles,
  HelpCircle,
  Layers,
  BookOpen,
  FileText,
  Bookmark,
  Share2,
  CheckCircle2,
  ArrowRight,
  Volume2,
  VolumeX,
  Network
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SelectionActionHUD } from '../components/document-viewer/SelectionActionHUD';
import { useToast } from '../context/ToastContext';
import { multimodalVisionService } from '../services/multimodalVisionService';
import { ConceptDiagramModal } from '../components/multimodal/ConceptDiagramModal';

export const DocumentViewerScreen: React.FC = () => {
  const {
    materials,
    selectedMaterial,
    setSelectedMaterial,
    selectedPage,
    setCurrentRoute,
    setPrefilledPrompt,
    startQuiz,
    recordDocumentRead
  } = useApp();

  const activeMaterial = selectedMaterial || materials[0] || {
    id: 'mat-os-unit3',
    title: 'OS — Unit 3 Deadlocks & Synchronization',
    filename: 'OS_Unit3_Deadlocks.pdf',
    type: 'pdf' as const,
    pagesCount: 42,
    size: '4.8 MB',
    uploadDate: 'Sep 18, 2026',
    status: 'indexed' as const,
    course: 'Operating Systems' as const,
    topics: ['Deadlock', 'Coffman Conditions', 'Resource Allocation Graph', 'Banker Algorithm'],
    sections: [
      { id: 's1', page: 1, title: 'Introduction to Deadlock & Concurrency', snippet: 'A deadlock occurs when a set of processes are blocked because each process is holding a resource...' },
      { id: 's2', page: 18, title: 'Four Necessary Coffman Conditions', snippet: '1. Mutual Exclusion, 2. Hold and Wait, 3. No Preemption, 4. Circular Wait...' },
      { id: 's3', page: 31, title: 'Banker\'s Safe State Algorithm', snippet: 'Dijkstra\'s Banker Algorithm simulates allocation for safety testing...' },
      { id: 's4', page: 42, title: 'Resource Allocation Graph & Cycle Detection', snippet: 'Deadlock Detection in single-instance systems reduces to cycle detection in a directed RAG graph...' }
    ]
  };

  const { showToast } = useToast();
  const [activePage, setActivePage] = useState<number>(selectedPage || 1);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [selectedText, setSelectedText] = useState<string>('');
  const [hudPosition, setHudPosition] = useState<{ x: number; y: number } | null>(null);

  // Text-To-Speech (TTS) State
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const ttsStopRef = useRef<(() => void) | null>(null);

  // Concept Diagram Modal state
  const [showDiagramModal, setShowDiagramModal] = useState(false);
  useEffect(() => {
    if (selectedPage) setActivePage(selectedPage);
  }, [selectedPage]);

  // Cleanup TTS on unmount
  useEffect(() => {
    return () => {
      if (ttsStopRef.current) {
        ttsStopRef.current();
        ttsStopRef.current = null;
      }
    };
  }, []);

  // When activePage changes, stop current speech and record progress
  const changePage = (newPage: number) => {
    if (ttsStopRef.current) {
      ttsStopRef.current();
      ttsStopRef.current = null;
    }
    setIsSpeaking(false);
    setActivePage(newPage);
    recordDocumentRead(activeMaterial, newPage);
  };

  // Helper to extract spoken text for current page
  const getPageSpokenText = (): string => {
    const raw = getPageTextContent(activePage);
    if (raw) return raw;
    const sec = activeMaterial.sections?.find(s => s.page === activePage);
    if (sec) return `${sec.title}. ${sec.snippet}`;
    return `${activeMaterial.title}, Page ${activePage}. Course: ${activeMaterial.course}. Topics: ${activeMaterial.topics.join(', ')}.`;
  };

  // Toggle Text-to-Speech narration
  const handleToggleTTS = () => {
    if (isSpeaking) {
      if (ttsStopRef.current) {
        ttsStopRef.current();
        ttsStopRef.current = null;
      }
      setIsSpeaking(false);
      return;
    }

    const narrationText = getPageSpokenText();

    const controller = multimodalVisionService.speakText(
      narrationText,
      () => setIsSpeaking(true),
      () => setIsSpeaking(false),
      (err) => {
        setIsSpeaking(false);
        showToast('Text-to-Speech Notice', err, 'info');
      }
    );

    ttsStopRef.current = controller.stop;
  };

  // Handle text selection in document reader
  const handleMouseUp = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 3) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setSelectedText(selection.toString().trim());
      setHudPosition({ x: rect.left + rect.width / 2, y: rect.top });
    } else {
      setHudPosition(null);
    }
  };

  const handleSummarizePage = () => {
    setCurrentRoute('ai-tutor');
    let promptText = `Summarize page ${activePage} of ${activeMaterial.filename} (${activeMaterial.title}) and highlight key definitions.`;
    if (activeMaterial.textContent) {
      const pageText = getPageTextContent(activePage);
      if (pageText) {
        promptText = `Please summarize the following text from page ${activePage} of ${activeMaterial.filename}:\n\n"${pageText}"`;
      }
    }
    setPrefilledPrompt(promptText);
  };

  const handleCreateQuizForPage = () => {
    startQuiz({
      sourceId: activeMaterial.id,
      course: activeMaterial.course,
      topic: `${activeMaterial.title} (Page ${activePage})`,
      questionCount: 5,
      difficulty: 'intermediate',
      questionType: 'all'
    });
  };

  const totalPages = activeMaterial.pagesCount || 10;
  // Helper to extract text for the specific page
  // Helper to extract text for the specific page
  const getPageTextContent = (pageNum: number) => {
    if (!activeMaterial.textContent) return null;
    const pageMarker = `--- Page ${pageNum} ---`;
    const nextMarker = `--- Page ${pageNum + 1} ---`;
    if (activeMaterial.textContent.includes(pageMarker)) {
      const start = activeMaterial.textContent.indexOf(pageMarker) + pageMarker.length;
      const end = activeMaterial.textContent.includes(nextMarker)
        ? activeMaterial.textContent.indexOf(nextMarker)
        : activeMaterial.textContent.length;
      return activeMaterial.textContent.slice(start, end).trim();
    }
    const charsPerPage = 1200;
    const start = (pageNum - 1) * charsPerPage;
    const slice = activeMaterial.textContent.slice(start, start + charsPerPage).trim();
    return slice.length > 20 ? slice : null;
  };

  // Helper to render dynamic, page-specific and course-specific academic text
  const renderDynamicPageContent = () => {
    const extractedText = getPageTextContent(activePage);
    const topicCount = activeMaterial.topics.length || 1;
    const mainTopic = activeMaterial.topics[(activePage - 1) % topicCount] || activeMaterial.course;
    const subTopic = activeMaterial.topics[activePage % topicCount] || 'Advanced Analysis';
    const exactSection = activeMaterial.sections?.find(s => s.page === activePage);

    if (extractedText) {
      return (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#18181b', margin: 0 }}>
              {activeMaterial.title} — Page {activePage}
            </h2>
            <span className="badge badge-accent" style={{ fontSize: '0.75rem' }}>{mainTopic}</span>
          </div>
          <div style={{ whiteSpace: 'pre-wrap', marginBottom: '20px', fontSize: '0.9375rem', lineHeight: 1.7, color: '#334155' }}>
            {extractedText}
          </div>
          <p style={{ marginTop: '24px', fontSize: '0.825rem', color: '#64748b', fontStyle: 'italic', borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
            Tip: Highlight any snippet above to use the Selection Action HUD for AI Q&A, quiz creation, or flashcard deck generation.
          </p>
        </div>
      );
    }

    if (exactSection) {
      return (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#18181b', margin: 0 }}>
              {exactSection.title}
            </h2>
            <span className="badge badge-primary" style={{ fontSize: '0.75rem' }}>Page {activePage}</span>
          </div>
          <p style={{ marginBottom: '18px', fontSize: '0.95rem', lineHeight: 1.7, color: '#1e293b' }}>
            {exactSection.snippet}
          </p>
          <div style={{ backgroundColor: '#f8fafc', padding: '18px 20px', borderRadius: '8px', borderLeft: '4px solid #2563eb', margin: '22px 0' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '6px', color: '#1e293b' }}>
              Core Formulation & Grounded Invariant
            </h4>
            <p style={{ fontSize: '0.875rem', color: '#334155', lineHeight: 1.6, margin: 0 }}>
              In <strong>{activeMaterial.course}</strong>, <em>{mainTopic}</em> specifies formal safety conditions. System state verification guarantees that all transitions maintain invariant {'$\\mathcal{S}_{t+1} = f(\\mathcal{S}_t, U_t)$'}.
            </p>
          </div>
          <p style={{ marginBottom: '16px', fontSize: '0.9375rem', lineHeight: 1.7, color: '#334155' }}>
            When analyzing complex scenarios in {activeMaterial.title}, ensure step-by-step verification of {'$O(N \\log N)$'} complexity constraints and resource utilization parameters.
          </p>
        </div>
      );
    }

    // Dynamic, page-specific academic content generator so every page (1..N) is unique
    const pageModulo = ((activePage - 1) % 6);

    switch (pageModulo) {
      case 0: // Overview & Fundamentals
        return (
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#18181b', marginBottom: '14px' }}>
              Section {activePage}.1 — Introduction to {mainTopic}
            </h2>
            <p style={{ marginBottom: '16px', fontSize: '0.9375rem', lineHeight: 1.7, color: '#334155' }}>
              This section of <strong>{activeMaterial.title}</strong> lays down the primary definitions and scope for <em>{mainTopic}</em> in <strong>{activeMaterial.course}</strong>.
            </p>
            {activeMaterial.contentPreview && (
              <blockquote style={{ margin: '16px 0', padding: '12px 16px', backgroundColor: '#f8fafc', borderLeft: '4px solid #3b82f6', borderRadius: '4px', fontStyle: 'italic', color: '#475569' }}>
                "{activeMaterial.contentPreview}"
              </blockquote>
            )}
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', margin: '20px 0 10px' }}>Key Learning Objectives:</h3>
            <ul style={{ paddingLeft: '22px', margin: 0, fontSize: '0.9rem', color: '#334155', lineHeight: 1.7 }}>
              <li>Define the core parameters governing <strong>{mainTopic}</strong> in academic contexts.</li>
              <li>Examine structural dependencies between <em>{mainTopic}</em> and <em>{subTopic}</em>.</li>
              <li>Formulate diagnostic criteria for solving typical course exam questions.</li>
            </ul>
          </div>
        );

      case 1: // Mathematical / Formal Theory
        return (
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#18181b', marginBottom: '14px' }}>
              Section {activePage}.2 — Mathematical Principles & Invariants of {mainTopic}
            </h2>
            <p style={{ marginBottom: '16px', fontSize: '0.9375rem', lineHeight: 1.7, color: '#334155' }}>
              Formally, <strong>{mainTopic}</strong> can be expressed as a constrained optimization problem or system graph relation {'$\\mathcal{G} = (\\mathcal{V}, \\mathcal{E})$'}.
            </p>
            <div style={{ backgroundColor: '#f1f5f9', padding: '18px 20px', borderRadius: '8px', borderLeft: '4px solid #0d9488', margin: '20px 0' }}>
              <h4 style={{ fontSize: '0.925rem', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
                Governing Equation — Page {activePage}
              </h4>
              <p style={{ fontFamily: 'monospace', fontSize: '0.95rem', color: '#0f172a', backgroundColor: '#ffffff', padding: '10px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', margin: 0 }}>
                {'$$\\text{Cost}(x) = \\sum_{i=1}^{N} w_i \\cdot \\phi(x_i) + \\lambda \\cdot \\Omega(w)$$'}
              </p>
            </div>
            <p style={{ marginBottom: '16px', fontSize: '0.9375rem', lineHeight: 1.7, color: '#334155' }}>
              Where {'$\\lambda$'} represents the regularization boundary and {'$\\phi(x_i)$'} projects features into the target vector space.
            </p>
          </div>
        );

      case 2: // Algorithm & Methodology
        return (
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#18181b', marginBottom: '14px' }}>
              Section {activePage}.3 — Execution Procedure & Algorithmic Steps
            </h2>
            <p style={{ marginBottom: '16px', fontSize: '0.9375rem', lineHeight: 1.7, color: '#334155' }}>
              To solve problems involving <strong>{mainTopic}</strong> step-by-step, apply the following standard academic protocol:
            </p>
            <ol style={{ paddingLeft: '22px', margin: '16px 0', fontSize: '0.9rem', color: '#334155', lineHeight: 1.8 }}>
              <li><strong>Initialization:</strong> Set initial state vectors {'$S_0$'} and compute resource allocation tables.</li>
              <li><strong>Iterative Evaluation:</strong> Evaluate matrix transitions for <em>{subTopic}</em> until convergence threshold {'$\\epsilon < 10^{-4}$'} is met.</li>
              <li><strong>Invariant Verification:</strong> Ensure non-negativity and safety conditions hold across all steps.</li>
              <li><strong>Output Termination:</strong> Synthesize the final reduced state vector or classification output.</li>
            </ol>
          </div>
        );

      case 3: // Solved Example & Analysis
        return (
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#18181b', marginBottom: '14px' }}>
              Section {activePage}.4 — Solved Practice Example & Exam Case Study
            </h2>
            <div style={{ backgroundColor: '#fffbe6', padding: '16px 20px', borderRadius: '8px', border: '1px solid #ffe58f', margin: '16px 0' }}>
              <h4 style={{ fontSize: '0.925rem', fontWeight: 700, color: '#d48806', marginBottom: '6px' }}>
                Exam Practice Question (Page {activePage}):
              </h4>
              <p style={{ fontSize: '0.875rem', color: '#595959', lineHeight: 1.6, margin: 0 }}>
                Given a system operating under {mainTopic} constraints, determine whether the state is safe and calculate the minimum execution time.
              </p>
            </div>
            <p style={{ fontWeight: 700, color: '#1e293b', marginTop: '16px', marginBottom: '8px' }}>Detailed Solution Walkthrough:</p>
            <p style={{ fontSize: '0.9rem', lineHeight: 1.7, color: '#334155' }}>
              Applying the step-by-step reduction rule from <strong>{activeMaterial.course}</strong>:
              Calculate Need matrix {'$N = \\text{Max} - \\text{Allocation}$'}. Since {'$\\text{Available} \\ge N_i$'}, process {'$P_i$'} can finish, yielding a safe execution sequence.
            </p>
          </div>
        );

      case 4: // Tradeoffs & Complexity
        return (
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#18181b', marginBottom: '14px' }}>
              Section {activePage}.5 — Performance Analysis & Trade-Off Matrix
            </h2>
            <p style={{ marginBottom: '16px', fontSize: '0.9375rem', lineHeight: 1.7, color: '#334155' }}>
              Evaluating <strong>{mainTopic}</strong> requires balancing computational time complexity with memory overhead:
            </p>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', margin: '18px 0' }}>
              <thead>
                <tr style={{ backgroundColor: '#f1f5f9', textAlign: 'left' }}>
                  <th style={{ padding: '8px 12px', border: '1px solid #cbd5e1' }}>Metric / Aspect</th>
                  <th style={{ padding: '8px 12px', border: '1px solid #cbd5e1' }}>Time Complexity</th>
                  <th style={{ padding: '8px 12px', border: '1px solid #cbd5e1' }}>Space Complexity</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '8px 12px', border: '1px solid #cbd5e1', fontWeight: 600 }}>Standard Model</td>
                  <td style={{ padding: '8px 12px', border: '1px solid #cbd5e1' }}>{'$O(N^2 \\cdot M)$'}</td>
                  <td style={{ padding: '8px 12px', border: '1px solid #cbd5e1' }}>{'$O(N \\cdot M)$'}</td>
                </tr>
                <tr style={{ backgroundColor: '#fafafa' }}>
                  <td style={{ padding: '8px 12px', border: '1px solid #cbd5e1', fontWeight: 600 }}>Optimized Strategy</td>
                  <td style={{ padding: '8px 12px', border: '1px solid #cbd5e1' }}>{'$O(N \\log N)$'}</td>
                  <td style={{ padding: '8px 12px', border: '1px solid #cbd5e1' }}>{'$O(N)$'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        );

      default: // Summary & Diagnostic Review
        return (
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#18181b', marginBottom: '14px' }}>
              Section {activePage}.6 — Summary Review & Key Takeaways
            </h2>
            <p style={{ marginBottom: '16px', fontSize: '0.9375rem', lineHeight: 1.7, color: '#334155' }}>
              Review notes for page {activePage} of <strong>{activeMaterial.filename}</strong>:
            </p>
            <div style={{ backgroundColor: '#f8fafc', padding: '16px 20px', borderRadius: '8px', borderLeft: '4px solid #6366f1', margin: '16px 0' }}>
              <ul style={{ paddingLeft: '18px', margin: 0, fontSize: '0.875rem', color: '#334155', lineHeight: 1.8 }}>
                <li><strong>Core Takeaway:</strong> <em>{mainTopic}</em> provides predictable guarantees within <strong>{activeMaterial.course}</strong>.</li>
                <li><strong>Common Trap:</strong> Do not confuse static allocation with dynamic runtime preemption.</li>
                <li><strong>Quiz Tip:</strong> Practice questions on page {activePage} test formulas and step-by-step state verification.</li>
              </ul>
            </div>
          </div>
        );
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr 320px', height: 'calc(100vh - 88px)', overflow: 'hidden' }}>
      {/* 1. LEFT: Page Thumbnails & Table of Contents */}
      <aside
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderRight: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          overflowY: 'auto'
        }}
      >
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Sections & Pages
          </div>
          <div style={{ fontSize: '0.725rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
            {activeMaterial.filename} ({totalPages} pages)
          </div>
        </div>

        {/* Sections list */}
        <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {activeMaterial.sections && activeMaterial.sections.length > 0 ? (
            activeMaterial.sections.map((sec) => (
              <button
                key={sec.id}
                onClick={() => changePage(sec.page)}
                style={{
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: activePage === sec.page ? 'var(--accent-primary-light)' : 'transparent',
                  border: `1px solid ${activePage === sec.page ? 'var(--accent-primary-border)' : 'transparent'}`,
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                  transition: 'all var(--transition-fast)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.785rem', fontWeight: activePage === sec.page ? 700 : 600, color: activePage === sec.page ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
                    {sec.title}
                  </span>
                  <span className="badge badge-neutral" style={{ fontSize: '0.65rem' }}>p. {sec.page}</span>
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {sec.snippet}
                </div>
              </button>
            ))
          ) : (
            Array.from({ length: Math.min(15, totalPages) }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => changePage(p)}
                style={{
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: activePage === p ? 'var(--accent-primary-light)' : 'transparent',
                  color: activePage === p ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  fontSize: '0.8125rem',
                  fontWeight: activePage === p ? 700 : 500,
                  textAlign: 'left'
                }}
              >
                Page {p}
              </button>
            ))
          )}
        </div>
      </aside>

      {/* 2. CENTER: Document Page Content Reader */}
      <main
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          backgroundColor: 'var(--bg-app)',
          overflowY: 'auto',
          position: 'relative'
        }}
        onMouseUp={handleMouseUp}
      >
        {/* Document Viewer Toolbar */}
        <div
          style={{
            height: '52px',
            backgroundColor: 'var(--bg-surface)',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 20px',
            position: 'sticky',
            top: 0,
            zIndex: 10,
            gap: '16px',
            flexWrap: 'nowrap'
          }}
        >
          {/* Material Switcher Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <BookOpen size={16} color="var(--accent-primary)" />
            <select
              value={activeMaterial.id}
              onChange={(e) => {
                const found = materials.find(m => m.id === e.target.value);
                if (found) {
                  setSelectedMaterial(found);
                  changePage(1);
                }
              }}
              className="input-text"
              style={{ padding: '4px 8px', fontSize: '0.8125rem', fontWeight: 600, maxWidth: '210px' }}
            >
              {materials.map(m => (
                <option key={m.id} value={m.id}>
                  {m.title}
                </option>
              ))}
            </select>
          </div>

          {/* Page Selector Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
            <button
              onClick={() => changePage(Math.max(1, activePage - 1))}
              disabled={activePage === 1}
              className="btn btn-ghost btn-sm"
              style={{ padding: '4px 6px', borderRadius: '6px' }}
              aria-label="Previous page"
            >
              <ChevronLeft size={16} />
            </button>
            <span
              style={{
                fontSize: '0.8125rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                whiteSpace: 'nowrap',
                display: 'inline-block',
                lineHeight: 1
              }}
            >
              Page {activePage} of {totalPages}
            </span>
            <button
              onClick={() => changePage(Math.min(totalPages, activePage + 1))}
              disabled={activePage === totalPages}
              className="btn btn-ghost btn-sm"
              style={{ padding: '4px 6px', borderRadius: '6px' }}
              aria-label="Next page"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* TTS Listen & Zoom Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={handleToggleTTS}
              className={`btn ${isSpeaking ? 'btn-danger' : 'btn-secondary'} btn-sm`}
              style={{ gap: '6px', padding: '4px 10px', fontSize: '0.785rem' }}
              title={isSpeaking ? 'Stop audio playback' : 'Listen to current page content aloud (Text-to-Speech)'}
            >
              {isSpeaking ? (
                <>
                  <VolumeX size={14} className="animate-pulse" />
                  <span>Stop Audio</span>
                </>
              ) : (
                <>
                  <Volume2 size={14} color="var(--accent-primary)" />
                  <span>Listen (TTS)</span>
                </>
              )}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', borderLeft: '1px solid var(--border-subtle)', paddingLeft: '8px' }}>
              <button onClick={() => setZoomLevel(Math.max(75, zoomLevel - 15))} className="btn btn-ghost btn-sm" title="Zoom Out">
                <ZoomOut size={15} />
              </button>
              <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                {zoomLevel}%
              </span>
              <button onClick={() => setZoomLevel(Math.min(150, zoomLevel + 15))} className="btn btn-ghost btn-sm" title="Zoom In">
                <ZoomIn size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* Document Render Canvas */}
        <div style={{ flex: 1, padding: '32px 40px', display: 'flex', justifyContent: 'center' }}>
          <div
            style={{
              width: '100%',
              maxWidth: `${720 * (zoomLevel / 100)}px`,
              minHeight: '880px',
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)',
              boxShadow: 'var(--shadow-md)',
              padding: '48px 56px',
              color: '#18181b',
              lineHeight: 1.65,
              fontSize: '0.9375rem',
              transition: 'max-width 150ms ease'
            }}
          >
            {/* Page Header Stamp */}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e4e4e7', paddingBottom: '12px', marginBottom: '24px', fontSize: '0.75rem', color: '#71717a' }}>
              <span style={{ fontWeight: 600 }}>{activeMaterial.title}</span>
              <span>Page {activePage} of {totalPages}</span>
            </div>

            {/* Dynamic Page Content */}
            {renderDynamicPageContent()}
          </div>
        </div>

        {/* Floating Text Selection HUD */}
        {hudPosition && selectedText && (
          <SelectionActionHUD
            selectedText={selectedText}
            position={hudPosition}
            onClose={() => setHudPosition(null)}
          />
        )}
      </main>

      {/* 3. RIGHT: AI Document Assistant */}
      <aside
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderLeft: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          overflowY: 'auto',
          padding: '16px'
        }}
      >
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={16} color="var(--accent-primary)" />
            <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Document AI Assistant
            </h3>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Contextual assistance grounded in Page {activePage} of {activeMaterial.filename}.
          </p>
        </div>

        {/* Quick Document Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
          <button
            onClick={handleToggleTTS}
            className={`btn ${isSpeaking ? 'btn-danger' : 'btn-secondary'} btn-sm`}
            style={{ justifyContent: 'flex-start', gap: '8px' }}
            title={isSpeaking ? 'Stop audio playback' : `Listen to page ${activePage} out loud`}
          >
            {isSpeaking ? (
              <>
                <VolumeX size={14} className="animate-pulse" />
                <span>Stop Audio Narration</span>
              </>
            ) : (
              <>
                <Volume2 size={14} color="var(--accent-primary)" />
                <span>Listen to Page {activePage} (TTS)</span>
              </>
            )}
          </button>

          <button onClick={handleSummarizePage} className="btn btn-secondary btn-sm" style={{ justifyContent: 'flex-start', gap: '8px' }}>
            <Sparkles size={14} color="var(--accent-primary)" />
            <span>Summarize Page {activePage}</span>
          </button>

          <button onClick={handleCreateQuizForPage} className="btn btn-secondary btn-sm" style={{ justifyContent: 'flex-start', gap: '8px' }}>
            <HelpCircle size={14} color="var(--color-warning)" />
            <span>Generate Quiz on Page {activePage}</span>
          </button>

          <button onClick={() => setCurrentRoute('flashcards')} className="btn btn-secondary btn-sm" style={{ justifyContent: 'flex-start', gap: '8px' }}>
            <Layers size={14} color="var(--color-purple)" />
            <span>Review Flashcards for Material</span>
          </button>

          <button
            onClick={() => setShowDiagramModal(true)}
            className="btn btn-secondary btn-sm"
            style={{ justifyContent: 'flex-start', gap: '8px' }}
            title="Generate a concept diagram for the current page content"
          >
            <Network size={14} color="var(--color-purple)" />
            <span>View Concept Diagram</span>
          </button>
        </div>

        {/* Key Extracted Concepts */}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
            Key Indexed Concepts:
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {activeMaterial.topics.map((t, idx) => (
              <div
                key={idx}
                style={{
                  padding: '8px 10px',
                  backgroundColor: 'var(--bg-surface-subtle)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{t}</span>
                <Bookmark size={12} color="var(--accent-primary)" />
              </div>
            ))}
          </div>
        </div>

        {/* Return to Chat */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '12px', marginTop: '12px' }}>
          <button
            onClick={() => {
              setCurrentRoute('ai-tutor');
              let promptText = `I am on page ${activePage} of ${activeMaterial.filename}. Can you explain this concept in simple terms?`;
              const pageText = getPageTextContent(activePage);
              if (pageText) {
                promptText = `Can you explain the following text from page ${activePage} of ${activeMaterial.filename} in simple terms?\n\n"${pageText}"`;
              }
              setPrefilledPrompt(promptText);
            }}
            className="btn btn-primary btn-sm"
            style={{ width: '100%', justifyContent: 'center', gap: '6px' }}
          >
            <span>Ask AI about this page</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </aside>

      {/* Concept Diagram Modal */}
      {showDiagramModal && (
        <ConceptDiagramModal
          isOpen={showDiagramModal}
          onClose={() => setShowDiagramModal(false)}
          textContent={getPageTextContent(activePage) || activeMaterial.textContent || activeMaterial.topics.join(', ')}
          topic={activeMaterial.topics[(activePage - 1) % (activeMaterial.topics.length || 1)] || activeMaterial.title}
          filename={activeMaterial.filename}
        />
      )}
    </div>
  );
};
