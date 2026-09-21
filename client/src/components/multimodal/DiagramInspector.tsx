import React, { useState } from 'react';
import {
  ScanEye,
  Sparkles,
  Layers,
  HelpCircle,
  ZoomIn,
  ZoomOut,
  Maximize2,
  CheckCircle,
  FileText,
  ArrowRight,
  Info
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';

interface DiagramPreset {
  id: string;
  title: string;
  category: string;
  description: string;
  type: 'cpu_scheduling' | 'neural_network' | 'gradient_descent' | 'dbms_erd';
  explanation: {
    overview: string;
    keyPoints: string[];
    formula?: string;
    implication: string;
  };
}

export const DIAGRAM_PRESETS: DiagramPreset[] = [
  {
    id: 'diag-cpu-gantt',
    title: 'Round Robin CPU Scheduling Gantt Timeline',
    category: 'Operating Systems (Unit 2 / 3)',
    description: 'Preemptive CPU Scheduling timeline with 3 concurrent processes (P1, P2, P3) and time quantum q = 4ms.',
    type: 'cpu_scheduling',
    explanation: {
      overview: 'This diagram illustrates Round Robin (RR) execution. Processes are allocated the CPU in cyclic order with a fixed time slice of 4ms to prevent starvation.',
      keyPoints: [
        '0ms – 4ms: Process P1 runs (burst reduces from 12ms to 8ms)',
        '4ms – 8ms: Process P2 executes and completes completely (0ms remaining)',
        '8ms – 12ms: Process P3 executes (burst reduces from 6ms to 2ms)',
        '12ms – 16ms: Process P1 resumes for its second quantum slice'
      ],
      formula: 'Average Waiting Time = ( (0 + 12 - 4) + 4 + 8 ) / 3 = 6.67ms',
      implication: 'Round Robin optimizes interactive responsiveness and fairness, though frequent context switching adds kernel overhead.'
    }
  },
  {
    id: 'diag-nn-backprop',
    title: 'Neural Network Multilayer Perceptron & Chain Rule',
    category: 'Machine Learning (Deep Learning)',
    description: 'Feedforward architecture showing input layer X, hidden layer H (ReLU), output layer Y_hat, and backward loss gradient vectors.',
    type: 'neural_network',
    explanation: {
      overview: 'The diagram depicts backward error propagation through interconnected layers via the multivariable chain rule of calculus.',
      keyPoints: [
        'Forward Pass: Computes activations z^[l] = W^[l] a^[l-1] + b^[l]',
        'Loss Computation: L(y_hat, y) measures divergence at the output layer',
        'Backward Pass: Computes partial derivative dW^[l] and passes gradient backward',
        'Weight Optimization: Parameters update via SGD: W := W - α * dW'
      ],
      formula: '∂L / ∂W^[1] = (∂L / ∂a^[2]) · (∂a^[2] / ∂z^[2]) · (∂z^[2] / ∂a^[1]) · (∂a^[1] / ∂z^[1]) · X^T',
      implication: 'ReLU activation eliminates vanishing gradients for positive inputs during deep backpropagation.'
    }
  },
  {
    id: 'diag-gradient-descent',
    title: 'Handwritten Gradient Descent Derivation & Contour',
    category: 'Machine Learning (Optimization)',
    description: 'Scanned handwritten notes detailing partial derivatives of MSE loss with respect to weight w1 and bias b on a 2D contour map.',
    type: 'gradient_descent',
    explanation: {
      overview: 'OCR transcription and mathematical reconstruction of hand-drawn loss contours descending towards the global minimum.',
      keyPoints: [
        'Elliptical contours represent levels of constant Mean Squared Error J(w, b)',
        'Orthogonal gradient vector points in the direction of steepest ascent',
        'Negative gradient step -α ∇J drives parameters towards optimum (w*, b*)'
      ],
      formula: '∇J(w, b) = [ ∂J/∂w, ∂J/∂b ]^T',
      implication: 'Appropriate feature scaling (normalization) transforms eccentric ellipses into concentric circles for faster convergence.'
    }
  }
];

export const DiagramInspector: React.FC = () => {
  const { setCurrentRoute, setPrefilledPrompt, startQuiz } = useApp();
  const { showToast } = useToast();
  const [selectedPresetId, setSelectedPresetId] = useState<string>(DIAGRAM_PRESETS[0].id);
  const [activeHighlightIndex, setActiveHighlightIndex] = useState<number | null>(null);

  const activePreset = DIAGRAM_PRESETS.find(p => p.id === selectedPresetId) || DIAGRAM_PRESETS[0];

  const handleAskFollowUp = () => {
    setCurrentRoute('ai-tutor');
    setPrefilledPrompt(`Explain the mathematical details behind "${activePreset.title}"`);
  };

  const handleGenerateQuiz = () => {
    startQuiz({
      course: activePreset.category.includes('Operating') ? 'Operating Systems' : 'Machine Learning',
      topic: activePreset.title,
      questionCount: 5,
      difficulty: 'intermediate',
      questionType: 'all'
    });
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
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
              <ScanEye size={18} />
            </div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Multimodal Vision & Diagram Analyzer
            </h1>
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Grounded visual intelligence: Parse diagrams, architecture flowcharts, and handwritten lecture calculations.
          </p>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={handleAskFollowUp} className="btn btn-secondary btn-sm" style={{ gap: '6px' }}>
            <Sparkles size={14} color="var(--accent-primary)" />
            <span>Ask Follow-up</span>
          </button>
          <button onClick={handleGenerateQuiz} className="btn btn-primary btn-sm" style={{ gap: '6px' }}>
            <HelpCircle size={14} />
            <span>Create Quiz on Diagram</span>
          </button>
        </div>
      </div>

      {/* Preset Selector Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '4px' }}>
        {DIAGRAM_PRESETS.map((preset) => (
          <button
            key={preset.id}
            onClick={() => {
              setSelectedPresetId(preset.id);
              setActiveHighlightIndex(null);
            }}
            style={{
              padding: '8px 14px',
              borderRadius: 'var(--radius-md)',
              border: `1px solid ${selectedPresetId === preset.id ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
              backgroundColor: selectedPresetId === preset.id ? 'var(--accent-primary-light)' : 'var(--bg-surface)',
              color: selectedPresetId === preset.id ? 'var(--accent-primary)' : 'var(--text-secondary)',
              fontWeight: selectedPresetId === preset.id ? 600 : 500,
              fontSize: '0.8125rem',
              whiteSpace: 'nowrap',
              transition: 'all var(--transition-fast)'
            }}
          >
            {preset.title}
          </button>
        ))}
      </div>

      {/* Main 2-Column Inspector */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '20px' }}>
        {/* Left: Diagram Canvas & Bounding Overlays */}
        <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ fontSize: '0.84375rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Multimodal Input Source ({activePreset.category})
            </div>
            <span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>
              OCR & Layout Parsed
            </span>
          </div>

          {/* SVG Synthesized High-Fidelity Diagram Visual */}
          <div
            style={{
              flex: 1,
              minHeight: '340px',
              backgroundColor: '#18181b',
              borderRadius: 'var(--radius-lg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)'
            }}
          >
            {activePreset.type === 'cpu_scheduling' && (
              <svg viewBox="0 0 540 260" style={{ width: '100%', height: '100%', maxWidth: '500px' }}>
                <text x="20" y="30" fill="#a1a1aa" fontSize="12" fontFamily="var(--font-mono)">CPU SCHEDULING GANTT CHART (q = 4ms)</text>
                
                {/* Gantt Bar Segments */}
                <rect x="20" y="60" width="120" height="60" rx="4" fill="#3b82f6" stroke="#60a5fa" strokeWidth="2" opacity={activeHighlightIndex === 0 ? 1 : 0.85} />
                <text x="65" y="95" fill="#ffffff" fontWeight="bold" fontSize="14">P1 (4ms)</text>

                <rect x="140" y="60" width="120" height="60" rx="4" fill="#10b981" stroke="#34d399" strokeWidth="2" opacity={activeHighlightIndex === 1 ? 1 : 0.85} />
                <text x="185" y="95" fill="#ffffff" fontWeight="bold" fontSize="14">P2 (4ms)</text>

                <rect x="260" y="60" width="120" height="60" rx="4" fill="#8b5cf6" stroke="#a78bfa" strokeWidth="2" opacity={activeHighlightIndex === 2 ? 1 : 0.85} />
                <text x="305" y="95" fill="#ffffff" fontWeight="bold" fontSize="14">P3 (4ms)</text>

                <rect x="380" y="60" width="120" height="60" rx="4" fill="#3b82f6" stroke="#60a5fa" strokeWidth="2" opacity={activeHighlightIndex === 3 ? 1 : 0.85} />
                <text x="425" y="95" fill="#ffffff" fontWeight="bold" fontSize="14">P1 (4ms)</text>

                {/* Timeline axis */}
                <line x1="20" y1="135" x2="500" y2="135" stroke="#52525b" strokeWidth="2" />
                <text x="20" y="155" fill="#9ca3af" fontSize="11" fontFamily="var(--font-mono)">0ms</text>
                <text x="135" y="155" fill="#9ca3af" fontSize="11" fontFamily="var(--font-mono)">4ms</text>
                <text x="255" y="155" fill="#9ca3af" fontSize="11" fontFamily="var(--font-mono)">8ms</text>
                <text x="375" y="155" fill="#9ca3af" fontSize="11" fontFamily="var(--font-mono)">12ms</text>
                <text x="490" y="155" fill="#9ca3af" fontSize="11" fontFamily="var(--font-mono)">16ms</text>

                {/* Status annotations */}
                <rect x="20" y="180" width="480" height="60" rx="6" fill="#27272a" />
                <text x="35" y="205" fill="#93c5fd" fontSize="12" fontWeight="600">P2 Finished at 8ms (Turnaround Time: 8ms)</text>
                <text x="35" y="225" fill="#a1a1aa" fontSize="11">P1 Remaining Burst: 4ms • P3 Remaining Burst: 2ms</text>
              </svg>
            )}

            {activePreset.type === 'neural_network' && (
              <svg viewBox="0 0 540 260" style={{ width: '100%', height: '100%', maxWidth: '500px' }}>
                <text x="20" y="30" fill="#a1a1aa" fontSize="12" fontFamily="var(--font-mono)">MULTILAYER PERCEPTRON (FEEDFORWARD & BACKPROP)</text>

                {/* Layer 1 - Inputs */}
                <circle cx="80" cy="80" r="16" fill="#3b82f6" />
                <text x="73" y="85" fill="#fff" fontSize="12">x1</text>
                <circle cx="80" cy="140" r="16" fill="#3b82f6" />
                <text x="73" y="145" fill="#fff" fontSize="12">x2</text>
                <circle cx="80" cy="200" r="16" fill="#3b82f6" />
                <text x="73" y="205" fill="#fff" fontSize="12">x3</text>

                {/* Layer 2 - Hidden */}
                <circle cx="260" cy="90" r="18" fill="#8b5cf6" />
                <text x="252" y="95" fill="#fff" fontSize="12">h1</text>
                <circle cx="260" cy="150" r="18" fill="#8b5cf6" />
                <text x="252" y="155" fill="#fff" fontSize="12">h2</text>
                <circle cx="260" cy="210" r="18" fill="#8b5cf6" />
                <text x="252" y="215" fill="#fff" fontSize="12">h3</text>

                {/* Layer 3 - Output */}
                <circle cx="440" cy="150" r="20" fill="#10b981" />
                <text x="430" y="155" fill="#fff" fontSize="13">ŷ</text>

                {/* Connectors */}
                <line x1="96" y1="80" x2="242" y2="90" stroke="#52525b" strokeWidth="1.5" />
                <line x1="96" y1="140" x2="242" y2="150" stroke="#52525b" strokeWidth="1.5" />
                <line x1="96" y1="200" x2="242" y2="210" stroke="#52525b" strokeWidth="1.5" />
                <line x1="278" y1="90" x2="420" y2="150" stroke="#a78bfa" strokeWidth="2" />
                <line x1="278" y1="150" x2="420" y2="150" stroke="#a78bfa" strokeWidth="2" />
                <line x1="278" y1="210" x2="420" y2="150" stroke="#a78bfa" strokeWidth="2" />

                <text x="310" y="70" fill="#f43f5e" fontSize="11" fontFamily="var(--font-mono)">← ∂L/∂W^[2]</text>
              </svg>
            )}

            {activePreset.type === 'gradient_descent' && (
              <svg viewBox="0 0 540 260" style={{ width: '100%', height: '100%', maxWidth: '500px' }}>
                <text x="20" y="30" fill="#a1a1aa" fontSize="12" fontFamily="var(--font-mono)">GRADIENT DESCENT LOSS CONTOUR MAP J(w, b)</text>

                {/* Contours */}
                <ellipse cx="270" cy="140" rx="190" ry="90" fill="none" stroke="#3f3f46" strokeWidth="1.5" />
                <ellipse cx="270" cy="140" rx="140" ry="65" fill="none" stroke="#52525b" strokeWidth="1.5" />
                <ellipse cx="270" cy="140" rx="90" ry="40" fill="none" stroke="#71717a" strokeWidth="1.5" />
                <ellipse cx="270" cy="140" rx="40" ry="18" fill="rgba(59, 130, 246, 0.2)" stroke="#3b82f6" strokeWidth="2" />

                {/* Descent trajectory */}
                <path d="M 120 70 Q 180 110, 210 125 T 270 140" fill="none" stroke="#f59e0b" strokeWidth="3" strokeDasharray="4" />
                <circle cx="120" cy="70" r="5" fill="#ef4444" />
                <text x="100" y="60" fill="#ef4444" fontSize="11" fontWeight="bold">Start θ_0</text>

                <circle cx="270" cy="140" r="6" fill="#10b981" />
                <text x="280" y="145" fill="#10b981" fontSize="12" fontWeight="bold">Global Min θ*</text>
              </svg>
            )}
          </div>
        </div>

        {/* Right: Agent Multimodal Grounded Breakdown */}
        <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Sparkles size={16} color="var(--accent-primary)" />
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Agent Vision Synthesis
            </h3>
          </div>

          <p style={{ fontSize: '0.84375rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '16px' }}>
            {activePreset.explanation.overview}
          </p>

          {/* Key Elements Breakdown */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
              Key Visual Elements:
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {activePreset.explanation.keyPoints.map((point, idx) => (
                <div
                  key={idx}
                  onMouseEnter={() => setActiveHighlightIndex(idx)}
                  onMouseLeave={() => setActiveHighlightIndex(null)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: activeHighlightIndex === idx ? 'var(--accent-primary-light)' : 'var(--bg-surface-subtle)',
                    border: `1px solid ${activeHighlightIndex === idx ? 'var(--accent-primary-border)' : 'var(--border-subtle)'}`,
                    fontSize: '0.8125rem',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="badge badge-neutral" style={{ fontSize: '0.65rem' }}>{idx + 1}</span>
                    <span>{point}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mathematical Formulation */}
          {activePreset.explanation.formula && (
            <div
              style={{
                backgroundColor: 'var(--bg-surface-subtle)',
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                marginBottom: '16px',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.785rem',
                color: 'var(--accent-primary)'
              }}
            >
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', marginBottom: '4px', textTransform: 'uppercase', fontFamily: 'var(--font-sans)', fontWeight: 600 }}>
                Derived Calculation / Formula:
              </div>
              {activePreset.explanation.formula}
            </div>
          )}

          {/* Conceptual Implication */}
          <div
            style={{
              padding: '10px 12px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-success-subtle)',
              border: '1px solid var(--color-success-border)',
              fontSize: '0.785rem',
              color: 'var(--color-success-text)'
            }}
          >
            <strong>Key Takeaway:</strong> {activePreset.explanation.implication}
          </div>
        </div>
      </div>
    </div>
  );
};
