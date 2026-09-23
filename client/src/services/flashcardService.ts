import { Flashcard, FlashcardConfidence, FlashcardDeck } from '../types/flashcard';
import { ApiResponse } from './apiTypes';
import { apiClient } from './apiClient';
import { getGeminiApiKey } from '../components/ai-tutor/ApiKeySetup';

// ---------------------------------------------------------------------------
// High-Yield Academic Knowledge Base — Rich, In-Depth Flashcard Content
// Each entry: [subtopic, question, detailed_answer, difficulty]
// ---------------------------------------------------------------------------
type CardTemplate = [string, string, string, string];

const TOPIC_KNOWLEDGE: Record<string, CardTemplate[]> = {
  'operating systems': [
    [
      'Process Lifecycle',
      'Describe the 5 principal process states and the kernel transitions between them.',
      `A process lifecycle is managed through five fundamental states in the Process Control Block (PCB):

• New: Process is being created, initialized, and its PCB allocated in kernel memory.
• Ready: Process is residing in the ready queue, fully loaded into main memory, awaiting CPU dispatch.
• Running: Instructions are being executed directly on the CPU hardware.
• Waiting (Blocked): Process cannot execute because it is waiting for an external event (e.g. I/O completion, page fault resolution, mutex lock).
• Terminated: Execution has finished; exit status is captured by parent via wait() system call, and OS reclaims address space.

★ Key Invariant: A process moves from Running → Ready on timer preemption (quantum expiry), and Running → Waiting on blocking system calls.`,
      'Easy'
    ],
    [
      'Deadlocks & Coffman Conditions',
      'State all 4 Coffman conditions required for deadlock and explain how each can be prevented.',
      `A deadlock occurs when concurrent processes are permanently blocked because each holds resources while awaiting resources held by others. All four conditions must hold simultaneously:

1. Mutual Exclusion: At least one resource must be held in a non-shareable mode.
   ↳ Prevention: Use virtualization/spooling (e.g., spooler for printers) or read-only access.
2. Hold and Wait: A process holds ≥1 resource while waiting to acquire others.
   ↳ Prevention: Require processes to request ALL required resources simultaneously at startup.
3. No Preemption: Resources cannot be forcibly seized; they must be released voluntarily.
   ↳ Prevention: If a process holding resources requests an unavailable resource, forcibly preempt all its currently held resources.
4. Circular Wait: A closed chain P0 → P1 → ... → Pn → P0 exists where each Pi waits for a resource held by P(i+1).
   ↳ Prevention: Impose strict global numeric ordering on all resources; processes can only request resources in strictly ascending order.

★ Exam Takeaway: In single-instance systems, a cycle in a Resource Allocation Graph (RAG) is both NECESSARY and SUFFICIENT for deadlock. In multi-instance systems, a cycle is necessary but NOT sufficient.`,
      'Hard'
    ],
    [
      'CPU Scheduling',
      'Compare Preemptive vs Non-Preemptive Scheduling and explain the Convoy Effect in FCFS.',
      `CPU Scheduling decides which process in the ready queue receives the CPU.

• Preemptive Scheduling: The OS kernel forcibly interrupts running processes (via hardware timer interrupts) when higher priority tasks arrive or a time quantum expires (e.g. Round Robin, SRTF, Priority Preemptive). Essential for interactive responsiveness.
• Non-Preemptive Scheduling: Once allocated the CPU, a process retains control until it voluntarily terminates or blocks for I/O (e.g. FCFS, Non-preemptive SJF).

★ The Convoy Effect: Occurs in FCFS when one long CPU-bound process hog the CPU while dozens of short I/O-bound processes wait behind it in the ready queue. This severely degrades device utilization and inflates Average Waiting Time (AWT).

★ Formula: Turnaround Time (TAT) = Completion Time - Arrival Time | Waiting Time (WT) = TAT - Burst Time.`,
      'Medium'
    ],
    [
      'Demand Paging & Page Faults',
      'Detail the exact step-by-step kernel mechanism of handling a Page Fault trap.',
      `Demand paging loads pages into physical memory only upon reference (lazy evaluation). When an instruction accesses a page marked invalid in the Page Table:

1. Hardware Trap: The MMU raises an internal exception/trap (Page Fault) to the OS kernel.
2. State Preservation: The CPU saves user registers and current program counter onto the kernel stack.
3. Validity Verification: The OS inspects the internal PCB tables to verify if the address is legal. If illegal, SIGSEGV is raised; if legal, it is an unmapped page.
4. Free Frame Allocation: The OS searches the free-frame list. If no frame is free, a page replacement algorithm (e.g., LRU) selects a victim frame (and writes it to swap if dirty).
5. Disk I/O Read: A non-blocking disk I/O request fetches the requested page from swap space into the allocated physical frame.
6. Page Table Update: The OS updates the page table entry (PTE) with the frame number and sets the valid bit to 1.
7. Instruction Restart: The faulting process is moved back to the Ready queue. When rescheduled, the CPU restarts the exact instruction that triggered the fault.`,
      'Hard'
    ],
    [
      'Concurrency Control',
      'What is the fundamental difference between a Mutex and a Binary Semaphore?',
      `While both synchronize access to critical sections, their design intent and semantics differ significantly:

• Mutex (Mutual Exclusion Lock):
  - Strict Ownership Semantics: Only the exact thread that acquired (locked) the mutex can release (unlock) it.
  - Priority Inversion Protection: Mutexes often support priority inheritance protocols to prevent lower-priority threads from starving high-priority threads.
  - Used strictly for mutual exclusion around shared state.

• Binary Semaphore:
  - Signaling Mechanism: Has no concept of ownership. Any thread (or even an interrupt service routine) can signal (V/post) a semaphore that was waited on (P/wait) by another thread.
  - Value is bounded between 0 and 1.
  - Used primarily for signaling events and producer-consumer handoffs.

★ Exam Pitfall: Never call a mutex a binary semaphore with a fancy name—the ownership constraint of a mutex is what enables recursion and priority inversion safeguards.`,
      'Hard'
    ],
    [
      'Banker\'s Algorithm',
      'Explain the data structures and safety criteria in Dijkstra\'s Banker\'s Algorithm.',
      `Banker\'s Algorithm is a deadlock avoidance algorithm for multi-instance resource systems. It ensures the system never enters an unsafe state.

Data Structures:
• Available[m]: Vector of length m indicating available instances of each resource type.
• Max[n][m]: Maximum demand matrix of each process n for resource m.
• Allocation[n][m]: Currently allocated instances of resource m to process n.
• Need[n][m]: Remaining resource instances required by each process: Need[i][j] = Max[i][j] - Allocation[i][j].

Safety Test Protocol:
1. Work = Available, Finish[i] = false for all i.
2. Find an index i such that: Finish[i] == false AND Need[i] ≤ Work.
3. If such an i exists: Work = Work + Allocation[i]; Finish[i] = true; repeat Step 2.
4. If Finish[i] == true for all i, the system is in a SAFE STATE.

★ Asymptotic Complexity: O(m · n²), where n = number of processes and m = number of resource types.`,
      'Medium'
    ],
    [
      'Virtual Memory & Thrashing',
      'What causes Thrashing in virtual memory and how does the Working Set Model resolve it?',
      `• Definition: Thrashing occurs when a computer's virtual memory subsystem is in a constant state of paging, rapidly exchanging data in memory for data on disk, to where execution virtually grinds to a halt.
• Root Cause: When the sum of the working sets of all active processes exceeds the total available physical memory frames:
  ∑ WSS_i > Total Available Frames

• The Working Set Model (Denning):
  - Defines the working set WS(t, Δ) as the set of unique pages referenced by a process during the most recent window of Δ memory references.
  - If the OS monitors WSS_i and detects ∑ WSS_i > Frames, it suspends one or more active processes entirely (swapping their entire memory out to disk).
  - This frees up sufficient physical frames for the remaining processes to satisfy their locality requirements without faulting.

★ Diagnostic Indicator: High disk I/O activity coupled with extremely low CPU utilization indicates severe thrashing.`,
      'Hard'
    ],
    [
      'Unix File System Inodes',
      'What metadata does an Inode contain, and how does multi-level indirect indexing work?',
      `An Inode (index node) represents a filesystem object on Unix/Linux filesystems.

Contents of an Inode:
• File type & permission bits (rwxr-xr-x)
• Owner UID and Group GID
• File size in bytes
• Timestamps: Access (atime), Modify (mtime), Change (ctime)
• Hard link count
• Pointers to physical disk data blocks.

★ CRITICAL: The filename is NOT stored in the inode! The filename is stored as an entry in the parent directory file mapped to an inode number.

Multi-Level Block Pointer Structure (typical 15 pointers):
• 12 Direct Pointers: Point directly to data blocks (fast access for small files).
• 1 Single Indirect Pointer: Points to a block containing pointers to data blocks.
• 1 Double Indirect Pointer: Points to a block of indirect pointer blocks.
• 1 Triple Indirect Pointer: Supports multi-terabyte files with O(1) random seeking.`,
      'Medium'
    ],
    [
      'Page Replacement',
      'Explain Belady\'s Anomaly and contrast FIFO with Stack Algorithms (LRU & OPT).',
      `• Belady\'s Anomaly: The counter-intuitive phenomenon where increasing the number of physical page frames allocated to a process results in an INCREASE (rather than decrease) in the total number of page faults.
• Where it occurs: Seen in simple First-In-First-Out (FIFO) page replacement.
  Example string: 1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5
  - With 3 frames: produces 9 page faults.
  - With 4 frames: produces 10 page faults!

★ Stack Algorithms Guarantee:
- A page replacement algorithm is a "Stack Algorithm" if the set of pages in memory for n frames is ALWAYS a strict subset of the pages that would be in memory for n+1 frames:
  M(n) ⊆ M(n+1)
- Least Recently Used (LRU) and Optimal (OPT/MIN) are strictly stack algorithms and are mathematically PROVEN to never suffer from Belady\'s Anomaly.`,
      'Hard'
    ],
    [
      'Context Switching',
      'What exact operations take place during a CPU Context Switch and what causes its overhead?',
      `A context switch is the computing process of storing the state of an active process/thread so that it can be restored and resume execution at a later point.

Kernel Sequence:
1. Hardware saves Program Counter (PC), Processor Status Word (PSW), and Stack Pointer (SP) into the kernel interrupt stack.
2. The OS scheduler saves remaining general-purpose CPU registers into the outgoing Process Control Block (PCB).
3. The scheduler updates the outgoing process state from Running to Ready or Waiting.
4. The scheduler chooses the next process via scheduling policy and loads its PCB state.
5. Memory Management Update: The CPU's Page Table Base Register (CR3 on x86) is switched to the incoming process's page directory.
6. Execution Resumption: Registers and PC are loaded, returning execution to user mode.

★ Key Overhead Factors:
• Direct Overhead: Saving and restoring dozens of hardware registers (~microseconds).
• Indirect Overhead (Dominant): Switching CR3 flushes the Translation Lookaside Buffer (TLB). Subsequent memory references suffer cold cache misses and TLB page walks.`,
      'Medium'
    ]
  ],

  'data structures': [
    [
      'Arrays & Pointer Arithmetic',
      'Explain the memory layout of arrays and why index access is strictly O(1).',
      `Arrays are linear, homogeneous collections of elements stored in contiguous memory addresses.

Addressing Formula:
For an array with Base Address B, where each element occupies S bytes:
Address(A[i]) = B + i · S

For a 2D array A[M][N] in Row-Major order:
Address(A[i][j]) = B + (i · N + j) · S

Key Architectural Insights:
• Constant Time O(1): Random access requires only one multiplication and one addition in the CPU ALU.
• Spatial Locality: Because elements are contiguous, CPU hardware prefetchers load entire cache lines (typically 64 bytes) into L1/L2 cache, maximizing cache hits during sequential traversals.
• Trade-off: Fixed capacity requires O(n) reallocation and copy when resizing dynamic arrays.`,
      'Easy'
    ],
    [
      'Binary Search Tree (BST)',
      'State the BST Invariant and explain how degenerate trees degrade time complexity.',
      `• The BST Invariant: For every node X in the tree:
  - All keys in the left subtree of X must be strictly LESS than X.key.
  - All keys in the right subtree of X must be strictly GREATER than X.key.
  - Both subtrees must recursively be valid Binary Search Trees.

Complexity Dynamics:
• Best & Average Case: O(log n) for Search, Insert, and Delete when the tree is reasonably balanced (height h ≈ log₂ n).
• Worst Case O(n): When elements are inserted in sorted or reverse-sorted order (e.g. 1, 2, 3, 4, 5), the tree degrades into a linear singly-linked list with height h = n.

★ In-Order Traversal Invariant: An in-order traversal (Left → Root → Right) of any valid BST yields keys in strictly sorted ascending order in O(n) time.`,
      'Easy'
    ],
    [
      'AVL Trees & Rotations',
      'Define the AVL Balance Factor and explain all 4 rebalancing rotations.',
      `An AVL Tree is a strictly self-balancing Binary Search Tree where the height difference between subtrees is bounded.

Balance Factor (BF):
BF(node) = Height(Left Subtree) - Height(Right Subtree)
★ Invariant: For every node in an AVL tree, BF(node) ∈ {-1, 0, +1}.

The 4 Rotations (triggered when |BF| > 1):
1. Left-Left (LL) Heavy: Fixed via a single Right Rotation at the unbalance node.
2. Right-Right (RR) Heavy: Fixed via a single Left Rotation at the unbalance node.
3. Left-Right (LR) Heavy: First perform Left Rotation on left child, then Right Rotation on parent.
4. Right-Left (RL) Heavy: First perform Right Rotation on right child, then Left Rotation on parent.

★ Asymptotics: Guaranteed O(log n) worst-case search, insert, and delete. Height never exceeds 1.44 · log₂(n + 2).`,
      'Hard'
    ],
    [
      'Binary Heap & Priority Queue',
      'What are the structural and heap-order properties of a Max-Heap?',
      `A Binary Heap is a complete binary tree implemented efficiently inside a contiguous 1D array.

1. Structural Property: Complete Binary Tree—every level is completely filled, except possibly the last level which is filled from left to right.
2. Heap-Order Property: For a Max-Heap, every parent node is greater than or equal to its children:
   A[parent(i)] ≥ A[i]

Array Indexing Formula (0-indexed):
• Parent(i) = ⌊(i - 1) / 2⌋
• Left Child(i) = 2i + 1
• Right Child(i) = 2i + 2

Operations & Complexity:
• Insert: Place element at array end, then Sift-Up (Percolate Up) → O(log n).
• Extract-Max: Swap root with last element, delete last, then Sift-Down (Percolate Down) → O(log n).
• Peek: Return root A[0] → O(1).
• Build-Heap (Floyd\'s Algorithm): Sift-down from last non-leaf node ⌊n/2⌋ - 1 down to 0 → O(n) linear time.`,
      'Medium'
    ],
    [
      'Hashing & Collision Resolution',
      'Compare Separate Chaining vs Open Addressing (Linear Probing vs Double Hashing).',
      `A Hash Table maps keys to bucket indices using a hash function h(k). When h(k₁) = h(k₂), a collision occurs.

1. Separate Chaining:
• Each array bucket holds a pointer to a linked list (or Red-Black tree in Java 8+) of colliding entries.
• Load Factor α = n / m can safely exceed 1.0.
• Deletions are trivial (standard node unlink).

2. Open Addressing (All entries stored directly in the table array; α must stay < 0.7):
• Linear Probing: h(k, i) = (h(k) + i) mod m. Suffers severely from Primary Clustering (long continuous runs of occupied slots).
• Quadratic Probing: h(k, i) = (h(k) + c₁ i + c₂ i²) mod m. Eliminates primary clustering but causes secondary clustering.
• Double Hashing: h(k, i) = (h₁(k) + i · h₂(k)) mod m, where h₂(k) must be relatively prime to table size m. Provides closest approximation to uniform hashing.`,
      'Hard'
    ],
    [
      'Graph Traversal',
      'Contrast Breadth-First Search (BFS) and Depth-First Search (DFS) in mechanisms and applications.',
      `Both algorithms systematically visit all V vertices and E edges of a graph in O(V + E) time.

• Breadth-First Search (BFS):
  - Data Structure: FIFO Queue.
  - Traversal Flow: Explores vertices in concentric frontier rings of increasing distance from source.
  - Space Complexity: O(V) to store frontier level queue.
  - Prime Applications: Unweighted Shortest Path, Connected Components, Testing Bipartiteness (2-coloring), Web crawling.

• Depth-First Search (DFS):
  - Data Structure: LIFO Stack (or recursion).
  - Traversal Flow: Follows a path as deep as possible before backtracking.
  - Space Complexity: O(h) where h is maximum recursion depth (O(V) worst-case).
  - Prime Applications: Topological Sorting (DAGs), Cycle Detection, Finding Strongly Connected Components (Kosaraju / Tarjan), Solving mazes.`,
      'Medium'
    ],
    [
      'Red-Black Tree Properties',
      'List the 5 mandatory Red-Black Tree invariants and explain why height is bounded.',
      `A Red-Black Tree is a self-balancing BST that uses node color bits to ensure logarithmic height without the strict balance requirements of AVL trees.

The 5 Invariants:
1. Every node is either RED or BLACK.
2. The root node is always BLACK.
3. Every leaf node (NIL sentinel) is BLACK.
4. If a node is RED, both of its children must be BLACK (no two RED nodes can be adjacent; no consecutive red nodes).
5. For every node, all simple paths from that node to any of its descendant NIL leaves contain the EXACT SAME number of black nodes (known as Black-Height, bh).

★ Mathematical Bound:
Because no path can contain consecutive red nodes, the longest path (alternating red and black) is at most twice the length of the shortest path (all black). This mathematically guarantees:
Height h ≤ 2 · log₂(n + 1)
All operations (Search, Insert, Delete) run in guaranteed O(log n) time.`,
      'Hard'
    ],
    [
      'Sorting Algorithms',
      'Compare Quicksort and Mergesort in algorithmic strategy, space complexity, and stability.',
      `Both algorithms employ Divide-and-Conquer paradigms but make fundamentally different engineering trade-offs:

• Mergesort:
  - Strategy: Divides array into two halves, recursively sorts them, and merges sorted halves in O(n) linear scan.
  - Time Complexity: O(n log n) in ALL cases (Best, Average, Worst).
  - Space Complexity: O(n) auxiliary array buffer space required for merging arrays (O(1) extra space for linked lists).
  - Stability: Strictly STABLE (preserves relative order of equal keys). Ideal for sorting linked lists or external disk sorting.

• Quicksort:
  - Strategy: Selects a pivot element, partitions the array such that elements ≤ pivot are left and > pivot are right, then recurses.
  - Time Complexity: O(n log n) average; O(n²) worst-case (if pivot is consistently minimum/maximum in sorted array).
  - Space Complexity: In-place O(log n) stack frames with tail-call recursion optimization.
  - Stability: UNSTABLE due to long-distance swaps during partitioning. Preferred in-memory sort due to superior cache locality.`,
      'Hard'
    ],
    [
      'Dynamic Programming Principles',
      'What are the two essential prerequisites for Dynamic Programming and how does Memoization differ from Tabulation?',
      `Dynamic Programming (DP) solves complex problems by breaking them down into simpler, overlapping subproblems.

Two Mandatory Prerequisites:
1. Optimal Substructure: An optimal solution to the overall problem incorporates optimal solutions to its constituent subproblems.
2. Overlapping Subproblems: The same subproblems are solved repeatedly rather than generating new subproblems at each stage.

Technique Comparison:
• Top-Down (Memoization):
  - Starts with the original problem and recursively breaks it down.
  - Caches results of function calls in a hash table or array.
  - Overhead: Function call stack overhead; potential risk of stack overflow on deep recursions.
  - Advantage: Only computes subproblems that are strictly necessary along the execution path.

• Bottom-Up (Tabulation):
  - Starts with the base cases and iteratively fills an N-dimensional table in topological dependency order.
  - Zero recursion stack overhead; cache-friendly sequential memory loops.
  - Space Optimization: Often allows reducing space complexity (e.g. from O(n) to O(1) in Fibonacci or Kadane's).`,
      'Medium'
    ],
    [
      'Dijkstra\'s Shortest Path',
      'Explain Dijkstra\'s Algorithm and why it fails on negative edge weights.',
      `Dijkstra\'s Algorithm computes the shortest path from a single source vertex to all other vertices in a weighted graph with non-negative edge weights.

Algorithm Flow:
1. Initialize dist[source] = 0 and dist[v] = ∞ for all other vertices.
2. Insert (dist[source], source) into a Min-Priority Queue.
3. While the Priority Queue is not empty:
   - Extract the vertex u with minimum tentative distance.
   - For each outgoing edge (u, v) with weight w:
     If dist[u] + w < dist[v]:
       dist[v] = dist[u] + w (Relaxation Step)
       Push (dist[v], v) into Priority Queue.

★ Why it FAILS on Negative Weights:
Dijkstra assumes that once a vertex is extracted from the Priority Queue, its shortest path is permanently finalized (greedy choice property). A negative edge encountered later could create a shorter path through an already-visited vertex, invalidating prior settlements.
↳ For graphs with negative weights, use the Bellman-Ford Algorithm (O(V · E)).`,
      'Hard'
    ]
  ],

  'machine learning': [
    [
      'Gradient Descent & Optimizers',
      'State the parameter update rule in Gradient Descent and explain the role of the learning rate α.',
      `Gradient Descent is an iterative optimization algorithm used to minimize a differentiable cost function J(θ).

Parameter Update Equation:
θ_{t+1} = θ_t - α ∇_θ J(θ_t)

Where:
• θ = parameter vector (weights and biases).
• α = learning rate (step size hyperparameter).
• ∇_θ J(θ) = gradient vector of partial derivatives pointing in the direction of steepest ascent.

Impact of Learning Rate α:
• Too Large: The algorithm overshoots the minimum, oscillations diverge across valley walls, and loss becomes NaN.
• Too Small: The algorithm takes minuscule steps, requiring millions of iterations, and gets easily trapped in plateau saddle points.

★ Momentum Extension:
v_t = β v_{t-1} + (1 - β) ∇ J(θ_t)
θ_{t+1} = θ_t - α v_t
Momentum accelerates progress along consistent gradients while dampening transverse oscillations.`,
      'Medium'
    ],
    [
      'Bias-Variance Tradeoff',
      'Formulate the Bias-Variance Decomposition and describe underfitting vs overfitting.',
      `The expected generalization error of a machine learning model on unseen test data can be decomposed mathematically into three terms:

Expected Error = Bias² + Variance + Irreducible Noise (σ²)

Components:
1. Bias²: Error stemming from erroneous simplifying assumptions in the model.
   • High Bias → Underfitting: Model is too simplistic to capture underlying patterns (e.g. fitting linear regression to quadratic data). Both training and test errors are high.
2. Variance: Error stemming from extreme sensitivity to small fluctuations in the training set.
   • High Variance → Overfitting: Model memorizes random noise and idiosyncrasies of training data (e.g. deep unpruned decision trees). Training error is near zero, but test error is high.
3. Irreducible Noise (σ²): Inherent randomness or unobserved variables in the data-generating process.

★ Mitigation Strategies:
• Reduce High Bias: Increase model capacity, add polynomial/interaction features, decrease regularization (λ).
• Reduce High Variance: Add regularization (L1/L2), gather more training samples, perform dropout, use ensemble bagging (Random Forests).`,
      'Hard'
    ],
    [
      'L1 vs L2 Regularization',
      'Contrast L1 (Lasso) and L2 (Ridge) regularization and explain why L1 enforces sparsity.',
      `Regularization penalizes model complexity to mitigate overfitting by appending a norm penalty to the objective loss function:

Objective = Loss(y, ŷ) + λ · Penalty

1. L1 Regularization (Lasso):
• Penalty = λ ∑ |w_i| (L1 Norm)
• Geometric Intuition: The L1 constraint region is a diamond with sharp corners aligned with coordinate axes. The elliptical contours of the MSE loss surface intersect the diamond at its sharp vertices, driving weight values exactly to ZERO (w_i = 0).
• Result: Produces sparse models; performs automatic feature selection.

2. L2 Regularization (Ridge):
• Penalty = λ ∑ w_i² (Squared L2 Norm)
• Geometric Intuition: The L2 constraint region is a smooth hypersphere/circle. Loss contours touch the boundary at non-zero tangent points.
• Result: Shrinks all weight coefficients smoothly towards zero, but rarely sets any weight exactly to zero. Highly effective at handling multicollinearity.`,
      'Hard'
    ],
    [
      'Activation Functions',
      'Compare Sigmoid and ReLU, and explain the "Dying ReLU" phenomenon.',
      `Activation functions introduce non-linearity, enabling neural networks to approximate non-linear continuous functions (Universal Approximation Theorem).

1. Sigmoid Function: σ(z) = 1 / (1 + e⁻ᶻ)
• Output range: (0, 1).
• Major Flaw (Vanishing Gradient): Derivative σ'(z) = σ(z)(1 - σ(z)) peaks at only 0.25 when z = 0. During backpropagation, chaining multiple derivatives < 0.25 across layers causes gradients to exponentially dissipate to zero, halting weight updates in early layers.

2. Rectified Linear Unit (ReLU): f(z) = max(0, z)
• Output range: [0, ∞).
• Advantage: For positive activations (z > 0), the gradient is strictly 1.0, completely eliminating vanishing gradients. Computation is blazing fast (simple hardware thresholding).

★ The Dying ReLU Problem:
If a large gradient update pushes a neuron's weights such that z < 0 across all training data, the neuron outputs 0 with a gradient of 0. It can never update again and becomes permanently inactive ("dead").
↳ Solutions: Leaky ReLU (f(z) = max(0.01z, z)), Parametric ReLU (PReLU), or ELU/GELU.`,
      'Hard'
    ],
    [
      'Precision, Recall & F1-Score',
      'Define Precision, Recall, and F1-Score, and explain why Accuracy is misleading on imbalanced data.',
      `Evaluation metrics for classification evaluate distinct facets of prediction quality:

Formulas:
• Precision = TP / (TP + FP)
  ↳ "Of all samples predicted positive, what fraction was actually positive?" Focuses on minimizing False Positives (e.g. Spam detection).
• Recall (Sensitivity) = TP / (TP + FN)
  ↳ "Of all actual positive samples, what fraction did the model find?" Focuses on minimizing False Negatives (e.g. Cancer detection, Fraud).
• F1-Score = 2 · (Precision · Recall) / (Precision + Recall)
  ↳ The harmonic mean of precision and recall. Penalizes models with extreme imbalances between precision and recall.

★ The Accuracy Paradox:
Accuracy = (TP + TN) / Total.
In an imbalanced dataset where 99% of samples are class 0 (healthy) and 1% are class 1 (disease), a naive classifier that simply outputs "0" for every patient achieves 99% accuracy while having a Recall of 0% and failing entirely at its purpose.`,
      'Medium'
    ],
    [
      'Backpropagation & Chain Rule',
      'Explain the computational flow of Backpropagation in a Multilayer Perceptron.',
      `Backpropagation is reverse-mode automatic differentiation applied to an interconnected computational graph.

Forward Pass:
1. Linear Transformation: z^[l] = W^[l] a^[l-1] + b^[l]
2. Non-linear Activation: a^[l] = g^[l](z^[l])
3. Loss Evaluation: Compute loss L(ŷ, y) at the output layer.

Backward Pass (Reverse Chain Rule):
1. Output Layer Gradient: δ^[L] = ∇_{a^[L]} L ⊙ g'^[L](z^[L])
2. Hidden Layer Gradients: δ^[l] = ( (W^[l+1])ᵀ δ^[l+1] ) ⊙ g'^[l](z^[l])
3. Weight Partial Derivatives: ∂L / ∂W^[l] = δ^[l] · (a^[l-1])ᵀ
4. Bias Partial Derivatives: ∂L / ∂b^[l] = δ^[l]

★ Algorithmic Advantage: Dynamic programming caches intermediate activation vectors and partial derivatives, reducing what would be exponential symbolic calculus into an O(|Edges|) linear-time computational graph traversal.`,
      'Hard'
    ],
    [
      'ROC-AUC vs PR-Curve',
      'Explain the ROC curve, Area Under Curve (AUC), and when to use Precision-Recall curves instead.',
      `• Receiver Operating Characteristic (ROC) Curve:
  - Plots True Positive Rate (Recall) on the y-axis vs False Positive Rate (FPR = FP / (FP + TN)) on the x-axis across all classification probability thresholds (0.0 to 1.0).
  - Area Under the ROC Curve (AUC-ROC): Evaluates the probability that the model ranks a randomly chosen positive example higher than a randomly chosen negative example.
    * AUC = 1.0: Perfect ranking.
    * AUC = 0.5: No discrimination (equivalent to random coin toss).

★ When ROC is Misleading:
Because the denominator of FPR includes True Negatives (TN), if the negative class is overwhelmingly large (e.g., ad clicks, fraud), massive increases in False Positives cause only negligible changes in FPR, making the ROC curve look deceptively optimistic.

★ Solution: Use Precision-Recall (PR) Curves for heavily imbalanced datasets, as neither precision nor recall incorporates True Negatives into its calculation.`,
      'Medium'
    ],
    [
      'Support Vector Machines (SVM)',
      'Explain the Maximum Margin principle and how the Kernel Trick operates in SVMs.',
      `Support Vector Machines find the optimal decision boundary that separates classes while maximizing the geometric margin.

1. Maximum Margin Hyperplane:
• Decision Boundary: wᵀ x + b = 0.
• Support Vectors: The data points that lie directly on the margin boundaries wᵀ x + b = ±1.
• Geometric Margin = 2 / ||w||. Maximizing the margin is formulated as minimizing ½ ||w||² subject to y_i (wᵀ x_i + b) ≥ 1.

2. The Kernel Trick:
• When data is linearly non-separable in original feature space ℝᵈ, it can be mapped into a higher-dimensional space ℝᴰ via mapping function φ(x) where it becomes linearly separable.
• Computing φ(x) explicitly is computationally prohibitive.
• The Kernel Trick observes that the SVM dual optimization problem depends solely on inner products x_i · x_j. We replace the inner product with a Mercer Kernel function:
  K(x_i, x_j) = φ(x_i) · φ(x_j)
• Common Kernels: Radial Basis Function (RBF/Gaussian): K(x, z) = exp(-γ ||x - z||²), Polynomial: K(x, z) = (xᵀ z + c)ᵈ. Computes inner products in infinite-dimensional Hilbert space in O(d) time!`,
      'Hard'
    ],
    [
      'Ensemble Learning',
      'Differentiate Bagging (Random Forest) from Boosting (Gradient Boosting / XGBoost).',
      `Ensemble learning combines multiple base models to create a superior composite predictor.

• Bagging (Bootstrap Aggregating — e.g., Random Forest):
  - Model Training: Trains parallel, independent, deep decision trees on random bootstrap subsets of the training data (sampling with replacement).
  - Feature Randomization: At each split, selects a random subset of features (typically √p) to decorrelate individual trees.
  - Objective: Primarily REDUCES VARIANCE without increasing bias.
  - Aggregation: Majority voting (classification) or averaging (regression).

• Boosting (e.g., AdaBoost, Gradient Boosting, XGBoost):
  - Model Training: Trains sequential, dependent, shallow decision trees (weak learners).
  - Iteration: Each subsequent tree is explicitly trained to predict the residual errors (pseudo-residuals) of the preceding ensemble.
  - Objective: Primarily REDUCES BIAS by converting weak learners into a strong learner.
  - Aggregation: Weighted linear combination of all learners.`,
      'Hard'
    ],
    [
      'Feature Scaling',
      'Why is feature scaling essential for Gradient Descent, KNN, and SVMs?',
      `Feature scaling normalizes the range of independent variables or features in data preprocessing.

Key Techniques:
1. Standardization (Z-score): z = (x - μ) / σ → transforms data to have zero mean (μ = 0) and unit variance (σ = 1). Handles outliers gracefully.
2. Min-Max Normalization: x' = (x - x_min) / (x_max - x_min) → scales values into strict [0, 1] interval.

Why Unscaled Features Break Algorithms:
• Gradient Descent: When feature x₁ is in range [0, 10000] and x₂ is in [0, 1], the loss contours become highly eccentric, elongated ellipses. The gradient vector oscillates violently across the steep valley walls rather than advancing towards the global minimum. Scaling turns ellipses into concentric circles, enabling direct descent.
• Distance-Based Algorithms (KNN, K-Means, SVM): Euclidean distance d = √((x₁ - y₁)² + (x₂ - y₂)²) causes large-scale features to completely dominate distance calculations, rendering small-scale features completely irrelevant.`,
      'Easy'
    ]
  ],

  'computer networks': [
    [
      'OSI 7-Layer Reference Model',
      'List all 7 layers of the OSI model from bottom to top and detail their Protocol Data Units (PDUs).',
      `The OSI model standardizes telecommunication and networking protocols into seven logical layers:

1. Physical Layer: Transmits raw, unstructured bit streams over physical media (cables, radio waves). PDU: Bits.
2. Data Link Layer: Manages node-to-node frame delivery across local links, physical MAC addressing, and frame error detection (CRC). PDU: Frame (Ethernet, Wi-Fi).
3. Network Layer: Handles logical addressing (IPv4/IPv6), packet forwarding, and path determination across subnets. PDU: Packet.
4. Transport Layer: Provides end-to-end process-to-process communication, connection management, multiplexing via port numbers, and reliability/flow control. PDU: Segment (TCP) / Datagram (UDP).
5. Session Layer: Establishes, manages, checkpoints, and terminates dialogs/sessions between applications (RPC, NetBIOS). PDU: Data.
6. Presentation Layer: Handles data translation, character code conversion (ASCII/Unicode), compression, and encryption/decryption (SSL/TLS, JSON). PDU: Data.
7. Application Layer: Provides network interfaces and services directly to user software (HTTP/HTTPS, DNS, SMTP, SSH). PDU: Data.`,
      'Easy'
    ],
    [
      'TCP vs UDP',
      'Contrast TCP and UDP in header overhead, connection state, reliability, and use-cases.',
      `TCP (Transmission Control Protocol) and UDP (User Datagram Protocol) operate at the Transport Layer:

• TCP (Connection-Oriented):
  - Reliability: Guaranteed delivery through sequence numbers, acknowledgements (ACK), and automatic retransmissions (ARQ).
  - Header Size: 20 to 60 bytes (includes sequence number, ACK number, flags, window size, checksum).
  - Flow & Congestion Control: Implements sliding window and AIMD congestion avoidance.
  - Latency: Higher due to 3-way handshake and ACK latency.
  - Ideal Use Cases: Web traffic (HTTP/HTTPS), file transfers (FTP/SFTP), emails (SMTP), remote shells (SSH).

• UDP (Connectionless):
  - Reliability: Unreliable best-effort delivery. Packets can arrive out of order, be duplicated, or drop silently without retransmission.
  - Header Size: Lightweight fixed 8 bytes (Source Port, Destination Port, Length, Checksum).
  - Overhead: Zero connection setup handshake; no congestion throttling.
  - Ideal Use Cases: Real-time gaming, live audio/video streaming (WebRTC), DNS lookups, DHCP, VoIP.`,
      'Easy'
    ],
    [
      'TCP 3-Way Handshake & Teardown',
      'Detail the TCP 3-way connection establishment and 4-way connection termination states.',
      `TCP guarantees synchronized initial sequence numbers (ISN) and full-duplex session establishment:

3-Way Handshake:
1. SYN (Client → Server): Client generates random sequence number x and sends SYN packet (Flags: SYN=1, Seq=x). Client enters SYN_SENT state.
2. SYN-ACK (Server → Client): Server acknowledges with Ack=x+1 and responds with its own random sequence number y (Flags: SYN=1, ACK=1, Seq=y, Ack=x+1). Server enters SYN_RCVD state.
3. ACK (Client → Server): Client confirms with Ack=y+1 (Flags: ACK=1, Seq=x+1, Ack=y+1). Both enter ESTABLISHED state.

4-Way Teardown:
1. Client sends FIN (Seq=u). Enters FIN_WAIT_1.
2. Server replies ACK (Ack=u+1). Enters CLOSE_WAIT; Client enters FIN_WAIT_2.
3. Server completes pending transmissions and sends its own FIN (Seq=v). Enters LAST_ACK.
4. Client sends final ACK (Ack=v+1) and enters TIME_WAIT state for 2 · MSL (Maximum Segment Lifetime, ~120s) to guarantee the final ACK was received and prevent orphan packets from corrupting future connections.`,
      'Medium'
    ],
    [
      'TCP Congestion Control',
      'Explain Slow Start, Congestion Avoidance (AIMD), Fast Retransmit, and Fast Recovery in TCP.',
      `TCP dynamically regulates its transmission rate via the Congestion Window (cwnd) to prevent network buffer collapse:

1. Slow Start:
• Begins with cwnd = 1 MSS (Maximum Segment Size).
• Exponential Growth: cwnd doubles every RTT (cwnd := cwnd · 2) for every ACK received, until cwnd reaches the slow-start threshold (ssthresh).

2. Congestion Avoidance (AIMD):
• Once cwnd ≥ ssthresh, TCP switches to Additive Increase Multiplicative Decrease.
• cwnd increases linearly by 1 MSS per RTT.

3. Fast Retransmit:
• When the sender receives 3 Duplicate ACKs for the same packet, it infers packet loss without waiting for a retransmission timer expiry and retransmits the missing segment immediately.

4. Fast Recovery:
• Instead of collapsing cwnd back to 1 MSS (as on a hard timeout), TCP sets ssthresh = cwnd / 2 and cwnd = ssthresh + 3 MSS, continuing linear increase once the loss is cleared.`,
      'Hard'
    ],
    [
      'DNS Hierarchy & Resolution',
      'Describe the iterative and recursive query flow when resolving a domain name.',
      `Domain Name System (DNS) resolves human-readable hostnames (e.g. www.google.com) to IP addresses (e.g. 142.250.190.46) over UDP port 53.

Resolution Hierarchy:
1. Client Cache: Checks local OS DNS resolver cache and hosts file.
2. Recursive Resolver (e.g. ISP or 8.8.8.8): If not cached, the recursive resolver undertakes iterative queries on behalf of the client.
3. Root Nameserver (.): 13 logical root server clusters return the authoritative nameservers for the Top-Level Domain (TLD referral: .com).
4. TLD Nameserver (.com): Evaluates the second-level domain and returns the authoritative nameserver for google.com.
5. Authoritative Nameserver: Holds the master zone file for google.com and returns the final A (IPv4) or AAAA (IPv6) record with a Time-To-Live (TTL).
6. Cache & Return: The recursive resolver caches the record according to its TTL and returns the IP address to the client browser.`,
      'Medium'
    ],
    [
      'IP Subnetting & CIDR',
      'Calculate the network address, broadcast address, and usable hosts for IP 192.168.10.75/26.',
      `CIDR (Classless Inter-Domain Routing) /26 specifies that 26 bits are dedicated to the Network ID, leaving 32 - 26 = 6 bits for Host IDs.

Calculations:
1. Subnet Mask:
   • 26 bits = 11111111.11111111.11111111.11000000 = 255.255.255.192.
2. Block Size:
   • 256 - 192 = 64 (each subnet spans 64 addresses).
3. Subnet Ranges in 4th octet:
   • Subnet 0: 0 to 63
   • Subnet 1: 64 to 127 ← (Contains 75!)
   • Subnet 2: 128 to 191
   • Subnet 3: 192 to 255
4. Address Allocation for Subnet 1:
   • Network Address: 192.168.10.64 (host bits all 0).
   • First Usable Host: 192.168.10.65.
   • Last Usable Host: 192.168.10.126.
   • Broadcast Address: 192.168.10.127 (host bits all 1).
   • Total Usable Hosts: 2⁶ - 2 = 64 - 2 = 62 usable hosts.`,
      'Medium'
    ],
    [
      'HTTP Evolutions',
      'Compare HTTP/1.1, HTTP/2, and HTTP/3 (QUIC) and explain Head-of-Line Blocking.',
      `The HTTP protocol has evolved to overcome latency and transport bottlenecks:

• HTTP/1.1:
  - Text-based protocol.
  - Head-of-Line (HoL) Blocking: Single TCP connection can process only one request/response at a time. Pipelining was unreliable and rarely deployed. Required browsers to open 6 parallel TCP connections per origin.

• HTTP/2:
  - Binary Framing: Replaces plaintext with binary frames.
  - Multiplexing: Multiple concurrent, bi-directional streams over a SINGLE TCP connection without interleaving conflicts.
  - Header Compression: Uses HPACK algorithm to eliminate redundant headers.
  - Server Push: Server can proactively send assets before requested.
  - Remaining Limitation: TCP-level HoL blocking—if one packet drops, TCP halts all streams until retransmitted.

• HTTP/3:
  - Replaces TCP with QUIC protocol over UDP.
  - Solves TCP HoL Blocking: Individual streams are independent; a dropped packet stalls only its own stream.
  - 0-RTT Connection Setup: Combines cryptographic handshake with transport setup for instantaneous connections.`,
      'Hard'
    ],
    [
      'Address Resolution Protocol (ARP)',
      'Explain how ARP maps IP to MAC addresses and the mechanics of ARP Spoofing/Poisoning.',
      `ARP operates between Network (Layer 3) and Data Link (Layer 2) to translate 32-bit IPv4 addresses into 48-bit physical MAC addresses on a local broadcast domain.

Standard Protocol Flow:
1. ARP Request: Host A needs to deliver a frame to IP 192.168.1.50. It checks its ARP cache. If missing, it broadcasts an Ethernet frame (Destination MAC: FF:FF:FF:FF:FF:FF): "Who has IP 192.168.1.50? Tell MAC A."
2. ARP Reply: The host holding 192.168.1.50 unicasts an ARP Reply frame back to Host A: "192.168.1.50 is at MAC B."
3. Cache Update: Host A stores the mapping in its local ARP table with a short expiration timer.

★ ARP Spoofing / Poisoning Vulnerability:
ARP is stateless and completely lacks cryptographic authentication. A malicious host can broadcast gratuitous ARP replies claiming: "Default Gateway 192.168.1.1 is at Attacker_MAC."
Victims overwrite their ARP cache, redirecting all outbound traffic through the attacker, enabling Man-In-The-Middle (MITM) inspection or eavesdropping.
↳ Defense: Dynamic ARP Inspection (DAI) on managed switches.`,
      'Medium'
    ],
    [
      'SSL/TLS 1.3 Cryptographic Handshake',
      'Detail the 1-RTT cryptographic handshake in TLS 1.3 and why it guarantees Perfect Forward Secrecy.',
      `TLS 1.3 establishes encrypted, authenticated end-to-end communication channels with minimal latency:

Handshake Sequence (1-RTT):
1. Client Hello:
   • Client sends supported cipher suites and public Ephemeral Diffie-Hellman Key Share (gᵃ mod p).
2. Server Hello:
   • Server selects cipher suite, sends its own Ephemeral Diffie-Hellman Key Share (gᵇ mod p), and digital certificate (X.509).
   • Server signs the handshake with its private key for authentication.
3. Key Derivation:
   • Both sides compute the shared secret gᵃᵇ mod p using HKDF (HMAC-based Key Derivation Function).
   • Symmetric session keys (AES-GCM or ChaCha20-Poly1305) are derived immediately.
4. Encrypted Finished: Server verifies authentication; subsequent application traffic is fully encrypted.

★ Perfect Forward Secrecy (PFS):
Because ephemeral Diffie-Hellman keys are generated anew for every session and immediately destroyed in memory after session termination, even if an attacker compromises the server's long-term private key in the future, past recorded encrypted traffic CANNOT be decrypted.`,
      'Hard'
    ]
  ],

  'dbms': [
    [
      'Database Normalization (1NF to BCNF)',
      'Define 1NF, 2NF, 3NF, and BCNF and explain the exact anomalies each eliminates.',
      `Normalization systematically decomposes relational tables to eliminate data redundancy, update anomalies, insertion anomalies, and deletion anomalies:

1. First Normal Form (1NF):
• Condition: Every column must contain atomic (indivisible) values. No repeating groups or arrays.
• Eliminates: Inability to index or query individual attributes.

2. Second Normal Form (2NF):
• Condition: Must be in 1NF AND contain NO partial dependencies (every non-prime attribute must depend on the FULL composite candidate key, not a proper subset).
• Eliminates: Redundant storage of attributes that depend on only part of a composite key.

3. Third Normal Form (3NF):
• Condition: Must be in 2NF AND contain NO transitive dependencies (for every non-trivial functional dependency X → Y, either X is a superkey OR Y is a prime attribute).
• Eliminates: Updates where changing an indirect relation requires updating thousands of rows.

4. Boyce-Codd Normal Form (BCNF):
• Condition: Stricter than 3NF. For EVERY non-trivial functional dependency X → Y, X MUST be a superkey.
• Eliminates: All remaining functional dependency redundancy, even when candidate keys overlap.`,
      'Hard'
    ],
    [
      'ACID Properties & Implementation',
      'Detail the 4 ACID transaction properties and the database engine mechanisms that enforce each.',
      `A transaction is a logical unit of database work. ACID ensures database reliability:

1. Atomicity ("All or Nothing"):
• Either all statements of a transaction commit successfully, or all changes are rolled back completely.
• Enforced by: Undo Logs within the Write-Ahead Logging (WAL) subsystem.

2. Consistency:
• A transaction brings the database from one valid state to another, preserving all explicit schema constraints (Foreign Keys, Unique, Check, Not Null) and application invariants.
• Enforced by: Constraint verification before transaction commit.

3. Isolation:
• Concurrent execution of transactions yields the same system state as if transactions were executed sequentially.
• Enforced by: Concurrency control protocols: Two-Phase Locking (2PL), Multiversion Concurrency Control (MVCC), and Snapshot Isolation.

4. Durability:
• Once a transaction commits, its modifications are permanently recorded and guaranteed to survive system crashes or power failures.
• Enforced by: Redo Logs flushed to non-volatile disk via fsync() before commit acknowledgment.`,
      'Easy'
    ],
    [
      'Indexing: B+ Trees vs Hash Indexes',
      'Explain the architectural structure of a B+ Tree index and why it is favored over Hash Indexes.',
      `A B+ Tree is an N-ary balanced search tree optimized for systems reading and writing large blocks of memory:

B+ Tree Architecture:
• Node Capacity (Fan-out): High fan-out (typically 100+ pointers per node) keeps tree height extremely low (h = 3 or 4 for billions of rows).
• Separation of Keys and Data:
  - Internal Nodes: Contain only routing keys and child pointers (acting purely as an in-memory index).
  - Leaf Nodes: Contain all actual data records (or record pointers) AND are connected to adjacent sibling leaves via a doubly-linked list.

Why B+ Trees Dominate Hash Indexes:
1. Range Queries: In queries like WHERE age BETWEEN 20 AND 30, B+ trees execute a single O(log n) search to the start leaf, then perform blazing-fast sequential pointer traversals along the leaf linked list. Hash indexes provide O(1) point lookups but CANNOT execute range queries.
2. Ordered Scans: B+ trees maintain sorted order for ORDER BY and GROUP BY without requiring explicit sorting in tempdb.`,
      'Hard'
    ],
    [
      'Concurrency Control & 2PL',
      'Explain Two-Phase Locking (2PL) and contrast Strict 2PL with Rigorous 2PL.',
      `Two-Phase Locking (2PL) guarantees Conflict Serializability of concurrent transaction schedules:

The Two Phases:
1. Growing Phase: A transaction may acquire locks (Shared or Exclusive), but cannot release any locks.
2. Shrinking Phase: A transaction may release locks, but cannot acquire any new locks.

Variations & Cascading Rollbacks:
• Standard 2PL: Subject to Cascading Aborts—if Transaction T1 modifies a row and releases its exclusive lock in its shrinking phase, and T2 reads that uncommitted row, an abort of T1 forces a cascading rollback of T2.

• Strict 2PL (Industry Standard):
  - Requires that all EXCLUSIVE (write) locks be held until the transaction commits or aborts.
  - Completely prevents cascading aborts and dirty reads.

• Rigorous 2PL:
  - Requires that ALL locks (both Shared and Exclusive) be held until transaction commit/abort. Ensures strict serial order matching commit order.`,
      'Hard'
    ],
    [
      'Database Deadlocks & Recovery',
      'Contrast Wait-Die vs Wound-Wait deadlock prevention and explain Wait-For Graph detection.',
      `Deadlocks occur in databases when two or more transactions hold locks on resources the other requires:

1. Deadlock Detection (Wait-For Graph):
• A directed graph G = (V, E) where vertices represent transactions. A directed edge T₁ → T₂ exists if T₁ is waiting for a lock held by T₂.
• Detection: Background daemon periodically executes Tarjan\'s cycle detection algorithm. If a cycle is detected, the engine selects a "victim" transaction (based on cost, age, or rows modified) and aborts it.

2. Deadlock Prevention (Timestamp Protocols based on transaction age):
Let T_old have earlier timestamp than T_young.
• Wait-Die (Non-preemptive):
  - If T_old requests resource held by T_young: T_old is allowed to WAIT.
  - If T_young requests resource held by T_old: T_young DIES (aborts and restarts).
• Wound-Wait (Preemptive):
  - If T_old requests resource held by T_young: T_old WOUNDS T_young (preempts and aborts T_young).
  - If T_young requests resource held by T_old: T_young is allowed to WAIT.
  - Note: Wound-Wait minimizes restarts compared to Wait-Die.`,
      'Hard'
    ],
    [
      'Write-Ahead Logging (WAL) & ARIES',
      'Explain the Write-Ahead Logging invariant and the 3 phases of ARIES crash recovery.',
      `Write-Ahead Logging guarantees Atomicity and Durability during unexpected database crashes:

★ The WAL Invariant:
No dirty data page can be written from volatile RAM buffer pool to non-volatile disk BEFORE the corresponding log record detailing the modification has been flushed to the log file on disk.

ARIES Crash Recovery Algorithm (3 Phases):
1. Analysis Phase:
   • Scans log forward from the most recent Checkpoint.
   • Identifies all active (uncommitted) transactions (the "loser list") and all dirty pages in buffer pool at the moment of the crash.
2. Redo Phase:
   • Repeats history: Scans log forward from smallest RecLSN and reapplies ALL changes (even for transactions that eventually aborted) to restore database state precisely to the crash instant.
3. Undo Phase:
   • Scans log backward from crash point and rolls back all modifications executed by uncommitted transactions in the loser list, logging Compensation Log Records (CLRs) to ensure idempotency.`,
      'Hard'
    ],
    [
      'SQL Query Optimization & Joins',
      'Contrast Nested Loop Join, Hash Join, and Sort-Merge Join in execution mechanics and complexity.',
      `Relational query optimizers evaluate join strategies based on table cardinalities, available memory, and indexes:

1. Nested Loop Join:
• Mechanics: For every outer tuple r ∈ R, scan inner relation S for matching join keys.
• Complexity: O(|R| · |S|) without index; O(|R| · log |S|) with B+ tree index on inner join column.
• Best For: Small outer table with indexed inner table.

2. Hash Join:
• Mechanics: Two phases:
  - Build Phase: Reads smaller relation R and builds an in-memory hash table on join attribute.
  - Probe Phase: Scans larger relation S, hashing each row's join key to look up matches in the hash table.
• Complexity: O(|R| + |S|) linear time.
• Best For: Large, unsorted tables without indexes where join condition is an equality (equi-join).

3. Sort-Merge Join:
• Mechanics: Sorts both relations on join key, then scans both relations concurrently in linear lockstep matching keys.
• Complexity: O(|R| log |R| + |S| log |S|); drops to O(|R| + |S|) if tables are already sorted or clustered on join key.
• Best For: Large tables already sorted by index or range-based join conditions.`,
      'Medium'
    ]
  ]
};

// ---------------------------------------------------------------------------
// Universal Analytical Fallback Generator — Deep Academic Structure
// ---------------------------------------------------------------------------
const GENERIC_TEMPLATES: Array<(topic: string, i: number) => CardTemplate> = [
  (t, _i) => [
    'Core Architecture & Definition',
    `What is the foundational definition and core operational objective of ${t}?`,
    `${t} represents a foundational domain methodology engineered to establish predictable, verifiable behavior in technical systems.

• Foundational Objective: Enforces formal constraints across system states, decoupling functional components while ensuring end-to-end data integrity.
• Core Mechanism: Accepts structured input specifications, verifies boundary preconditions, and applies deterministic state transformations.
• Architectural Role: Serves as a modular layer that minimizes runtime divergence and prevents unpredictable failure states in production systems.

★ Key Takeaway: Mastery of ${t} requires understanding the formal trade-offs between execution speed, memory footprint, and architectural maintainability.`,
    'Easy'
  ],
  (t, _i) => [
    'Underlying Mechanics & Flow',
    `Detail the step-by-step execution lifecycle and internal mechanisms of ${t}.`,
    `The operational execution flow of ${t} follows a structured multi-stage protocol:

1. Initialization & Verification: Validates environment variables, parameter boundaries, and prerequisite allocations.
2. Transformation Pipeline: Evaluates governing invariants iteratively, computing intermediate states while minimizing algorithmic overhead.
3. State Verification: Ensures that post-conditions hold true across all branches, handling corner cases without state corruption.
4. Output Synthesis: Emits final verified artifacts or computational representations to downstream consumers.

★ Exam Note: When diagramming or tracing ${t} in technical evaluations, always document intermediate transformations and state preservation checkpoints.`,
    'Medium'
  ],
  (t, _i) => [
    'Governing Rules & Constraints',
    `What mathematical invariants, asymptotic complexities, or design constraints govern ${t}?`,
    `Analytical evaluation of ${t} centers on formal constraints and efficiency bounds:

• Time Complexity: Standard implementations operate within optimized polynomial bounds (typically striving for O(log n) or O(n) amortized performance).
• Space & Memory Bounds: Memory footprint scales proportionally with input complexity, requiring careful management of auxiliary buffers.
• Governing Invariant: Guarantees that system transformations preserve consistency across all state transitions.

★ Common Exam Trap: Avoid confusing average-case execution efficiency with worst-case performance under adversarial or skewed inputs.`,
    'Hard'
  ],
  (t, _i) => [
    'Trade-off Matrix & Comparison',
    `What critical engineering trade-offs and alternative approaches exist for ${t}?`,
    `Selecting ${t} involves deliberate engineering compromises across multiple architectural axes:

• Simplicity vs Optimization: Naive implementations are straightforward to audit and verify, whereas highly optimized variants require specialized data structures and concurrency synchronization.
• Throughput vs Latency: Maximizing batch processing throughput often increases response latency for individual interactive transactions.
• Competing Paradigms: Contrasting approaches may offer faster point lookups but fail to support multi-attribute indexing or predictable fault recovery.

★ Decision Rule: Choose ${t} when data integrity, structural guarantees, and predictable performance outweigh the minor overhead of formal state validation.`,
    'Hard'
  ],
  (t, _i) => [
    'Failure Modes & Exam Traps',
    `What are the most frequent failure modes, edge cases, and exam pitfalls associated with ${t}?`,
    `Mastering ${t} requires recognizing subtle edge conditions and diagnostic anomalies:

• Boundary Failure Modes: Unhandled null pointers, integer overflow in indexing calculations, and race conditions during concurrent state updates.
• Degradation Scenarios: Skewed input distributions or cache invalidation storms can cause performance to degrade from logarithmic to linear time.
• Diagnostic Protocol: Trace state vectors step-by-step using minimal test inputs (n = 0, n = 1, and boundary values) to verify invariant maintenance.

★ Quick Exam Checklist: Always verify base cases, confirm resource deallocation to prevent memory leaks, and state assumptions regarding thread safety explicitly.`,
    'Medium'
  ]
];

// Resolve topic string to a knowledge-base key
function resolveTopicKey(topic: string): string | null {
  const lower = topic.toLowerCase();
  const mappings: [string[], string][] = [
    [['operating system', 'os ', 'process', 'scheduling', 'deadlock', 'semaphore', 'paging', 'memory management', 'concurrency', 'thrashing'], 'operating systems'],
    [['data structure', 'array', 'linked list', 'stack', 'queue', 'tree', 'graph', 'heap', 'hash', 'sorting', 'algorithm', 'avl', 'bst', 'dijkstra'], 'data structures'],
    [['machine learning', 'neural network', 'deep learning', 'gradient', 'classification', 'regression', 'overfitting', 'svm', 'ml ', 'backpropagation', 'precision'], 'machine learning'],
    [['network', 'tcp', 'udp', 'ip ', 'dns', 'http', 'routing', 'osi', 'subnet', 'firewall', 'arp', 'tls', 'ssl'], 'computer networks'],
    [['dbms', 'database', 'sql', 'normalization', 'transaction', 'index', 'join', 'acid', 'er model', 'relational', '2pl', 'b+ tree'], 'dbms'],
  ];
  for (const [keywords, key] of mappings) {
    if (keywords.some(kw => lower.includes(kw))) return key;
  }
  return null;
}

// Generate N unique cards for any topic from rich local knowledge
function generateCardsForTopic(topic: string, count: number): Flashcard[] {
  const key = resolveTopicKey(topic);
  const knowledgeBase = key ? TOPIC_KNOWLEDGE[key] : null;

  const cards: Flashcard[] = [];
  for (let i = 0; i < count; i++) {
    let subtopic: string, question: string, answer: string, difficulty: string;

    if (knowledgeBase && i < knowledgeBase.length) {
      [subtopic, question, answer, difficulty] = knowledgeBase[i];
    } else if (knowledgeBase && i >= knowledgeBase.length) {
      const base = knowledgeBase[i % knowledgeBase.length];
      subtopic = base[0];
      question = `[Advanced Mastery] ${base[1]}`;
      answer = base[2];
      difficulty = 'Hard';
    } else {
      const tmplFn = GENERIC_TEMPLATES[i % GENERIC_TEMPLATES.length];
      [subtopic, question, answer, difficulty] = tmplFn(topic, i);
    }

    cards.push({
      id: `fc-${Date.now()}-${i}`,
      topic: subtopic,
      course: key ? key.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : topic,
      front: question,
      back: answer,
      sourceDoc: `${topic} High-Yield Guide`,
      sourcePage: i + 1,
      confidence: difficulty === 'Easy' ? 'easy' : difficulty === 'Hard' ? 'hard' : 'good',
      repetitionCount: 0,
    });
  }
  return cards;
}

// ---------------------------------------------------------------------------
// Gemini AI Flashcard Generator
// ---------------------------------------------------------------------------
async function generateDeckWithGemini(topic: string, count: number, apiKey: string): Promise<FlashcardDeck | null> {
  const prompt = `You are an elite computer science professor and academic examiner.
Generate a deck of ${count} high-yield, academically detailed active recall flashcards for the topic: "${topic}".

STRICT CONTENT REQUIREMENTS:
1. "front_question": Write a targeted, precise, challenging conceptual question testing core mechanisms, algorithms, or exam scenarios.
2. "back_answer": MUST be comprehensive, structured, and contain the MOST IMPORTANT POINTS of that topic. Do NOT write lazy or short 1-line answers!
   Include:
   - Clear definition & core principle
   - Step-by-step mechanics / bullet points of how it works under the hood
   - Governing mathematical formula, invariant, or time/space complexity (if applicable)
   - Critical exam takeaway or common pitfall to avoid
3. "difficulty": Choose from "Easy", "Medium", "Hard".
4. "topic": Specific subtopic name.

Output strictly valid JSON with this structure:
{
  "title": "${topic} Mastery Deck",
  "topic": "${topic}",
  "cards": [
    {
      "topic": "Subtopic Name",
      "front_question": "...",
      "back_answer": "...",
      "difficulty": "Medium"
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
            temperature: 0.2,
            responseMimeType: 'application/json'
          }
        })
      });

      if (!response.ok) continue;

      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) continue;

      const parsed = JSON.parse(rawText);
      if (parsed && Array.isArray(parsed.cards) && parsed.cards.length > 0) {
        return {
          id: `deck-ai-${Date.now()}`,
          title: parsed.title || `${topic} AI Mastery Deck`,
          course: parsed.topic || topic,
          description: `AI-grounded comprehensive revision deck with deep academic focus on ${topic}.`,
          totalCards: parsed.cards.length,
          reviewedCount: 0,
          cards: parsed.cards.map((c: any, idx: number) => ({
            id: `fc-ai-${Date.now()}-${idx}`,
            topic: c.topic || topic,
            course: parsed.topic || topic,
            front: c.front_question || c.question || c.front,
            back: c.back_answer || c.answer || c.back,
            sourceDoc: `${topic} Course Notes`,
            sourcePage: idx + 1,
            confidence: c.difficulty === 'Easy' ? 'easy' : c.difficulty === 'Hard' ? 'hard' : 'good',
            repetitionCount: 0
          }))
        };
      }
    } catch (e) {
      console.warn(`Model ${model} flashcard generation failed:`, e);
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Flashcard Service
// ---------------------------------------------------------------------------
const STORAGE_KEY = 'cognilens_flashcards_v2';

class FlashcardService {
  private decks: FlashcardDeck[] = [];

  private loadDecks() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          this.decks = parsed;
          return;
        }
      }
    } catch (e) {
      console.warn('Failed to load flashcards from localStorage', e);
    }
    this.decks = [];
  }

  private saveDecks() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.decks));
    } catch (e) {
      console.warn('Failed to save flashcards to localStorage', e);
    }
  }

  resetDecks() {
    this.decks = [];
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }

  async getDecks(): Promise<ApiResponse<FlashcardDeck[]>> {
    try {
      const backendDecks = await apiClient.getFlashcardDecks();
      if (Array.isArray(backendDecks)) {
        this.decks = backendDecks.map((d: any) => ({
          id: d.id,
          title: d.title,
          course: d.course,
          description: d.description || '',
          totalCards: d.totalCards || (d.cards ? d.cards.length : 0),
          reviewedCount: d.reviewedCount || 0,
          cards: (d.cards || []).map((c: any) => ({
            id: c.id,
            topic: c.subtopic || d.title,
            course: d.course,
            front: c.question || c.front || '',
            back: c.detailedAnswer || c.back || '',
            sourceDoc: d.title,
            sourcePage: 1,
            confidence: (c.confidence as any) || 'good',
            repetitionCount: c.repetitions || 0,
          })),
        }));
        this.saveDecks();
      }
    } catch (e) {
      console.warn('Failed to fetch flashcards from backend, using local cache', e);
      this.loadDecks();
    }

    return {
      success: true,
      data: [...this.decks],
      metadata: { latencyMs: 50 }
    };
  }

  async generateDeckForTopic(topic: string, count: number = 5): Promise<ApiResponse<FlashcardDeck>> {
    let newDeck: FlashcardDeck | null = null;

    // 1. Try Gemini AI Generation first if API key is configured
    const apiKey = getGeminiApiKey();
    if (apiKey) {
      try {
        newDeck = await generateDeckWithGemini(topic, count, apiKey);
      } catch (err) {
        console.warn('Gemini deck generation failed, attempting backend fallback:', err);
      }
    }

    // 2. Try Backend Generator if online
    if (!newDeck) {
      try {
        const backendResp = await apiClient.generateFlashcards({ topic, num_cards: count });
        if (backendResp?.cards?.length > 0) {
          newDeck = {
            id: `deck-dyn-${Date.now()}`,
            title: backendResp.title || `${topic} Flashcard Deck`,
            course: backendResp.topic || topic,
            description: `AI generated flashcard deck for ${topic}.`,
            totalCards: backendResp.cards.length,
            reviewedCount: 0,
            cards: backendResp.cards.map((c: any, idx: number) => ({
              id: `fc-dyn-${Date.now()}-${idx}`,
              topic: c.topic || topic,
              course: backendResp.topic || topic,
              front: c.front_question || c.front || c.question,
              back: c.back_answer || c.back || c.detailed_answer,
              sourceDoc: 'Indexed Notes',
              sourcePage: idx + 1,
              confidence: 'unreviewed',
              repetitionCount: 0,
            })),
          };
        }
      } catch (err) {
        console.warn('Backend flashcard generation error, generating from knowledge base:', err);
      }
    }

    // 3. High-Detail Local Knowledge Base Fallback
    if (!newDeck) {
      const cards = generateCardsForTopic(topic, count);
      newDeck = {
        id: `deck-dyn-${Date.now()}`,
        title: `${topic} Active Recall Deck`,
        course: topic,
        description: `High-yield revision cards covering the most important points of ${topic}.`,
        totalCards: cards.length,
        reviewedCount: 0,
        cards,
      };
    }

    // Persist to backend database
    try {
      await apiClient.saveFlashcardDeck({
        id: newDeck.id,
        title: newDeck.title,
        course: newDeck.course,
        description: newDeck.description,
        cards: newDeck.cards.map(c => ({
          id: c.id,
          subtopic: c.topic,
          question: c.front,
          detailedAnswer: c.back,
          confidence: c.confidence,
          repetitions: c.repetitionCount,
        })),
      });
    } catch (e) {
      console.warn('Failed to save flashcard deck to backend database', e);
    }

    this.decks.unshift(newDeck);
    this.saveDecks();
    return { success: true, data: newDeck, metadata: { latencyMs: 150 } };
  }

  async deleteDeck(deckId: string): Promise<ApiResponse<boolean>> {
    try {
      await apiClient.deleteFlashcardDeck(deckId);
    } catch (e) {
      console.warn('Failed deleting flashcard deck from backend database', e);
    }

    this.decks = this.decks.filter(d => d.id !== deckId);
    this.saveDecks();
    return { success: true, data: true, metadata: { latencyMs: 30 } };
  }

  async updateCardConfidence(deckId: string, cardId: string, confidence: FlashcardConfidence): Promise<ApiResponse<Flashcard>> {
    const deck = this.decks.find(d => d.id === deckId);
    if (!deck) throw new Error('Deck not found');
    const card = deck.cards.find(c => c.id === cardId);
    if (!card) throw new Error('Card not found');

    card.confidence = confidence;
    card.repetitionCount += 1;
    deck.reviewedCount = Math.min(deck.totalCards, deck.reviewedCount + 1);

    try {
      await apiClient.updateCardConfidence(deckId, cardId, confidence);
    } catch (e) {
      console.warn('Failed updating card confidence in database', e);
    }

    this.saveDecks();

    return {
      success: true,
      data: { ...card },
      metadata: { latencyMs: 30 }
    };
  }
}

export const flashcardService = new FlashcardService();
