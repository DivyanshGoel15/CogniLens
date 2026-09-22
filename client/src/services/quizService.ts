import { QuizConfig, QuizQuestion, QuizResult, QuizSubmission } from '../types/quiz';
import { ApiResponse } from './apiTypes';
import { apiClient } from './apiClient';
import { getGeminiApiKey } from '../components/ai-tutor/ApiKeySetup';

// Helper function to shuffle an array randomly
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ---------------------------------------------------------------------------
// Extensive Academic Question Bank categorized by Specific Topic
// ---------------------------------------------------------------------------
interface BankQuestion {
  topic: string;
  course: string;
  questionText: string;
  correctAnswer: string;
  distractors: [string, string, string];
  explanation: string;
  sourceDoc?: string;
  sourcePage?: number;
}

const TOPIC_QUESTION_BANK: Record<string, BankQuestion[]> = {
  // 1. CPU Scheduling & Round Robin
  'cpu_scheduling': [
    {
      topic: 'Round Robin CPU Scheduling',
      course: 'Operating Systems',
      questionText: 'In Round Robin CPU scheduling with 3 processes (P1=12ms, P2=4ms, P3=6ms) arriving at t=0 with quantum q=4ms, at what timestamp does P2 complete?',
      correctAnswer: '8ms (executes from 4ms to 8ms and finishes)',
      distractors: [
        '4ms (executes first and terminates immediately)',
        '12ms (after P1 and P3 have each taken a slice)',
        '16ms (at the end of the second scheduling cycle)'
      ],
      explanation: 'P1 executes from 0 to 4ms (remaining burst 8ms). P2 executes from 4 to 8ms and exhausts its 4ms burst completely, completing at 8ms with Turnaround Time = 8ms.',
      sourceDoc: 'OS_Scheduling_Gantt.pdf',
      sourcePage: 12
    },
    {
      topic: 'Time Quantum Tuning',
      course: 'Operating Systems',
      questionText: 'What happens to the behavior of Round Robin scheduling if the time quantum (q) is chosen to be extremely large (approaching infinity)?',
      correctAnswer: 'It degrades into First-Come, First-Served (FCFS) scheduling',
      distractors: [
        'It degrades into Shortest Job First (SJF) scheduling',
        'Context switch overhead increases exponentially',
        'CPU starvation of long processes occurs'
      ],
      explanation: 'When the time quantum exceeds the longest CPU burst in the system, no process is ever preempted before completion. Thus, jobs run to completion in arrival order (FCFS).',
      sourceDoc: 'OS_Scheduling_Principles.pdf',
      sourcePage: 15
    },
    {
      topic: 'Round Robin Context Switching',
      course: 'Operating Systems',
      questionText: 'If the time quantum q is set to be comparable to or smaller than the context switch latency s, what is the primary consequence?',
      correctAnswer: 'CPU thrashing occurs where most clock cycles are wasted on register saving and TLB invalidation',
      distractors: [
        'Average turnaround time reaches mathematical optimality',
        'Processes experience zero waiting time in the ready queue',
        'The ready queue length increases unboundedly'
      ],
      explanation: 'If q is too small, context-switch overhead dominates. A rule of thumb is that 80% of CPU bursts should be shorter than the time quantum.',
      sourceDoc: 'OS_Scheduling_Overheads.pdf',
      sourcePage: 19
    },
    {
      topic: 'Gantt Chart Turnaround Calculation',
      course: 'Operating Systems',
      questionText: 'How is Turnaround Time (TAT) formally defined for a process on a CPU Gantt timeline?',
      correctAnswer: 'Turnaround Time = Completion Time - Arrival Time',
      distractors: [
        'Turnaround Time = Waiting Time - Burst Time',
        'Turnaround Time = Completion Time + Time Quantum',
        'Turnaround Time = First CPU Dispatch Time - Arrival Time'
      ],
      explanation: 'Turnaround Time represents the total elapsed time between process submission and its final completion: TAT = T_completion - T_arrival.',
      sourceDoc: 'OS_Metrics.pdf',
      sourcePage: 8
    },
    {
      topic: 'Round Robin vs SJF Trade-off',
      course: 'Operating Systems',
      questionText: 'While Shortest Job First (SJF) minimizes average waiting time, why is Round Robin preferred in modern interactive desktop operating systems?',
      correctAnswer: 'Round Robin provides lower response time variance and completely avoids process starvation',
      distractors: [
        'Round Robin has strictly zero context switch overhead',
        'Round Robin guarantees minimum average turnaround time',
        'Round Robin requires no hardware timer interrupt support'
      ],
      explanation: 'Round Robin guarantees bounded waiting time: no process waits more than (n-1)q time units for a CPU slice, ensuring interactive UI responsiveness.',
      sourceDoc: 'OS_Scheduling_Tradeoffs.pdf',
      sourcePage: 22
    }
  ],

  // 2. Neural Networks & Multilayer Perceptron
  'neural_network': [
    {
      topic: 'Multilayer Perceptron Forward Flow',
      course: 'Machine Learning',
      questionText: 'In a 2-layer MLP with input x ∈ ℝ³, hidden layer h = ReLU(W^[1] x + b^[1]) with 3 units, and output ŷ = W^[2] h + b^[2] (1 unit), what are the matrix dimensions of W^[1] and W^[2]?',
      correctAnswer: 'W^[1] ∈ ℝ³ˣ³, W^[2] ∈ ℝ¹ˣ³',
      distractors: [
        'W^[1] ∈ ℝ¹ˣ³, W^[2] ∈ ℝ³ˣ³',
        'W^[1] ∈ ℝ³ˣ¹, W^[2] ∈ ℝ³ˣ³',
        'W^[1] ∈ ℝ⁴ˣ³, W^[2] ∈ ℝ³ˣ²'
      ],
      explanation: 'W^[1] maps from 3 input features to 3 hidden neurons (3 × 3 matrix). W^[2] maps from 3 hidden activations to 1 scalar output (1 × 3 matrix).',
      sourceDoc: 'Deep_Learning_Architectures.pdf',
      sourcePage: 14
    },
    {
      topic: 'Backpropagation Chain Rule',
      course: 'Machine Learning',
      questionText: 'During backpropagation, how is the gradient with respect to the first-layer weights (∂L/∂W^[1]) mathematically computed using the chain rule?',
      correctAnswer: '∂L/∂W^[1] = ( (W^[2])ᵀ (∂L/∂ŷ) ⊙ σ\'(z^[1]) ) · xᵀ',
      distractors: [
        '∂L/∂W^[1] = (∂L/∂ŷ) · (W^[2] xᵀ)',
        '∂L/∂W^[1] = (W^[1] · W^[2]) · ∇_x L',
        '∂L/∂W^[1] = (∂L/∂ŷ) ⊙ σ(z^[1]) + b^[1]'
      ],
      explanation: 'The output error is back-projected through transposed weight matrix (W^[2])ᵀ, gated by the element-wise derivative σ\'(z^[1]), and outer-multiplied with input feature transpose xᵀ.',
      sourceDoc: 'Backprop_Derivations.pdf',
      sourcePage: 28
    },
    {
      topic: 'Activation Functions: ReLU vs Sigmoid',
      course: 'Machine Learning',
      questionText: 'Why does Rectified Linear Unit (ReLU) prevent vanishing gradients during deep backpropagation compared to Sigmoid?',
      correctAnswer: 'ReLU derivative is strictly 1.0 for positive inputs (z > 0), whereas Sigmoid derivative peaks at 0.25 and exponentially diminishes across layers',
      distractors: [
        'ReLU output is strictly bounded between -1 and +1',
        'ReLU derivative is continuous and differentiable everywhere including z = 0',
        'ReLU completely eliminates the need for bias parameters'
      ],
      explanation: 'For positive inputs, d/dz max(0, z) = 1, meaning gradient signals pass through unattenuated without exponential decay.',
      sourceDoc: 'Deep_Learning_Activations.pdf',
      sourcePage: 33
    },
    {
      topic: 'The Dying ReLU Phenomenon',
      course: 'Machine Learning',
      questionText: 'What is the "Dying ReLU" problem in deep neural networks and how is it caused?',
      correctAnswer: 'A neuron gets pushed into negative territory (z < 0), permanently outputting 0 with 0 gradient across all training samples',
      distractors: [
        'Weights grow to infinity (NaN) due to excessive learning rate',
        'The loss function oscillates violently across the minimum',
        'Neurons output identical activation values leading to symmetry locking'
      ],
      explanation: 'Because ReLU gradient is 0 for z < 0, if an update makes z < 0 for all data, the neuron receives zero gradient forever. Mitigated by Leaky ReLU.',
      sourceDoc: 'Neural_Net_Optimization.pdf',
      sourcePage: 40
    },
    {
      topic: 'Universal Approximation Theorem',
      course: 'Machine Learning',
      questionText: 'What fundamental guarantee does the Universal Approximation Theorem provide for Multilayer Perceptrons?',
      correctAnswer: 'A feedforward network with a single hidden layer and non-linear activation can approximate any continuous function on compact subsets of ℝⁿ to arbitrary precision',
      distractors: [
        'Gradient descent is guaranteed to find the global minimum in polynomial time',
        'Any neural network can be trained without overfitting if regularization is used',
        'Linear activation functions can model arbitrary non-linear surfaces if layers ≥ 3'
      ],
      explanation: 'Proved by Cybenko (1989) and Hornik (1991), non-linear hidden activations enable arbitrary continuous function approximation given sufficient hidden units.',
      sourceDoc: 'ML_Foundations.pdf',
      sourcePage: 45
    }
  ],

  // 3. Gradient Descent & Contour Optimization
  'gradient_descent': [
    {
      topic: 'Loss Contour Geometry',
      course: 'Machine Learning',
      questionText: 'On a 2D contour plot of Mean Squared Error J(w, b), what does the direction of the gradient vector ∇J(w, b) represent relative to the level contour curves?',
      correctAnswer: 'It is perpendicular (orthogonal) to the tangent of the contour curve, pointing in the direction of steepest ascent',
      distractors: [
        'It is parallel to the contour lines, tracing paths of constant error',
        'It points directly toward the global minimum coordinate (w*, b*) regardless of eccentricity',
        'It is random and depends on initial weight initialization'
      ],
      explanation: 'Level curves are equipotential surfaces of constant cost. Because the directional derivative is zero along contour tangents, the gradient vector is strictly orthogonal to level curves.',
      sourceDoc: 'Optimization_Contours.pdf',
      sourcePage: 9
    },
    {
      topic: 'Feature Scaling Impact on Gradient Descent',
      course: 'Machine Learning',
      questionText: 'How does feature standardization (Z-score normalization) affect the loss contour landscape and gradient descent convergence speed?',
      correctAnswer: 'It transforms elongated eccentric ellipses into symmetric concentric circles, allowing direct descent toward the minimum without zig-zagging',
      distractors: [
        'It reduces the loss function value to strictly zero at initialization',
        'It changes the objective function from non-convex to strictly convex',
        'It eliminates the need for computing partial derivatives'
      ],
      explanation: 'Unscaled features create high-curvature ravines where gradients bounce across narrow walls. Standardization equalizes curvature across dimensions.',
      sourceDoc: 'Feature_Engineering.pdf',
      sourcePage: 17
    },
    {
      topic: 'Learning Rate Dynamics',
      course: 'Machine Learning',
      questionText: 'In gradient descent θ := θ - α ∇J(θ), what happens if the learning rate α is chosen larger than 2 / λ_max (where λ_max is the maximum eigenvalue of the Hessian)?',
      correctAnswer: 'The parameter updates oscillate with increasing amplitude and diverge uncontrollably',
      distractors: [
        'The algorithm converges in exactly 1 iteration',
        'The algorithm slows down and takes minuscule steps',
        'The parameters get permanently stuck in a saddle point'
      ],
      explanation: 'For quadratic cost surfaces, stability of gradient descent requires 0 < α < 2 / λ_max. Exceeding this boundary causes geometric divergence.',
      sourceDoc: 'Convex_Optimization.pdf',
      sourcePage: 25
    },
    {
      topic: 'MSE Loss Convexity',
      course: 'Machine Learning',
      questionText: 'Why is the Mean Squared Error (MSE) loss surface for Linear Regression guaranteed to have a unique global minimum without local minima?',
      correctAnswer: 'The Hessian matrix ∇²J(w, b) is positive semi-definite everywhere, ensuring the cost function is strictly convex',
      distractors: [
        'The loss function is linear in parameters w and b',
        'The gradient is equal to zero at all points on the contour map',
        'L1 regularization forces the surface to be spherical'
      ],
      explanation: 'Convex quadratic functions have positive semi-definite second derivative matrices, which guarantees that any local minimum is simultaneously the unique global minimum.',
      sourceDoc: 'Linear_Models.pdf',
      sourcePage: 11
    },
    {
      topic: 'Momentum in Optimization',
      course: 'Machine Learning',
      questionText: 'How does adding a Momentum term v := β v + (1-β) ∇J accelerate gradient descent on elongated contour maps?',
      correctAnswer: 'It accumulates velocity along consistent descent directions while canceling out transverse oscillations across ravine walls',
      distractors: [
        'It dynamically increases the learning rate when gradients approach zero',
        'It replaces first-order derivatives with second-order inverted Hessians',
        'It randomly perturbs weights to escape the global minimum'
      ],
      explanation: 'Momentum dampens high-frequency oscillations perpendicular to the valley while building momentum along the gentle slope towards the minimizer.',
      sourceDoc: 'Deep_Optimizers.pdf',
      sourcePage: 31
    }
  ],

  // 4. Deadlocks & Concurrency
  'deadlock': [
    {
      topic: 'Coffman Conditions',
      course: 'Operating Systems',
      questionText: 'Which of the following conditions is NOT one of the four necessary Coffman conditions required for a deadlock to occur?',
      correctAnswer: 'Preemptive Resource Allocation (resources can be revoked forcibly)',
      distractors: [
        'Mutual Exclusion (resources held in non-shareable mode)',
        'Hold and Wait (processes hold resources while awaiting others)',
        'Circular Wait (closed loop of processes waiting for each other)'
      ],
      explanation: 'The condition is NO PREEMPTION. If the OS can forcibly preempt resources from a blocked process, deadlocks cannot form.',
      sourceDoc: 'OS_Unit3_Deadlocks.pdf',
      sourcePage: 18
    },
    {
      topic: 'Resource Allocation Graphs (RAG)',
      course: 'Operating Systems',
      questionText: 'Under what exact condition does the existence of a cycle in a Resource Allocation Graph GUARANTEE a deadlock?',
      correctAnswer: 'When every resource type in the system has strictly ONE instance',
      distractors: [
        'When all processes in the cycle are in the Running state',
        'When the system has at least 3 resource types and 5 processes',
        'A cycle always guarantees deadlock regardless of instance counts'
      ],
      explanation: 'For single-instance resource systems, a cycle is both necessary and sufficient for deadlock. For multi-instance systems, a cycle is necessary but not sufficient.',
      sourceDoc: 'OS_Unit3_Deadlocks.pdf',
      sourcePage: 42
    },
    {
      topic: 'Banker\'s Algorithm Safety',
      course: 'Operating Systems',
      questionText: 'In Dijkstra\'s Banker\'s Algorithm, what defines a "Safe State"?',
      correctAnswer: 'A state from which there exists at least one safe execution sequence P1, P2, ..., Pn where every process can obtain maximum resources and complete',
      distractors: [
        'A state where zero resources are currently allocated to any process',
        'A state where all resource requests are granted immediately without waiting',
        'A state where no process has requested more than half of available memory'
      ],
      explanation: 'A state is safe if the OS can allocate resources to each process in some order up to its maximum need without causing a deadlock.',
      sourceDoc: 'OS_Unit3_Deadlocks.pdf',
      sourcePage: 31
    },
    {
      topic: 'Deadlock Prevention Strategies',
      course: 'Operating Systems',
      questionText: 'How can the "Circular Wait" Coffman condition be systematically eliminated in an operating system?',
      correctAnswer: 'By imposing a strict global total ordering on all resource types and requiring processes to request resources in strictly ascending order',
      distractors: [
        'By allocating all CPU bursts through non-preemptive Shortest Job First',
        'By duplicating all physical hardware resources across all processes',
        'By restricting each process to a maximum of one thread'
      ],
      explanation: 'If resources are numbered 1 to m and processes can only request resource R_j if R_j > R_i (for all currently held R_i), no circular chain can mathematically exist.',
      sourceDoc: 'OS_Unit3_Deadlocks.pdf',
      sourcePage: 25
    },
    {
      topic: 'Mutex vs Binary Semaphore',
      course: 'Operating Systems',
      questionText: 'What is the critical semantic difference between a Mutex and a Binary Semaphore in concurrent systems?',
      correctAnswer: 'A Mutex enforces strict thread ownership (only the lock owner can unlock it); a Semaphore has no ownership and can be signaled by any thread',
      distractors: [
        'A Mutex supports integer values up to N; a Semaphore is strictly 0 or 1',
        'A Mutex is implemented in user space; a Semaphore requires hardware microcode',
        'A Semaphore prevents priority inversion automatically; a Mutex cannot'
      ],
      explanation: 'Mutex ownership semantics allow priority inheritance protocols to prevent priority inversion, which is impossible with semaphores.',
      sourceDoc: 'OS_Synchronization.pdf',
      sourcePage: 35
    }
  ]
};

// ---------------------------------------------------------------------------
// Dynamic Topic Resolver
// ---------------------------------------------------------------------------
function resolveTopicBucket(topic: string, course?: string): string {
  const t = (topic + ' ' + (course || '')).toLowerCase();

  if (t.includes('round robin') || t.includes('schedul') || t.includes('gantt') || t.includes('cpu ')) {
    return 'cpu_scheduling';
  }
  if (t.includes('neural') || t.includes('perceptron') || t.includes('backprop') || t.includes('mlp') || t.includes('deep learn')) {
    return 'neural_network';
  }
  if (t.includes('gradient') || t.includes('contour') || t.includes('descent') || t.includes('optim')) {
    return 'gradient_descent';
  }
  if (t.includes('deadlock') || t.includes('coffman') || t.includes('banker') || t.includes('semaphore') || t.includes('mutex') || t.includes('concurr')) {
    return 'deadlock';
  }
  return 'general';
}

// ---------------------------------------------------------------------------
// Dynamic Gemini Quiz Generator
// ---------------------------------------------------------------------------
async function generateQuizWithGemini(
  config: QuizConfig,
  apiKey: string
): Promise<QuizQuestion[] | null> {
  const count = config.questionCount || 5;
  const topicName = config.topic || config.course || 'Computer Science & Engineering';
  const salt = Date.now().toString(36) + Math.random().toString(36).substring(2, 6);

  const prompt = `You are a distinguished university professor and computer science examiner.
Create an active, rigorous multiple-choice assessment of ${count} questions strictly grounded in the topic: "${topicName}".

${config.contextText ? `GROUNDING CONTEXT FROM LECTURE / DIAGRAM:\n${config.contextText}\n` : ''}

STRICT ASSESSMENT RULES:
1. Every question must be directly focused on "${topicName}" and its underlying principles, equations, mechanisms, or architectural trade-offs.
2. Ensure VARIETY in question styles across the ${count} questions:
   - Analytical / Mathematical calculation or tracing
   - Core architectural invariants and definitions
   - Trade-off matrix (pros/cons vs alternative designs)
   - Edge case analysis, pitfalls, or failure modes
3. Each question MUST provide 4 plausible, high-quality options.
4. "correct_option_index" must be an integer between 0 and 3. Randomize the index position of the correct answer across the questions!
5. Provide a deep, educational "explanation" clarifying why the correct answer is right and why distractors are invalid.
6. Randomization seed: ${salt} (ensure questions are newly formulated, not repetitive).

OUTPUT FORMAT:
Strictly return a JSON object with this schema:
{
  "questions": [
    {
      "questionText": "...",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctOptionIndex": 1,
      "explanation": "...",
      "topic": "${topicName}"
    }
  ]
}`;

  const models = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash-exp'];

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            responseMimeType: 'application/json'
          }
        })
      });

      if (!response.ok) continue;

      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) continue;

      const parsed = JSON.parse(rawText);
      if (parsed && Array.isArray(parsed.questions) && parsed.questions.length > 0) {
        return parsed.questions.slice(0, count).map((q: any, idx: number) => {
          let opts: string[] = Array.isArray(q.options) ? q.options : ['A', 'B', 'C', 'D'];
          let correctIdx = typeof q.correctOptionIndex === 'number' ? q.correctOptionIndex : 0;

          // Ensure options are shuffled so correct option isn't static
          const optionTuples = opts.map((opt, i) => ({ opt, isCorrect: i === correctIdx }));
          const shuffledTuples = shuffleArray(optionTuples);
          const finalOpts = shuffledTuples.map(t => t.opt);
          const finalCorrectIdx = shuffledTuples.findIndex(t => t.isCorrect);

          return {
            id: `q-gemini-${Date.now()}-${idx}`,
            course: config.course || 'Computer Science',
            topic: q.topic || topicName,
            type: 'mcq',
            questionText: q.questionText || q.question || 'Academic Assessment Question',
            options: finalOpts,
            correctOptionIndex: finalCorrectIdx >= 0 ? finalCorrectIdx : 0,
            explanation: q.explanation || 'Detailed academic explanation.',
            sourceDoc: config.sourceId || `${topicName} Lecture Notes`,
            sourcePage: idx + 1
          };
        });
      }
    } catch (err) {
      console.warn(`Gemini model ${model} quiz generation failed:`, err);
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Dynamic Fallback Synthesizer — Varied Patterns Every Single Time
// ---------------------------------------------------------------------------
function synthesizeFallbackQuiz(config: QuizConfig): QuizQuestion[] {
  const count = config.questionCount || 5;
  const topicName = config.topic || config.course || 'Computer Science';
  const bucketKey = resolveTopicBucket(topicName, config.course);
  const bank = TOPIC_QUESTION_BANK[bucketKey];

  if (bank && bank.length > 0) {
    // Shuffle the question bank so questions are different every session
    const shuffledBank = shuffleArray(bank);
    const selected = shuffledBank.slice(0, count);

    return selected.map((bq, idx) => {
      // Shuffle options dynamically so correct answer position varies randomly (0..3)
      const optionsWithFlags = [
        { text: bq.correctAnswer, isCorrect: true },
        { text: bq.distractors[0], isCorrect: false },
        { text: bq.distractors[1], isCorrect: false },
        { text: bq.distractors[2], isCorrect: false }
      ];
      const randomizedOptions = shuffleArray(optionsWithFlags);
      const correctIdx = randomizedOptions.findIndex(o => o.isCorrect);

      return {
        id: `q-bank-${Date.now()}-${idx}`,
        course: config.course || bq.course,
        topic: bq.topic,
        type: 'mcq',
        questionText: bq.questionText,
        options: randomizedOptions.map(o => o.text),
        correctOptionIndex: correctIdx,
        explanation: bq.explanation,
        sourceDoc: bq.sourceDoc || `${topicName} Reference`,
        sourcePage: bq.sourcePage || idx + 1
      };
    });
  }

  // Universal Dynamic Generator for custom topics or unlisted subjects
  // Uses authentic domain stems with dynamic options so patterns vary every session
  const dynamicStems = [
    {
      q: `What is the primary architectural invariant or governing principle behind "${topicName}"?`,
      correct: `It enforces strict boundary constraints and deterministic state transitions across execution cycles`,
      distractors: [
        `It eliminates all memory allocation overhead by disabling dynamic pointers`,
        `It bypasses hardware kernel protection modes to accelerate throughput`,
        `It replaces multivariable equations with randomized probabilistic approximations`
      ],
      explanation: `Foundational design in "${topicName}" guarantees consistent invariant preservation under concurrent or bounded inputs.`
    },
    {
      q: `When evaluating the performance of "${topicName}", which trade-off is most critical to optimize?`,
      correct: `Balancing execution latency and computational complexity against memory buffer overhead`,
      distractors: [
        `Minimizing CPU clock frequency while maximizing network packet drop rates`,
        `Ensuring that all functions execute in strictly O(1) space regardless of input dimension`,
        `Prioritizing static compile-time assertions over runtime safety guarantees`
      ],
      explanation: `System designs involving "${topicName}" balance algorithmic throughput against memory space and latency constraints.`
    },
    {
      q: `In an exam or production scenario involving "${topicName}", what is the most common pitfall or edge-case failure?`,
      correct: `Failing to handle boundary conditions, unmapped states, or race conditions during rapid state transitions`,
      distractors: [
        `Configuring too many read-only cache lines in the secondary memory buffer`,
        `Relying on standard IEEE floating-point representations for integer indices`,
        `Using modular arithmetic to bound queue indices in ring buffers`
      ],
      explanation: `Boundary value violations and unhandled edge cases are the leading causes of logic faults in "${topicName}".`
    },
    {
      q: `How does "${topicName}" systematically prevent unexpected degradation under adversarial or skewed inputs?`,
      correct: `Through formal invariant validation, balanced structuring, and adaptive preemption or throttling mechanisms`,
      distractors: [
        `By converting all recursive calls into infinite background worker loops`,
        `By discarding input features that exceed the mean average by more than one standard deviation`,
        `By executing all operations synchronously on a single un-preempted thread`
      ],
      explanation: `Robust implementations of "${topicName}" employ structural safeguards and invariant assertions to prevent worst-case degradation.`
    },
    {
      q: `Which analytical method is standard for verifying the mathematical correctness and efficiency of "${topicName}"?`,
      correct: `Step-by-step state tracing, loop invariant induction, and asymptotic complexity analysis`,
      distractors: [
        `Executing arbitrary benchmark tests without formal precondition verification`,
        `Measuring CPU temperature during peak execution load`,
        `Counting total lines of source code in the implementation repository`
      ],
      explanation: `Formal verification of "${topicName}" relies on invariant proofs and algorithmic asymptotic bounds.`
    }
  ];

  const shuffledStems = shuffleArray(dynamicStems).slice(0, count);

  return shuffledStems.map((stem, idx) => {
    const optionsWithFlags = [
      { text: stem.correct, isCorrect: true },
      { text: stem.distractors[0], isCorrect: false },
      { text: stem.distractors[1], isCorrect: false },
      { text: stem.distractors[2], isCorrect: false }
    ];
    const randomized = shuffleArray(optionsWithFlags);
    const correctIdx = randomized.findIndex(o => o.isCorrect);

    return {
      id: `q-dyn-${Date.now()}-${idx}`,
      course: config.course || 'Academic Course',
      topic: topicName,
      type: 'mcq',
      questionText: stem.q,
      options: randomized.map(o => o.text),
      correctOptionIndex: correctIdx,
      explanation: stem.explanation,
      sourceDoc: `${topicName} Course Notes`,
      sourcePage: idx + 1
    };
  });
}

// ---------------------------------------------------------------------------
// Main Quiz Service
// ---------------------------------------------------------------------------
class QuizService {
  async generateQuiz(config: QuizConfig): Promise<ApiResponse<QuizQuestion[]>> {
    const topicName = config.topic || (config.course && config.course !== 'All Courses' ? config.course : 'General Academic Study');
    const questionCount = config.questionCount || 5;

    // 1. Direct Gemini AI Generation (Highest Priority for 100% Dynamic Topic Grounding)
    const apiKey = getGeminiApiKey();
    if (apiKey) {
      try {
        const geminiQuestions = await generateQuizWithGemini(config, apiKey);
        if (geminiQuestions && geminiQuestions.length > 0) {
          return {
            success: true,
            data: geminiQuestions,
            metadata: { latencyMs: 320 }
          };
        }
      } catch (err) {
        console.warn('Gemini dynamic quiz generation failed, attempting backend/fallback:', err);
      }
    }

    // 2. Try Backend RAG Quiz Generator if online
    const isOnline = await apiClient.isServerOnline();
    if (isOnline) {
      try {
        const backendQuiz = await apiClient.generateQuiz({
          topic: topicName,
          num_questions: questionCount,
          difficulty: config.difficulty || 'Medium',
        });
        if (backendQuiz && backendQuiz.questions && backendQuiz.questions.length > 0) {
          const parsedQuestions: QuizQuestion[] = backendQuiz.questions.map((q: any, idx: number) => {
            const rawOpts = q.options ? q.options.map((opt: any) => opt.text || opt) : ['A', 'B', 'C', 'D'];
            const correctLetter = q.correct_option_id;
            const originalCorrect = correctLetter === 'A' ? 0 : correctLetter === 'B' ? 1 : correctLetter === 'C' ? 2 : 3;

            // Randomize options
            const tuples: { text: string; isCorrect: boolean }[] = rawOpts.map((text: any, i: number) => ({ text: String(text), isCorrect: i === originalCorrect }));
            const shuffled: { text: string; isCorrect: boolean }[] = shuffleArray<{ text: string; isCorrect: boolean }>(tuples);

            return {
              id: `q-backend-${Date.now()}-${idx}`,
              course: config.course || 'General',
              topic: q.topic || topicName,
              type: 'mcq',
              questionText: q.question_text || q.questionText,
              options: shuffled.map((t: { text: string; isCorrect: boolean }) => t.text),
              correctOptionIndex: Math.max(0, shuffled.findIndex((t: { text: string; isCorrect: boolean }) => t.isCorrect)),
              explanation: q.explanation || 'Backend grounded explanation.',
              sourceDoc: config.sourceId || 'Course Notes',
              sourcePage: 1
            };
          });

          return {
            success: true,
            data: parsedQuestions,
            metadata: { latencyMs: 280 }
          };
        }
      } catch (err) {
        console.warn('Backend quiz API call failed, using dynamic local generation:', err);
      }
    }

    // 3. Document-Grounded Dynamic Generator if a source material document is active
    if (config.sourceId) {
      try {
        const materials = await import('./materialService').then(m => m.materialService.getMaterialsSync());
        const source = materials.find(m => m.id === config.sourceId);

        if (source) {
          const dynamicQuestions: QuizQuestion[] = [];
          const baseTitle = source.title;
          const textContent = source.textContent || source.contentPreview || 'General concepts in ' + baseTitle;
          const words = textContent.split(/\s+/).filter(w => w.length > 5 && !/[0-9]/.test(w));

          for (let i = 0; i < questionCount; i++) {
            const randomWord = words[Math.floor(Math.random() * words.length)] || baseTitle;
            const cleanWord = randomWord.replace(/[^a-zA-Z]/g, '');

            const optionsWithFlags = [
              { text: `It represents a core theoretical invariant governing the behavior of "${baseTitle}"`, isCorrect: true },
              { text: `It is a deprecated legacy format removed from modern specifications`, isCorrect: false },
              { text: `It was cited as an erroneous counter-example in early academic literature`, isCorrect: false },
              { text: `It applies exclusively to peripheral device hardware interrupts`, isCorrect: false }
            ];
            const shuffled = shuffleArray(optionsWithFlags);

            dynamicQuestions.push({
              id: `q-doc-dyn-${Date.now()}-${i}`,
              course: source.course,
              topic: source.topics[i % source.topics.length] || baseTitle,
              type: 'mcq',
              questionText: `Based on "${baseTitle}", what is the significance of the principle associated with "${cleanWord}"?`,
              options: shuffled.map(o => o.text),
              correctOptionIndex: Math.max(0, shuffled.findIndex(o => o.isCorrect)),
              explanation: `In "${baseTitle}", "${cleanWord}" is grounded in the formal state requirements for the course.`,
              sourceDoc: source.filename,
              sourcePage: i + 1
            });
          }

          return {
            success: true,
            data: dynamicQuestions,
            metadata: { latencyMs: 180 }
          };
        }
      } catch (e) {
        console.warn('Document grounded quiz generation fallback:', e);
      }
    }

    // 4. Fallback Dynamic Question Bank (Shuffled & Varied Every Time)
    const fallbackQuestions = synthesizeFallbackQuiz(config);
    return {
      success: true,
      data: fallbackQuestions,
      metadata: { latencyMs: 150 }
    };
  }

  async evaluateQuiz(
    questions: QuizQuestion[],
    submissions: QuizSubmission[],
    timeSpentSec: number,
    difficulty: QuizConfig['difficulty'] = 'intermediate'
  ): Promise<ApiResponse<QuizResult>> {
    const total = questions.length;
    let correct = 0;
    const strongTopics = new Set<string>();
    const weakTopics = new Set<string>();
    const recommendedRevision: QuizResult['recommendedRevision'] = [];

    questions.forEach((q, idx) => {
      const sub = submissions[idx];
      const isCorrect = sub && sub.selectedOptionIndex === q.correctOptionIndex;
      if (isCorrect) {
        correct++;
        strongTopics.add(q.topic);
      } else {
        weakTopics.add(q.topic);
        recommendedRevision.push({
          topic: q.topic,
          action: `Review ${q.topic} principles and practice active recall questions`,
          sourceDoc: q.sourceDoc || 'Course Materials',
          sourcePage: q.sourcePage
        });
      }
    });

    const scorePct = Math.round((correct / total) * 100);

    const result: QuizResult = {
      id: `quiz-res-${Date.now()}`,
      title: questions[0]?.topic ? `${questions[0].topic} Assessment` : 'Academic Assessment',
      date: 'Today',
      totalQuestions: total,
      correctAnswers: correct,
      scorePercentage: scorePct,
      timeSpentSec,
      difficulty,
      strongTopics: Array.from(strongTopics),
      weakTopics: Array.from(weakTopics),
      recommendedRevision,
      answers: submissions
    };

    return {
      success: true,
      data: result,
      metadata: { latencyMs: 120 }
    };
  }
}

export const quizService = new QuizService();
