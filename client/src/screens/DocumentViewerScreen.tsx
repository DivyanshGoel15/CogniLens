import React, { useState, useEffect } from 'react';
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
  ArrowRight
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SelectionActionHUD } from '../components/document-viewer/SelectionActionHUD';
import { useToast } from '../context/ToastContext';

export const DocumentViewerScreen: React.FC = () => {
  const { selectedMaterial, selectedPage, setCurrentRoute, setPrefilledPrompt, startQuiz } = useApp();
  const { showToast } = useToast();

  const [activePage, setActivePage] = useState<number>(selectedPage || 1);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [selectedText, setSelectedText] = useState<string>('');
  const [hudPosition, setHudPosition] = useState<{ x: number; y: number } | null>(null);

  const material = selectedMaterial || {
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

  useEffect(() => {
    if (selectedPage) setActivePage(selectedPage);
  }, [selectedPage]);

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
    setPrefilledPrompt(`Summarize page ${activePage} of ${material.filename} and highlight the key definitions.`);
  };

  const handleCreateQuizForPage = () => {
    startQuiz({
      sourceId: material.id,
      course: material.course,
      topic: `${material.title} (Page ${activePage})`,
      questionCount: 5,
      difficulty: 'intermediate',
      questionType: 'all'
    });
  };

  const totalPages = material.pagesCount || 42;

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
            {material.filename} ({totalPages} pages)
          </div>
        </div>

        {/* Sections list */}
        <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {material.sections && material.sections.length > 0 ? (
            material.sections.map((sec) => (
              <button
                key={sec.id}
                onClick={() => setActivePage(sec.page)}
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
            Array.from({ length: Math.min(10, totalPages) }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setActivePage(p)}
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
            height: '46px',
            backgroundColor: 'var(--bg-surface)',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 20px',
            position: 'sticky',
            top: 0,
            zIndex: 10
          }}
        >
          {/* Page Selector Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => setActivePage(Math.max(1, activePage - 1))}
              disabled={activePage === 1}
              className="btn btn-ghost btn-sm"
              aria-label="Previous page"
            >
              <ChevronLeft size={16} />
            </button>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Page {activePage} of {totalPages}
            </span>
            <button
              onClick={() => setActivePage(Math.min(totalPages, activePage + 1))}
              disabled={activePage === totalPages}
              className="btn btn-ghost btn-sm"
              aria-label="Next page"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Zoom Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
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
              <span>{material.title}</span>
              <span>Page {activePage}</span>
            </div>

            {/* Simulated High-Res Document Body */}
            {activePage === 42 ? (
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#18181b', marginBottom: '16px' }}>
                  Section 7.4 — Resource Allocation Graph & Deadlock Detection
                </h2>
                <p style={{ marginBottom: '16px' }}>
                  In computer systems with single-instance resource types, deadlock detection is directly solvable via graph-theoretic cycle detection on the directed <strong>Resource-Allocation Graph (RAG)</strong>.
                </p>

                <div style={{ backgroundColor: '#f4f4f5', padding: '16px', borderRadius: '8px', borderLeft: '4px solid #2563eb', margin: '20px 0' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '6px' }}>
                    Theorem 7.1 (Cycle Equivalence in Single-Instance Resources)
                  </h4>
                  <p style={{ fontSize: '0.875rem' }}>
                    If each resource type in the system $R = &#123;R_1, R_2, \dots, R_m&#125;$ contains exactly one instance, then a cycle in the Resource Allocation Graph $G = (V, E)$ is both a <em>necessary and sufficient condition</em> for the existence of a deadlock.
                  </p>
                </div>

                <p style={{ marginBottom: '16px' }}>
                  An edge $P_i \to R_j$ signifies a <em>request edge</em>, meaning process $P_i$ is currently blocked waiting for resource $R_j$. Conversely, an assignment edge $R_j \to P_i$ denotes that resource $R_j$ has been allocated to process $P_i$.
                </p>

                <p>
                  To detect cycles efficiently, algorithms such as <strong>Tarjan's strongly connected components algorithm</strong> or <strong>Depth-First Search (DFS)</strong> with back-edge detection run with time complexity O(|V| + |E|), where |V| = |P| + |R|.
                </p>
              </div>
            ) : activePage === 18 ? (
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#18181b', marginBottom: '16px' }}>
                  Section 7.2 — The Four Necessary Coffman Conditions
                </h2>
                <p style={{ marginBottom: '16px' }}>
                  For a deadlock to arise in an operating system, all four of the following conditions must hold concurrently:
                </p>
                <ol style={{ paddingLeft: '24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <li><strong>Mutual Exclusion:</strong> At least one resource must be held in a non-shareable mode.</li>
                  <li><strong>Hold and Wait:</strong> A process must be actively holding at least one resource and waiting to acquire additional resources held by other processes.</li>
                  <li><strong>No Preemption:</strong> Resources cannot be preempted; a resource can only be released voluntarily by the process holding it.</li>
                  <li><strong>Circular Wait:</strong> A closed chain of processes $&#123;P_0, P_1, \dots, P_n&#125;$ exists where each process waits for a resource held by the next.</li>
                </ol>
              </div>
            ) : (
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#18181b', marginBottom: '16px' }}>
                  {material.title} — Overview
                </h2>
                <p style={{ marginBottom: '16px' }}>
                  This chapter examines core theoretical principles, synchronization mechanisms, and algorithm specifications for modern system design.
                </p>
                <p>
                  Highlight any passage of text above to trigger the <strong>Selection HUD</strong> to explain, make flashcards, or generate a grounded quiz.
                </p>
              </div>
            )}
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
            Contextual assistance grounded in Page {activePage}.
          </p>
        </div>

        {/* Quick Document Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
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
        </div>

        {/* Key Extracted Concepts */}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
            Key Indexed Concepts:
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {material.topics.map((t, idx) => (
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
              setPrefilledPrompt(`I am on page ${activePage} of ${material.filename}. Can you explain this concept in simple terms?`);
            }}
            className="btn btn-primary btn-sm"
            style={{ width: '100%', justifyContent: 'center', gap: '6px' }}
          >
            <span>Ask AI about this page</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </aside>
    </div>
  );
};
