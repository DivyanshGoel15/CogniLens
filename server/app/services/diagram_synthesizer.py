"""
CogniLens Domain-Aware Diagram Synthesizer
Generates topic-aligned, educational Mermaid.js diagrams with concrete information in each node:
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
    return cleaned[:70] if len(cleaned) > 70 else cleaned


def sanitize_mindmap_text(text: str) -> str:
    """Clean mindmap node text (Mermaid mindmap breaks on (), [], {}, and quotes)."""
    cleaned = re.sub(r'[\(\)\[\]\{\}"\':]', "", text).strip()
    return cleaned[:50] if len(cleaned) > 50 else cleaned


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


def extract_key_phrases(text: str, max_items: int = 6) -> List[str]:
    """Extract key technical terms or sentence fragments from source text."""
    if not text:
        return []
    lines = [line.strip("- *•0123456789.) ").strip() for line in text.splitlines() if line.strip()]
    good_lines = [l for l in lines if 10 <= len(l) <= 75 and not l.startswith("http")]
    if len(good_lines) >= 3:
        return good_lines[:max_items]

    sentences = re.split(r'[.\n;]', text)
    valid_sentences = [s.strip() for s in sentences if 12 <= len(s.strip()) <= 75]
    return valid_sentences[:max_items]


def generate_synthesized_diagram(
    topic: str,
    text_content: str,
    diagram_type: str = "flowchart",
    direction: str = "TD",
) -> Tuple[str, str, str, str, List[str]]:
    """
    Generate an educational, non-generic Mermaid.js diagram and simplified explanation.
    Returns: (mermaid_code, title, description, simplified_explanation, key_takeaways)
    """
    domain = detect_domain(topic, text_content)
    clean_topic = topic.strip() or "Core Concept"
    safe_topic = sanitize_mermaid_label(clean_topic)
    extracted = extract_key_phrases(text_content, 6)

    # -------------------------------------------------------------------------
    # 1. MIND MAP
    # -------------------------------------------------------------------------
    if diagram_type == "mindmap":
        title = f"Concept Mind Map: {clean_topic}"
        description = f"Structured knowledge tree of {clean_topic}."
        root_label = sanitize_mindmap_text(clean_topic)

        if domain == "concurrency_deadlock":
            code = f"""mindmap
  root(( {root_label} ))
    4 Necessary Conditions
      Mutual Exclusion (Only 1 process holds lock)
      Hold and Wait (Holds resource while requesting another)
      No Preemption (Resources cannot be taken by force)
      Circular Wait (Closed chain of waiting processes)
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
      Request All Resources at Once
"""
            simplified = (
                f"A deadlock happens when processes get permanently stuck waiting for each other to release resources, "
                "like cars in a gridlock traffic intersection where no one can move. Breaking even one of the 4 conditions "
                "prevents the deadlock completely."
            )
            takeaways = [
                "Deadlocks require all 4 Coffman conditions to hold at the same time.",
                "Wait-For Graphs detect deadlocks by checking for cycles using DFS.",
                "Recovery involves aborting processes or preempting resources back to a safe checkpoint."
            ]

        elif domain == "networking_protocols":
            code = f"""mindmap
  root(( {root_label} ))
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
      FIN and ACK exchange to close connection
"""
            simplified = (
                f"The TCP handshake is like a polite telephone call: 'Can you hear me?' (SYN), "
                "'Yes, I hear you, can you hear me?' (SYN-ACK), and 'Yes, connection confirmed!' (ACK). "
                "This guarantees both computers are synchronized before transmitting any real data."
            )
            takeaways = [
                "SYN initiates synchronization with an initial sequence number.",
                "SYN-ACK confirms reception and sends the server's sequence number.",
                "ACK establishes the reliable connection for two-way communication."
            ]

        else:
            b1 = sanitize_mindmap_text(extracted[0]) if len(extracted) > 0 else "Core Principles"
            b2 = sanitize_mindmap_text(extracted[1]) if len(extracted) > 1 else "How It Works"
            b3 = sanitize_mindmap_text(extracted[2]) if len(extracted) > 2 else "Rules & Constraints"
            b4 = sanitize_mindmap_text(extracted[3]) if len(extracted) > 3 else "Practical Applications"

            code = f"""mindmap
  root(( {root_label} ))
    Core Principles
      {b1}
      Key Definitions
      Essential Foundations
    Operational Mechanism
      {b2}
      Step-by-Step Flow
      Component Collaboration
    Rules & Constraints
      {b3}
      Boundary Conditions
      Edge Case Handling
    Applied Realization
      {b4}
      Real-World Exam Relevance
      Performance Trade-offs
"""
            simplified = (
                f"This concept map breaks down {clean_topic} into its fundamental principles, how it operates step-by-step, "
                "the constraints governing its behavior, and how it is applied in practice."
            )
            takeaways = [
                f"Master the core mechanism: {b1[:45]}.",
                f"Understand operational rules: {b2[:45]}.",
                f"Watch for boundary constraints: {b3[:45]}."
            ]

        return code.strip(), title, description, simplified, takeaways

    # -------------------------------------------------------------------------
    # 2. SEQUENCE DIAGRAM
    # -------------------------------------------------------------------------
    elif diagram_type == "sequence":
        title = f"Sequence Flow: {clean_topic}"
        description = f"Step-by-step interaction between participating components in {clean_topic}."

        if domain == "concurrency_deadlock":
            code = f"""sequenceDiagram
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
    RM-->>P1: Grant R2 to P1 -> System Unblocked!
"""
            simplified = (
                "This sequence shows two processes that each hold one resource and request what the other holds. "
                "The Wait-For Graph engine detects the circular dependency and terminates one process so the other can finish."
            )
            takeaways = [
                "Process 1 holds R1 and wants R2; Process 2 holds R2 and wants R1.",
                "Circular dependencies form a cycle in the Wait-For Graph.",
                "The OS resolves the deadlock by aborting one process or preempting its held lock."
            ]

        elif domain == "networking_protocols":
            code = f"""sequenceDiagram
    autonumber
    actor Client as Client (Browser)
    participant Server as Web Server (Port 80/443)

    Client->>Server: 1. TCP SYN (Seq = 100) -> 'Let's Synchronize'
    Server-->>Client: 2. TCP SYN-ACK (Seq = 300, Ack = 101) -> 'Acknowledged! Sync with me'
    Client->>Server: 3. TCP ACK (Ack = 301) -> 'Connection Established!'
    Note over Client,Server: Safe two-way channel ready for HTTP/TLS data
    Client->>Server: 4. HTTP GET /data (Send Application Request)
    Server-->>Client: 5. HTTP 200 OK (Return Requested Content)
"""
            simplified = (
                "The 3-way handshake guarantees that both client and server are alive, listening, and have synchronized "
                "their sequence numbers before any real website or API data is transferred."
            )
            takeaways = [
                "SYN initiates the handshake with a random starting sequence number.",
                "SYN-ACK verifies the server is listening and acknowledges the client's number.",
                "ACK completes the circuit, allowing application data to flow reliably."
            ]

        else:
            act1 = sanitize_mermaid_label(extracted[0]) if len(extracted) > 0 else "Client / Requestor"
            act2 = sanitize_mermaid_label(extracted[1]) if len(extracted) > 1 else "Coordinator Engine"
            act3 = sanitize_mermaid_label(extracted[2]) if len(extracted) > 2 else "Storage / State Store"

            code = f"""sequenceDiagram
    autonumber
    actor Ingress as Request Ingress
    participant Step1 as {act1[:25]}
    participant Step2 as {act2[:25]}
    participant State as {act3[:25]}

    Ingress->>Step1: Initiate ({safe_topic[:25]})
    Step1->>Step2: Validate Invariant & Parameters
    Step2->>State: Query State Vector
    alt Preconditions Satisfied
        State-->>Step2: Validation Passed
        Step2->>State: Apply State Mutation
        Step2-->>Step1: Execution Success
        Step1-->>Ingress: Return Verified Result
    else Boundary Check Failed
        State-->>Step2: Constraint Violation Error
        Step2-->>Step1: Trigger Recovery Action
        Step1-->>Ingress: Emit Controlled Retry Notice
    end
"""
            simplified = (
                f"This sequence diagram models the step-by-step communication lifecycle of {clean_topic}, "
                "highlighting parameter validation, state mutation, and graceful error handling."
            )
            takeaways = [
                "Requests enter through the ingress boundary and undergo verification.",
                "Operations mutate state only if all preconditions are satisfied.",
                "Boundary violations trigger dedicated recovery routines."
            ]

        return code.strip(), title, description, simplified, takeaways

    # -------------------------------------------------------------------------
    # 3. STATE DIAGRAM
    # -------------------------------------------------------------------------
    elif diagram_type == "stateDiagram":
        title = f"State Machine: {clean_topic}"
        description = f"Lifecycle states and transitions for {clean_topic}."

        if domain == "concurrency_deadlock":
            code = f"""stateDiagram-v2
    [*] --> ResourceAvailable : System Idle
    ResourceAvailable --> ResourceAllocated : Process Requests & Acquires Lock
    ResourceAllocated --> WaitingForResource : Requests Second Held Lock
    WaitingForResource --> DeadlockCycleDetected : Circular Dependency Formed
    WaitingForResource --> ResourceAllocated : Lock Released by Other Process
    DeadlockCycleDetected --> RecoveryPreemption : OS Invokes Preemption Routine
    RecoveryPreemption --> ResourceAvailable : Victim Aborted & Locks Returned
    ResourceAllocated --> ResourceAvailable : Process Completes & Releases All
    ResourceAvailable --> [*] : All Tasks Finished
"""
            simplified = (
                "A resource moves from Available to Allocated when locked. If a process must wait for a lock that another "
                "process holds in a circle, the system enters the Deadlock state until recovery aborts the victim."
            )
            takeaways = [
                "Normal flow: Available -> Allocated -> Finished.",
                "Contention flow: Allocated -> WaitingForResource.",
                "Deadlock state requires external OS preemption to return resources to Available."
            ]

        else:
            s1 = sanitize_mermaid_label(extracted[0]) if len(extracted) > 0 else "Initialization"
            s2 = sanitize_mermaid_label(extracted[1]) if len(extracted) > 1 else "Execution"
            s3 = sanitize_mermaid_label(extracted[2]) if len(extracted) > 2 else "Verification"

            code = f"""stateDiagram-v2
    [*] --> InitialState : Start ({s1[:20]})
    InitialState --> ActiveProcessing : Parameters Validated
    ActiveProcessing --> VerifyingState : Execute Core Logic ({s2[:20]})
    VerifyingState --> CompletedSuccess : Invariants Confirmed ({s3[:20]})
    VerifyingState --> ErrorRecovery : Constraint Violation
    ErrorRecovery --> ActiveProcessing : Retry with Adjusted Bounds
    CompletedSuccess --> [*] : End of Lifecycle
"""
            simplified = f"Shows the state lifecycle of {clean_topic} from start through verification and completion."
            takeaways = [
                "Transitions only proceed when invariant checks pass.",
                "Violations loop back through dedicated error recovery.",
                "Terminal state confirms successful task execution."
            ]

        return code.strip(), title, description, simplified, takeaways

    # -------------------------------------------------------------------------
    # 4. CLASS DIAGRAM
    # -------------------------------------------------------------------------
    elif diagram_type == "class":
        title = f"Class Architecture: {clean_topic}"
        description = f"Object model and structural relationships for {clean_topic}."

        if domain == "concurrency_deadlock":
            code = """classDiagram
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
    ResourceManager --> "1" DeadlockResolver : triggers recovery
"""
            simplified = (
                "The object model separates responsibilities: Processes hold resources, the Resource Manager evaluates claims, "
                "the WaitForGraph detects cycle dependencies, and the DeadlockResolver cleans up deadlocks."
            )
            takeaways = [
                "Process: Encapsulates held locks and pending requests.",
                "WaitForGraph: Directed graph maintaining dependency edges to find cycles.",
                "DeadlockResolver: Selects victim process based on cost metric for rollback."
            ]

        else:
            class_name = re.sub(r'[^a-zA-Z0-9]', '', clean_topic) or 'Concept'
            code = f"""classDiagram
    class {class_name}Model {{
        +String identifier
        +Map configSettings
        +executeOperation() Result
        +verifyInvariants() bool
    }}
    class ExecutionEngine {{
        -List stateHistory
        +processStep() void
        +handleException() void
    }}
    class ValidationAuditor {{
        +checkRules() bool
        +generateReport() Report
    }}
    {class_name}Model "1" *-- "many" ExecutionEngine : coordinates
    {class_name}Model ..> ValidationAuditor : verifies with
"""
            simplified = f"Architecture model representing the entities, methods, and relationships of {clean_topic}."
            takeaways = [
                f"{class_name}Model acts as the primary coordinator.",
                "ExecutionEngine maintains state history and step execution.",
                "ValidationAuditor enforces domain constraints and invariants."
            ]

        return code.strip(), title, description, simplified, takeaways

    # -------------------------------------------------------------------------
    # 5. FLOWCHART (Default)
    # -------------------------------------------------------------------------
    else:
        title = f"Educational Flowchart: {clean_topic}"
        description = f"Step-by-step logic and decision flow explaining {clean_topic}."
        dir_code = "LR" if direction == "LR" else "TD"

        if domain == "concurrency_deadlock":
            code = f"""flowchart {dir_code}
    A["Process Requests Resource R1"] --> B{{"Is Resource R1 currently Free?"}}
    B -->|Yes: Free| C["Allocate Resource R1 to Process<br/>(Process continues running)"]
    B -->|No: Busy| D["Process enters Wait Queue<br/>(Cannot proceed without R1)"]

    D --> E["OS adds edge to Wait-For Graph:<br/>(Process P1 → Process P2 holding R1)"]
    E --> F{{"Does Wait-For Graph contain a Circular Cycle?"}}

    F -->|No: No Cycle| G["Normal Wait State<br/>(Process will wake up when R1 is released)"]
    F -->|Yes: Cycle Exists| H["DEADLOCK CONFIRMED!<br/>Circular dependency prevents all progress"]

    H --> I["Recovery Engine chooses Victim Process<br/>(Based on lowest priority or runtime cost)"]
    I --> J["Abort Victim & Forcibly Release Held Resources"]
    J --> C

    style A fill:#2563eb,stroke:#1d4ed8,color:#fff
    style B fill:#7c3aed,stroke:#6d28d9,color:#fff
    style C fill:#059669,stroke:#047857,color:#fff
    style F fill:#d97706,stroke:#b45309,color:#fff
    style H fill:#dc2626,stroke:#b91c1c,color:#fff
"""
            simplified = (
                "A deadlock is like two people each holding one shoe and refusing to share: neither can walk! "
                "When a process asks for a busy resource, it waits. If a circle of waiting processes forms, "
                "the OS detects the cycle and terminates one process to free its resources so the others can continue."
            )
            takeaways = [
                "Available resources are granted immediately; busy resources put the process to sleep.",
                "The OS checks the Wait-For Graph: a closed loop means a deadlock is present.",
                "The system breaks the deadlock by choosing a victim process and aborting it to free locks."
            ]

        elif domain == "networking_protocols":
            code = f"""flowchart {dir_code}
    A["Client creates Socket & wants connection"] --> B["Step 1: Client sends SYN Packet<br/>(Random Sequence Number = x)"]
    B --> C{{"Is Server listening on Port?"}}
    C -->|No| D["Server sends RST Packet<br/>(Connection Refused)"]
    C -->|Yes| E["Step 2: Server sends SYN-ACK Packet<br/>(Server Seq = y, Ack = x + 1)"]
    E --> F["Step 3: Client sends ACK Packet<br/>(Ack = y + 1)"]
    F --> G["Connection ESTABLISHED!<br/>Reliable two-way channel ready for HTTP/TLS data"]

    style A fill:#2563eb,stroke:#1d4ed8,color:#fff
    style C fill:#7c3aed,stroke:#6d28d9,color:#fff
    style E fill:#d97706,stroke:#b45309,color:#fff
    style G fill:#059669,stroke:#047857,color:#fff
"""
            simplified = (
                "Before two computers can exchange data over TCP, they must agree on starting numbers. "
                "Client sends SYN ('hello, start at x'). Server sends SYN-ACK ('got x, start at y'). "
                "Client sends ACK ('got y, connection ready!')."
            )
            takeaways = [
                "Step 1 (SYN): Initiates handshake with client's sequence number.",
                "Step 2 (SYN-ACK): Server confirms client's number and introduces its own.",
                "Step 3 (ACK): Final handshake confirmation completes the reliable connection."
            ]

        else:
            e1 = sanitize_mermaid_label(extracted[0]) if len(extracted) > 0 else "Initialize input parameters"
            e2 = sanitize_mermaid_label(extracted[1]) if len(extracted) > 1 else "Execute primary transformation"
            e3 = sanitize_mermaid_label(extracted[2]) if len(extracted) > 2 else "Check boundary constraints"
            e4 = sanitize_mermaid_label(extracted[3]) if len(extracted) > 3 else "Generate final outcome"

            code = f"""flowchart {dir_code}
    A["Start: Concept Overview for {safe_topic[:30]}"] --> B["{e1[:50]}"]
    B --> C["{e2[:50]}"]
    C --> D{{"{e3[:40]}?"}}
    D -->|Yes: Valid| E["{e4[:50]}"]
    D -->|No: Boundary Case| F["Apply Alternative Handling & Safety Fallback"]
    F --> E
    E --> G["Final Result: Successfully Applied {safe_topic[:25]}"]

    style A fill:#2563eb,stroke:#1d4ed8,color:#fff
    style C fill:#7c3aed,stroke:#6d28d9,color:#fff
    style D fill:#d97706,stroke:#b45309,color:#fff
    style G fill:#059669,stroke:#047857,color:#fff
"""
            simplified = (
                f"This flowchart outlines the practical decision-making process for {clean_topic}. "
                "It walks through the initial parameters, transformation rules, decision checks, and final verified outcome."
            )
            takeaways = [
                f"Initial Step: {e1[:50]}.",
                f"Key Decision: Verify {e3[:40]}.",
                f"Target Outcome: {e4[:50]}."
            ]

        return code.strip(), title, description, simplified, takeaways
