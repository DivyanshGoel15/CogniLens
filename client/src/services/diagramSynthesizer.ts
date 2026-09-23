/**
 * CogniLens Domain-Aware Client Diagram Synthesizer
 * Generates topic-aligned, non-generic Mermaid.js diagrams for:
 * - Flowchart (Process & Flow)
 * - Mind Map (Concept Taxonomy & Hierarchy)
 * - Sequence Diagram (Timeline & Actor Interactions)
 * - State Diagram (Lifecycles & Transitions)
 * - Class Diagram (Data Structures & Models)
 */

export interface SynthesizedDiagramResult {
  mermaid_code: string;
  title: string;
  description: string;
}

export function sanitizeMermaidLabel(text: string): string {
  const cleaned = text.replace(/"/g, "'").replace(/\n/g, ' ').trim();
  return cleaned.length > 55 ? cleaned.slice(0, 55) : cleaned;
}

export function sanitizeMindmapText(text: string): string {
  const cleaned = text.replace(/[()[\]{}"':]/g, '').trim();
  return cleaned.length > 40 ? cleaned.slice(0, 40) : cleaned;
}

export function detectDomain(topic: string, text: string): string {
  const combined = `${topic} ${text}`.toLowerCase();

  if (/(deadlock|mutex|semaphore|process|thread|concurrency|race condition)/.test(combined)) {
    return 'concurrency_deadlock';
  } else if (/(cpu scheduling|round robin|shortest job|scheduling|context switch|mlfq)/.test(combined)) {
    return 'process_scheduling';
  } else if (/(paging|page fault|virtual memory|tlb|cache replacement|segmentation|thrashing)/.test(combined)) {
    return 'virtual_memory';
  } else if (/(tcp|3-way handshake|handshake|socket|udp|osi|packet|routing|dns)/.test(combined)) {
    return 'networking_protocols';
  } else if (/(binary search|bst|binary tree|avl|sort|quicksort|mergesort|dynamic programming|dijkstra)/.test(combined)) {
    return 'dsa_algorithms';
  } else if (/(acid|transaction|sql|indexing|b-tree|normalization|two-phase commit|relational)/.test(combined)) {
    return 'database_systems';
  } else if (/(neural network|backprop|gradient descent|transformer|attention|rag|embedding|llm)/.test(combined)) {
    return 'machine_learning';
  } else if (/(rest api|microservices|pub\/sub|mvc|jwt|oauth|frontend|architecture)/.test(combined)) {
    return 'web_architecture';
  }
  return 'general_academic';
}

export function extractKeyPhrases(text: string, maxItems: number = 6): string[] {
  if (!text) return [];
  const lines = text
    .split('\n')
    .map(l => l.replace(/^[- *•0-9.)]+/, '').trim())
    .filter(l => l.length >= 10 && l.length <= 70 && !l.startsWith('http'));

  if (lines.length >= 3) {
    return lines.slice(0, maxItems);
  }

  const sentences = text
    .split(/[.\n;]/)
    .map(s => s.trim())
    .filter(s => s.length >= 12 && s.length <= 70);

  return sentences.slice(0, maxItems);
}

export function generateClientSynthesizedDiagram(
  topic: string,
  textContent: string,
  diagramType: string = 'flowchart',
  direction: string = 'TD'
): SynthesizedDiagramResult {
  const domain = detectDomain(topic, textContent);
  const cleanTopic = topic.trim() || 'Core Concept';
  const safeTopic = sanitizeMermaidLabel(cleanTopic);
  const extracted = extractKeyPhrases(textContent, 6);

  // 1. MIND MAP
  if (diagramType === 'mindmap') {
    const rootLabel = sanitizeMindmapText(cleanTopic);
    const title = `Mind Map: ${cleanTopic}`;
    const description = `Hierarchical concept breakdown and taxonomy of ${cleanTopic}.`;

    if (domain === 'concurrency_deadlock') {
      const code = `mindmap
  root(( ${rootLabel} ))
    Coffman Conditions
      Mutual Exclusion
      Hold and Wait
      No Preemption
      Circular Wait
    Detection Methods
      Resource Allocation Graph
      Wait-For Graph WFG
      Cycle Detection via DFS
      Bankers Algorithm Matrix
    Recovery Strategies
      Process Termination
      Resource Preemption
      Rollback to Checkpoint
      Starvation Prevention
    Prevention & Avoidance
      Hierarchical Resource Order
      Safe State Verification`;
      return { mermaid_code: code, title, description };
    }

    if (domain === 'networking_protocols') {
      const code = `mindmap
  root(( ${rootLabel} ))
    Connection Lifecycle
      SYN Initiator Packet
      SYN-ACK Receiver Confirmation
      ACK Final Handshake
      FIN Connection Teardown
    Transmission Reliability
      Sequence Numbering
      Sliding Window Flow Control
      Cumulative Acknowledgments
      Retransmission Timeout
    Congestion Controls
      Slow Start Phase
      Congestion Avoidance
      Fast Retransmit
      Fast Recovery`;
      return { mermaid_code: code, title, description };
    }

    if (domain === 'dsa_algorithms') {
      const code = `mindmap
  root(( ${rootLabel} ))
    Algorithmic Core
      Divide and Conquer Step
      Recursive Base Condition
      State Invariant
    Complexity Analysis
      Worst-case Time Complexity
      Average-case Performance
      Auxiliary Space Footprint
    Optimizations
      Pruning and Memoization
      In-place Transformations
      Cache Locality`;
      return { mermaid_code: code, title, description };
    }

    if (domain === 'machine_learning') {
      const code = `mindmap
  root(( ${rootLabel} ))
    Architecture Layers
      Input Representation
      Hidden Transformations
      Self-Attention Query Key Value
      Output Activation Softmax
    Optimization Loop
      Forward Pass Computation
      Loss Objective Function
      Backpropagation Gradients
      Adam Optimizer Weight Updates
    Generalization Controls
      Dropout and Normalization
      Learning Rate Schedule`;
      return { mermaid_code: code, title, description };
    }

    // Dynamic Universal Mindmap
    const b1 = sanitizeMindmapText(extracted[0] || 'Foundational Principles');
    const b2 = sanitizeMindmapText(extracted[1] || 'Operational Mechanism');
    const b3 = sanitizeMindmapText(extracted[2] || 'Key Constraints & Rules');
    const b4 = sanitizeMindmapText(extracted[3] || 'Practical Applications');

    const code = `mindmap
  root(( ${rootLabel} ))
    Theoretical Framework
      ${b1}
      Core Terminology
      System Boundaries
    Execution & Dynamics
      ${b2}
      State Transitions
      Inter-module Interactions
    Constraints & Invariants
      ${b3}
      Boundary Conditions
      Failure Mode Handling
    Applied Realization
      ${b4}
      Performance Metrics
      Implementation Strategy`;
    return { mermaid_code: code, title, description };
  }

  // 2. SEQUENCE DIAGRAM
  if (diagramType === 'sequence') {
    const title = `Sequence Interaction: ${cleanTopic}`;
    const description = `Timeline interaction and message exchange flow for ${cleanTopic}.`;

    if (domain === 'concurrency_deadlock') {
      const code = `sequenceDiagram
    autonumber
    actor P1 as Process P1
    participant RM as Resource Manager
    participant WFG as Wait-For Graph Engine
    actor P2 as Process P2

    P1->>RM: Request Lock on Resource R1
    RM->>WFG: Check Dependency Cycles
    alt Resource R1 is Available
        RM-->>P1: Grant Exclusive Lock R1
    else Resource R1 Held by P2
        RM->>WFG: Add Directed Edge (P1 -> P2)
        WFG->>WFG: Run Cycle Detection (DFS)
        alt Cycle Detected (Deadlock Condition)
            WFG-->>RM: Deadlock Detected: Cycle [P1 -> P2 -> P1]
            RM->>P1: Terminate or Preempt Process P1
            Note over RM,WFG: Trigger Recovery: Rollback to Safe State
        else No Cycle Detected
            RM-->>P1: Block P1 (State: Suspended)
        end
    end
    P2->>RM: Release Resource R1
    RM->>WFG: Remove Edge (P1 -> P2)
    RM-->>P1: Wakeup and Grant Lock R1`;
      return { mermaid_code: code, title, description };
    }

    if (domain === 'networking_protocols') {
      const code = `sequenceDiagram
    autonumber
    actor Client as Client / Browser
    participant Router as Gateway / Proxy
    participant Server as Application Server
    participant DB as Persistent Store

    Client->>Router: TCP SYN (Seq = x)
    Router->>Server: Forward SYN
    Server-->>Router: TCP SYN-ACK (Seq = y, Ack = x + 1)
    Router-->>Client: Forward SYN-ACK
    Client->>Server: TCP ACK (Ack = y + 1) [Connection Established]
    Client->>Server: HTTP Request GET /api/resource (TLS Secured)
    Server->>DB: Query Index & Fetch Record
    DB-->>Server: Return Data Tuple
    Server-->>Client: 200 OK (Payload JSON + ETag)`;
      return { mermaid_code: code, title, description };
    }

    // Dynamic Universal Sequence
    const act1 = sanitizeMermaidLabel(extracted[0] || 'Client Ingress').slice(0, 22);
    const act2 = sanitizeMermaidLabel(extracted[1] || 'Processing Core').slice(0, 22);
    const act3 = sanitizeMermaidLabel(extracted[2] || 'State Store').slice(0, 22);

    const code = `sequenceDiagram
    autonumber
    actor User as Ingress Client
    participant Step1 as ${act1}
    participant Step2 as ${act2}
    participant State as ${act3}

    User->>Step1: Initiate Operation (${safeTopic.slice(0, 25)})
    Step1->>Step2: Validate Invariants and Parameters
    Step2->>State: Inspect Current State Vector
    alt Preconditions Satisfied
        State-->>Step2: State Verified OK
        Step2->>State: Commit State Mutation
        Step2-->>Step1: Execution Success
        Step1-->>User: Return Completed Result
    else Invariant Violation / Boundary Error
        State-->>Step2: Constraint Violation
        Step2-->>Step1: Trigger Fallback Routine
        Step1-->>User: Emit Controlled Error / Retry Signal
    end`;
    return { mermaid_code: code, title, description };
  }

  // 3. STATE DIAGRAM
  if (diagramType === 'stateDiagram') {
    const title = `State Machine: ${cleanTopic}`;
    const description = `State transitions, triggers, and lifecycle for ${cleanTopic}.`;

    if (domain === 'concurrency_deadlock') {
      const code = `stateDiagram-v2
    [*] --> ResourceAvailable : System Initialized
    ResourceAvailable --> Allocated : Process Requests & Acquires Lock
    Allocated --> WaitingForResource : Process Requests Busy Lock
    WaitingForResource --> CycleDetected : Dependency Cycle Formed
    WaitingForResource --> Allocated : Lock Released & Acquired
    CycleDetected --> PreemptionRollback : Recovery Algorithm Invoked
    PreemptionRollback --> ResourceAvailable : Victim Aborted & State Restored
    Allocated --> ResourceAvailable : Process Completes & Releases Locks
    ResourceAvailable --> [*] : All Tasks Terminated`;
      return { mermaid_code: code, title, description };
    }

    // Dynamic Universal State Machine
    const s1 = sanitizeMermaidLabel(extracted[0] || 'Initialization').slice(0, 18);
    const s2 = sanitizeMermaidLabel(extracted[1] || 'Active Processing').slice(0, 18);
    const s3 = sanitizeMermaidLabel(extracted[2] || 'Verification').slice(0, 18);

    const code = `stateDiagram-v2
    [*] --> InitialState : Trigger Ingestion
    InitialState --> ProcessingState : Parse Parameters (${s1})
    ProcessingState --> VerificationState : Execute Core Logic (${s2})
    VerificationState --> CommittedState : All Invariants Satisfied (${s3})
    VerificationState --> FaultRecovery : Constraint Failure Detected
    FaultRecovery --> ProcessingState : Retry with Adjusted Bounds
    CommittedState --> Finalized : Emit Output
    Finalized --> [*]`;
    return { mermaid_code: code, title, description };
  }

  // 4. CLASS DIAGRAM
  if (diagramType === 'class') {
    const title = `Class Architecture: ${cleanTopic}`;
    const description = `Object model, data structures, and relationships for ${cleanTopic}.`;

    if (domain === 'concurrency_deadlock') {
      const code = `classDiagram
    class Process {
        +int pid
        +ProcessState state
        +List~Resource~ allocatedResources
        +requestResource(int resId) bool
        +releaseResource(int resId) void
    }
    class ResourceManager {
        -Matrix allocationTable
        -Vector availableVector
        -Matrix maxClaim
        +checkSafeState() bool
        +allocate(int pid, int resId) bool
    }
    class WaitGraph {
        -Map~int, Set~int~~ adjacencyList
        +addEdge(int p1, int p2) void
        +removeEdge(int p1, int p2) void
        +hasCycle() bool
        +tarjanSCC() List~Cycle~
    }
    class DeadlockRecoveryEngine {
        +selectVictim(List~Process~ processes) Process
        +rollback(Process victim, Checkpoint cp) void
    }
    Process "many" --> "1" ResourceManager : interacts
    ResourceManager --> "1" WaitGraph : maintains
    ResourceManager --> "1" DeadlockRecoveryEngine : invokes`;
      return { mermaid_code: code, title, description };
    }

    const className = cleanTopic.replace(/[^a-zA-Z0-9]/g, '') || 'Concept';
    const code = `classDiagram
    class ${className}Core {
        +String identifier
        +Map configParameters
        +initialize() void
        +executePipeline() OutputResult
    }
    class StateProcessor {
        -Vector stateHistory
        +evaluateConstraints() bool
        +applyTransformation() void
    }
    class ValidatorEngine {
        +checkInvariants() bool
        +emitAuditLog() void
    }
    ${className}Core "1" *-- "many" StateProcessor : orchestrates
    ${className}Core ..> ValidatorEngine : verifies with`;
    return { mermaid_code: code, title, description };
  }

  // 5. FLOWCHART (Default)
  const title = `Flowchart: ${cleanTopic}`;
  const description = `Algorithmic execution flow and decision logic for ${cleanTopic}.`;
  const dirCode = direction === 'LR' ? 'LR' : 'TD';

  if (domain === 'concurrency_deadlock') {
    const code = `flowchart ${dirCode}
    subgraph S1["1. Resource Allocation Request"]
        A["Process P1 issues Request for Resource R1"] --> B{"Is R1 currently Available?"}
    end

    subgraph S2["2. State Evaluation & Safety Check"]
        B -->|Yes| C["Temporarily Allocate R1 to P1"]
        C --> D{"Run Banker's Safety Algorithm<br/>Is State Safe?"}
        D -->|Safe State| E["Commit Allocation<br/>Update Available Vector"]
        D -->|Unsafe State| F["Rollback Allocation<br/>Block P1 to Prevent Deadlock"]
    end

    subgraph S3["3. Wait-For Graph & Cycle Resolution"]
        B -->|No| G["Add Directed Edge (P1 → P2) in WFG"]
        G --> H{"Does WFG Contain a Cycle?"}
        H -->|Cycle Detected| I["DEADLOCK CONFIRMED<br/>Select Victim Process by Cost"]
        I --> J["Abort Victim & Preempt Held Resources"]
        J --> E
        H -->|No Cycle| K["Suspend P1 in Wait Queue"]
    end

    style A fill:#2563eb,stroke:#1d4ed8,color:#fff
    style B fill:#7c3aed,stroke:#6d28d9,color:#fff
    style D fill:#d97706,stroke:#b45309,color:#fff
    style H fill:#dc2626,stroke:#b91c1c,color:#fff
    style E fill:#059669,stroke:#047857,color:#fff`;
    return { mermaid_code: code, title, description };
  }

  if (domain === 'networking_protocols') {
    const code = `flowchart ${dirCode}
    subgraph Phase1["1. Connection Establishment"]
        A["Client creates TCP Socket"] --> B["Send TCP SYN Packet (Seq=x)"]
        B --> C{"Server Port Open & Listening?"}
        C -->|Yes| D["Server replies with SYN-ACK (Seq=y, Ack=x+1)"]
        C -->|No| E["Server sends RST Packet (Connection Refused)"]
        D --> F["Client sends ACK (Ack=y+1)"]
    end

    subgraph Phase2["2. Data Transmission & Flow Control"]
        F --> G["Connection ESTABLISHED<br/>Negotiate MSS & Window Size"]
        G --> H["Send Encrypted Application Payload"]
        H --> I{"Packet Acknowledged within RTO?"}
        I -->|Yes| J["Slide Congestion Window Forward"]
        I -->|No / Timeout| K["Retransmit Missing Segment<br/>Enter Slow-Start Congestion Avoidance"]
    end

    style A fill:#2563eb,stroke:#1d4ed8,color:#fff
    style D fill:#7c3aed,stroke:#6d28d9,color:#fff
    style G fill:#059669,stroke:#047857,color:#fff
    style K fill:#dc2626,stroke:#b91c1c,color:#fff`;
    return { mermaid_code: code, title, description };
  }

  // Dynamic Universal Flowchart
  const e1 = sanitizeMermaidLabel(extracted[0] || 'Input Initialization').slice(0, 35);
  const e2 = sanitizeMermaidLabel(extracted[1] || 'Primary Transformation Step').slice(0, 35);
  const e3 = sanitizeMermaidLabel(extracted[2] || 'Invariant & Boundary Check').slice(0, 30);
  const e4 = sanitizeMermaidLabel(extracted[3] || 'Synthesized Output State').slice(0, 35);

  const code = `flowchart ${dirCode}
    subgraph Ingestion["Phase 1: Ingestion & Setup"]
        A["${safeTopic.slice(0, 30)}: Ingress"] --> B["${e1}"]
    end

    subgraph Processing["Phase 2: Execution & Logic Check"]
        B --> C["${e2}"]
        C --> D{"${e3}?"}
        D -->|Valid / Satisfied| E["Commit State Transition"]
        D -->|Boundary Error / Retry| F["Trigger Remediation Routine"]
        F --> C
    end

    subgraph Resolution["Phase 3: Output Synthesis"]
        E --> G["${e4}"]
        G --> H["Deliver Verified Result"]
    end

    style A fill:#2563eb,stroke:#1d4ed8,color:#fff
    style C fill:#7c3aed,stroke:#6d28d9,color:#fff
    style D fill:#d97706,stroke:#b45309,color:#fff
    style H fill:#059669,stroke:#047857,color:#fff`;

  return { mermaid_code: code, title, description };
}
