import { ChatMessage, SourceReference, AgentTaskActivity, MultimodalAttachment } from '../types/chat';
import { ApiResponse, StructuredAgentResponse } from './apiTypes';

export interface StreamEvent {
  type: 'activity_step' | 'chunk' | 'sources' | 'actions' | 'complete';
  stepIndex?: number;
  activity?: AgentTaskActivity;
  textChunk?: string;
  sources?: SourceReference[];
  actions?: ChatMessage['suggestedActions'];
  fullResponse?: StructuredAgentResponse;
}

export const INITIAL_CONVERSATION_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-welcome',
    role: 'assistant',
    content: "Welcome to Cognita. I've indexed your materials across **Operating Systems**, **Machine Learning**, **DBMS**, **Java OOP**, and **Computer Networks**.\n\nYou can ask me complex conceptual questions, attach diagrams or handwritten notes, or request grounded practice quizzes.",
    timestamp: '10:00 AM',
    suggestedActions: [
      { id: 'act-1', label: 'Explain Deadlock from OS Notes', actionType: 'explain_further', payload: { query: 'Explain deadlock using my OS notes' } },
      { id: 'act-2', label: 'Analyze CPU Scheduling Diagram', actionType: 'open_source', payload: { diagram: 'cpu_scheduling' } },
      { id: 'act-3', label: 'Create 5-min Quiz on Linear Regression', actionType: 'create_quiz', payload: { topic: 'Linear Regression', count: 5 } }
    ]
  }
];

class AIService {
  async processUserMessage(
    userPrompt: string,
    attachments: MultimodalAttachment[] = [],
    selectedSources: string[] = [],
    onStream?: (event: StreamEvent) => void
  ): Promise<ApiResponse<StructuredAgentResponse>> {
    const isDeadlockQuery = /deadlock|os|operating system|rag|resource allocation/i.test(userPrompt);
    const isMLQuery = /linear regression|gradient descent|loss|mse|machine learning/i.test(userPrompt);
    const isDiagramQuery = /diagram|scheduling|gantt|cpu|fcfs|sjf|round robin/i.test(userPrompt) || attachments.some(a => a.type === 'image');
    const isDBMSQuery = /normalization|dbms|bcnf|3nf|functional dependency/i.test(userPrompt);

    // Initial agent activity state
    const activity: AgentTaskActivity = {
      taskTitle: 'Analyzing grounded materials & synthesizing response',
      status: 'running',
      steps: [
        { id: 's1', label: 'Scanning 7 indexed course materials', status: 'in_progress', detail: 'Evaluating vector embeddings against query' },
        { id: 's2', label: 'Extracting source citations & page snippets', status: 'pending' },
        { id: 's3', label: 'Synthesizing conceptual explanation', status: 'pending' }
      ]
    };

    if (onStream) {
      onStream({ type: 'activity_step', activity: { ...activity } });
    }

    await new Promise(r => setTimeout(r, 450));
    activity.steps[0].status = 'completed';
    activity.steps[1].status = 'in_progress';
    activity.steps[1].detail = isDeadlockQuery ? 'Found relevant sections in OS_Unit3_Deadlocks.pdf (p. 18 & 42)' :
                               isMLQuery ? 'Retrieved definitions from ML_Linear_Regression.pdf (p. 4 & 12)' :
                               'Extracted verified excerpts from indexed course library';

    if (onStream) {
      onStream({ type: 'activity_step', activity: { ...activity } });
    }

    await new Promise(r => setTimeout(r, 450));
    activity.steps[1].status = 'completed';
    activity.steps[2].status = 'in_progress';
    activity.steps[2].detail = 'Structuring academic explanation with definitions and key properties';

    if (onStream) {
      onStream({ type: 'activity_step', activity: { ...activity } });
    }

    let responseText = "";
    let sources: SourceReference[] = [];
    let suggestedActions: ChatMessage['suggestedActions'] = [];
    let relatedTopics: string[] = [];

    if (isDeadlockQuery) {
      responseText = `A **Deadlock** is a permanent blocking condition in an Operating System where a set of processes are unable to proceed because each process is holding a resource and waiting to acquire another resource currently held by another process in the same set.\n\n### The 4 Necessary Coffman Conditions:\n1. **Mutual Exclusion**: At least one resource must be held in a non-shareable mode (only one process can use it at a time).\n2. **Hold and Wait**: A process is holding at least one resource while waiting to acquire additional resources held by other processes.\n3. **No Preemption**: Resources cannot be forcibly taken from a process; they can only be released voluntarily.\n4. **Circular Wait**: A closed chain of processes $\{P_0, P_1, \\dots, P_n\}$ exists such that $P_0$ is waiting for a resource held by $P_1$, and $P_n$ is waiting for a resource held by $P_0$.\n\n### Deadlock Detection via Resource Allocation Graph (RAG):\nIn a system where each resource type has **exactly one instance**, the presence of a **cycle in the Resource Allocation Graph (RAG)** is both a necessary and sufficient condition for deadlock.`;
      
      sources = [
        {
          id: 'src-os-1',
          documentId: 'mat-os-unit3',
          documentTitle: 'OS — Unit 3 Deadlocks & Synchronization',
          filename: 'OS_Unit3_Deadlocks.pdf',
          page: 18,
          snippet: 'Four Coffman Conditions: Mutual Exclusion, Hold & Wait, No Preemption, Circular Wait must hold simultaneously.',
          confidence: 0.98
        },
        {
          id: 'src-os-2',
          documentId: 'mat-os-unit3',
          documentTitle: 'OS — Unit 3 Deadlocks & Synchronization',
          filename: 'OS_Unit3_Deadlocks.pdf',
          page: 42,
          snippet: 'Resource Allocation Graph & Deadlock Detection: In single-instance resource systems, a cycle implies deadlock.',
          confidence: 0.95
        }
      ];

      suggestedActions = [
        { id: 'act-q-os', label: 'Create 5-Question Quiz on Deadlocks', actionType: 'create_quiz', payload: { course: 'Operating Systems', topic: 'Deadlock' } },
        { id: 'act-f-os', label: 'Review Flashcards for Coffman Conditions', actionType: 'create_flashcards', payload: { topic: 'Deadlock' } },
        { id: 'act-v-os', label: 'Open OS_Unit3.pdf Page 42 in Reader', actionType: 'open_source', payload: { documentId: 'mat-os-unit3', page: 42 } }
      ];
      relatedTopics = ['Banker Algorithm', 'Resource Allocation Graph', 'Process Synchronization', 'Starvation vs Deadlock'];

    } else if (isDiagramQuery) {
      responseText = `### Visual Analysis: CPU Scheduling & Process Execution Timeline\n\nI have parsed the **CPU Scheduling Gantt Chart diagram**. Here is the structural breakdown:\n\n- **Algorithm Identified**: **Round Robin (RR) Scheduling** with Time Quantum $q = 4\\text{ms}$.\n- **Processes Analyzed**: $P_1$ (Burst: $12\\text{ms}$), $P_2$ (Burst: $4\\text{ms}$), $P_3$ (Burst: $6\\text{ms}$).\n- **Execution Timeline**:\n  - $0\\text{ms} - 4\\text{ms}$: $P_1$ executes (remaining $8\\text{ms}$)\n  - $4\\text{ms} - 8\\text{ms}$: $P_2$ completes execution ($0\\text{ms}$ remaining)\n  - $8\\text{ms} - 12\\text{ms}$: $P_3$ executes (remaining $2\\text{ms}$)\n  - $12\\text{ms} - 16\\text{ms}$: $P_1$ resumes...\n\n**Key Insight**: Round Robin ensures starvation-free responsiveness at the cost of context-switching overhead.`;

      sources = [
        {
          id: 'src-diag-1',
          documentId: 'mat-os-unit3',
          documentTitle: 'OS — Unit 3 Deadlocks & Synchronization',
          filename: 'OS_Unit3_Deadlocks.pdf',
          page: 24,
          snippet: 'Preemptive Scheduling: Round Robin Gantt chart analysis and turnaround time computations.',
          confidence: 0.96
        }
      ];

      suggestedActions = [
        { id: 'act-q-cpu', label: 'Generate Scheduling Practice Problems', actionType: 'create_quiz', payload: { topic: 'CPU Scheduling' } },
        { id: 'act-calc', label: 'Calculate Average Waiting Time', actionType: 'explain_further', payload: { query: 'Calculate average waiting time for this schedule' } }
      ];
      relatedTopics = ['Preemptive Scheduling', 'Turnaround Time', 'Context Switch Overhead', 'Shortest Job First (SJF)'];

    } else if (isMLQuery) {
      responseText = `### Machine Learning: Linear Regression & Optimization\n\n**Linear Regression** models the linear relationship between continuous input features $X \\in \\mathbb{R}^{m \\times n}$ and target scalar $y$.\n\n$$\nh_\\theta(x) = \\theta_0 + \\theta_1 x_1 + \\dots + \\theta_n x_n = \\theta^T x\n$$\n\n### Cost Function (Mean Squared Error):\nTo measure prediction errors, we optimize the **Mean Squared Error (MSE)** loss:\n$$\nJ(\\theta) = \\frac{1}{2m} \\sum_{i=1}^m \\left( h_\\theta(x^{(i)}) - y^{(i)} \\right)^2\n$$\n\n### Gradient Descent Update:\nParameters $\\theta_j$ are updated iteratively in the direction of steepest descent:\n$$\n\\theta_j := \\theta_j - \\alpha \\frac{\\partial}{\\partial \\theta_j} J(\\theta)\n$$\nwhere $\\alpha$ is the learning rate hyperparameter.`;

      sources = [
        {
          id: 'src-ml-1',
          documentId: 'mat-ml-linear',
          documentTitle: 'Machine Learning — Linear Regression & Cost Functions',
          filename: 'Machine Learning — Linear Regression.pdf',
          page: 4,
          snippet: 'Mean Squared Error (MSE) formulation and convex optimization surface.',
          confidence: 0.99
        },
        {
          id: 'src-ml-2',
          documentId: 'mat-hw-notes',
          documentTitle: 'Handwritten ML Notes — Gradient Descent Derivation',
          filename: 'Handwritten ML Notes.jpg',
          page: 1,
          snippet: 'Handwritten derivation showing partial derivatives and convergence paths.',
          confidence: 0.94
        }
      ];

      suggestedActions = [
        { id: 'act-q-ml', label: 'Quiz on Gradient Descent & Cost Functions', actionType: 'create_quiz', payload: { course: 'Machine Learning', topic: 'Linear Regression' } },
        { id: 'act-f-ml', label: 'Practice Flashcards for ML Formulas', actionType: 'create_flashcards', payload: { topic: 'Linear Regression' } }
      ];
      relatedTopics = ['Gradient Descent', 'Learning Rate Tuning', 'Polynomial Regression', 'Ridge vs Lasso Regularization'];

    } else if (isDBMSQuery) {
      responseText = `### Database Normalization: 3NF vs BCNF\n\n**Normalization** is the process of organizing data in a relational database to minimize redundancy and prevent insert, update, and delete anomalies.\n\n- **Third Normal Form (3NF)**: A relation is in 3NF if for every non-trivial functional dependency $X \\to A$, either:\n  1. $X$ is a **Superkey**, OR\n  2. $A$ is a **Prime Attribute** (part of a candidate key).\n\n- **Boyce-Codd Normal Form (BCNF)**: Stricter than 3NF. For every functional dependency $X \\to A$, $X$ **must** be a Superkey.\n\n*Note*: Every BCNF relation is in 3NF, but a 3NF relation is not necessarily in BCNF when overlapping candidate keys exist.`;

      sources = [
        {
          id: 'src-dbms-1',
          documentId: 'mat-dbms-norm',
          documentTitle: 'DBMS — Normalization Notes & Functional Dependencies',
          filename: 'DBMS — Normalization Notes.pdf',
          page: 14,
          snippet: '3NF allows prime attributes on RHS; BCNF requires LHS to always be superkey.',
          confidence: 0.97
        }
      ];

      suggestedActions = [
        { id: 'act-q-dbms', label: 'Test Knowledge on 3NF & BCNF', actionType: 'create_quiz', payload: { course: 'DBMS', topic: 'Normalization' } }
      ];
      relatedTopics = ['Lossless Join Decomposition', 'Dependency Preservation', 'Functional Dependencies', 'Canonical Cover'];

    } else {
      responseText = `I've analyzed your question across your study materials.\n\nBased on your indexed documents, here is a concise explanation grounded in your course notes. The concepts connect to your recent lectures and practice items. Would you like me to generate a tailored diagnostic quiz or flashcard set to reinforce this?`;

      sources = [
        {
          id: 'src-gen-1',
          documentId: 'mat-os-unit3',
          documentTitle: 'OS — Unit 3 Deadlocks & Synchronization',
          filename: 'OS_Unit3_Deadlocks.pdf',
          page: 1,
          snippet: 'Course overview and fundamental definitions.',
          confidence: 0.90
        }
      ];

      suggestedActions = [
        { id: 'act-q-gen', label: 'Create Quick 5-Question Quiz', actionType: 'create_quiz', payload: { count: 5 } }
      ];
      relatedTopics = ['Core Concepts', 'Lecture Review', 'Practice Problems'];
    }

    // Stream the tokens smoothly
    if (onStream) {
      const words = responseText.split(' ');
      let currentAcc = "";
      for (let i = 0; i < words.length; i++) {
        currentAcc += (i === 0 ? "" : " ") + words[i];
        if (i % 3 === 0 || i === words.length - 1) {
          onStream({ type: 'chunk', textChunk: currentAcc });
          await new Promise(r => setTimeout(r, 20));
        }
      }

      activity.status = 'completed';
      activity.steps[2].status = 'completed';
      onStream({
        type: 'complete',
        sources,
        actions: suggestedActions,
        activity: { ...activity },
        fullResponse: {
          answer: responseText,
          sources,
          agentActivity: activity,
          suggestedActions,
          confidence: 0.97,
          relatedTopics
        }
      });
    }

    return {
      success: true,
      data: {
        answer: responseText,
        sources,
        agentActivity: activity,
        suggestedActions,
        confidence: 0.97,
        relatedTopics
      },
      metadata: { latencyMs: 900, tokensUsed: 420, model: 'azure-gpt-4o-grounded' }
    };
  }
}

export const aiService = new AIService();
