import React, { useState, useEffect, useRef } from 'react';
import {
  ScanEye,
  Sparkles,
  HelpCircle,
  ZoomIn,
  ZoomOut,
  Plus,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Upload,
  Image as ImageIcon,
  X,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Loader2,
  BookOpen
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { multimodalVisionService, VisualAnalysisResult, VisionSlide } from '../../services/multimodalVisionService';

export interface DiagramItem {
  id: string;
  title: string;
  category: string;
  description: string;
  type: 'cpu_scheduling' | 'neural_network' | 'gradient_descent' | 'custom';
  imageUrl?: string;
  slides: VisionSlide[];
  explanation: {
    overview: string;
    keyPoints: string[];
    formula?: string;
    implication: string;
    extractedText?: string;
  };
}

export const DIAGRAM_PRESETS: DiagramItem[] = [
  {
    id: 'diag-cpu-gantt',
    title: 'Round Robin CPU Scheduling Gantt Timeline',
    category: 'Operating Systems (Unit 2 / 3)',
    description: 'Preemptive CPU Scheduling timeline with 3 concurrent processes (P1, P2, P3) and time quantum q = 4ms.',
    type: 'cpu_scheduling',
    slides: [
      {
        title: 'Executive Overview & Gantt Anatomy',
        badge: 'Slide 1 of 3: Core Architecture',
        content: 'Round Robin (RR) is a preemptive scheduling algorithm engineered for time-sharing operating systems. Processes are arranged in a circular FIFO ready queue and allocated CPU time in discrete slices known as the time quantum (q = 4ms). If a process burst exceeds 4ms, it is preempted and cycled to the queue tail.',
        keyPoints: [
          '0ms – 4ms: Process P1 executes (CPU burst decrements from 12ms to 8ms)',
          '4ms – 8ms: Process P2 executes and completes completely (0ms remaining, Turnaround = 8ms)',
          '8ms – 12ms: Process P3 executes (burst decrements from 6ms to 2ms)',
          '12ms – 16ms: Process P1 resumes for its second quantum slice'
        ],
        formula: 'Average Waiting Time = ( (0 + 12 - 4) + 4 + 8 ) / 3 = 6.67ms',
        implication: 'Guarantees bounded waiting time (W_i ≤ (n-1)q) and completely prevents starvation across interactive processes.'
      },
      {
        title: 'Context Switching, Ready Queue Dynamics & Overhead',
        badge: 'Slide 2 of 3: Execution Mechanics',
        content: 'System efficiency in Round Robin hinges upon time quantum tuning. Every preemption necessitates a kernel context switch: saving process registers, program counter, and flushing translation lookaside buffer (TLB) lines. If q is too small, context-switch overhead dominates; if q is too large, RR degrades into First-Come First-Served (FCFS).',
        keyPoints: [
          'Context Switch Overhead: As q approaches 0, CPU thrashing consumes clock cycles on register swapping',
          '80% Rule of Thumb: Roughly 80% of CPU bursts in an OS should complete within a single quantum slice',
          'Ready Queue Mechanics: Preempted processes yield to newly arriving jobs or fellow queue members in strict FIFO sequence',
          'Dispatch Latency: Bounded response latency guarantees interactive UI responsiveness in kernel schedulers'
        ],
        implication: 'Modern operating systems pair Round Robin with Multi-Level Feedback Queues (MLFQ) to dynamically penalize CPU-heavy jobs while rewarding interactive I/O jobs.'
      },
      {
        title: 'Turnaround Metrics, Asymptotics & Exam Mastery',
        badge: 'Slide 3 of 3: Theoretical Rigor',
        content: 'Academic evaluation benchmarks for CPU schedulers focus on Turnaround Time (TAT = Completion - Arrival) and Waiting Time (WT = TAT - Burst). While Shortest Job First (SJF) is theoretically optimal for minimum average waiting time, Round Robin provides lower variance in response time, ensuring predictable interactive performance.',
        keyPoints: [
          'Turnaround Breakdown: P1 finishes at 16ms (TAT = 16ms), P2 finishes at 8ms (TAT = 8ms), P3 completes at subsequent slice',
          'SJF vs RR Tradeoff: RR has higher average turnaround time than SJF, but avoids SJF starvation of long processes',
          'Exam Cheat Sheet: Remember that Round Robin does NOT minimize average waiting time — it optimizes responsiveness variance'
        ],
        formula: 'Turnaround Time (TAT) = T_completion - T_arrival \\quad | \\quad Waiting Time (WT) = TAT - T_burst',
        implication: 'Essential for Operating Systems exams: know how to construct Gantt timelines and compute AWT/ATAT accurately.'
      }
    ],
    explanation: {
      overview: 'Round Robin (RR) preemptive scheduling execution with 3 concurrent processes and time quantum q = 4ms.',
      keyPoints: [
        '0ms – 4ms: Process P1 runs (burst reduces from 12ms to 8ms)',
        '4ms – 8ms: Process P2 executes and completes completely',
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
    slides: [
      {
        title: 'MLP Topology & Forward Activation Flow',
        badge: 'Slide 1 of 3: Core Architecture',
        content: 'This Multilayer Perceptron (MLP) visualizes feedforward propagation. An input feature vector x ∈ ℝ³ is mapped to hidden representation h ∈ ℝ³ via affine weight transformation and Rectified Linear Unit (ReLU) non-linearity, before synthesizing a final continuous or probability prediction ŷ at the output neuron.',
        keyPoints: [
          'Input Layer: 3 input feature nodes (x1, x2, x3) representing observation signals',
          'Hidden Layer: 3 hidden units (h1, h2, h3) activated with non-linear mapping a^[1] = max(0, z^[1])',
          'Output Layer: Single predictive unit ŷ evaluating loss divergence against ground truth label y',
          'Weight Matrices: W^[1] ∈ ℝ³ˣ³ and W^[2] ∈ ℝ¹ˣ³ parameterized with learnable bias vectors'
        ],
        formula: 'z^{[1]} = W^{[1]} x + b^{[1]} \\quad \\to \\quad a^{[1]} = \\text{ReLU}(z^{[1]}) \\quad \\to \\quad \\hat{y} = W^{[2]} a^{[1]} + b^{[2]}',
        implication: 'Non-linear activations allow MLPs to approximate arbitrary continuous functions (Universal Approximation Theorem).'
      },
      {
        title: 'Backpropagation Mechanics & Gradient Flow',
        badge: 'Slide 2 of 3: Execution Mechanics',
        content: 'Backpropagation applies the multivariable chain rule backwards across the computational graph. The output error gradient δ^[2] is back-projected through transposed weight matrix (W^[2])ᵀ, gated by the element-wise subgradient of ReLU, computing the exact analytical sensitivity for each weight parameter.',
        keyPoints: [
          'Loss Sensitivity: Evaluates partial derivative ∂L/∂ŷ divergence at the final objective node',
          'Backward Projection: Multiplies incoming gradient vector by weight transpose (W^[2])ᵀ',
          'Activation Gating: ReLU derivative acts as a switch: passes gradient through if z > 0, zeroes it out if z ≤ 0',
          'Weight Updates: Computes partial gradient ∂L/∂W^[1] = δ^[1] · xᵀ and updates via Stochastic Gradient Descent'
        ],
        implication: 'Dynamic programming memoizes intermediate gradient products, reducing computational cost from exponential to linear O(|E|).'
      },
      {
        title: 'Optimization Rigor, Vanishing Gradients & Exam Mastery',
        badge: 'Slide 3 of 3: Theoretical Rigor',
        content: 'Understanding gradient stability in deep feedforward networks. Prior to ReLU, deep sigmoid/tanh networks suffered catastrophic gradient dissipation because derivatives peaked at 0.25, exponentially shrinking gradients across layers.',
        keyPoints: [
          'Dying ReLU Problem: Neurons pushed into negative territory output zero gradient, permanently stalling updates',
          'Optimization Solvers: Modern optimizers (Adam, RMSProp) augment SGD with first and second moment moving averages',
          'Exam Cheat Sheet: Always express backpropagation as a reverse topological traversal over the directed acyclic computational graph'
        ],
        formula: '\\frac{\\partial L}{\\partial W^{[1]}} = \\left( W^{[2]T} \\frac{\\partial L}{\\partial \\hat{y}} \\odot \\sigma\'(z^{[1]}) \\right) x^T \\quad | \\quad W := W - \\alpha \\nabla_W L',
        implication: 'Mastering the chain rule derivation across matrix dimensions is a cornerstone of deep learning exams and interviews.'
      }
    ],
    explanation: {
      overview: 'Backward error propagation through interconnected layers via the multivariable chain rule of calculus.',
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
    slides: [
      {
        title: 'Contour Geometry & Loss Landscape',
        badge: 'Slide 1 of 3: Core Architecture',
        content: 'This 2D contour map models the convex Mean Squared Error (MSE) loss surface J(w, b). Each elliptical isoline represents points in parameter space yielding identical error values. The center represents the optimal parameter point θ* = (w*, b*) where gradient magnitude vanishes.',
        keyPoints: [
          'Isolines / Contours: Concentric ellipses indicate level sets of cost surface J(w, b)',
          'Initialization θ_0: Starting weight-bias point (w0, b0) located on an outer high-error contour',
          'Trajectory Vector: Steps take direction orthogonal to local contour tangents',
          'Convergence Basin: Global minimizer θ* reached when gradient norm ||∇J|| approaches zero'
        ],
        formula: 'J(w, b) = \\frac{1}{2m} \\sum_{i=1}^{m} ( (w x^{(i)} + b) - y^{(i)} )^2',
        implication: 'Convex quadratic objectives guarantee that any local minimum is simultaneously the unique global minimum.'
      },
      {
        title: 'Trajectory Dynamics, Step Size & Orthogonality',
        badge: 'Slide 2 of 3: Execution Mechanics',
        content: 'The gradient vector ∇J(θ) points in the direction of greatest instantaneous rate of increase. Gradient Descent takes discrete negative steps along -∇J. Because level contours are perpendicular to steepest ascent, every continuous trajectory intersects contour tangents at right angles (orthogonality property).',
        keyPoints: [
          'Orthogonality Condition: The update vector is always orthogonal to the tangent of the contour curve',
          'Learning Rate Sensitivity: Too small an α leads to slow convergence; excessive α causes overshoot oscillations across valleys',
          'Oscillatory Zig-Zag: In poorly conditioned eccentric ellipses, gradients bounce repeatedly across narrow ravine walls',
          'Momentum Acceleration: Incorporates velocity term v := β v + (1-β) ∇J to smooth transverse oscillation'
        ],
        implication: 'Feature scaling (standardization z = (x - μ) / σ) transforms elongated ellipses into symmetric circles, allowing direct 1-step descent.'
      },
      {
        title: 'Conditioning, Asymptotic Rates & Exam Mastery',
        badge: 'Slide 3 of 3: Theoretical Rigor',
        content: 'Mathematical analysis of gradient convergence rates. The convergence rate of first-order gradient descent on strongly convex quadratics is bounded by the condition number κ = λ_max / λ_min of the Hessian matrix H = ∇²J.',
        keyPoints: [
          'Condition Number κ: High ratio of largest to smallest eigenvalue causes severe elongation and slow convergence',
          'Second-Order Methods: Newton-Raphson replaces scalar α with inverted Hessian H⁻¹ to jump directly to optimum in one step',
          'Exam Cheat Sheet: Remember that gradient descent always moves perpendicular to contour lines, not directly towards the minimum'
        ],
        formula: '\\theta_{t+1} = \\theta_t - \\alpha \\nabla J(\\theta_t) \\quad | \\quad \\nabla J(w, b) = \\begin{bmatrix} \\frac{\\partial J}{\\partial w} \\\\ \\frac{\\partial J}{\\partial b} \\end{bmatrix}',
        implication: 'A quintessential question in machine learning exams: explain why feature scaling accelerates gradient descent on contour maps.'
      }
    ],
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

const CUSTOM_DIAGRAMS_STORAGE_KEY = 'cognilens_custom_diagrams';

export const DiagramInspector: React.FC = () => {
  const { setCurrentRoute, setPrefilledPrompt, startQuiz } = useApp();
  const { showToast } = useToast();

  // Custom uploaded diagrams state
  const [customDiagrams, setCustomDiagrams] = useState<DiagramItem[]>(() => {
    try {
      const stored = localStorage.getItem(CUSTOM_DIAGRAMS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // Normalize slides if legacy custom diagram
          return parsed.map((item: any) => {
            if (!item.slides || !Array.isArray(item.slides) || item.slides.length === 0) {
              return {
                ...item,
                slides: [
                  {
                    title: 'Architecture & Visual Anatomy',
                    badge: 'Slide 1 of 3: Core Architecture',
                    content: item.explanation?.overview || 'Overview of diagram.',
                    keyPoints: item.explanation?.keyPoints || [],
                    ocrText: item.explanation?.extractedText
                  },
                  {
                    title: 'Operational Mechanics & Flow',
                    badge: 'Slide 2 of 3: Execution Mechanics',
                    content: 'Detailed step-by-step breakdown of components and interaction flow.',
                    keyPoints: item.explanation?.keyPoints || []
                  },
                  {
                    title: 'Theoretical Rigor & Takeaways',
                    badge: 'Slide 3 of 3: Theoretical Rigor',
                    content: item.explanation?.implication || 'Core academic principles.',
                    formula: item.explanation?.formula,
                    implication: item.explanation?.implication
                  }
                ]
              };
            }
            return item;
          });
        }
      }
    } catch (e) {
      console.warn('Failed to parse custom diagrams from localStorage', e);
    }
    return [];
  });

  // All available diagrams
  const allDiagrams: DiagramItem[] = [...DIAGRAM_PRESETS, ...customDiagrams];

  const [selectedPresetId, setSelectedPresetId] = useState<string>(() => {
    return allDiagrams[0]?.id || DIAGRAM_PRESETS[0].id;
  });

  const [activeHighlightIndex, setActiveHighlightIndex] = useState<number | null>(null);

  // Multi-Slide active index
  const [activeSlideIndex, setActiveSlideIndex] = useState<number>(0);

  // Zoom controls for custom image diagrams
  const [zoomScale, setZoomScale] = useState<number>(1);

  // Add Diagram Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [newTopic, setNewTopic] = useState<string>('');
  const [newPrompt, setNewPrompt] = useState<string>('');
  const [newImageBase64, setNewImageBase64] = useState<string | null>(null);
  const [newImageMime, setNewImageMime] = useState<string>('image/png');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  // Speech-to-Text state
  const [isListening, setIsListening] = useState<boolean>(false);
  const [listeningTarget, setListeningTarget] = useState<'topic' | 'prompt' | 'query' | null>(null);
  const speechRecognitionStopRef = useRef<(() => void) | null>(null);
  const baseTextRef = useRef<string>('');

  // Text-to-Speech state
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const ttsStopRef = useRef<(() => void) | null>(null);

  // Voice Inquiry / Question State
  const [voiceQueryText, setVoiceQueryText] = useState<string>('');
  const [isVoiceQueryModalOpen, setIsVoiceQueryModalOpen] = useState<boolean>(false);

  const activePreset = allDiagrams.find(p => p.id === selectedPresetId) || allDiagrams[0] || DIAGRAM_PRESETS[0];

  // Current slides for the active diagram
  const currentSlides: VisionSlide[] = activePreset.slides && activePreset.slides.length > 0
    ? activePreset.slides
    : [
        {
          title: 'Architecture & Visual Anatomy',
          badge: 'Slide 1 of 3: Core Architecture',
          content: activePreset.explanation.overview,
          keyPoints: activePreset.explanation.keyPoints,
          formula: activePreset.explanation.formula,
          implication: activePreset.explanation.implication,
          ocrText: activePreset.explanation.extractedText
        }
      ];

  const currentSlide = currentSlides[activeSlideIndex] || currentSlides[0];

  // Save custom diagrams to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(CUSTOM_DIAGRAMS_STORAGE_KEY, JSON.stringify(customDiagrams));
    } catch (e) {
      console.warn('Failed to save custom diagrams', e);
    }
  }, [customDiagrams]);

  // Reset slide index & stop speech when switching diagram
  useEffect(() => {
    setActiveSlideIndex(0);
    setActiveHighlightIndex(null);
    setZoomScale(1);

    if (ttsStopRef.current) {
      ttsStopRef.current();
      ttsStopRef.current = null;
    }
    setIsSpeaking(false);

    if (speechRecognitionStopRef.current) {
      speechRecognitionStopRef.current();
      speechRecognitionStopRef.current = null;
    }
    setIsListening(false);
  }, [selectedPresetId]);

  const handleAskFollowUp = () => {
    setCurrentRoute('ai-tutor');
    setPrefilledPrompt(`Explain the visual structure, flow, and mathematical concepts behind "${activePreset.title}" (${activePreset.category})`);
  };

  const handleGenerateQuiz = () => {
    const slideContext = (activePreset.slides || []).map((s, idx) =>
      `Slide ${idx + 1} (${s.title}): ${s.content} ${s.keyPoints ? 'Key points: ' + s.keyPoints.join('; ') : ''} ${s.formula ? 'Formula: ' + s.formula : ''} ${s.implication ? 'Takeaway: ' + s.implication : ''}`
    ).join('\n\n');

    const courseName = activePreset.category.toLowerCase().includes('operat')
      ? 'Operating Systems'
      : activePreset.category.toLowerCase().includes('data structure')
      ? 'Data Structures'
      : activePreset.category.toLowerCase().includes('network')
      ? 'Computer Networks'
      : activePreset.category.toLowerCase().includes('database') || activePreset.category.toLowerCase().includes('dbms')
      ? 'DBMS'
      : 'Machine Learning';

    startQuiz({
      course: courseName,
      topic: activePreset.title,
      contextText: `Visual Topic: ${activePreset.title}\nDomain: ${activePreset.category}\nOverview: ${activePreset.description}\n\n${slideContext}`,
      questionCount: 5,
      difficulty: 'intermediate',
      questionType: 'all'
    });
  };

  // Image File selection
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Invalid File', 'Please select a valid image file (PNG, JPG, WEBP, GIF, SVG).', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setNewImageBase64(result);
      setNewImageMime(file.type);
      if (!newTopic) {
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
        setNewTopic(cleanName);
      }
    };
    reader.readAsDataURL(file);
  };

  // Trigger Add Diagram Analysis
  const handleAnalyzeAndSaveDiagram = async () => {
    if (!newImageBase64) {
      showToast('Image Required', 'Please select or upload an image to analyze.', 'error');
      return;
    }

    setIsAnalyzing(true);
    try {
      const result: VisualAnalysisResult = await multimodalVisionService.analyzeImage(
        newImageBase64,
        newImageMime,
        newTopic.trim() || 'Custom Visual Analysis',
        newPrompt.trim() || undefined
      );

      const newItem: DiagramItem = {
        id: result.id,
        title: result.title,
        category: result.category,
        description: result.description,
        type: 'custom',
        imageUrl: result.imageUrl || newImageBase64,
        slides: result.slides && result.slides.length > 0 ? result.slides : [
          {
            title: 'Architecture & Visual Anatomy',
            badge: 'Slide 1 of 3: Core Architecture',
            content: result.explanation.overview,
            keyPoints: result.explanation.keyPoints,
            formula: result.explanation.formula,
            implication: result.explanation.implication,
            ocrText: result.explanation.extractedText
          }
        ],
        explanation: result.explanation
      };

      setCustomDiagrams(prev => [newItem, ...prev]);
      setSelectedPresetId(newItem.id);
      setIsAddModalOpen(false);
      setNewImageBase64(null);
      setNewTopic('');
      setNewPrompt('');

      showToast('Vision Synthesis Complete', `"${newItem.title}" analyzed with multi-slide academic depth.`, 'success');
    } catch (err: any) {
      console.error(err);
      showToast('Analysis Error', err?.message || 'Failed to analyze image.', 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Delete Custom Diagram
  const handleDeleteCustomDiagram = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCustomDiagrams(prev => prev.filter(d => d.id !== id));
    if (selectedPresetId === id) {
      setSelectedPresetId(DIAGRAM_PRESETS[0].id);
    }
    showToast('Diagram Removed', 'The custom diagram has been removed.', 'info');
  };

  // Text-To-Speech (TTS) Toggle
  const handleToggleTTS = () => {
    if (isSpeaking) {
      if (ttsStopRef.current) {
        ttsStopRef.current();
        ttsStopRef.current = null;
      }
      setIsSpeaking(false);
      return;
    }

    const narrationText = `
      ${currentSlide.badge}. ${currentSlide.title}.
      ${currentSlide.content}.
      ${currentSlide.keyPoints && currentSlide.keyPoints.length > 0 ? `Key visual components: ${currentSlide.keyPoints.join('. ')}.` : ''}
      ${currentSlide.implication ? `Takeaway: ${currentSlide.implication}` : ''}
    `;

    const controller = multimodalVisionService.speakText(
      narrationText,
      () => setIsSpeaking(true),
      () => setIsSpeaking(false),
      (err) => {
        setIsSpeaking(false);
        showToast('Text-to-Speech Warning', err, 'info');
      }
    );

    ttsStopRef.current = controller.stop;
  };

  // Speech-To-Text (STT) Trigger (Fixed: No duplicate repetition!)
  const handleStartSTT = (target: 'topic' | 'prompt' | 'query') => {
    if (isListening && listeningTarget === target) {
      if (speechRecognitionStopRef.current) {
        speechRecognitionStopRef.current();
        speechRecognitionStopRef.current = null;
      }
      setIsListening(false);
      setListeningTarget(null);
      return;
    }

    // Capture initial text baseline
    let base = '';
    if (target === 'topic') base = newTopic;
    else if (target === 'prompt') base = newPrompt;
    else if (target === 'query') base = voiceQueryText;
    baseTextRef.current = base;

    setIsListening(true);
    setListeningTarget(target);

    const controller = multimodalVisionService.startSpeechRecognition(
      (spokenSentence) => {
        const initial = baseTextRef.current.trim();
        const updated = initial ? `${initial} ${spokenSentence}` : spokenSentence;
        if (target === 'topic') setNewTopic(updated);
        else if (target === 'prompt') setNewPrompt(updated);
        else if (target === 'query') setVoiceQueryText(updated);
      },
      (err) => {
        setIsListening(false);
        setListeningTarget(null);
        showToast('Microphone Notice', err, 'info');
      },
      () => {
        setIsListening(false);
        setListeningTarget(null);
      }
    );

    speechRecognitionStopRef.current = controller.stop;
  };

  // Submit Voice Query to AI Tutor
  const handleSendVoiceQuery = () => {
    if (!voiceQueryText.trim()) return;
    setIsVoiceQueryModalOpen(false);
    setCurrentRoute('ai-tutor');
    setPrefilledPrompt(`Regarding the diagram "${activePreset.title}" (${activePreset.category}):\n\nQuestion: "${voiceQueryText}"`);
    setVoiceQueryText('');
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1440px', margin: '0 auto' }}>
      {/* 1. Page Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: 'rgba(37, 99, 235, 0.12)',
                color: 'var(--accent-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 6px rgba(37, 99, 235, 0.15)'
              }}
            >
              <ScanEye size={20} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                Multimodal Vision & Diagram Analyzer
              </h1>
            </div>
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Grounded visual intelligence: Upload any diagram, architecture, or lecture notes. Powered by Gemini & Azure Vision and Speech synthesis.
          </p>
        </div>

        {/* Action buttons: + Add Diagram, Text-to-Speech (TTS), Speech-to-Text (STT), Ask AI, Quiz */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
          {/* Main Add Diagram Button */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="btn btn-primary btn-sm"
            style={{ gap: '6px', fontWeight: 600, boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)' }}
            title="Upload any image or diagram for AI synthesis"
          >
            <Plus size={15} />
            <span>Add Diagram</span>
          </button>

          {/* Text-To-Speech (TTS) Button */}
          <button
            onClick={handleToggleTTS}
            className={`btn ${isSpeaking ? 'btn-danger' : 'btn-secondary'} btn-sm`}
            style={{ gap: '6px', transition: 'all 0.2s ease' }}
            title={isSpeaking ? 'Stop audio playback' : 'Listen to AI analysis out loud (Text-to-Speech)'}
          >
            {isSpeaking ? (
              <>
                <VolumeX size={15} className="animate-pulse" />
                <span>Stop Audio</span>
              </>
            ) : (
              <>
                <Volume2 size={15} color="var(--accent-primary)" />
                <span>Listen (TTS)</span>
              </>
            )}
          </button>

          {/* Speech-To-Text (STT) Voice Inquiry */}
          <button
            onClick={() => setIsVoiceQueryModalOpen(true)}
            className="btn btn-secondary btn-sm"
            style={{ gap: '6px' }}
            title="Ask questions about this diagram using your voice (Speech-to-Text)"
          >
            <Mic size={15} color="var(--accent-primary)" />
            <span>Voice Ask (STT)</span>
          </button>

          {/* Follow-up in AI Tutor */}
          <button onClick={handleAskFollowUp} className="btn btn-secondary btn-sm" style={{ gap: '6px' }}>
            <Sparkles size={14} color="var(--accent-primary)" />
            <span>Ask Follow-up</span>
          </button>

          {/* Create Quiz */}
          <button onClick={handleGenerateQuiz} className="btn btn-secondary btn-sm" style={{ gap: '6px' }}>
            <HelpCircle size={14} color="var(--color-warning)" />
            <span>Create Quiz</span>
          </button>
        </div>
      </div>

      {/* 2. Diagram Selector Tabs (WITHOUT "+ Add Custom" duplicate button) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '4px' }}>
        {allDiagrams.map((preset) => {
          const isSelected = selectedPresetId === preset.id;
          const isCustom = preset.type === 'custom';

          return (
            <div
              key={preset.id}
              onClick={() => {
                setSelectedPresetId(preset.id);
                setActiveHighlightIndex(null);
                setActiveSlideIndex(0);
                setZoomScale(1);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                borderRadius: 'var(--radius-md)',
                border: `1px solid ${isSelected ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                backgroundColor: isSelected ? 'var(--accent-primary-light)' : 'var(--bg-surface)',
                color: isSelected ? 'var(--accent-primary)' : 'var(--text-secondary)',
                fontWeight: isSelected ? 600 : 500,
                fontSize: '0.8125rem',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)'
              }}
            >
              {isCustom && <ImageIcon size={14} color="var(--accent-primary)" />}
              <span>{preset.title}</span>

              {isCustom && (
                <button
                  onClick={(e) => handleDeleteCustomDiagram(preset.id, e)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '2px',
                    borderRadius: '4px',
                    marginLeft: '2px'
                  }}
                  title="Remove diagram"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* 3. Main 2-Column Inspector */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '20px' }}>
        {/* Left: Diagram Canvas & Zoom Controls */}
        <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.84375rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {activePreset.title}
              </span>
            </div>

            {/* Canvas controls — zoom applies to ALL diagram types */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                onClick={() => setZoomScale(s => Math.min(s + 0.2, 2.5))}
                className="btn btn-ghost btn-sm"
                style={{ padding: '4px 8px', borderRadius: '4px' }}
                title="Zoom in"
              >
                <ZoomIn size={14} />
              </button>
              <button
                onClick={() => setZoomScale(s => Math.max(s - 0.2, 0.6))}
                className="btn btn-ghost btn-sm"
                style={{ padding: '4px 8px', borderRadius: '4px' }}
                title="Zoom out"
              >
                <ZoomOut size={14} />
              </button>
              <button
                onClick={() => setZoomScale(1)}
                className="btn btn-ghost btn-sm"
                style={{ padding: '4px 8px', borderRadius: '4px' }}
                title="Reset zoom"
              >
                <RotateCcw size={13} />
              </button>
            </div>
          </div>

          {/* Diagram Display Area */}
          <div
            style={{
              flex: 1,
              minHeight: '380px',
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
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transform: `scale(${zoomScale})`,
                transition: 'transform 0.15s ease',
                transformOrigin: 'center center'
              }}
            >
              {/* Custom Uploaded Image */}
              {activePreset.type === 'custom' && activePreset.imageUrl && (
                <img
                  src={activePreset.imageUrl}
                  alt={activePreset.title}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '360px',
                    objectFit: 'contain',
                    borderRadius: '8px'
                  }}
                />
              )}

              {/* Preset 1: CPU Scheduling SVG */}
              {activePreset.type === 'cpu_scheduling' && (
                <svg viewBox="0 0 540 260" style={{ width: '100%', height: '100%', maxWidth: '500px' }}>
                  <text x="20" y="30" fill="#a1a1aa" fontSize="12" fontFamily="var(--font-mono)">CPU SCHEDULING GANTT CHART (q = 4ms)</text>
                  <rect x="20" y="60" width="120" height="60" rx="4" fill="#3b82f6" stroke="#60a5fa" strokeWidth="2" opacity={activeHighlightIndex === 0 ? 1 : 0.85} />
                  <text x="65" y="95" fill="#ffffff" fontWeight="bold" fontSize="14">P1 (4ms)</text>
                  <rect x="140" y="60" width="120" height="60" rx="4" fill="#10b981" stroke="#34d399" strokeWidth="2" opacity={activeHighlightIndex === 1 ? 1 : 0.85} />
                  <text x="185" y="95" fill="#ffffff" fontWeight="bold" fontSize="14">P2 (4ms)</text>
                  <rect x="260" y="60" width="120" height="60" rx="4" fill="#8b5cf6" stroke="#a78bfa" strokeWidth="2" opacity={activeHighlightIndex === 2 ? 1 : 0.85} />
                  <text x="305" y="95" fill="#ffffff" fontWeight="bold" fontSize="14">P3 (4ms)</text>
                  <rect x="380" y="60" width="120" height="60" rx="4" fill="#3b82f6" stroke="#60a5fa" strokeWidth="2" opacity={activeHighlightIndex === 3 ? 1 : 0.85} />
                  <text x="425" y="95" fill="#ffffff" fontWeight="bold" fontSize="14">P1 (4ms)</text>
                  <line x1="20" y1="135" x2="500" y2="135" stroke="#52525b" strokeWidth="2" />
                  <text x="20" y="155" fill="#9ca3af" fontSize="11" fontFamily="var(--font-mono)">0ms</text>
                  <text x="135" y="155" fill="#9ca3af" fontSize="11" fontFamily="var(--font-mono)">4ms</text>
                  <text x="255" y="155" fill="#9ca3af" fontSize="11" fontFamily="var(--font-mono)">8ms</text>
                  <text x="375" y="155" fill="#9ca3af" fontSize="11" fontFamily="var(--font-mono)">12ms</text>
                  <text x="490" y="155" fill="#9ca3af" fontSize="11" fontFamily="var(--font-mono)">16ms</text>
                  <rect x="20" y="180" width="480" height="60" rx="6" fill="#27272a" />
                  <text x="35" y="205" fill="#93c5fd" fontSize="12" fontWeight="600">P2 Finished at 8ms (Turnaround Time: 8ms)</text>
                  <text x="35" y="225" fill="#a1a1aa" fontSize="11">P1 Remaining Burst: 4ms • P3 Remaining Burst: 2ms</text>
                </svg>
              )}

              {/* Preset 2: Neural Network SVG */}
              {activePreset.type === 'neural_network' && (
                <svg viewBox="0 0 540 260" style={{ width: '100%', height: '100%', maxWidth: '500px' }}>
                  <text x="20" y="30" fill="#a1a1aa" fontSize="12" fontFamily="var(--font-mono)">MULTILAYER PERCEPTRON (FEEDFORWARD & BACKPROP)</text>
                  <circle cx="80" cy="80" r="16" fill="#3b82f6" />
                  <text x="73" y="85" fill="#fff" fontSize="12">x1</text>
                  <circle cx="80" cy="140" r="16" fill="#3b82f6" />
                  <text x="73" y="145" fill="#fff" fontSize="12">x2</text>
                  <circle cx="80" cy="200" r="16" fill="#3b82f6" />
                  <text x="73" y="205" fill="#fff" fontSize="12">x3</text>
                  <circle cx="260" cy="90" r="18" fill="#8b5cf6" />
                  <text x="252" y="95" fill="#fff" fontSize="12">h1</text>
                  <circle cx="260" cy="150" r="18" fill="#8b5cf6" />
                  <text x="252" y="155" fill="#fff" fontSize="12">h2</text>
                  <circle cx="260" cy="210" r="18" fill="#8b5cf6" />
                  <text x="252" y="215" fill="#fff" fontSize="12">h3</text>
                  <circle cx="440" cy="150" r="20" fill="#10b981" />
                  <text x="430" y="155" fill="#fff" fontSize="13">ŷ</text>
                  <line x1="96" y1="80" x2="242" y2="90" stroke="#52525b" strokeWidth="1.5" />
                  <line x1="96" y1="140" x2="242" y2="150" stroke="#52525b" strokeWidth="1.5" />
                  <line x1="96" y1="200" x2="242" y2="210" stroke="#52525b" strokeWidth="1.5" />
                  <line x1="278" y1="90" x2="420" y2="150" stroke="#a78bfa" strokeWidth="2" />
                  <line x1="278" y1="150" x2="420" y2="150" stroke="#a78bfa" strokeWidth="2" />
                  <line x1="278" y1="210" x2="420" y2="150" stroke="#a78bfa" strokeWidth="2" />
                  <text x="310" y="70" fill="#f43f5e" fontSize="11" fontFamily="var(--font-mono)">← ∂L/∂W^[2]</text>
                </svg>
              )}

              {/* Preset 3: Gradient Descent SVG */}
              {activePreset.type === 'gradient_descent' && (
                <svg viewBox="0 0 540 260" style={{ width: '100%', height: '100%', maxWidth: '500px' }}>
                  <text x="20" y="30" fill="#a1a1aa" fontSize="12" fontFamily="var(--font-mono)">GRADIENT DESCENT LOSS CONTOUR MAP J(w, b)</text>
                  <ellipse cx="270" cy="140" rx="190" ry="90" fill="none" stroke="#3f3f46" strokeWidth="1.5" />
                  <ellipse cx="270" cy="140" rx="140" ry="65" fill="none" stroke="#52525b" strokeWidth="1.5" />
                  <ellipse cx="270" cy="140" rx="90" ry="40" fill="none" stroke="#71717a" strokeWidth="1.5" />
                  <ellipse cx="270" cy="140" rx="40" ry="18" fill="rgba(59, 130, 246, 0.2)" stroke="#3b82f6" strokeWidth="2" />
                  <path d="M 120 70 Q 180 110, 210 125 T 270 140" fill="none" stroke="#f59e0b" strokeWidth="3" strokeDasharray="4" />
                  <circle cx="120" cy="70" r="5" fill="#ef4444" />
                  <text x="100" y="60" fill="#ef4444" fontSize="11" fontWeight="bold">Start θ_0</text>
                  <circle cx="270" cy="140" r="6" fill="#10b981" />
                  <text x="280" y="145" fill="#10b981" fontSize="12" fontWeight="bold">Global Min θ*</text>
                </svg>
              )}
            </div>
          </div>
        </div>

        {/* Right: Agent Vision Synthesis Box with Top-Right Navigation Arrows */}
        <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
          {/* Box Header with Arrows & Slide Indicator */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={18} color="var(--accent-primary)" />
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Agent Vision Synthesis
              </h3>
            </div>

            {/* TOP RIGHT ARROWS & SLIDE CONTROLLER */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {isSpeaking && (
                <span className="badge badge-primary animate-pulse" style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Volume2 size={12} />
                  <span>Reading...</span>
                </span>
              )}

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: 'var(--bg-surface-subtle)',
                  borderRadius: '8px',
                  border: '1px solid var(--border-subtle)',
                  padding: '2px 4px',
                  gap: '4px'
                }}
              >
                {/* Back Arrow */}
                <button
                  type="button"
                  onClick={() => setActiveSlideIndex(i => Math.max(0, i - 1))}
                  disabled={activeSlideIndex === 0}
                  className="btn btn-ghost btn-sm"
                  style={{
                    padding: '3px 6px',
                    borderRadius: '4px',
                    opacity: activeSlideIndex === 0 ? 0.35 : 1,
                    cursor: activeSlideIndex === 0 ? 'not-allowed' : 'pointer'
                  }}
                  title="Previous Study Slide"
                >
                  <ChevronLeft size={16} />
                </button>

                {/* Slide indicator */}
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-mono)',
                    padding: '0 4px',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {activeSlideIndex + 1} / {currentSlides.length}
                </span>

                {/* Next Arrow */}
                <button
                  type="button"
                  onClick={() => setActiveSlideIndex(i => Math.min(currentSlides.length - 1, i + 1))}
                  disabled={activeSlideIndex === currentSlides.length - 1}
                  className="btn btn-ghost btn-sm"
                  style={{
                    padding: '3px 6px',
                    borderRadius: '4px',
                    opacity: activeSlideIndex === currentSlides.length - 1 ? 0.35 : 1,
                    cursor: activeSlideIndex === currentSlides.length - 1 ? 'not-allowed' : 'pointer'
                  }}
                  title="Next Study Slide"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Current Slide Title */}
          <div style={{ marginBottom: '12px' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              {currentSlide.title}
            </h4>
          </div>

          {/* Slide Main Content */}
          <p style={{ fontSize: '0.84375rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '16px' }}>
            {currentSlide.content}
          </p>

          {/* Key Elements Breakdown for this slide */}
          {currentSlide.keyPoints && currentSlide.keyPoints.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
                Key Visual & Conceptual Elements:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {currentSlide.keyPoints.map((point, idx) => (
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
          )}

          {/* Mathematical Formulation if present on this slide */}
          {currentSlide.formula && (
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
              {currentSlide.formula}
            </div>
          )}

          {/* Conceptual Implication or Takeaway */}
          {(currentSlide.implication || currentSlide.takeaway) && (
            <div
              style={{
                padding: '10px 12px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-success-subtle)',
                border: '1px solid var(--color-success-border)',
                fontSize: '0.785rem',
                color: 'var(--color-success-text)',
                marginBottom: currentSlide.ocrText ? '14px' : '0'
              }}
            >
              <strong>Key Takeaway:</strong> {currentSlide.implication || currentSlide.takeaway}
            </div>
          )}

          {/* OCR Extracted Text if present on this slide */}
          {currentSlide.ocrText && (
            <div style={{ marginTop: '12px', padding: '10px 12px', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '4px' }}>
                OCR Text Extracted from Visual:
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', maxHeight: '90px', overflowY: 'auto', fontFamily: 'var(--font-mono)' }}>
                {currentSlide.ocrText}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. MODAL: Add Custom Diagram / Image */}
      {isAddModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '20px'
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '560px',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '24px',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)',
              borderRadius: '16px'
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'rgba(37, 99, 235, 0.1)', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ImageIcon size={18} />
                </div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Add Custom Image or Diagram
                </h3>
              </div>
              <button
                onClick={() => {
                  if (!isAnalyzing) {
                    setIsAddModalOpen(false);
                    setNewImageBase64(null);
                  }
                }}
                className="btn btn-ghost btn-sm"
                style={{ padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Upload any diagram, flowchart, graph, or lecture note. CogniLens Vision will extract the visual elements, transcribe formulas, and synthesize grounded multi-slide academic explanations.
            </p>

            {/* Image Upload Area */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                Diagram Image File (PNG, JPG, WEBP, SVG)
              </label>

              {!newImageBase64 ? (
                <label
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '28px 20px',
                    border: '2px dashed var(--accent-primary-border)',
                    borderRadius: '12px',
                    backgroundColor: 'var(--bg-surface-subtle)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Upload size={28} color="var(--accent-primary)" style={{ marginBottom: '8px' }} />
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--accent-primary)' }}>
                    Click or drag image to upload
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Supports PNG, JPG, JPEG, WEBP, SVG up to 10MB
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileChange}
                    style={{ display: 'none' }}
                  />
                </label>
              ) : (
                <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-default)', backgroundColor: '#18181b', padding: '12px', display: 'flex', justifyContent: 'center' }}>
                  <img
                    src={newImageBase64}
                    alt="Preview"
                    style={{ maxHeight: '200px', maxWidth: '100%', objectFit: 'contain', borderRadius: '6px' }}
                  />
                  <button
                    onClick={() => setNewImageBase64(null)}
                    style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      backgroundColor: 'rgba(0,0,0,0.7)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '50%',
                      width: '26px',
                      height: '26px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer'
                    }}
                    title="Remove preview"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>

            {/* Topic Input with Speech-To-Text */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Topic / Concept Title
                </label>
                <button
                  type="button"
                  onClick={() => handleStartSTT('topic')}
                  className={`btn ${isListening && listeningTarget === 'topic' ? 'btn-danger' : 'btn-ghost'} btn-sm`}
                  style={{ padding: '2px 8px', fontSize: '0.75rem', gap: '4px' }}
                  title="Speak topic into microphone"
                >
                  {isListening && listeningTarget === 'topic' ? (
                    <>
                      <MicOff size={13} className="animate-pulse" />
                      <span>Listening...</span>
                    </>
                  ) : (
                    <>
                      <Mic size={13} color="var(--accent-primary)" />
                      <span>Speak Topic</span>
                    </>
                  )}
                </button>
              </div>

              <input
                type="text"
                className="input-text"
                placeholder="e.g. Binary Search Tree AVL Rotation, TCP 3-Way Handshake"
                value={newTopic}
                onChange={(e) => setNewTopic(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>

            {/* Optional Specific Prompt with Speech-To-Text */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Specific Focus or Question (Optional)
                </label>
                <button
                  type="button"
                  onClick={() => handleStartSTT('prompt')}
                  className={`btn ${isListening && listeningTarget === 'prompt' ? 'btn-danger' : 'btn-ghost'} btn-sm`}
                  style={{ padding: '2px 8px', fontSize: '0.75rem', gap: '4px' }}
                  title="Speak instructions into microphone"
                >
                  {isListening && listeningTarget === 'prompt' ? (
                    <>
                      <MicOff size={13} className="animate-pulse" />
                      <span>Listening...</span>
                    </>
                  ) : (
                    <>
                      <Mic size={13} color="var(--accent-primary)" />
                      <span>Speak Prompt</span>
                    </>
                  )}
                </button>
              </div>

              <textarea
                className="input-text"
                rows={2}
                placeholder="e.g. Explain how node balancing works and write down the rotation formula..."
                value={newPrompt}
                onChange={(e) => setNewPrompt(e.target.value)}
                style={{ width: '100%', resize: 'vertical' }}
              />
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                disabled={isAnalyzing}
                className="btn btn-secondary btn-md"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleAnalyzeAndSaveDiagram}
                disabled={!newImageBase64 || isAnalyzing}
                className="btn btn-primary btn-md"
                style={{ gap: '8px' }}
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Synthesizing Vision Agent...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>Analyze with Vision Agent</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. MODAL: Voice Question (Speech-to-Text) on active diagram */}
      {isVoiceQueryModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '20px'
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '500px',
              padding: '24px',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
              borderRadius: '16px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'rgba(37, 99, 235, 0.1)', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Mic size={18} />
                </div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Voice Inquiry on Diagram
                </h3>
              </div>
              <button onClick={() => setIsVoiceQueryModalOpen(false)} className="btn btn-ghost btn-sm" style={{ padding: '4px' }}>
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Speak your question about <strong>{activePreset.title}</strong>. Your voice is transcribed via Speech-to-Text and answered by your AI Tutor.
            </p>

            {/* Mic trigger and status */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: '12px', border: '1px solid var(--border-subtle)', marginBottom: '16px' }}>
              <button
                type="button"
                onClick={() => handleStartSTT('query')}
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: isListening && listeningTarget === 'query' ? '#ef4444' : 'var(--accent-primary)',
                  color: '#ffffff',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: isListening && listeningTarget === 'query' ? '0 0 20px rgba(239, 68, 68, 0.6)' : '0 4px 12px rgba(37, 99, 235, 0.3)',
                  transition: 'all 0.2s ease',
                  marginBottom: '12px'
                }}
                className={isListening && listeningTarget === 'query' ? 'animate-pulse' : ''}
              >
                {isListening && listeningTarget === 'query' ? <MicOff size={28} /> : <Mic size={28} />}
              </button>

              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: isListening && listeningTarget === 'query' ? '#ef4444' : 'var(--text-primary)' }}>
                {isListening && listeningTarget === 'query' ? 'Listening... Speak now' : 'Click to Speak'}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Speech-to-Text (STT) active
              </span>
            </div>

            {/* Transcript preview / edit */}
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '6px' }}>
                Transcribed Question
              </label>
              <textarea
                className="input-text"
                rows={3}
                placeholder="Speak above or type your question here..."
                value={voiceQueryText}
                onChange={(e) => setVoiceQueryText(e.target.value)}
                style={{ width: '100%', resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setIsVoiceQueryModalOpen(false)}
                className="btn btn-secondary btn-md"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSendVoiceQuery}
                disabled={!voiceQueryText.trim()}
                className="btn btn-primary btn-md"
                style={{ gap: '6px' }}
              >
                <Sparkles size={16} />
                <span>Ask AI Tutor</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
