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
  simplified_explanation?: string;
  key_takeaways?: string[];
}

export function sanitizeMermaidLabel(text: string): string {
  const cleaned = text.replace(/"/g, "'").replace(/\n/g, ' ').trim();
  return cleaned.length > 65 ? cleaned.slice(0, 65) : cleaned;
}

export function sanitizeMindmapText(text: string): string {
  const cleaned = text.replace(/[()[\]{}"':]/g, '').trim();
  return cleaned.length > 45 ? cleaned.slice(0, 45) : cleaned;
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
    .filter(l => l.length >= 10 && l.length <= 75 && !l.startsWith('http'));

  if (lines.length >= 3) {
    return lines.slice(0, maxItems);
  }

  const sentences = text
    .split(/[.\n;]/)
    .map(s => s.trim())
    .filter(s => s.length >= 12 && s.length <= 75);

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
    const title = `Concept Mind Map: ${cleanTopic}`;
    const description = `Structured knowledge breakdown of ${cleanTopic}.`;

    if (domain === 'concurrency_deadlock') {
      const code = `mindmap
  root(( ${rootLabel} ))
    4 Necessary Conditions
      Mutual Exclusion (Only 1 process holds lock)
      Hold and Wait (Holds resource while requesting another)
      No Preemption (Resources cannot be taken by force)
      Circular Wait (Closed loop of waiting processes)
    Detection Methods
      Resource Allocation Graph (RAG)
      Wait-For Graph (Cycle detection via DFS)
      Bankers Algorithm (Safe vs Unsafe state check)
    Resolution & Recovery
      Process Termination (Abort 1 or all in cycle)
      Resource Preemption (Forcibly release victim resource)
      Rollback (Restore state to previous safe checkpoint)
    Prevention Rules
      Order Resources Numerically
      Request All Resources at Once`;

      return {
        mermaid_code: code,
        title,
        description,
        simplified_explanation: 'A deadlock happens when processes get permanently stuck waiting for each other to release resources, like four cars at a 4-way stop where each driver waits for the other to move. Breaking any one of the 4 conditions prevents the deadlock completely.',
        key_takeaways: [
          'Deadlocks require all 4 Coffman conditions to hold simultaneously.',
          'Wait-For Graphs detect deadlocks by finding cycles using Depth-First Search.',
          'Recovery requires terminating a process or rolling back to a safe checkpoint.'
        ]
      };
    }

    if (domain === 'networking_protocols') {
      const code = `mindmap
  root(( ${rootLabel} ))
    3-Way Handshake
      Step 1: Client sends SYN (Seq=x)
      Step 2: Server sends SYN-ACK (Seq=y, Ack=x+1)
      Step 3: Client sends ACK (Ack=y+1)
    Reliable Delivery
      Sequence Numbers (Orders incoming packets)
      Cumulative ACKs (Confirms received bytes)
      Retransmission Timer (Resends lost packets)
    Flow & Congestion Control
      Sliding Window (Prevents receiver buffer overflow)
      Slow Start (Gradually ramps up sending rate)
      Congestion Avoidance (Reduces rate on packet loss)
    Teardown Phase
      FIN and ACK exchange to close connection`;

      return {
        mermaid_code: code,
        title,
        description,
        simplified_explanation: 'The TCP handshake is like a polite phone call: "Hello, can you hear me?" (SYN), "Yes I hear you, can you hear me?" (SYN-ACK), and "Yes, connection confirmed!" (ACK). This ensures both computers are ready before transmitting data.',
        key_takeaways: [
          'SYN initiates sequence synchronization.',
          'SYN-ACK acknowledges client sequence and introduces server sequence.',
          'ACK completes two-way connection setup.'
        ]
      };
    }

    // Dynamic Universal Mindmap
    const b1 = sanitizeMindmapText(extracted[0] || 'Foundational Principles');
    const b2 = sanitizeMindmapText(extracted[1] || 'Operational Mechanism');
    const b3 = sanitizeMindmapText(extracted[2] || 'Key Constraints & Rules');
    const b4 = sanitizeMindmapText(extracted[3] || 'Practical Applications');

    const code = `mindmap
  root(( ${rootLabel} ))
    Core Principles
      ${b1}
      Key Definitions
      Essential Foundations
    Operational Mechanism
      ${b2}
      Step-by-Step Flow
      Component Collaboration
    Rules & Constraints
      ${b3}
      Boundary Conditions
      Edge Case Handling
    Applied Realization
      ${b4}
      Real-World Exam Relevance
      Performance Trade-offs`;

    return {
      mermaid_code: code,
      title,
      description,
      simplified_explanation: `This map breaks down ${cleanTopic} into its core principles, step-by-step operation, boundary constraints, and practical applications.`,
      key_takeaways: [
        `Master the core mechanism: ${b1.slice(0, 45)}.`,
        `Understand operational rules: ${b2.slice(0, 45)}.`,
        `Watch for boundary constraints: ${b3.slice(0, 45)}.`
      ]
    };
  }

  // 2. SEQUENCE DIAGRAM
  if (diagramType === 'sequence') {
    const title = `Sequence Flow: ${cleanTopic}`;
    const description = `Step-by-step interaction between participating components in ${cleanTopic}.`;

    if (domain === 'concurrency_deadlock') {
      const code = `sequenceDiagram
    autonumber
    actor P1 as Process 1
    participant RM as Resource Allocator
    participant WFG as Wait-For Graph
    actor P2 as Process 2

    P1->>RM: Request Resource R1
    RM-->>P1: Resource R1 is Free -> Granted!
    P2->>RM: Request Resource R2
    RM-->>P2: Resource R2 is Free -> Granted!
    Note over P1,P2: Both processes hold 1 resource each
    P1->>RM: Request Resource R2 (held by P2)
    RM->>WFG: Record Edge: P1 waits for P2
    P2->>RM: Request Resource R1 (held by P1)
    RM->>WFG: Record Edge: P2 waits for P1
    WFG->>WFG: Run Cycle Check (Cycle [P1 -> P2 -> P1] Detected!)
    WFG-->>RM: ALERT: Deadlock Confirmed
    RM->>P2: Preempt / Abort P2 to break cycle
    RM-->>P1: Grant R2 to P1 -> System Unblocked!`;

      return {
        mermaid_code: code,
        title,
        description,
        simplified_explanation: 'This sequence shows two processes that each hold one resource and want what the other holds. The Wait-For Graph engine detects the circular dependency and terminates one process so the other can finish.',
        key_takeaways: [
          'Process 1 holds R1 and wants R2; Process 2 holds R2 and wants R1.',
          'Circular wait creates a cycle in the Wait-For Graph.',
          'The OS breaks the deadlock by preempting or aborting one process.'
        ]
      };
    }

    if (domain === 'networking_protocols') {
      const code = `sequenceDiagram
    autonumber
    actor Client as Client (Browser)
    participant Server as Web Server (Port 80/443)

    Client->>Server: 1. TCP SYN (Seq = 100) -> 'Let's Synchronize'
    Server-->>Client: 2. TCP SYN-ACK (Seq = 300, Ack = 101) -> 'Acknowledged! Sync with me'
    Client->>Server: 3. TCP ACK (Ack = 301) -> 'Connection Established!'
    Note over Client,Server: Safe two-way channel ready for HTTP/TLS data
    Client->>Server: 4. HTTP GET /data (Send Application Request)
    Server-->>Client: 5. HTTP 200 OK (Return Requested Content)`;

      return {
        mermaid_code: code,
        title,
        description,
        simplified_explanation: 'The 3-way handshake ensures both client and server are active and agree on sequence numbers before any real data is sent.',
        key_takeaways: [
          'SYN initiates the connection with the client sequence number.',
          'SYN-ACK confirms the client number and sends the server sequence number.',
          'ACK completes the handshake and unlocks application data transfer.'
        ]
      };
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
    else Boundary Check Failed
        State-->>Step2: Constraint Violation Error
        Step2-->>Step1: Trigger Recovery Action
        Step1-->>User: Emit Controlled Retry Notice
    end`;

    return {
      mermaid_code: code,
      title,
      description,
      simplified_explanation: `Shows the sequential step-by-step lifecycle of ${cleanTopic}, illustrating verification, execution, and error resolution.`,
      key_takeaways: [
        'Operations undergo invariant checks prior to execution.',
        'State mutations are committed only upon verification.',
        'Failures trigger controlled recovery paths.'
      ]
    };
  }

  // 3. STATE DIAGRAM
  if (diagramType === 'stateDiagram') {
    const title = `State Machine: ${cleanTopic}`;
    const description = `Lifecycle states and triggers for ${cleanTopic}.`;

    if (domain === 'concurrency_deadlock') {
      const code = `stateDiagram-v2
    [*] --> ResourceAvailable : System Idle
    ResourceAvailable --> ResourceAllocated : Process Requests & Acquires Lock
    ResourceAllocated --> WaitingForResource : Requests Second Held Lock
    WaitingForResource --> DeadlockCycleDetected : Circular Dependency Formed
    WaitingForResource --> ResourceAllocated : Lock Released by Other Process
    DeadlockCycleDetected --> RecoveryPreemption : OS Invokes Preemption Routine
    RecoveryPreemption --> ResourceAvailable : Victim Aborted & Locks Returned
    ResourceAllocated --> ResourceAvailable : Process Completes & Releases All
    ResourceAvailable --> [*] : All Tasks Finished`;

      return {
        mermaid_code: code,
        title,
        description,
        simplified_explanation: 'A resource moves from Available to Allocated when locked. If a process must wait for a lock that another process holds in a circle, the system enters the Deadlock state until recovery aborts the victim.',
        key_takeaways: [
          'Normal path: ResourceAvailable -> ResourceAllocated -> Released.',
          'Contention path: ResourceAllocated -> WaitingForResource.',
          'Deadlock state requires external OS preemption to restore safe execution.'
        ]
      };
    }

    // Dynamic Universal State Machine
    const s1 = sanitizeMermaidLabel(extracted[0] || 'Initialization').slice(0, 18);
    const s2 = sanitizeMermaidLabel(extracted[1] || 'Active Processing').slice(0, 18);
    const s3 = sanitizeMermaidLabel(extracted[2] || 'Verification').slice(0, 18);

    const code = `stateDiagram-v2
    [*] --> InitialState : Start (${s1})
    InitialState --> ActiveProcessing : Parameters Validated
    ActiveProcessing --> VerifyingState : Execute Core Logic (${s2})
    VerifyingState --> CompletedSuccess : Invariants Confirmed (${s3})
    VerifyingState --> ErrorRecovery : Constraint Violation
    ErrorRecovery --> ActiveProcessing : Retry with Adjusted Bounds
    CompletedSuccess --> [*] : End of Lifecycle`;

    return {
      mermaid_code: code,
      title,
      description,
      simplified_explanation: `Illustrates the state lifecycle of ${cleanTopic} from initiation to verification and completion.`,
      key_takeaways: [
        'States transition following strict condition verification.',
        'Exceptions route through dedicated error recovery states.',
        'Terminal state confirms successful execution.'
      ]
    };
  }

  // 4. CLASS DIAGRAM
  if (diagramType === 'class') {
    const title = `Class Architecture: ${cleanTopic}`;
    const description = `Object model and structural relationships for ${cleanTopic}.`;

    if (domain === 'concurrency_deadlock') {
      const code = `classDiagram
    class Process {
        +int pid
        +ProcessState state
        +List~Resource~ heldResources
        +requestResource(int resId) bool
        +releaseResource(int resId) void
    }
    class ResourceManager {
        -Vector availableResources
        -Matrix allocationTable
        -Matrix maximumClaim
        +isSafeState() bool
        +allocateResource(pid, resId) bool
    }
    class WaitForGraph {
        -Map~int, Set~int~~ dependencyEdges
        +addDependency(p1, p2) void
        +detectCycle() bool
        +findDeadlockedProcesses() List
    }
    class DeadlockResolver {
        +selectVictim(List processes) Process
        +abortProcess(Process victim) void
        +rollbackToCheckpoint(Process p) void
    }
    Process "many" --> "1" ResourceManager : requests lock
    ResourceManager --> "1" WaitForGraph : inspects cycles
    ResourceManager --> "1" DeadlockResolver : triggers recovery`;

      return {
        mermaid_code: code,
        title,
        description,
        simplified_explanation: 'The system structure separates concerns: Processes hold resources, the Resource Manager evaluates claims, the WaitForGraph detects cycle dependencies, and the DeadlockResolver cleans up deadlocks.',
        key_takeaways: [
          'Process: Encapsulates held locks and pending requests.',
          'WaitForGraph: Directed graph maintaining dependency edges to find cycles.',
          'DeadlockResolver: Selects victim process based on cost metric for rollback.'
        ]
      };
    }

    const className = cleanTopic.replace(/[^a-zA-Z0-9]/g, '') || 'Concept';
    const code = `classDiagram
    class ${className}Model {
        +String identifier
        +Map configSettings
        +executeOperation() Result
        +verifyInvariants() bool
    }
    class ExecutionEngine {
        -List stateHistory
        +processStep() void
        +handleException() void
    }
    class ValidationAuditor {
        +checkRules() bool
        +generateReport() Report
    }
    ${className}Model "1" *-- "many" ExecutionEngine : coordinates
    ${className}Model ..> ValidationAuditor : verifies with`;

    return {
      mermaid_code: code,
      title,
      description,
      simplified_explanation: `Architecture model representing the entities, methods, and relationships of ${cleanTopic}.`,
      key_takeaways: [
        `${className}Model coordinates operations and configuration.`,
        'ExecutionEngine processes steps and manages state history.',
        'ValidationAuditor verifies domain constraints.'
      ]
    };
  }

  // 5. FLOWCHART (Default)
  const title = `Educational Flowchart: ${cleanTopic}`;
  const description = `Step-by-step logic and decision flow explaining ${cleanTopic}.`;
  const dirCode = direction === 'LR' ? 'LR' : 'TD';

  if (domain === 'concurrency_deadlock') {
    const code = `flowchart ${dirCode}
    A["Process Requests Resource R1"] --> B{"Is Resource R1 currently Free?"}
    B -->|Yes: Free| C["Allocate Resource R1 to Process<br/>(Process continues running)"]
    B -->|No: Busy| D["Process enters Wait Queue<br/>(Cannot proceed without R1)"]

    D --> E["OS adds edge to Wait-For Graph:<br/>(Process P1 → Process P2 holding R1)"]
    E --> F{"Does Wait-For Graph contain a Circular Cycle?"}

    F -->|No: No Cycle| G["Normal Wait State<br/>(Process will wake up when R1 is released)"]
    F -->|Yes: Cycle Exists| H["DEADLOCK CONFIRMED!<br/>Circular dependency prevents all progress"]

    H --> I["Recovery Engine chooses Victim Process<br/>(Based on lowest priority or runtime cost)"]
    I --> J["Abort Victim & Forcibly Release Held Resources"]
    J --> C

    style A fill:#2563eb,stroke:#1d4ed8,color:#fff
    style B fill:#7c3aed,stroke:#6d28d9,color:#fff
    style C fill:#059669,stroke:#047857,color:#fff
    style F fill:#d97706,stroke:#b45309,color:#fff
    style H fill:#dc2626,stroke:#b91c1c,color:#fff`;

    return {
      mermaid_code: code,
      title,
      description,
      simplified_explanation: 'A deadlock is like two people each holding one shoe and refusing to share: neither can walk! When a process asks for a busy resource, it waits. If a circle of waiting processes forms, the OS detects the cycle and terminates one process to free its resources so the others can continue.',
      key_takeaways: [
        'Available resources are granted immediately; busy resources put the process to sleep.',
        'The OS checks the Wait-For Graph: a closed loop means a deadlock is present.',
        'The system breaks the deadlock by choosing a victim process and aborting it to free locks.'
      ]
    };
  }

  if (domain === 'networking_protocols') {
    const code = `flowchart ${dirCode}
    A["Client creates Socket & wants connection"] --> B["Step 1: Client sends SYN Packet<br/>(Random Sequence Number = x)"]
    B --> C{"Is Server listening on Port?"}
    C -->|No| D["Server sends RST Packet<br/>(Connection Refused)"]
    C -->|Yes| E["Step 2: Server sends SYN-ACK Packet<br/>(Server Seq = y, Ack = x + 1)"]
    E --> F["Step 3: Client sends ACK Packet<br/>(Ack = y + 1)"]
    F --> G["Connection ESTABLISHED!<br/>Reliable two-way channel ready for HTTP/TLS data"]

    style A fill:#2563eb,stroke:#1d4ed8,color:#fff
    style C fill:#7c3aed,stroke:#6d28d9,color:#fff
    style E fill:#d97706,stroke:#b45309,color:#fff
    style G fill:#059669,stroke:#047857,color:#fff`;

    return {
      mermaid_code: code,
      title,
      description,
      simplified_explanation: 'Before two computers can exchange data over TCP, they must agree on starting numbers. Client sends SYN ("hello, start at x"). Server sends SYN-ACK ("got x, start at y"). Client sends ACK ("got y, connection ready!").',
      key_takeaways: [
        'Step 1 (SYN): Initiates handshake with client sequence number.',
        'Step 2 (SYN-ACK): Server confirms client number and introduces its own.',
        'Step 3 (ACK): Final handshake confirmation completes the reliable connection.'
      ]
    };
  }

  // Dynamic Universal Flowchart
  const e1 = sanitizeMermaidLabel(extracted[0] || 'Initialize input parameters').slice(0, 45);
  const e2 = sanitizeMermaidLabel(extracted[1] || 'Execute primary transformation').slice(0, 45);
  const e3 = sanitizeMermaidLabel(extracted[2] || 'Check boundary constraints').slice(0, 35);
  const e4 = sanitizeMermaidLabel(extracted[3] || 'Generate final outcome').slice(0, 45);

  const code = `flowchart ${dirCode}
    A["Start: Concept Overview for ${safeTopic.slice(0, 30)}"] --> B["${e1}"]
    B --> C["${e2}"]
    C --> D{"${e3}?"}
    D -->|Yes: Valid| E["${e4}"]
    D -->|No: Boundary Case| F["Apply Alternative Handling & Safety Fallback"]
    F --> E
    E --> G["Final Result: Successfully Applied ${safeTopic.slice(0, 25)}"]

    style A fill:#2563eb,stroke:#1d4ed8,color:#fff
    style C fill:#7c3aed,stroke:#6d28d9,color:#fff
    style D fill:#d97706,stroke:#b45309,color:#fff
    style G fill:#059669,stroke:#047857,color:#fff`;

  return {
    mermaid_code: code,
    title,
    description,
    simplified_explanation: `This flowchart outlines the practical decision-making process for ${cleanTopic}. It walks through the initial parameters, transformation rules, decision checks, and final verified outcome.`,
    key_takeaways: [
      `Initial Step: ${e1}.`,
      `Key Decision: Verify ${e3}.`,
      `Target Outcome: ${e4}.`
    ]
  };
}
