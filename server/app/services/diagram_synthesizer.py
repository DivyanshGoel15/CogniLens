"""
CogniLens Domain-Aware Diagram Synthesizer
Generates topic-aligned, non-generic Mermaid.js diagrams for:
- Flowcharts (Process & Logic Flow)
- Mind Maps (Concept Taxonomy & Hierarchy)
- Sequence Diagrams (Timeline & Actor Interactions)
- State Diagrams (Lifecycles & Transitions)
- Class Diagrams (Data Structures & Models)
"""

import re
from typing import Dict, List, Optional, Tuple


def sanitize_mermaid_label(text: str) -> str:
    """Clean label text so it doesn't break Mermaid syntax."""
    cleaned = text.replace('"', "'").replace("\n", " ").strip()
    return cleaned[:60] if len(cleaned) > 60 else cleaned


def sanitize_mindmap_text(text: str) -> str:
    """Clean mindmap node text (Mermaid mindmap breaks on (), [], {}, and quotes)."""
    cleaned = re.sub(r'[\(\)\[\]\{\}"\':]', "", text).strip()
    return cleaned[:45] if len(cleaned) > 45 else cleaned


def detect_domain(topic: str, text: str) -> str:
    """Detect academic/engineering domain from topic and text content."""
    combined = f"{topic} {text}".lower()

    if any(k in combined for k in ["deadlock", "mutex", "semaphore", "process", "thread", "concurrency", "race condition"]):
        return "concurrency_deadlock"
    elif any(k in combined for k in ["cpu scheduling", "round robin", "shortest job", "scheduling", "context switch", "mlfq"]):
        return "process_scheduling"
    elif any(k in combined for k in ["paging", "page fault", "virtual memory", "tlb", "cache replacement", "segmentation", "thrashing"]):
        return "virtual_memory"
    elif any(k in combined for k in ["tcp", "3-way handshake", "handshake", "socket", "udp", "osi", "packet", "routing", "dns"]):
        return "networking_protocols"
    elif any(k in combined for k in ["binary search", "bst", "binary tree", "avl", "sort", "quicksort", "mergesort", "dynamic programming", "dijkstra"]):
        return "dsa_algorithms"
    elif any(k in combined for k in ["acid", "transaction", "sql", "indexing", "b-tree", "normalization", "two-phase commit", "relational"]):
        return "database_systems"
    elif any(k in combined for k in ["neural network", "backprop", "gradient descent", "transformer", "attention", "rag", "embedding", "llm"]):
        return "machine_learning"
    elif any(k in combined for k in ["rest api", "microservices", "pub/sub", "mvc", "jwt", "oauth", "frontend", "architecture"]):
        return "web_architecture"
    return "general_academic"


def extract_key_phrases(text: str, max_items: int = 8) -> List[str]:
    """Extract key technical terms or sentence fragments from source text."""
    if not text:
        return []
    # Find bullet points or numbered lines first
    lines = [line.strip("- *•0123456789.) ").strip() for line in text.splitlines() if line.strip()]
    good_lines = [l for l in lines if 10 <= len(l) <= 70 and not l.startswith("http")]
    if len(good_lines) >= 3:
        return good_lines[:max_items]

    # Otherwise extract sentences or capitalized phrases
    sentences = re.split(r'[.\n;]', text)
    valid_sentences = [s.strip() for s in sentences if 15 <= len(s.strip()) <= 80]
    return valid_sentences[:max_items]


def generate_synthesized_diagram(
    topic: str,
    text_content: str,
    diagram_type: str = "flowchart",
    direction: str = "TD",
) -> Tuple[str, str, str]:
    """
    Generate a Mermaid.js diagram tailored to the specific topic and chosen style.
    Returns: (mermaid_code, title, description)
    """
    domain = detect_domain(topic, text_content)
    clean_topic = topic.strip() or "Core Concept"
    safe_topic = sanitize_mermaid_label(clean_topic)
    extracted = extract_key_phrases(text_content, 6)

    # -------------------------------------------------------------------------
    # 1. MIND MAP (Mermaid native mindmap syntax)
    # -------------------------------------------------------------------------
    if diagram_type == "mindmap":
        title = f"Mind Map: {clean_topic}"
        description = f"Hierarchical concept breakdown and taxonomy of {clean_topic}."
        root_label = sanitize_mindmap_text(clean_topic)

        if domain == "concurrency_deadlock":
            code = f"""mindmap
  root(( {root_label} ))
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
      Safe State Verification
"""
        elif domain == "process_scheduling":
            code = f"""mindmap
  root(( {root_label} ))
    Scheduling Criteria
      CPU Utilization
      Throughput
      Turnaround Time
      Response Latency
    Preemptive Algorithms
      Round Robin Time Quantum
      Shortest Remaining Time First
      Multi-Level Feedback Queues
    Non-Preemptive Algorithms
      First-Come First-Served
      Shortest Job First
      Priority Scheduling
    System Overheads
      Context Switching
      Process Control Block State
"""
        elif domain == "networking_protocols":
            code = f"""mindmap
  root(( {root_label} ))
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
      Fast Recovery
"""
        elif domain == "dsa_algorithms":
            code = f"""mindmap
  root(( {root_label} ))
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
      Cache Locality
"""
        elif domain == "database_systems":
            code = f"""mindmap
  root(( {root_label} ))
    ACID Guarantees
      Atomicity All-or-Nothing
      Consistency Invariant Rules
      Isolation Concurrency Levels
      Durability WAL Logging
    Concurrency Controls
      Two-Phase Locking 2PL
      Multi-Version Concurrency MVCC
      Optimistic Concurrency Control
    Storage & Indexing
      B+ Tree Leaf Traversal
      Buffer Pool Cache
"""
        elif domain == "machine_learning":
            code = f"""mindmap
  root(( {root_label} ))
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
      Learning Rate Schedule
"""
        else:
            # Universal Dynamic Extraction Mind Map
            branch1 = sanitize_mindmap_text(extracted[0]) if len(extracted) > 0 else "Foundational Principles"
            branch2 = sanitize_mindmap_text(extracted[1]) if len(extracted) > 1 else "Operational Mechanism"
            branch3 = sanitize_mindmap_text(extracted[2]) if len(extracted) > 2 else "Key Constraints & Rules"
            branch4 = sanitize_mindmap_text(extracted[3]) if len(extracted) > 3 else "Practical Applications"

            code = f"""mindmap
  root(( {root_label} ))
    Theoretical Framework
      {branch1}
      Core Terminology
      System Boundaries
    Execution & Dynamics
      {branch2}
      State Transitions
      Inter-module Interactions
    Constraints & Invariants
      {branch3}
      Boundary Conditions
      Failure Mode Handling
    Applied Realization
      {branch4}
      Performance Metrics
      Implementation Strategy
"""
        return code.strip(), title, description

    # -------------------------------------------------------------------------
    # 2. SEQUENCE DIAGRAM (Timeline & Actor Interactions)
    # -------------------------------------------------------------------------
    elif diagram_type == "sequence":
        title = f"Sequence Interaction: {clean_topic}"
        description = f"Timeline interaction and message exchange flow for {clean_topic}."

        if domain == "concurrency_deadlock":
            code = f"""sequenceDiagram
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
    RM-->>P1: Wakeup and Grant Lock R1
"""
        elif domain == "networking_protocols":
            code = f"""sequenceDiagram
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
    Server-->>Client: 200 OK (Payload JSON + ETag)
"""
        elif domain == "process_scheduling":
            code = f"""sequenceDiagram
    autonumber
    actor Process as User Process
    participant ReadyQ as Ready Queue
    participant Sched as CPU Scheduler
    participant CPU as CPU Core
    participant IO as I/O Device Subsystem

    Process->>ReadyQ: Enqueue (State: READY)
    Sched->>ReadyQ: Select Highest Priority Job
    Sched->>CPU: Context Switch & Dispatch Process
    CPU->>CPU: Execute Instructions (State: RUNNING)
    alt Time Quantum Expires
        CPU->>ReadyQ: Preempt & Re-queue Process
    else I/O Request Issued
        CPU->>IO: Dispatch Asynchronous Read
        CPU->>ReadyQ: Put Process to WAIT State
        IO-->>Sched: I/O Interrupt Complete
        Sched->>ReadyQ: Move Process to READY State
    end
"""
        elif domain == "machine_learning":
            code = f"""sequenceDiagram
    autonumber
    actor User as Query Prompt / Input
    participant Ret as Vector Retriever
    participant Store as Vector Store (Chroma/FAISS)
    participant LLM as Multimodal Model
    participant Post as Synthesis Engine

    User->>Ret: Send Query Token Embedding
    Ret->>Store: Execute Cosine Similarity Search (k=5)
    Store-->>Ret: Top-k Relevant Document Chunks
    Ret->>LLM: Assemble Prompt (System + Retrieved Context)
    LLM->>LLM: Multi-Head Attention & Forward Pass
    LLM-->>Post: Raw Generated Tokens
    Post-->>User: Verified Grounded Answer
"""
        else:
            # Universal Dynamic Sequence
            act1 = sanitize_mermaid_label(extracted[0]) if len(extracted) > 0 else "Client / Ingress"
            act2 = sanitize_mermaid_label(extracted[1]) if len(extracted) > 1 else "Coordinator Engine"
            act3 = sanitize_mermaid_label(extracted[2]) if len(extracted) > 2 else "Storage / State Core"

            code = f"""sequenceDiagram
    autonumber
    actor User as Ingress Client
    participant Step1 as {act1[:25]}
    participant Step2 as {act2[:25]}
    participant State as {act3[:25]}

    User->>Step1: Initiate Operation ({safe_topic[:30]})
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
    end
"""
        return code.strip(), title, description

    # -------------------------------------------------------------------------
    # 3. STATE DIAGRAM (Lifecycles & State Transitions)
    # -------------------------------------------------------------------------
    elif diagram_type == "stateDiagram":
        title = f"State Machine: {clean_topic}"
        description = f"State transitions, triggers, and lifecycle for {clean_topic}."

        if domain == "concurrency_deadlock":
            code = f"""stateDiagram-v2
    [*] --> ResourceAvailable : System Initialized
    ResourceAvailable --> Allocated : Process Requests & Acquires Lock
    Allocated --> WaitingForResource : Process Requests Busy Lock
    WaitingForResource --> CycleDetected : Dependency Cycle Formed
    WaitingForResource --> Allocated : Lock Released & Acquired
    CycleDetected --> PreemptionRollback : Recovery Algorithm Invoked
    PreemptionRollback --> ResourceAvailable : Victim Aborted & State Restored
    Allocated --> ResourceAvailable : Process Completes & Releases Locks
    ResourceAvailable --> [*] : All Tasks Terminated
"""
        elif domain == "process_scheduling":
            code = f"""stateDiagram-v2
    [*] --> New : Process Created (fork/exec)
    New --> Ready : Admitted to Ready Queue
    Ready --> Running : Scheduler Dispatch
    Running --> Ready : Time Quantum Expired (Preemption)
    Running --> Waiting : Wait for I/O or Event
    Waiting --> Ready : I/O Complete or Signal
    Running --> Terminated : Process Exit or Kill
    Terminated --> [*]
"""
        elif domain == "networking_protocols":
            code = f"""stateDiagram-v2
    [*] --> CLOSED
    CLOSED --> SYN_SENT : Active Open (Send SYN)
    CLOSED --> LISTEN : Passive Open (Server)
    LISTEN --> SYN_RCVD : Receive SYN (Send SYN-ACK)
    SYN_SENT --> ESTABLISHED : Receive SYN-ACK (Send ACK)
    SYN_RCVD --> ESTABLISHED : Receive ACK
    ESTABLISHED --> FIN_WAIT_1 : Active Close (Send FIN)
    ESTABLISHED --> CLOSE_WAIT : Passive Close (Receive FIN)
    FIN_WAIT_1 --> TIME_WAIT : 2MSL Timer
    TIME_WAIT --> CLOSED : Timeout Complete
    CLOSED --> [*]
"""
        else:
            # Universal Dynamic State Machine
            s1 = sanitize_mermaid_label(extracted[0]) if len(extracted) > 0 else "Initialization"
            s2 = sanitize_mermaid_label(extracted[1]) if len(extracted) > 1 else "Active Processing"
            s3 = sanitize_mermaid_label(extracted[2]) if len(extracted) > 2 else "Verification & Validation"

            code = f"""stateDiagram-v2
    [*] --> InitialState : Trigger Ingestion
    InitialState --> ProcessingState : Parse Parameters ({s1[:20]})
    ProcessingState --> VerificationState : Execute Core Logic ({s2[:20]})
    VerificationState --> CommittedState : All Invariants Satisfied ({s3[:20]})
    VerificationState --> FaultRecovery : Constraint Failure Detected
    FaultRecovery --> ProcessingState : Retry with Adjusted Bounds
    CommittedState --> Finalized : Emit Output
    Finalized --> [*]
"""
        return code.strip(), title, description

    # -------------------------------------------------------------------------
    # 4. CLASS / ARCHITECTURE DIAGRAM
    # -------------------------------------------------------------------------
    elif diagram_type == "class":
        title = f"Class Architecture: {clean_topic}"
        description = f"Object model, data structures, and relationships for {clean_topic}."

        if domain == "concurrency_deadlock":
            code = """classDiagram
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
    ResourceManager --> "1" DeadlockRecoveryEngine : invokes
"""
        else:
            class_name = re.sub(r'[^a-zA-Z0-9]', '', clean_topic) or 'Concept'
            code = f"""classDiagram
    class {class_name}Core {{
        +String identifier
        +Map configParameters
        +initialize() void
        +executePipeline() OutputResult
    }}
    class StateProcessor {{
        -Vector stateHistory
        +evaluateConstraints() bool
        +applyTransformation() void
    }}
    class ValidatorEngine {{
        +checkInvariants() bool
        +emitAuditLog() void
    }}
    {class_name}Core "1" *-- "many" StateProcessor : orchestrates
    {class_name}Core ..> ValidatorEngine : verifies with
"""
        return code.strip(), title, description

    # -------------------------------------------------------------------------
    # 5. FLOWCHART (Process & Logic Flow) - Default
    # -------------------------------------------------------------------------
    else:
        title = f"Flowchart: {clean_topic}"
        description = f"Algorithmic execution flow and decision logic for {clean_topic}."
        dir_code = "LR" if direction == "LR" else "TD"

        if domain == "concurrency_deadlock":
            code = f"""flowchart {dir_code}
    subgraph S1["1. Resource Allocation Request"]
        A["Process P1 issues Request for Resource R1"] --> B{{"Is R1 currently Available?"}}
    end

    subgraph S2["2. State Evaluation & Safety Check"]
        B -->|Yes| C["Temporarily Allocate R1 to P1"]
        C --> D{{"Run Banker's Safety Algorithm<br/>Is State Safe?"}}
        D -->|Safe State| E["Commit Allocation<br/>Update Available Vector"]
        D -->|Unsafe State| F["Rollback Allocation<br/>Block P1 to Prevent Deadlock"]
    end

    subgraph S3["3. Wait-For Graph & Cycle Resolution"]
        B -->|No| G["Add Directed Edge (P1 → P2) in WFG"]
        G --> H{{"Does WFG Contain a Cycle?"}}
        H -->|Cycle Detected| I["DEADLOCK CONFIRMED<br/>Select Victim Process by Cost"]
        I --> J["Abort Victim & Preempt Held Resources"]
        J --> E
        H -->|No Cycle| K["Suspend P1 in Wait Queue"]
    end

    style A fill:#2563eb,stroke:#1d4ed8,color:#fff
    style B fill:#7c3aed,stroke:#6d28d9,color:#fff
    style D fill:#d97706,stroke:#b45309,color:#fff
    style H fill:#dc2626,stroke:#b91c1c,color:#fff
    style E fill:#059669,stroke:#047857,color:#fff
"""
        elif domain == "networking_protocols":
            code = f"""flowchart {dir_code}
    subgraph Phase1["1. Connection Establishment"]
        A["Client creates TCP Socket"] --> B["Send TCP SYN Packet (Seq=x)"]
        B --> C{{"Server Port Open & Listening?"}}
        C -->|Yes| D["Server replies with SYN-ACK (Seq=y, Ack=x+1)"]
        C -->|No| E["Server sends RST Packet (Connection Refused)"]
        D --> F["Client sends ACK (Ack=y+1)"]
    end

    subgraph Phase2["2. Data Transmission & Flow Control"]
        F --> G["Connection ESTABLISHED<br/>Negotiate MSS & Window Size"]
        G --> H["Send Encrypted Application Payload"]
        H --> I{{"Packet Acknowledged within RTO?"}}
        I -->|Yes| J["Slide Congestion Window Forward"]
        I -->|No / Timeout| K["Retransmit Missing Segment<br/>Enter Slow-Start Congestion Avoidance"]
    end

    style A fill:#2563eb,stroke:#1d4ed8,color:#fff
    style D fill:#7c3aed,stroke:#6d28d9,color:#fff
    style G fill:#059669,stroke:#047857,color:#fff
    style K fill:#dc2626,stroke:#b91c1c,color:#fff
"""
        elif domain == "dsa_algorithms":
            code = f"""flowchart {dir_code}
    subgraph Ingress["1. Problem Ingestion & Partitioning"]
        A["Input Data Collection & Target Parameters"] --> B{{"Is Base Case Reached?<br/>(e.g., size <= 1)"}}
        B -->|Yes| C["Return Immediate Base Result"]
        B -->|No| D["Decompose / Partition into Subproblems"]
    end

    subgraph CoreLoop["2. Algorithmic Transformation"]
        D --> E["Execute Core Transformation Rule"]
        E --> F{{"Does Subproblem Match Memoized Cache?"}}
        F -->|Cache Hit| G["Retrieve O(1) Precomputed Value"]
        F -->|Cache Miss| H["Compute Value Recursively / Iteratively"]
        H --> I["Store Computed Value in Lookup Table"]
    end

    subgraph Output["3. Result Synthesis & Validation"]
        G --> J["Combine Subproblem Solutions"]
        I --> J
        J --> K["Verify Invariants & Return Final Answer"]
    end

    style A fill:#2563eb,stroke:#1d4ed8,color:#fff
    style B fill:#7c3aed,stroke:#6d28d9,color:#fff
    style F fill:#d97706,stroke:#b45309,color:#fff
    style K fill:#059669,stroke:#047857,color:#fff
"""
        else:
            # Universal Dynamic Flowchart tailored with extracted phrases
            e1 = sanitize_mermaid_label(extracted[0]) if len(extracted) > 0 else "Input Initialization"
            e2 = sanitize_mermaid_label(extracted[1]) if len(extracted) > 1 else "Primary Transformation Step"
            e3 = sanitize_mermaid_label(extracted[2]) if len(extracted) > 2 else "Invariant & Boundary Check"
            e4 = sanitize_mermaid_label(extracted[3]) if len(extracted) > 3 else "Synthesized Output State"

            code = f"""flowchart {dir_code}
    subgraph Ingestion["Phase 1: Ingestion & Setup"]
        A["{safe_topic[:35]}: Ingress"] --> B["{e1[:40]}"]
    end

    subgraph Processing["Phase 2: Execution & Logic Check"]
        B --> C["{e2[:40]}"]
        C --> D{{"{e3[:35]}?"}}
        D -->|Valid / Satisfied| E["Commit State Transition"]
        D -->|Boundary Error / Retry| F["Trigger Remediation Routine"]
        F --> C
    end

    subgraph Resolution["Phase 3: Output Synthesis"]
        E --> G["{e4[:40]}"]
        G --> H["Deliver Verified Result"]
    end

    style A fill:#2563eb,stroke:#1d4ed8,color:#fff
    style C fill:#7c3aed,stroke:#6d28d9,color:#fff
    style D fill:#d97706,stroke:#b45309,color:#fff
    style H fill:#059669,stroke:#047857,color:#fff
"""
        return code.strip(), title, description
